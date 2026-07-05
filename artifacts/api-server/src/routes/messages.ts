import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { resolveDisplayName } from "../lib/displayName";
import webpush from "web-push";
import { pushSubscriptionsTable } from "@workspace/db";

const router = Router();

webpush.setVapidDetails(
  "mailto:admin@skillet.app",
  process.env.VAPID_PUBLIC_KEY!.trim(),
  process.env.VAPID_PRIVATE_KEY!.trim(),
);

// GET /messages/conversations - list conversations
router.get("/conversations", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  // Get the latest message per conversation partner
  const allMessages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderId, userId),
        eq(messagesTable.receiverId, userId),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  // Group by conversation partner
  const conversationMap = new Map<string, (typeof allMessages)[0]>();
  for (const msg of allMessages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg);
    }
  }

  // Fetch partner user details
  const partnerIds = Array.from(conversationMap.keys());
  if (partnerIds.length === 0) {
    res.json({ conversations: [] });
    return;
  }

  const partners = await db
    .select()
    .from(usersTable)
    .where(or(...partnerIds.map((id) => eq(usersTable.id, id))));

  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  const conversations = partnerIds
    .map((partnerId) => {
      const lastMsg = conversationMap.get(partnerId)!;
      const partner = partnerMap.get(partnerId);
      if (!partner) return null;
      return {
        otherUser: {
          id: partner.id,
          displayName: resolveDisplayName(
            partner.displayName,
            partner.firstName,
            partner.lastName,
          ),
          profileImageUrl: partner.profileImageUrl ?? null,
        },
        lastMessage: {
          id: lastMsg.id,
          senderId: lastMsg.senderId,
          receiverId: lastMsg.receiverId,
          content: lastMsg.content,
          createdAt: lastMsg.createdAt.toISOString(),
        },
        unreadCount: 0,
      };
    })
    .filter(Boolean);

  res.json({ conversations });
});

// GET /messages/:otherUserId - get conversation
router.get("/:otherUserId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { otherUserId } = req.params;
  const userId = req.user.id;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(
          eq(messagesTable.senderId, userId),
          eq(messagesTable.receiverId, otherUserId),
        ),
        and(
          eq(messagesTable.senderId, otherUserId),
          eq(messagesTable.receiverId, userId),
        ),
      ),
    )
    .orderBy(messagesTable.createdAt);

  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

// POST /messages - send message
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    res.status(400).json({ error: "receiverId and content are required" });
    return;
  }

  if (content.length < 1 || content.length > 2000) {
    res
      .status(400)
      .json({ error: "content must be between 1 and 2000 characters" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      senderId: req.user.id,
      receiverId,
      content,
    })
    .returning();

  // Send a push notification to the receiver, if they have a subscription
  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, receiverId));

  for (const sub of subscriptions) {
    webpush
      .sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: "New message on Skillet",
          body: content.slice(0, 100),
          url: "/chats",
        }),
      )
      .catch((err) => {
        console.error("Push notification failed:", err);
      });
  }

  res.status(201).json({
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
});

export default router;
