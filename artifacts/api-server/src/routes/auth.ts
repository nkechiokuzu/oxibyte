import { Router, type IRouter } from "express";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  otpCodesTable,
  phoneVerificationsTable,
  depositsTable,
  walletLedgerTable,
  toPublicUser,
} from "@workspace/db/schema";
import {
  isValidPhone,
  generateOtpCode,
  generateOpaqueToken,
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getUserIdForSession,
  extractSessionToken,
  SESSION_COOKIE_NAME,
} from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import { sendSms } from "../lib/sms";

const router: IRouter = Router();

const OTP_TTL_MS = 8 * 60 * 1000; // 8 minutes
const OTP_MAX_ATTEMPTS = 5; // per code, before it's rejected outright
const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes to complete registration
const SIGNUP_BONUS_MB = 20;

// --- POST /api/auth/request-otp --------------------------------------------
router.post("/auth/request-otp", async (req, res) => {
  const phone = String(req.body?.phone ?? "").trim();

  if (!isValidPhone(phone)) {
    res.status(400).json({ error: "Enter a valid international phone number, e.g. +2348012345678." });
    return;
  }

  const ip = req.ip ?? "unknown";
  const isDevSms = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN;
  const phoneLimit = isDevSms ? 20 : 5;
  const ipLimit = isDevSms ? 50 : 15;

  if (!checkRateLimit(`otp-send:phone:${phone}`, phoneLimit, 5 * 60 * 1000)) {
    res.status(429).json({ error: "Too many codes requested for this number. Try again in a few minutes." });
    return;
  }
  if (!checkRateLimit(`otp-send:ip:${ip}`, ipLimit, 5 * 60 * 1000)) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.insert(otpCodesTable).values({ phone, code, expiresAt });

  try {
    await sendSms(phone, `${code} is your plasticbyte verification code. It expires in 8 minutes.`);
  } catch (err) {
    if (!isDevSms) throw err;
  }

  res.json({ ok: true, devCode: isDevSms ? code : undefined });
});

// --- POST /api/auth/verify-otp ----------------------------------------------
router.post("/auth/verify-otp", async (req, res) => {
  const phone = String(req.body?.phone ?? "").trim();
  const code = String(req.body?.code ?? "").trim();

  if (!isValidPhone(phone) || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Missing or invalid phone/code." });
    return;
  }

  const ip = req.ip ?? "unknown";
  if (!checkRateLimit(`otp-verify:phone:${phone}`, 8, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Request a new code shortly." });
    return;
  }
  if (!checkRateLimit(`otp-verify:ip:${ip}`, 20, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Try again shortly." });
    return;
  }

  const [latest] = await db
    .select()
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.consumed, false), gte(otpCodesTable.expiresAt, new Date())))
    .orderBy(sql`${otpCodesTable.createdAt} desc`)
    .limit(1);

  if (!latest || latest.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ error: "That code has expired or is no longer valid. Request a new one." });
    return;
  }

  if (latest.code !== code) {
    await db
      .update(otpCodesTable)
      .set({ attempts: latest.attempts + 1 })
      .where(eq(otpCodesTable.id, latest.id));
    res.status(400).json({ error: "Incorrect code." });
    return;
  }

  await db.update(otpCodesTable).set({ consumed: true }).where(eq(otpCodesTable.id, latest.id));

  const token = generateOpaqueToken();
  await db.insert(phoneVerificationsTable).values({
    token,
    phone,
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  });

  res.json({ verificationToken: token });
});

// --- POST /api/auth/register ------------------------------------------------
router.post("/auth/register", async (req, res) => {
  const verificationToken = String(req.body?.verificationToken ?? "");
  const firstName = String(req.body?.firstName ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!verificationToken || !firstName || password.length < 6) {
    res.status(400).json({ error: "Missing name, password (6+ characters), or verification." });
    return;
  }

  const [verification] = await db
    .select()
    .from(phoneVerificationsTable)
    .where(eq(phoneVerificationsTable.token, verificationToken))
    .limit(1);

  if (!verification || verification.consumed || verification.expiresAt < new Date()) {
    res.status(400).json({ error: "Verification expired. Please verify your phone number again." });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, verification.phone)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account already exists for this phone number." });
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(usersTable)
      .values({ phone: verification.phone, firstName, passwordHash })
      .returning();
    if (!newUser) throw new Error("Failed to create user");

    await tx
      .update(phoneVerificationsTable)
      .set({ consumed: true })
      .where(eq(phoneVerificationsTable.token, verificationToken));

    // Signup bonus, always credited.
    await tx.insert(walletLedgerTable).values({
      userId: newUser.id,
      deltaMb: SIGNUP_BONUS_MB,
      reason: "signup_bonus",
    });
    let balance = SIGNUP_BONUS_MB;

    // Deposits logged against this phone before the account existed —
    // surface them immediately and credit them retroactively.
    const priorDeposits = await tx
      .select()
      .from(depositsTable)
      .where(and(eq(depositsTable.phone, verification.phone), isNull(depositsTable.userId)));

    for (const deposit of priorDeposits) {
      await tx
        .update(depositsTable)
        .set({ userId: newUser.id })
        .where(eq(depositsTable.id, deposit.id));
      await tx.insert(walletLedgerTable).values({
        userId: newUser.id,
        deltaMb: deposit.megabytes,
        reason: "deposit_backfill",
      });
      balance += deposit.megabytes;
    }

    const [updatedUser] = await tx
      .update(usersTable)
      .set({ walletBalanceMb: balance })
      .where(eq(usersTable.id, newUser.id))
      .returning();

    return { user: updatedUser ?? newUser, priorDepositsCount: priorDeposits.length, priorDepositsMb: priorDeposits.reduce((sum, d) => sum + d.megabytes, 0) };
  });

  const sessionToken = createSession(user.user.id);
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: toPublicUser(user.user),
    token: sessionToken,
    signupBonusMb: SIGNUP_BONUS_MB,
    priorDepositsFound: user.priorDepositsCount,
    priorDepositsMb: user.priorDepositsMb,
  });
});

// --- POST /api/auth/login ---------------------------------------------------
router.post("/auth/login", async (req, res) => {
  const phone = String(req.body?.phone ?? "").trim();
  const password = String(req.body?.password ?? "");

  const ip = req.ip ?? "unknown";
  if (!checkRateLimit(`login:ip:${ip}`, 15, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Try again shortly." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect phone number or password." });
    return;
  }

  const sessionToken = createSession(user.id);
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: toPublicUser(user), token: sessionToken });
});

// --- POST /api/auth/logout ---------------------------------------------------
router.post("/auth/logout", (req, res) => {
  const token = extractSessionToken(req);
  destroySession(token);
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: isSecure ? "none" : "lax", secure: isSecure });
  res.json({ ok: true });
});

// --- GET /api/auth/me ---------------------------------------------------
router.get("/auth/me", async (req, res) => {
  const token = extractSessionToken(req);
  const userId = getUserIdForSession(token);
  if (!userId) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

// --- POST /api/auth/change-password ------------------------------------------
router.post("/auth/change-password", async (req, res) => {
  const token = extractSessionToken(req);
  const userId = getUserIdForSession(token);
  if (!userId) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }

  const currentPassword = String(req.body?.currentPassword ?? "");
  const newPassword = String(req.body?.newPassword ?? "");

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }
  if (!checkRateLimit(`change-password:user:${userId}`, 8, 10 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Try again shortly." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const newPasswordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newPasswordHash }).where(eq(usersTable.id, userId));

  res.json({ ok: true });
});

export default router;
