import { Router, Request, Response } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";
import { getSessionId, getSession } from "../lib/auth";

const router = Router();

// GET /posts - list posts with optional search/category filter
router.get("/", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

  return res.json({ posts, total: posts.length });
});

// GET /posts/stats - category breakdown
router.get("/stats", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const stats = await db
    .select({
      category: postsTable.category,
      count: count(),
    })
    .from(postsTable)
    .groupBy(postsTable.category);

  const total = stats.reduce((sum, s) => sum + Number(s.count), 0);

  return res.json({
    categories: stats.map((s) => ({
      category: s.category,
      count: Number(s.count),
    })),
    total,
  });
});

// GET /posts/:id - get a single post by ID (using Drizzle ORM)
router.get("/:id", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const postId = req.params.id;

  const result = await db
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

  if (result.length === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  const p = result[0];
  return res.json({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    availability: p.availability ?? null,
    priceRate: p.priceRate ?? null,
    university: p.university ?? null,
    imageUrl: p.imageUrl ?? null,
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

// POST /posts - create a new post
router.post("/", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
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
    return res
      .status(400)
      .json({ error: "title, category, and description are required" });
  }

  if (description.length < 20) {
    return res
      .status(400)
      .json({ error: "Description must be at least 20 characters" });
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
    return res.status(400).json({ error: "Invalid category" });
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      userId: session.user.id,
      title,
      category,
      description,
      availability: availability || null,
      priceRate: priceRate || null,
      university: university || null,
      imageUrl: imageUrl || null,
    })
    .returning();

  const user = session.user;
  return res.status(201).json({
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
router.delete("/:postId", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { postId } = req.params;
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId));

  if (rows.length === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = rows[0];
  if (session.user.role !== "admin" && post.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(postsTable).where(eq(postsTable.id, postId));
  return res.json({ success: true });
});

// PATCH /posts/:postId/complete - mark exchange as complete
router.patch("/:postId/complete", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { postId } = req.params;
  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId));

  if (rows.length === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = rows[0];
  if (session.user.role !== "admin" && post.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [updated] = await db
    .update(postsTable)
    .set({ status: "completed" })
    .where(eq(postsTable.id, postId))
    .returning();

  return res.json({ success: true, post: updated });
});

export default router;
