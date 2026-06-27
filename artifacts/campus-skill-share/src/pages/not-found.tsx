import { Link } from "wouter";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <SearchX className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">404</h1>
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">Page not found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
      </p>
      <Link href="/" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-colors">
        Return Home
      </Link>
    </div>
  );
}
