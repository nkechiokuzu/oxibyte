import { Router, type IRouter } from "express";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { collectionPointsTable } from "@workspace/db/schema";

const router: IRouter = Router();

// --- GET /api/collection-points/nearby ---------------------------------
// Straight-line (Haversine) distance from the given coordinates, nearest
// first. Good enough for "which shop is closest" — not turn-by-turn
// routing, which the client handles by linking out to Google Maps.
router.get("/collection-points/nearby", async (req, res) => {
  const lat = Number(req.query["lat"]);
  const lng = Number(req.query["lng"]);
  const limit = Math.min(Number(req.query["limit"]) || 10, 25);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    res.status(400).json({ error: "Provide valid lat and lng query parameters." });
    return;
  }

  // Clamp the acos() argument into [-1, 1] — floating point rounding can
  // push it just outside that range for a point very close to (lat, lng),
  // which would otherwise make acos() return NaN.
  const distanceKmExpr = sql<number>`
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(${lat})) * cos(radians(${collectionPointsTable.latitude})) *
        cos(radians(${collectionPointsTable.longitude}) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(${collectionPointsTable.latitude}))
      ))
    )
  `;

  const points = await db
    .select({
      id: collectionPointsTable.id,
      name: collectionPointsTable.name,
      address: collectionPointsTable.address,
      latitude: collectionPointsTable.latitude,
      longitude: collectionPointsTable.longitude,
      phone: collectionPointsTable.phone,
      distanceKm: distanceKmExpr,
    })
    .from(collectionPointsTable)
    .where(eq(collectionPointsTable.approved, true))
    .orderBy(distanceKmExpr)
    .limit(limit);

  res.json({ points });
});

// --- GET /api/collection-points -----------------------------------------
// Fallback for when the browser won't share location: the full approved
// list, alphabetical, with no distance.
router.get("/collection-points", async (_req, res) => {
  const points = await db
    .select()
    .from(collectionPointsTable)
    .where(eq(collectionPointsTable.approved, true))
    .orderBy(asc(collectionPointsTable.name));

  res.json({ points });
});

export default router;
