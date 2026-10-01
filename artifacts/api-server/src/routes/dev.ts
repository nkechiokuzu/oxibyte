import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { depositsTable, collectionPointsTable } from "@workspace/db/schema";
import { isValidPhone } from "../lib/auth";

const router: IRouter = Router();

// Not wired to anything real yet — there's no physical recycling-counter
// system in this project. This exists purely so you can test "sign up and
// see prior deposit history appear" locally: call it with a phone number,
// then sign up with that same number and watch the register response.
if (process.env["NODE_ENV"] !== "production") {
  router.post("/dev/simulate-deposit", async (req, res) => {
    const phone = String(req.body?.phone ?? "").trim();
    const grams = Number(req.body?.grams ?? 100);

    if (!isValidPhone(phone) || !Number.isFinite(grams) || grams <= 0) {
      res.status(400).json({ error: "Provide a valid phone and a positive gram amount." });
      return;
    }

    const [deposit] = await db
      .insert(depositsTable)
      .values({ phone, grams, megabytes: grams }) // 1g plastic = 1MB, per the app's rule
      .returning();

    res.status(201).json({ deposit });
  });

  // Fixture data for the "find a nearby collection point" screen, so it has
  // something to show locally. These are NOT real, currently-operating
  // vendor locations — they're placeholders standing in for a real vendor
  // onboarding flow that doesn't exist yet. Swap for real approved vendors
  // before this goes anywhere near production. Idempotent: safe to call
  // more than once, it won't create duplicates.
  router.post("/dev/seed-collection-points", async (_req, res) => {
    const existing = await db.select({ id: collectionPointsTable.id }).from(collectionPointsTable).limit(1);
    if (existing.length > 0) {
      res.json({ ok: true, seeded: false, message: "Collection points already exist — nothing to do." });
      return;
    }

    const sample = [
      { name: "[SAMPLE] plasticbyte Drop-Off — Yaba", address: "Herbert Macaulay Way, Yaba, Lagos", latitude: 6.5158, longitude: 3.3707, phone: null },
      { name: "[SAMPLE] plasticbyte Drop-Off — Surulere", address: "Adeniran Ogunsanya St, Surulere, Lagos", latitude: 6.4924, longitude: 3.3562, phone: null },
      { name: "[SAMPLE] plasticbyte Drop-Off — Lekki Phase 1", address: "Admiralty Way, Lekki Phase 1, Lagos", latitude: 6.4432, longitude: 3.4726, phone: null },
      { name: "[SAMPLE] plasticbyte Drop-Off — Ikeja", address: "Allen Avenue, Ikeja, Lagos", latitude: 6.6018, longitude: 3.3515, phone: null },
    ];
    await db.insert(collectionPointsTable).values(sample);
    res.json({ ok: true, seeded: true, count: sample.length });
  });

  // Add a single collection point on demand — useful for testing with a
  // real address without editing code each time. Dev-only, same as the
  // rest of this file: there's no vendor-approval workflow yet, so
  // anything posted here is trusted as-is.
  router.post("/dev/add-collection-point", async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const address = String(req.body?.address ?? "").trim();
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
    const phone = req.body?.phone ? String(req.body.phone).trim() : null;

    if (!name || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({ error: "Provide name, address, latitude and longitude." });
      return;
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      res.status(400).json({ error: "latitude/longitude out of range." });
      return;
    }

    const [point] = await db
      .insert(collectionPointsTable)
      .values({ name, address, latitude, longitude, phone, approved: true })
      .returning();

    res.status(201).json({ point });
  });
}

export default router;
