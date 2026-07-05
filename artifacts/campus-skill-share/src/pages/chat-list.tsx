import {
  useListConversations,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [notifStatus, setNotifStatus] = useState<
    "idle" | "asking" | "enabled" | "denied"
  >("idle");

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async function enableNotifications() {
    setNotifStatus("asking");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifStatus("denied");
        return;
      }

      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subscription),
      });

      setNotifStatus("enabled");
    } catch (err) {
      console.error("Failed to enable notifications:", err);
      setNotifStatus("idle");
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading } = useListConversations({
    query: {
      enabled: isAuthenticated,
      queryKey: getListConversationsQueryKey(),
    },
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Connect with peers about skills
          </p>
        </div>
      </div>
      {notifStatus !== "enabled" && (
        <button
          onClick={enableNotifications}
          disabled={notifStatus === "asking"}
          className="mb-6 w-full sm:w-auto bg-primary text-primary-foreground font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          {notifStatus === "asking"
            ? "Requesting permission..."
            : notifStatus === "denied"
              ? "Notifications blocked — check browser settings"
              : "Enable Message Notifications"}
        </button>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 flex items-center gap-4 animate-pulse"
              >
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-64 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !data?.conversations || data.conversations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto text-border mb-4" />
            <p className="text-lg font-medium text-foreground">
              No conversations yet
            </p>
            <p className="mt-1">
              Find a skill you like and send a message to start chatting.
            </p>
            <Link
              href="/feed"
              className="text-primary hover:underline font-medium mt-4 inline-block"
            >
              Browse feed
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data.conversations.map((conv) => (
              <Link
                key={conv.otherUser.id}
                href={`/chat/${conv.otherUser.id}`}
                className="flex items-center gap-4 p-5 hover:bg-secondary/50 transition-colors group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-primary/10 overflow-hidden border border-border">
                    {conv.otherUser.profileImageUrl ? (
                      <img
                        src={conv.otherUser.profileImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-lg font-bold">
                        {conv.otherUser.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-destructive border-2 border-card rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold font-display text-[17px] text-foreground truncate">
                      {conv.otherUser.displayName}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 font-medium">
                      {formatDistanceToNow(
                        new Date(conv.lastMessage.createdAt),
                        { addSuffix: true },
                      )}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${conv.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                  >
                    {conv.lastMessage.content}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
