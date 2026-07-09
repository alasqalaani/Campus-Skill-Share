import {
  pgTable,
  varchar,
  integer,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ratingsTable = pgTable(
  "ratings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: varchar("post_id").notNull(),
    raterId: varchar("rater_id").notNull(),
    ratedUserId: varchar("rated_user_id").notNull(),
    score: integer("score").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueRaterPerPost: unique().on(table.postId, table.raterId),
  }),
);

export const insertRatingSchema = createInsertSchema(ratingsTable)
  .omit({
    id: true,
    raterId: true,
    ratedUserId: true,
    createdAt: true,
  })
  .extend({
    score: z.number().int().min(1).max(5),
  });
