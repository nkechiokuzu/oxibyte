import { pgTable, text, integer, timestamp, uuid, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// `id` (not `phone`) is the real primary key referenced everywhere else
// (wallet ledger, gifts, sessions). Phones are just an attribute of a user,
// so a user can change their number later without breaking any history.
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(), // E.164 format, e.g. +2348012345678. Never user-editable post signup.
  firstName: text("first_name").notNull(),
  lastName: text("last_name"), // optional; combined with firstName for "full name" in the profile UI
  username: text("username").unique(), // optional display nickname, distinct from real name
  gender: text("gender"), // free-text, validated against an allow-list at the API layer
  dateOfBirth: date("date_of_birth"), // stored as YYYY-MM-DD
  email: text("email").unique(), // set only once verified — see emailVerified
  emailVerified: boolean("email_verified").notNull().default(false),
  // Data URL (data:image/...;base64,...) of the user's profile photo. Stored
  // inline since there's no object storage wired up yet — fine at this
  // scale, but move to real blob storage (S3/Cloudinary/etc.) before this
  // needs to scale past a modest user base.
  profilePhotoUrl: text("profile_photo_url"),
  passwordHash: text("password_hash").notNull(),
  walletBalanceMb: integer("wallet_balance_mb").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  lastName: true,
  username: true,
  gender: true,
  dateOfBirth: true,
  email: true,
  emailVerified: true,
  profilePhotoUrl: true,
  walletBalanceMb: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// What's safe to send to the client — never the password hash.
export type PublicUser = Omit<User, "passwordHash">;
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
