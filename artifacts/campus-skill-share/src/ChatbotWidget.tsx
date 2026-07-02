import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, something went wrong.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-card border border-border/40 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex justify-between items-center">
            <span className="font-medium">Campus Skill Share Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask me anything about posting skills, searching, or messaging!
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded-lg max-w-[85%] ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm p-2 rounded-lg bg-muted max-w-[85%]">
                Typing...
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <div className="p-3 border-t border-border/40 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 text-sm px-3 py-2 rounded-md border border-border/40 bg-background"
            />
            <button
              onClick={sendMessage}
              className="bg-primary text-primary-foreground rounded-md px-3 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-primary-foreground rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:opacity-90"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
