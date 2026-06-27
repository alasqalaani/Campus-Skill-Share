import { useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { ArrowLeft, Clock, MessageSquare, Tag, Calendar, User } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { format } from "date-fns";

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: post, isLoading, error } = useGetPost(id, {
    query: { enabled: !!id && isAuthenticated, queryKey: getGetPostQueryKey(id) }
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-card rounded"></div>
        <div className="h-12 w-3/4 bg-card rounded-xl"></div>
        <div className="h-64 bg-card rounded-2xl"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Post not found</h2>
        <Link href="/feed" className="text-primary mt-4 inline-block hover:underline">
          Return to feed
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/feed" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Feed
      </Link>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <CategoryBadge category={post.category} className="px-3 py-1 text-sm" />
            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Posted {format(new Date(post.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-lg font-bold font-display mb-3 text-foreground">About this skill</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.availability && (
                  <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      Availability
                    </div>
                    <p className="text-muted-foreground text-sm">{post.availability}</p>
                  </div>
                )}
                {post.priceRate && (
                  <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                      <Tag className="w-4 h-4 text-primary" />
                      Rate
                    </div>
                    <p className="text-muted-foreground text-sm">{post.priceRate}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 sticky top-24">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden mb-4 border-2 border-background shadow-sm">
                    {post.author.profileImageUrl ? (
                      <img src={post.author.profileImageUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                        {post.author.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{post.author.displayName}</h3>
                  <p className="text-sm text-muted-foreground">Student</p>
                </div>

                {!isAuthor ? (
                  <Link 
                    href={`/chat/${post.author.id}`}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message {post.author.displayName.split(' ')[0]}
                  </Link>
                ) : (
                  <div className="w-full bg-muted text-muted-foreground font-medium py-3 px-4 rounded-xl text-center text-sm border border-border">
                    This is your post
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
