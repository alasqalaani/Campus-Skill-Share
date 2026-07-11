import { Router, Request, Response } from "express";
import { auth } from "../lib/firebase-admin";
import { db, usersTable } from "@workspace/db";
import {
  createSession,
  clearSession,
  getSessionId,
  getSession,
} from "../lib/auth";
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

const router = Router();

// Get current user
router.get("/", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  res.json({
    user: session?.user || null,
  });
});

// Login with Firebase Google token
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Build user data from Firebase claims
    const userData = {
      id: uid,
      email: decodedToken.email || null,
      firstName: decodedToken.name?.split(" ")[0] || null,
      lastName: decodedToken.name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: decodedToken.picture || null,
    };

    const adminEmails = getAdminEmails();
    const isAdmin = userData.email
      ? adminEmails.has(userData.email.toLowerCase())
      : false;

    // Insert or update the user in the database
    const [user] = await db
      .insert(usersTable)
      .values({
        ...userData,
        ...(isAdmin ? { role: "admin" as const } : {}),
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
          // Promote to admin if in the list; never demote an existing admin
          ...(isAdmin ? { role: "admin" as const } : {}),
        },
      })
      .returning();

    const userInfo = {
      ...user,
      displayName: decodedToken.name || null,
    };

    // Create your custom session
    const sid = await createSession({ user: userInfo });

    // Set session cookie
    res.cookie("sid", sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ success: true, user: userInfo, sid });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Logout
router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
