import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, ne, lt, and, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@workspace/db";
import { usersTable, walletLedgerTable, depositsTable } from "@workspace/db/schema";
import { getUserIdForSession, extractSessionToken, SESSION_COOKIE_NAME } from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import { tierForGrams } from "../lib/tiers";

const router: IRouter = Router();
const relatedUsersTable = alias(usersTable, "related_user");

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractSessionToken(req);
  const userId = getUserIdForSession(token);
  if (!userId) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }
  (req as Request & { userId: string }).userId = userId;
  next();
}

// --- GET /api/wallet/me ------------------------------------------------------
// Registered users only — holding a balance (vs. instant credit) is one of
// the two things sign-up unlocks.
router.get("/wallet/me", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const [depositTotal] = await db
    .select({ totalGrams: sql<number>`coalesce(sum(${depositsTable.grams}), 0)` })
    .from(depositsTable)
    .where(eq(depositsTable.userId, userId));
  const depositedGrams = Number(depositTotal?.totalGrams ?? 0);

  res.json({ balanceMb: user.walletBalanceMb, depositedGrams, tier: tierForGrams(depositedGrams) });
});

// --- GET /api/wallet/transactions ---------------------------------------------
// Recent ledger entries for the signed-in user, newest first. The other
// party's first name is resolved for gifts via a self-join; it's null for
// deposits and bonuses, which have no related user.
router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const rows = await db
    .select({
      id: walletLedgerTable.id,
      deltaMb: walletLedgerTable.deltaMb,
      reason: walletLedgerTable.reason,
      createdAt: walletLedgerTable.createdAt,
      relatedFirstName: relatedUsersTable.firstName,
    })
    .from(walletLedgerTable)
    .leftJoin(relatedUsersTable, eq(walletLedgerTable.relatedUserId, relatedUsersTable.id))
    .where(eq(walletLedgerTable.userId, userId))
    .orderBy(desc(walletLedgerTable.createdAt))
    .limit(50);

  res.json({ transactions: rows });
});

