import { Router } from "express";
import { db } from "@workspace/db";
import {
  ratingsTable,
  insertRatingSchema,
  postsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";

const router = Router();

// POST /ratings - submit a rating for a completed exchange
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = insertRatingSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid rating data", details: parsed.error.flatten() });
    return;
  }

  const { postId, score, comment } = parsed.data;
  const raterId = req.user.id;

  const postRows = await db
    .select({ id: postsTable.id, userId: postsTable.userId })
    .from(postsTable)
    .where(eq(postsTable.id, postId));

  const post = postRows[0];
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const ratedUserId = post.userId;

  if (ratedUserId === raterId) {
    res.status(400).json({ error: "You cannot rate yourself" });
    return;
  }

  try {
    const [rating] = await db
      .insert(ratingsTable)
      .values({ postId, raterId, ratedUserId, score, comment })
      .returning();

    res.status(201).json(rating);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "You have already rated this exchange" });
      return;
    }
    throw err;
  }
});

// GET /ratings/user/:userId - fetch ratings received by a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  const rows = await db
    .select({
      id: ratingsTable.id,
      postId: ratingsTable.postId,
      score: ratingsTable.score,
      comment: ratingsTable.comment,
      createdAt: ratingsTable.createdAt,
      raterId: usersTable.id,
      raterDisplayName: usersTable.displayName,
      raterFirstName: usersTable.firstName,
      raterLastName: usersTable.lastName,
    })
    .from(ratingsTable)
    .innerJoin(usersTable, eq(ratingsTable.raterId, usersTable.id))
    .where(eq(ratingsTable.ratedUserId, userId))
    .orderBy(desc(ratingsTable.createdAt));

  const ratings = rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    score: r.score,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    rater: {
      id: r.raterId,
      displayName: resolveDisplayName(
        r.raterDisplayName,
        r.raterFirstName,
        r.raterLastName,
      ),
    },
  }));

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : null;

  res.json({ ratings, average, total: ratings.length });
});
// GET /api/ratings/post/:postId - get all ratings for a post
router.get("/post/:postId", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const postId = req.params.postId;

  const result = await db.$client.query(
    `SELECT r.id, r.score, r.comment, r.created_at,
            u.id as user_id, u.display_name, u.profile_image_url
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.post_id = $1
     ORDER BY r.created_at DESC`,
    [postId],
  );

  const ratings = result.rows.map((row: any) => ({
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    user: {
      id: row.user_id,
      displayName: row.display_name,
      profileImageUrl: row.profile_image_url,
    },
  }));

  const avgResult = await db.$client.query(
    `SELECT AVG(score) as average, COUNT(*) as total
     FROM ratings
     WHERE post_id = $1`,
    [postId],
  );

  const average = avgResult.rows[0]?.average
    ? parseFloat(avgResult.rows[0].average)
    : null;
  const total = parseInt(avgResult.rows[0]?.total || "0", 10);

  return res.json({ average, total, ratings });
});
export default router;
