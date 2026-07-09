import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, usersTable } from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";

const router = Router();

// GET /posts - list posts with optional search/category filter
router.get("/", async (req, res) => {
  const {
    search,
    category,
    limit = "50",
    offset = "0",
  } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];

  if (category && category !== "all") {
    conditions.push(
      eq(
        postsTable.category,
        category as
          | "Tutoring"
          | "Design"
          | "Music"
          | "Tech"
          | "Language"
          | "Other",
      ),
    );
  }

  let postsQuery = db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      category: postsTable.category,
      description: postsTable.description,
      availability: postsTable.availability,
      priceRate: postsTable.priceRate,
      university: postsTable.university,
      imageUrl: postsTable.imageUrl,
      createdAt: postsTable.createdAt,
      authorId: usersTable.id,
      authorDisplayName: usersTable.displayName,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorProfileImageUrl: usersTable.profileImageUrl,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  const rawPosts =
    conditions.length > 0
      ? await postsQuery.where(and(...conditions))
      : await postsQuery;

  const posts = rawPosts
    .filter(
      (p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()),
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      availability: p.availability ?? null,
      priceRate: p.priceRate ?? null,
      university: p.university ?? null,
      imageUrl: p.imageUrl ?? null,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.authorId,
        displayName: resolveDisplayName(
          p.authorDisplayName,
          p.authorFirstName,
          p.authorLastName,
        ),
        profileImageUrl: p.authorProfileImageUrl ?? null,
      },
    }));

  res.json({ posts, total: posts.length });
});

// GET /posts/stats - category breakdown
router.get("/stats", async (req, res) => {
  const stats = await db
    .select({
      category: postsTable.category,
      count: count(),
    })
    .from(postsTable)
    .groupBy(postsTable.category);

  const total = stats.reduce((sum, s) => sum + Number(s.count), 0);

  res.json({
    categories: stats.map((s) => ({
      category: s.category,
      count: Number(s.count),
    })),
    total,
  });
});

// GET /posts/:postId - single post
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  const rows = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      category: postsTable.category,
      description: postsTable.description,
      availability: postsTable.availability,
      priceRate: postsTable.priceRate,
      university: postsTable.university,
      createdAt: postsTable.createdAt,
      status: postsTable.status,
      authorId: usersTable.id,
      authorDisplayName: usersTable.displayName,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorProfileImageUrl: usersTable.profileImageUrl,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .where(eq(postsTable.id, postId));

  if (rows.length === 0) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const p = rows[0];
  res.json({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    availability: p.availability ?? null,
    priceRate: p.priceRate ?? null,
    university: p.university ?? null,
    createdAt: p.createdAt.toISOString(),
    status: p.status,
    author: {
      id: p.authorId,
      displayName: resolveDisplayName(
        p.authorDisplayName,
        p.authorFirstName,
        p.authorLastName,
      ),
      profileImageUrl: p.authorProfileImageUrl ?? null,
    },
  });
});

// POST /posts - create post
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    title,
    category,
    description,
    availability,
    priceRate,
    university,
    imageUrl,
  } = req.body;

  if (!title || !category || !description) {
    res
      .status(400)
      .json({ error: "title, category, and description are required" });
    return;
  }

  if (description.length < 20) {
    res
      .status(400)
      .json({ error: "Description must be at least 20 characters" });
    return;
  }

  const validCategories = [
    "Tutoring",
    "Design",
    "Music",
    "Tech",
    "Language",
    "Other",
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      userId: req.user.id,
      title,
      category,
      description,
      availability: availability || null,
      priceRate: priceRate || null,
      university: university || null,
      imageUrl: imageUrl || null,
    })
    .returning();

  const user = req.user;
  res.status(201).json({
    id: post.id,
    title: post.title,
    category: post.category,
    university: post.university,
    description: post.description,
    availability: post.availability ?? null,
    priceRate: post.priceRate ?? null,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: user.id,
      displayName: resolveDisplayName(
        user.displayName,
        user.firstName,
        user.lastName,
      ),
      profileImageUrl: user.profileImageUrl ?? null,
    },
  });
});

// DELETE /posts/:postId - delete post (admin or owner)
router.delete("/:postId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { postId } = req.params;
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId));

  if (rows.length === 0) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const post = rows[0];
  if (req.user.role !== "admin" && post.userId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, postId));
  res.json({ success: true });
});
// PATCH /posts/:postId/complete - mark exchange as complete
router.patch("/:postId/complete", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { postId } = req.params;
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId));

  if (rows.length === 0) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const post = rows[0];
  if (req.user.role !== "admin" && post.userId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(postsTable)
    .set({ status: "completed" })
    .where(eq(postsTable.id, postId))
    .returning();

  res.json({ success: true, post: updated });
});

export default router;
