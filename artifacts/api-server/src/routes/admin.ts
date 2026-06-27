import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// GET /admin/posts
router.get("/posts", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { search, category } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];
  if (category && category !== "all") {
    conditions.push(
      eq(postsTable.category, category as "Tutoring" | "Design" | "Music" | "Tech" | "Language" | "Other")
    );
  }

  const baseQuery = db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      category: postsTable.category,
      description: postsTable.description,
      availability: postsTable.availability,
      priceRate: postsTable.priceRate,
      createdAt: postsTable.createdAt,
      authorId: usersTable.id,
      authorDisplayName: usersTable.displayName,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorProfileImageUrl: usersTable.profileImageUrl,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .orderBy(desc(postsTable.createdAt));

  const rawPosts = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery;

  const posts = rawPosts
    .filter((p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      availability: p.availability ?? null,
      priceRate: p.priceRate ?? null,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.authorId,
        displayName: resolveDisplayName(p.authorDisplayName, p.authorFirstName, p.authorLastName),
        profileImageUrl: p.authorProfileImageUrl ?? null,
      },
    }));

  res.json({ posts, total: posts.length });
});

// GET /admin/stats
router.get("/stats", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const [totalUsersResult, totalPostsResult, categoryStats] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(postsTable),
    db
      .select({ category: postsTable.category, count: count() })
      .from(postsTable)
      .groupBy(postsTable.category),
  ]);

  res.json({
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    totalPosts: Number(totalPostsResult[0]?.count ?? 0),
    postsByCategory: categoryStats.map((s) => ({
      category: s.category,
      count: Number(s.count),
    })),
  });
});

export default router;
