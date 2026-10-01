import { logger } from "./logger";

// Resend is the default real provider here (simple HTTP API, no SDK
// required) — swap sendEmail's fetch call for another provider if needed.
//
// Local dev / no credentials configured: the email is logged to this
// server's terminal instead of being sent, so the email-verification flow
// is testable without any email account or cost — same pattern as sendSms.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const fromEmail = process.env["EMAIL_FROM"] ?? "plasticbyte <onboarding@resend.dev>";

  if (!apiKey) {
    logger.info({ to, subject }, "[dev-email] RESEND_API_KEY not set — printing message instead of sending it");
    // eslint-disable-next-line no-console
    console.log(`\n[dev-email] To: ${to}\n[dev-email] Subject: ${subject}\n[dev-email] Body: ${html}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, text }, "Resend send failed");
    throw new Error("Failed to send verification email");
  }
}
