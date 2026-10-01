import { pgTable, text, integer, timestamp, serial, uuid } from "drizzle-orm/pg-core";

export type WalletReason =
  | "signup_bonus" // one-time bonus for creating an account
  | "deposit_backfill" // deposits made before this account existed, matched on sign-up
  | "deposit" // a deposit made while already signed in
  | "gift_sent" // debit: sent to another user
  | "gift_received" // credit: received from another user
  | "profile_bonus"; // bonus for completing an optional profile field later

// Append-only. `walletBalanceMb` on the user row is a cached running total
// for fast reads; this table is the source of truth / audit trail.
export const walletLedgerTable = pgTable("wallet_ledger", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  deltaMb: integer("delta_mb").notNull(), // positive = credit, negative = debit
  reason: text("reason").$type<WalletReason>().notNull(),
  relatedUserId: uuid("related_user_id"), // the other party, for gifts
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WalletLedgerEntry = typeof walletLedgerTable.$inferSelect;
