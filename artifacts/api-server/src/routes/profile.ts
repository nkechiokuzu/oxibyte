import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, and, ne, gte, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, emailOtpCodesTable, depositsTable, toPublicUser } from "@workspace/db/schema";
import { getUserIdForSession, extractSessionToken, SESSION_COOKIE_NAME, generateOtpCode } from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import { sendEmail } from "../lib/email";
import { tierForGrams, gramsToNextTier } from "../lib/tiers";

const router: IRouter = Router();

const OTP_TTL_MS = 8 * 60 * 1000; // 8 minutes, matches phone OTP
const OTP_MAX_ATTEMPTS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB decoded
const ALLOWED_PHOTO_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_GENDERS = new Set(["male", "female", "other", "prefer_not_to_say"]);
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

async function depositSummaryFor(userId: string) {
  const [row] = await db
    .select({ totalGrams: sql<number>`coalesce(sum(${depositsTable.grams}), 0)` })
    .from(depositsTable)
    .where(eq(depositsTable.userId, userId));
  const totalGrams = Number(row?.totalGrams ?? 0);
  return { totalGrams, tier: tierForGrams(totalGrams), gramsToNextTier: gramsToNextTier(totalGrams) };
}

// --- GET /api/profile/me ---------------------------------------------------
// Full profile plus deposit tier, for the profile/edit screen.
router.get("/profile/me", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: toPublicUser(user), ...(await depositSummaryFor(userId)) });
});

// --- PATCH /api/profile -----------------------------------------------------
// Editable fields only. Phone is deliberately absent — it's never editable
// here; changing it would require re-verifying it via the OTP flow, which
// this endpoint doesn't do.
router.patch("/profile", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (req.body?.firstName !== undefined) {
    const firstName = String(req.body.firstName).trim();
    if (!firstName) {
      res.status(400).json({ error: "First name can't be empty." });
      return;
    }
    updates.firstName = firstName;
  }
  if (req.body?.lastName !== undefined) {
    updates.lastName = String(req.body.lastName).trim() || null;
  }
  if (req.body?.username !== undefined) {
    const username = String(req.body.username).trim();
    if (username && !USERNAME_RE.test(username)) {
      res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, underscore or period." });
      return;
    }
    updates.username = username || null;
  }
  if (req.body?.gender !== undefined) {
    const gender = String(req.body.gender).trim().toLowerCase();
    if (gender && !ALLOWED_GENDERS.has(gender)) {
      res.status(400).json({ error: "Invalid gender value." });
      return;
    }
    updates.gender = gender || null;
  }
  if (req.body?.dateOfBirth !== undefined) {
    const raw = String(req.body.dateOfBirth).trim();
    if (raw && !DATE_RE.test(raw)) {
      res.status(400).json({ error: "Date of birth must be in YYYY-MM-DD format." });
      return;
    }
    updates.dateOfBirth = raw || null;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No changes provided." });
    return;
  }

  try {
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "That username is already taken." });
      return;
    }
    throw err;
  }
});

// --- POST /api/profile/photo ------------------------------------------------
// Body: { photoDataUrl: "data:image/png;base64,..." }. Client is expected to
// downscale/compress before sending — this just enforces a hard ceiling.
router.post("/profile/photo", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const dataUrl = String(req.body?.photoDataUrl ?? "");
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/]+=*)$/.exec(dataUrl);

  if (!match) {
    res.status(400).json({ error: "Provide a PNG, JPEG or WEBP image as a data URL." });
    return;
  }
  const [, mime, base64] = match as unknown as [string, string, string];
  if (!ALLOWED_PHOTO_MIME.has(mime)) {
    res.status(400).json({ error: "Unsupported image type." });
    return;
  }
  const approxBytes = Math.ceil((base64.length * 3) / 4);
  if (approxBytes > MAX_PHOTO_BYTES) {
    res.status(400).json({ error: "Image too large. Please use an image under 2MB." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ profilePhotoUrl: dataUrl })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: toPublicUser(updated) });
});

// --- POST /api/profile/email/request-otp -------------------------------------
router.post("/profile/email/request-otp", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const email = String(req.body?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (!checkRateLimit(`email-otp-send:user:${userId}`, 3, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many codes requested. Try again in a few minutes." });
    return;
  }

  const [taken] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, email), eq(usersTable.emailVerified, true), ne(usersTable.id, userId)))
    .limit(1);
  if (taken) {
    res.status(409).json({ error: "That email is already linked to another account." });
    return;
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.insert(emailOtpCodesTable).values({ userId, email, code, expiresAt });

  await sendEmail(
    email,
    "Verify your plasticbyte email",
    `<p>Your verification code is <strong>${code}</strong>. It expires in 8 minutes.</p>`,
  );

  res.json({ ok: true });
});

// --- POST /api/profile/email/verify-otp ---------------------------------------
router.post("/profile/email/verify-otp", requireAuth, async (req, res) => {
  const { userId } = req as Request & { userId: string };
  const code = String(req.body?.code ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Enter the 6-digit code." });
    return;
  }
  if (!checkRateLimit(`email-otp-verify:user:${userId}`, 8, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Request a new code shortly." });
    return;
  }

  const [latest] = await db
    .select()
    .from(emailOtpCodesTable)
    .where(
      and(
        eq(emailOtpCodesTable.userId, userId),
        eq(emailOtpCodesTable.consumed, false),
        gte(emailOtpCodesTable.expiresAt, new Date()),
      ),
    )
    .orderBy(sql`${emailOtpCodesTable.createdAt} desc`)
    .limit(1);

  if (!latest || latest.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ error: "That code has expired or is no longer valid. Request a new one." });
    return;
  }
  if (latest.code !== code) {
    await db
      .update(emailOtpCodesTable)
      .set({ attempts: latest.attempts + 1 })
      .where(eq(emailOtpCodesTable.id, latest.id));
    res.status(400).json({ error: "Incorrect code." });
    return;
  }

  await db.update(emailOtpCodesTable).set({ consumed: true }).where(eq(emailOtpCodesTable.id, latest.id));

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ email: latest.email, emailVerified: true })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "That email is already linked to another account." });
      return;
    }
    throw err;
  }
});

export default router;
