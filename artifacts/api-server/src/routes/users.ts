import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";

const router = Router();

// GET /users/me
router.get("/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = rows[0];
  res.json({
    id: u.id,
    email: u.email ?? null,
    displayName: resolveDisplayName(u.displayName, u.firstName, u.lastName),
    role: u.role,
    profileImageUrl: u.profileImageUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  });
});

// PATCH /users/me
router.patch("/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { displayName } = req.body;

  if (displayName !== undefined && (typeof displayName !== "string" || displayName.length < 2)) {
    res.status(400).json({ error: "displayName must be at least 2 characters" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ displayName: displayName ?? undefined })
    .where(eq(usersTable.id, req.user.id))
    .returning();

  res.json({
    id: updated.id,
    email: updated.email ?? null,
    displayName: resolveDisplayName(updated.displayName, updated.firstName, updated.lastName),
    role: updated.role,
    profileImageUrl: updated.profileImageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
