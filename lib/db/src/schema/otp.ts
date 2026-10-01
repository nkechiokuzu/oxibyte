import { pgTable, text, integer, timestamp, serial, boolean, uuid } from "drizzle-orm/pg-core";

// One row per requested code. A phone can have multiple rows over time
// (old ones just go stale); we always look up the newest, unconsumed,
// unexpired one when verifying.
export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(), // 6 digits, zero-padded
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0), // failed verify attempts against this code
  consumed: boolean("consumed").notNull().default(false), // true once successfully verified
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;

// Short-lived proof that a phone was verified, used to bridge the
// verify-otp step and the register step without re-sending a code.
export const phoneVerificationsTable = pgTable("phone_verifications", {
  token: text("token").primaryKey(), // random opaque token, given to the client
  phone: text("phone").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumed: boolean("consumed").notNull().default(false), // true once used to register
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhoneVerification = typeof phoneVerificationsTable.$inferSelect;

// Email verification codes, requested by an already-signed-in user editing
// their profile (unlike phone OTP, this never touches signup/login — the
// user row already exists). Same "newest unconsumed unexpired" lookup
// pattern as otpCodesTable.
export const emailOtpCodesTable = pgTable("email_otp_codes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  email: text("email").notNull(),
  code: text("code").notNull(), // 6 digits, zero-padded
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmailOtpCode = typeof emailOtpCodesTable.$inferSelect;
