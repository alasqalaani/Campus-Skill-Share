import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useGetConversation, useSendMessage, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { ShieldAlert, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const params = useParams();
  const otherUserId = params.userId as string;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Poll for messages every 3 seconds
  const { data, isLoading } = useGetConversation(otherUserId, {
    query: {
      enabled: !!otherUserId && isAuthenticated,
      refetchInterval: 3000,
      queryKey: getGetConversationQueryKey(otherUserId)
    }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/");
  }, [authLoading, isAuthenticated, setLocation]);

  const sendMessage = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages]);

  if (authLoading || !isAuthenticated) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;

    sendMessage.mutate({
      data: { receiverId: otherUserId, content: content.trim() }
    }, {
      onSuccess: () => {
        setContent("");
        // Optimistic invalidation to fetch new message immediately
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(otherUserId) });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
      {/* Chat Header */}
      <div className="bg-background border-b border-border p-4 flex items-center gap-4 z-10 relative">
        <Link href="/chats" className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-bold font-display text-lg">Conversation</h2>
          <p className="text-xs text-muted-foreground">End-to-end encrypted on Campus Skill Share</p>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="bg-accent/10 border-b border-accent/20 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong className="font-semibold text-foreground">Safety first:</strong> Ready to connect further? Share your WhatsApp number or campus meeting spot when you're comfortable. Do not share financial info.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages...</div>
        ) : !data?.messages || data.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-2">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          data.messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const showDate = idx === 0 || new Date(msg.createdAt).getDate() !== new Date(data.messages[idx - 1].createdAt).getDate();
            
            return (
              <div key={msg.id} className="space-y-4">
                {showDate && (
                  <div className="flex justify-center my-6">
                    <span className="text-xs font-medium bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border/50">
                      {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1.5 px-1 font-medium">
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-[15px] shadow-sm"
            autoComplete="off"
            data-testid="input-message"
          />
          <button
            type="submit"
            disabled={!content.trim() || sendMessage.isPending}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            data-testid="button-send-message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
