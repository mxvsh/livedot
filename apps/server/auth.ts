import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@livedot/db";
import * as schema from "@livedot/db/schema";
import { createLogger } from "@livedot/logger";
import { env } from "./env";
import { defaultPlan } from "./limits";

const log = createLogger("auth");

log.info({ LIVEDOT_CLOUD: env.LIVEDOT_CLOUD, SMTP_HOST: env.SMTP_HOST, SMTP_PORT: env.SMTP_PORT, SMTP_USER: env.SMTP_USER }, "Auth config");

const socialProviders: Record<string, any> = {};

if (env.LIVEDOT_CLOUD) {
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
}


async function sendEmail(to: string, subject: string, html: string) {
  if (!env.SMTP_HOST) {
    log.warn({ to, subject }, "SMTP_HOST not set — skipping email");
    return;
  }
  log.debug({ to, subject, host: env.SMTP_HOST, port: env.SMTP_PORT, user: env.SMTP_USER }, "Sending email");
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  try {
    const info = await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    log.info({ to, subject, messageId: info.messageId }, "Email sent");
  } catch (err) {
    log.error(err, "Failed to send email");
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.LIVEDOT_CLOUD,
  },
  emailVerification: env.LIVEDOT_CLOUD ? {
    sendVerificationEmail: async ({ user, url }) => {
      log.info({ email: user.email, url }, "sendVerificationEmail called");
      await sendEmail(
        user.email,
        "Verify your Livedot account",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Livedot account</title>
</head>
<body style="margin:0;padding:0;background-color:#0e0e0e;font-family:'Inter',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0e0e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Brand -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-family:'Space Grotesk',Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.04em;color:#ffffff;">
                <span style="color:#aefc2d;">●</span> livedot
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#131313;border:1px solid #2a2a2a;border-radius:12px;padding:40px;">

              <p style="margin:0 0 8px;font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aefc2d;">
                Email Verification
              </p>

              <h1 style="margin:0 0 16px;font-family:'Space Grotesk',Arial,sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;">
                Verify your account
              </h1>

              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#adaaaa;">
                Hi ${user.name}, click the button below to verify your email address and activate your Livedot account.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#aefc2d;border-radius:6px;">
                    <a href="${url}" style="display:inline-block;padding:14px 32px;font-family:'Space Grotesk',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#314d00;text-decoration:none;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#767575;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#484847;word-break:break-all;">
                <a href="${url}" style="color:#767575;text-decoration:underline;">${url}</a>
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr><td style="height:1px;background-color:#2a2a2a;"></td></tr>
              </table>

              <p style="margin:0;font-size:13px;color:#767575;line-height:1.6;">
                This link expires in <strong style="color:#adaaaa;">24 hours</strong>. If you didn't create a Livedot account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#484847;">
                © ${new Date().getFullYear()} Livedot · Real-time visitor tracking
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      );
    },
    autoSignInAfterVerification: true,
  } : undefined,
  plugins: [username()],
  socialProviders,
  trustedOrigins: ["http://localhost:5173", env.APP_URL],
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const result = await db.select({ count: count() }).from(schema.user);
          const userCount = result[0]?.count ?? 0;
          if (userCount >= env.DEFAULT_MAX_USER_SIGNUP) {
            throw new Error("Registration is closed");
          }
        },
        after: async (user) => {
          await db.update(schema.user).set({ plan: defaultPlan() }).where(eq(schema.user.id, user.id));
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: env.NODE_ENV === "production",
      maxAge: 60 * 5,
    },
  },
});

export type Auth = typeof auth;

export const enabledProviders = Object.keys(socialProviders);
