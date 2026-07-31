import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const pioneers = pgTable('pioneers', {
  id: text('id').primaryKey(),
  piUid: text('pi_uid').notNull().unique(),
  username: text('username').notNull(),
  genesisCompleted: boolean('genesis_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Pioneer = typeof pioneers.$inferSelect;
export type NewPioneer = typeof pioneers.$inferInsert;