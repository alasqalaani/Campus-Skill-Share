import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import {
  BookOpen,
  LogOut,
  User,
  PlusCircle,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { ChatbotWidget } from "../ChatbotWidget";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { data: profile } = useGetMyProfile({
    query: { enabled: isAuthenticated, queryKey: getGetMyProfileQueryKey() },
  });
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="relative container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={isAuthenticated ? "/feed" : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Campus Skill Share
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/feed"
                  className={`text-sm font-medium transition-colors hover:text-primary ${location === "/feed" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Feed
                </Link>
                <Link
                  href="/post/new"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post Skill
                </Link>
                <Link
                  href="/chats"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chats
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Admin
                  </Link>
                )}
                <div className="h-6 w-px bg-border mx-2"></div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                    {profile?.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="hidden md:inline-block font-display">
                    {profile?.displayName || user?.firstName || "Student"}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Log out"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                data-testid="button-login"
              >
                Sign In
              </button>
            )}
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-muted-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          {mobileMenuOpen && (
            <div className="sm:hidden absolute top-16 left-0 w-full bg-background border-b border-border/40 py-4 px-4 flex flex-col gap-4">
              <Link
                href="/post/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Post Skill
              </Link>
              <Link
                href="/chats"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Chats
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-border/40 py-8 bg-card/50 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-display">
            © {new Date().getFullYear()} Campus Skill Share. Built for
            students.
          </p>
        </div>
      </footer>
      <ChatbotWidget />
    </div>
  );
}
