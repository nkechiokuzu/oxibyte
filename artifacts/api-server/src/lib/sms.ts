import { logger } from "./logger";

// Twilio is already in the sponsor stack, so it's the default real
// provider — but nothing about this file forces that choice. Swap
// sendSms's Twilio branch for another provider's API call if needed.
//
// Local dev / no credentials configured: the code is logged to this
// server's terminal instead of being texted, so the whole sign-up flow
// is testable without any SMS account or cost.
export async function sendSms(phone: string, message: string): Promise<void> {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber = process.env["TWILIO_FROM_NUMBER"];

  if (!accountSid || !authToken || !fromNumber) {
    logger.info(
      { phone, message },
      "[dev-sms] TWILIO_* env vars not set — printing message instead of sending it",
    );
    // eslint-disable-next-line no-console
    console.log(`\n[dev-sms] To: ${phone}\n[dev-sms] Message: ${message}\n`);
    return;
  }

  const body = new URLSearchParams({ To: phone, From: fromNumber, Body: message });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, text }, "Twilio send failed");
    throw new Error("Failed to send verification code");
  }
}
