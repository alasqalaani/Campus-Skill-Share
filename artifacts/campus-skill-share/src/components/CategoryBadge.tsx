import { cn } from "@/lib/utils";

type Category = 'Tutoring' | 'Design' | 'Music' | 'Tech' | 'Language' | 'Other';

const categoryColors: Record<Category, string> = {
  Tutoring: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  Design: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  Music: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  Tech: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  Language: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  Other: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

export function CategoryBadge({ category, className }: { category: string, className?: string }) {
  const colorClass = categoryColors[category as Category] || categoryColors.Other;
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", colorClass, className)} data-testid={`badge-category-${category}`}>
      {category}
    </span>
  );
}
