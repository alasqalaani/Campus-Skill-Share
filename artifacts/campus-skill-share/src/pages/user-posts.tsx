import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { ArrowLeft, Search, MessageSquare, User } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";

interface UserProfile {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  university: string | null;
}

interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  status: string;
}

export default function UserPostsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // Fetch user profile
    fetch(`/api/users/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setProfile(data.user || data);
      })
      .catch(() => {});

    // Fetch user's posts
    fetch(`/api/posts?authorId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPosts(data.posts || data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-card rounded"></div>
        <div className="h-32 bg-card rounded-2xl"></div>
        <div className="h-64 bg-card rounded-2xl"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">User not found</h2>
        <Link
          href="/feed"
          className="text-primary mt-4 inline-block hover:underline"
        >
          Return to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Feed
      </Link>

      {/* User Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 border-2 border-background shadow-sm">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
              {profile.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">
            {profile.university || "University not specified"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""} published
          </p>
        </div>
        {user?.id !== userId && (
          <Link
            href={`/chat/${userId}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search posts by ${profile.displayName}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>
            {searchTerm
              ? "No posts match your search."
              : "This user hasn't posted anything yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-card border border-border rounded-xl p-5 hover:border-primary transition-all hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <CategoryBadge
                  category={post.category}
                  className="px-2 py-0.5 text-xs"
                />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </span>
                {post.status === "completed" && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
