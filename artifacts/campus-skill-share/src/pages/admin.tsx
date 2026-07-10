import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetMyProfile,
  useAdminListPosts,
  useGetAdminStats,
  useDeletePost,
  getAdminListPostsQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import {
  Trash2,
  ShieldAlert,
  BarChart3,
  Users,
  FileText,
  Search,
} from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/");
  }, [isLoading, isAuthenticated, setLocation]);

  const { data: profile, isLoading: profileLoading } = useGetMyProfile();

  const { data: stats } = useGetAdminStats({
    query: {
      enabled: profile?.role === "admin",
      queryKey: getGetAdminStatsQueryKey(),
    },
  });

  const queryParams = debouncedSearch ? { search: debouncedSearch } : {};
  const { data: postsData, isLoading: postsLoading } = useAdminListPosts(
    queryParams,
    {
      query: {
        enabled: profile?.role === "admin",
        queryKey: getAdminListPostsQueryKey(queryParams),
      },
    },
  );

  const deletePost = useDeletePost();

  if (isLoading || !isAuthenticated) return null;

  if (profileLoading)
    return <div className="text-center py-20">Loading admin...</div>;

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center bg-destructive/10 border border-destructive/20 p-8 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You need administrator privileges to view this page.
        </p>
        <Link
          href="/feed"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  const handleDelete = (postId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this post? This cannot be undone.",
      )
    ) {
      deletePost.mutate(
        { postId },
        {
          onSuccess: () => {
            toast({ title: "Post deleted successfully" });
            queryClient.invalidateQueries({
              queryKey: getAdminListPostsQueryKey(queryParams),
            });
            queryClient.invalidateQueries({
              queryKey: getGetAdminStatsQueryKey(),
            });
          },
          onError: () => {
            toast({ title: "Failed to delete post", variant: "destructive" });
          },
        },
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and moderation.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-muted-foreground">Total Users</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold font-display">
            {stats?.totalUsers || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-muted-foreground">Total Posts</h3>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold font-display">
            {stats?.totalPosts || 0}
          </p>
        </div>
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-muted-foreground">
              Posts by Category
            </h3>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {stats?.postsByCategory.map((stat) => (
              <div
                key={stat.category}
                className="bg-secondary px-3 py-1.5 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 border border-border/50"
              >
                <span className="font-medium text-foreground">
                  {stat.category}
                </span>
                <span className="bg-background px-2 py-0.5 rounded-md font-bold text-xs">
                  {stat.count}
                </span>
              </div>
            ))}
            {(!stats?.postsByCategory ||
              stats.postsByCategory.length === 0) && (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-background/50">
          <h2 className="text-lg font-bold font-display">Manage Posts</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Post & Category</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {postsLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading posts...
                  </td>
                </tr>
              ) : !postsData?.posts || postsData.posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-muted-foreground">No posts found.</div>
                  </td>
                </tr>
              ) : (
                postsData.posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground mb-1 line-clamp-1 max-w-xs">
                        {post.title}
                      </div>
                      <CategoryBadge
                        category={post.category}
                        className="text-[10px] px-2 py-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                          {post.author.profileImageUrl ? (
                            <img
                              src={post.author.profileImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            post.author.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {post.author.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletePost.isPending}
                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
