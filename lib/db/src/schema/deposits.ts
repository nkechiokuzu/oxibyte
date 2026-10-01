import { pgTable, text, integer, timestamp, serial, uuid } from "drizzle-orm/pg-core";

// A deposit is logged by phone number at the moment plastic is recycled —
// which can happen before that phone has an app account. `userId` starts
// null and gets backfilled the moment that phone completes sign-up, so
// existing history surfaces immediately instead of being orphaned.
export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  userId: uuid("user_id"), // backfilled on sign-up; null until then
  grams: integer("grams").notNull(),
  megabytes: integer("megabytes").notNull(), // grams === megabytes per the app's conversion rule
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Deposit = typeof depositsTable.$inferSelect;