// --- POST /api/wallet/gift ---------------------------------------------------
// The second thing sign-up unlocks: gifting balance to another user's phone.
router.post("/wallet/gift", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const toPhone = String(req.body?.toPhone ?? "").trim();
  const recipientName = req.body?.recipientName ? String(req.body.recipientName).trim() : undefined;
  const amountMb = Number(req.body?.amountMb);

  if (!toPhone || !Number.isFinite(amountMb) || amountMb <= 0) {
    res.status(400).json({ error: "Provide a recipient phone number and a positive amount." });
    return;
  }

  if (!checkRateLimit(`gift:user:${userId}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many gifts sent recently. Try again later." });
    return;
  }

  let [recipient] = await db.select().from(usersTable).where(eq(usersTable.phone, toPhone)).limit(1);
  if (!recipient) {
    // If recipient is a contact or new user, auto-create their account record so gifts always succeed
    const [newUser] = await db
      .insert(usersTable)
      .values({
        phone: toPhone,
        firstName: recipientName || "Builder",
        passwordHash: "contact_placeholder",
        walletBalanceMb: 0,
      })
      .returning();
    recipient = newUser;
  }
  if (recipient.id === userId) {
    res.status(400).json({ error: "You can't gift yourself." });
    return;
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!sender || sender.walletBalanceMb < amountMb) {
    res.status(400).json({ error: "Insufficient balance." });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ walletBalanceMb: sender.walletBalanceMb - amountMb })
      .where(eq(usersTable.id, sender.id));
    await tx
      .update(usersTable)
      .set({ walletBalanceMb: recipient.walletBalanceMb + amountMb })
      .where(eq(usersTable.id, recipient.id));
    await tx.insert(walletLedgerTable).values({
      userId: sender.id,
      deltaMb: -amountMb,
      reason: "gift_sent",
      relatedUserId: recipient.id,
    });
    await tx.insert(walletLedgerTable).values({
      userId: recipient.id,
      deltaMb: amountMb,
      reason: "gift_received",
      relatedUserId: sender.id,
    });
  });

  res.json({ ok: true, newBalanceMb: sender.walletBalanceMb - amountMb });
});

// --- POST /api/wallet/gift-random --------------------------------------------
// "Send to a random builder who needs data" — targets other users with the
// lowest balances first (genuine need), falling back to any other user if
// everyone happens to be well-funded.
router.post("/wallet/gift-random", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const amountMb = Number(req.body?.amountMb);

  if (!Number.isFinite(amountMb) || amountMb <= 0) {
    res.status(400).json({ error: "Provide a positive amount." });
    return;
  }
  if (!checkRateLimit(`gift:user:${userId}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many gifts sent recently. Try again later." });
    return;
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!sender || sender.walletBalanceMb < amountMb) {
    res.status(400).json({ error: "Insufficient balance." });
    return;
  }

  const NEED_THRESHOLD_MB = 20;
  const needy = await db
    .select()
    .from(usersTable)
    .where(and(ne(usersTable.id, userId), lt(usersTable.walletBalanceMb, NEED_THRESHOLD_MB)));

  let pool = needy;
  if (pool.length === 0) {
    pool = await db.select().from(usersTable).where(ne(usersTable.id, userId));
  }
  if (pool.length === 0) {
    res.status(404).json({ error: "No other builders to send data to yet." });
    return;
  }
  const recipient = pool[Math.floor(Math.random() * pool.length)]!;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ walletBalanceMb: sender.walletBalanceMb - amountMb })
      .where(eq(usersTable.id, sender.id));
    await tx
      .update(usersTable)
      .set({ walletBalanceMb: recipient.walletBalanceMb + amountMb })
      .where(eq(usersTable.id, recipient.id));
    await tx.insert(walletLedgerTable).values({
      userId: sender.id,
      deltaMb: -amountMb,
      reason: "gift_sent",
      relatedUserId: recipient.id,
    });
    await tx.insert(walletLedgerTable).values({
      userId: recipient.id,
      deltaMb: amountMb,
      reason: "gift_received",
      relatedUserId: sender.id,
    });
  });

  res.json({
    ok: true,
    newBalanceMb: sender.walletBalanceMb - amountMb,
    recipientFirstName: recipient.firstName,
  });
});

// --- POST /api/wallet/redeem-code --------------------------------------------
// Redeem a plastic drop-off code (e.g. "SH123456789paT0n") for instant 50g / 50MB credit
router.post("/wallet/redeem-code", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const rawCode = String(req.body?.code ?? "").trim();
  const sponsorTool = String(req.body?.sponsorTool ?? "Shipaton").trim();

  // Validate code (case-insensitive for SH123456789paT0n)
  if (rawCode.toLowerCase() !== "sh123456789pat0n") {
    res.status(400).json({ error: "Invalid plastic code. Please enter a valid drop-off code (Demo: SH123456789paT0n)." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const grams = 50;
  const deltaMb = 50;
  const newBalance = user.walletBalanceMb + deltaMb;
  let ledgerId = 0;

  await db.transaction(async (tx) => {
    // Record deposit in depositsTable
    await tx.insert(depositsTable).values({
      phone: user.phone,
      userId: user.id,
      grams,
      megabytes: deltaMb,
    });

    // Update user wallet balance
    await tx
      .update(usersTable)
      .set({ walletBalanceMb: newBalance })
      .where(eq(usersTable.id, user.id));

    // Record in ledger
    const [entry] = await tx
      .insert(walletLedgerTable)
      .values({
        userId: user.id,
        deltaMb,
        reason: "deposit",
      })
      .returning({ id: walletLedgerTable.id });
    if (entry) ledgerId = entry.id;
  });

  const username = user.firstName || "Shipper";
  const message = `hey ${username}, your 50 gram of plastic waste is received and 50MB is now credited to your wallet, build today with ${sponsorTool}.`;

  res.json({
    ok: true,
    newBalanceMb: newBalance,
    deltaMb,
    grams,
    txId: ledgerId,
    message,
  });
});

export default router;
