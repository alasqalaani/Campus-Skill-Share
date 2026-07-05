import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
