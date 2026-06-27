import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const categoryEnum = pgEnum('category', [
  'Tutoring',
  'Design',
  'Music',
  'Tech',
  'Language',
  'Other',
]);

export const postsTable = pgTable('posts', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  category: categoryEnum('category').notNull(),
  description: text('description').notNull(),
  availability: varchar('availability', { length: 200 }),
  priceRate: varchar('price_rate', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
