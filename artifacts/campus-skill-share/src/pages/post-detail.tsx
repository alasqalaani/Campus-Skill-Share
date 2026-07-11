import { useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Tag,
  Calendar,
  User,
} from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { format } from "date-fns";

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/");
  }, [authLoading, isAuthenticated, setLocation]);

  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);

  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [authorRatings, setAuthorRatings] = useState<{
    average: number | null;
    total: number;
  } | null>(null);

  // State for post ratings (to display)
  const [postRatings, setPostRatings] = useState<{
    average: number | null;
    total: number;
    ratings: Array<{
      id: string;
      score: number;
      comment: string | null;
      user: {
        id: string;
        displayName: string;
        profileImageUrl: string | null;
      };
      createdAt: string;
    }>;
  } | null>(null);

  const {
    data: post,
    isLoading,
    error,
  } = useGetPost(id, {
    query: {
      enabled: !!id && isAuthenticated,
      queryKey: getGetPostQueryKey(id),
    },
  });

  // Fetch author's average rating (for sidebar)
  useEffect(() => {
    if (!post?.author?.id) return;
    fetch(`/api/ratings/user/${post.author.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data) =>
          data &&
          setAuthorRatings({ average: data.average, total: data.total }),
      )
      .catch(() => {});
  }, [post?.author?.id]);

  // Fetch ratings for this specific post (to display below description)
  useEffect(() => {
    if (!id) return;
    fetch(`/api/ratings/post/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPostRatings({
            average: data.average,
            total: data.total,
            ratings: data.ratings || [],
          });
        }
      })
      .catch(() => {});
  }, [id]);

  const submitRating = async () => {
    if (!id || ratingScore === 0) return;
    setSubmittingRating(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          score: ratingScore,
          comment: ratingComment || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      setRatingSubmitted(true);
      // Refresh the post ratings after successful submission
      const refreshRes = await fetch(`/api/ratings/post/${id}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setPostRatings({
          average: data.average,
          total: data.total,
          ratings: data.ratings || [],
        });
      }
    } catch (err) {
      alert("Something went wrong submitting your rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const markComplete = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/posts/${id}/complete`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark complete");
      await queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(id) });
    } catch (err) {
      alert("Something went wrong marking this complete. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

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
        <Link
          href="/feed"
          className="text-primary mt-4 inline-block hover:underline"
        >
          Return to feed
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Feed
      </Link>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <CategoryBadge
              category={post.category}
              className="px-3 py-1 text-sm"
            />
            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Posted {format(new Date(post.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column: description and ratings */}
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-lg font-bold font-display mb-3 text-foreground">
                  About this skill
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              {/* Post Ratings Display */}
              <div>
                <h3 className="text-lg font-bold font-display mb-3 text-foreground">
                  Ratings
                </h3>
                {postRatings && postRatings.total > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold">
                        {postRatings.average?.toFixed(1)}
                      </span>
                      <span className="text-yellow-400 text-2xl">★</span>
                      <span className="text-sm text-muted-foreground">
                        ({postRatings.total} rating
                        {postRatings.total !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="space-y-4">
                      {postRatings.ratings.map((rating) => (
                        <div
                          key={rating.id}
                          className="bg-secondary/20 border border-border rounded-xl p-4"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-sm font-bold">
                              {rating.user.profileImageUrl ? (
                                <img
                                  src={rating.user.profileImageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                rating.user.displayName
                                  ?.charAt(0)
                                  .toUpperCase() || "U"
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {rating.user.displayName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(rating.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                            <div className="ml-auto text-yellow-400">
                              {"★".repeat(rating.score)}
                              {"☆".repeat(5 - rating.score)}
                            </div>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {rating.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No ratings yet. Be the first to rate this exchange!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.availability && (
                  <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      Availability
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {post.availability}
                    </p>
                  </div>
                )}
                {post.priceRate && (
                  <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                      <Tag className="w-4 h-4 text-primary" />
                      Rate
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {post.priceRate}
                    </p>
                  </div>
                )}
                {post.university && (
                  <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                      <User className="w-4 h-4 text-primary" />
                      University
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {post.university}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: author sidebar + actions */}
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 sticky top-24">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden mb-4 border-2 border-background shadow-sm">
                    {post.author.profileImageUrl ? (
                      <img
                        src={post.author.profileImageUrl}
                        alt={post.author.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                        {post.author.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">
                    {post.author.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    {authorRatings && authorRatings.total > 0 ? (
                      <>
                        ★ {authorRatings.average?.toFixed(1)} (
                        {authorRatings.total} rating
                        {authorRatings.total !== 1 ? "s" : ""})
                      </>
                    ) : (
                      "No ratings yet"
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                {post.status === "completed" ? (
                  <>
                    <div className="w-full bg-muted text-muted-foreground font-medium py-3.5 px-4 rounded-xl text-center text-sm border border-border">
                      ✓ Exchange completed
                    </div>

                    {!isAuthor && !ratingSubmitted && (
                      <div className="mt-3 border border-border rounded-xl p-4">
                        <p className="text-sm font-medium mb-2">
                          Rate this exchange
                        </p>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingScore(star)}
                              className={`text-2xl ${
                                star <= ratingScore
                                  ? "text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Leave a comment (optional)"
                          className="w-full border border-border rounded-lg p-2 text-sm mb-3"
                          rows={2}
                        />
                        <button
                          onClick={submitRating}
                          disabled={submittingRating || ratingScore === 0}
                          className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
                        >
                          {submittingRating ? "Submitting..." : "Submit Rating"}
                        </button>
                      </div>
                    )}

                    {ratingSubmitted && (
                      <div className="mt-3 text-sm text-muted-foreground text-center">
                        ✓ Thanks for your rating!
                      </div>
                    )}
                  </>
                ) : isAuthor ? (
                  <button
                    onClick={markComplete}
                    disabled={completing}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50"
                  >
                    {completing
                      ? "Marking complete..."
                      : "Mark Exchange Complete"}
                  </button>
                ) : (
                  <Link
                    href={`/chat/${post.author.id}`}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message {post.author.displayName.split(" ")[0]}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
