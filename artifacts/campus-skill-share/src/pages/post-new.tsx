import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreatePost } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const postSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title too long"),
  category: z.enum([
    "Tutoring",
    "Design",
    "Music",
    "Tech",
    "Language",
    "Other",
  ]),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description too long"),
  availability: z.string().max(200).optional(),
  priceRate: z.string().max(100).optional(),
  university: z.string().min(1, "University is required"),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      category: "Tutoring",
      description: "",
      availability: "",
      priceRate: "",
      university: "",
    },
  });
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const onSubmit = async (data: PostFormValues) => {
    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        const res = await fetch("/api/upload/image", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const result = await res.json();
        if (res.ok) {
          imageUrl = result.imageUrl;
        } else {
          toast({
            title: "Image upload failed",
            description: result.error,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      } catch (err) {
        toast({
          title: "Image upload failed",
          description: "Please try again.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createPost.mutate(
      { data: { ...data, imageUrl } },
      {
        onSuccess: () => {
          toast({
            title: "Skill posted!",
            description: "Your skill is now visible on the feed.",
          });
          setLocation("/feed");
        },
        onError: (err) => {
          toast({
            title: "Failed to post",
            description: err.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <Link
          href="/feed"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Feed
        </Link>
        <h1 className="text-3xl font-display font-bold">Post a Skill</h1>
        <p className="text-muted-foreground mt-1">
          Share your expertise with the campus community.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold">
              Skill Title *
            </label>
            <input
              id="title"
              {...form.register("title")}
              placeholder="e.g. Intro to Python Tutoring, Beginner Guitar Lessons"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="university" className="text-sm font-semibold">
              University *
            </label>
            <input
              id="university"
              {...form.register("university")}
              placeholder="e.g. University of Toronto"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.university && (
              <p className="text-sm text-destructive">
                {form.formState.errors.university.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-semibold">
              Category *
            </label>
            <select
              id="category"
              {...form.register("category")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="Tutoring">Tutoring</option>
              <option value="Design">Design</option>
              <option value="Music">Music</option>
              <option value="Tech">Tech</option>
              <option value="Language">Language</option>
              <option value="Other">Other</option>
            </select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold">
              Description *
            </label>
            <textarea
              id="description"
              {...form.register("description")}
              rows={5}
              placeholder="What exactly are you offering? What should someone expect? Mention your experience level."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-full max-h-64 object-cover rounded-xl border border-border"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="availability" className="text-sm font-semibold">
                Availability (Optional)
              </label>
              <input
                id="availability"
                {...form.register("availability")}
                placeholder="e.g. Tue/Thu evenings, Weekends"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priceRate" className="text-sm font-semibold">
                Price/Rate (Optional)
              </label>
              <input
                id="priceRate"
                {...form.register("priceRate")}
                placeholder="e.g. $15/hr, Free, Trade for coffee"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <button
              type="submit"
              disabled={uploading || createPost.isPending}
              className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : createPost.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Skill"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
