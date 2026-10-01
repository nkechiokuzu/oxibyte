import { pgTable, text, doublePrecision, boolean, timestamp, serial } from "drizzle-orm/pg-core";

// Physical shops/vendors where a user can hand over plastic in person and
// have it weighed and logged in real time. There's no self-reporting flow
// in the consumer app on purpose — a deposit only exists because a vendor
// recorded it at the point of drop-off (see routes/dev.ts's
// simulate-deposit for the stand-in until a real vendor-side system
// exists). This table just answers "where's the nearest one?".
export const collectionPointsTable = pgTable("collection_points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: text("phone"),
  approved: boolean("approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CollectionPoint = typeof collectionPointsTable.$inferSelect;
