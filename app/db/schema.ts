import { pgTable, serial, text, timestamp, uniqueIndex, integer, index, foreignKey, doublePrecision, uuid, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const communityPolls = pgTable("community_polls", {
  id: serial().primaryKey().notNull(),
  title: text().notNull(),
  summary: text().notNull(),
  piTxHash: text(),
  status: text().default('ACTIVE').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const citizenPassports = pgTable("citizen_passports", {
  id: serial().primaryKey().notNull(),
  pioneerUid: text().notNull(),
  status: text().default('ACTIVE').notNull(),
  tier: integer().default(1).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("citizen_passports_pioneerUid_key").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops")),
]);

export const recoveryLedgers = pgTable("recovery_ledgers", {
  id: serial().primaryKey().notNull(),
  citizenUid: text().notNull(),
  status: text().default('STASIS').notNull(),
  nodeIp: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("recovery_ledgers_citizenUid_key").using("btree", table.citizenUid.asc().nullsLast().op("text_ops")),
]);

export const communityVotes = pgTable("community_votes", {
  id: serial().primaryKey().notNull(),
  piUsername: text().notNull(),
  decision: text().notNull(),
  pollId: integer().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("community_votes_piUsername_idx").using("btree", table.piUsername.asc().nullsLast().op("text_ops")),
  uniqueIndex("community_votes_piUsername_pollId_key").using("btree", table.piUsername.asc().nullsLast().op("int4_ops"), table.pollId.asc().nullsLast().op("int4_ops")),
  foreignKey({
      columns: [table.pollId],
      foreignColumns: [communityPolls.id],
      name: "community_votes_pollId_fkey"
    }).onUpdate("cascade").onDelete("cascade"),
]);

export const pioneers = pgTable("pioneers", {
  id: serial().primaryKey().notNull(),
  pioneerUid: text().notNull(),
  role: text().default('PIONEER').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  trustScore: doublePrecision().default(1).notNull(),
}, (table) => [
  uniqueIndex("pioneers_pioneerUid_key").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops")),
]);

export const internalProposals = pgTable("internal_proposals", {
  id: serial().primaryKey().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  requiredWeight: doublePrecision().default(1).notNull(),
  status: text().default('BUFFER').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const internalVotes = pgTable("internal_votes", {
  id: serial().primaryKey().notNull(),
  pioneerUid: text().notNull(),
  weight: doublePrecision().default(1).notNull(),
  decision: text().notNull(),
  proposalId: integer().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("internal_votes_pioneerUid_idx").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops")),
  uniqueIndex("internal_votes_pioneerUid_proposalId_key").using("btree", table.pioneerUid.asc().nullsLast().op("int4_ops"), table.proposalId.asc().nullsLast().op("int4_ops")),
  foreignKey({
      columns: [table.proposalId],
      foreignColumns: [internalProposals.id],
      name: "internal_votes_proposalId_fkey"
    }).onUpdate("cascade").onDelete("cascade"),
]);

export const academyLogs = pgTable("academy_logs", {
  id: serial().primaryKey().notNull(),
  pioneerUid: text().notNull(),
  moduleLocked: text().notNull(),
  status: text().default('COMPLETED').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  index("academy_logs_pioneerUid_idx").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops")),
  uniqueIndex("academy_logs_pioneerUid_moduleLocked_key").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops"), table.moduleLocked.asc().nullsLast().op("text_ops")),
]);

export const piPayments = pgTable("pi_payments", {
  id: serial().primaryKey().notNull(),
  paymentId: text().notNull(),
  pioneerUid: text().notNull(),
  amount: doublePrecision().default(0.01).notNull(),
  status: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("pi_payments_paymentId_key").using("btree", table.paymentId.asc().nullsLast().op("text_ops")),
]);

export const userWallet = pgTable("UserWallet", {
  id: serial().primaryKey().notNull(),
  pioneerUid: text().notNull(),
  username: text().default('Anonymous').notNull(),
  mbzrBalance: doublePrecision().default(0).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("UserWallet_pioneerUid_key").using("btree", table.pioneerUid.asc().nullsLast().op("text_ops")),
]);

// --- BAZAAR REPUBLIC: 10-NODE SECURITY CIRCLE ---
export const securityCircleNodes = pgTable("security_circle_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  walletAddress: varchar("wallet_address", { length: 56 }).notNull().unique(), 
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
});