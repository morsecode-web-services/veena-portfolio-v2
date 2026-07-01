import { Resend, CreateEmailResponse } from 'resend';
import { render } from '@react-email/render';
import CohortWelcome from '@/emails/CohortWelcome';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Sends an email using Resend with built-in retries for rate limits (HTTP 429).
 * Uses exponential backoff and random jitter to stagger parallel requests.
 */
export async function sendEmailWithRetry(
  payload: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
  },
  maxRetries = 4,
  initialDelayMs = 1000
): Promise<CreateEmailResponse> {
  const resend = getResend();
  if (!resend) {
    return {
      data: null,
      error: { name: 'missing_api_key', message: 'RESEND_API_KEY not configured' },
    } as unknown as CreateEmailResponse;
  }

  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await resend.emails.send(payload);

      if (res.error) {
        const errorMsg = res.error.message || '';
        // Resend returns status 429 or specific rate limit messages
        const isRateLimit =
          errorMsg.toLowerCase().includes('too many requests') ||
          errorMsg.toLowerCase().includes('rate limit') ||
          (res.error as any).statusCode === 429 ||
          (res.error as any).status === 429 ||
          res.error.name === 'rate_limit_exceeded';

        if (isRateLimit && attempt < maxRetries) {
          const jitter = Math.random() * 200; // 0 to 200ms of random jitter to stagger retries
          const totalDelay = delayMs + jitter;
          console.warn(
            `[Resend Rate Limit] Attempt ${attempt} failed: ${errorMsg}. Retrying in ${Math.round(totalDelay)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, totalDelay));
          delayMs = delayMs * 2; // Exponential backoff
          continue;
        }
      }

      return res;
    } catch (err: any) {
      const errorMsg = err.message || '';
      const isRateLimit =
        errorMsg.toLowerCase().includes('too many requests') ||
        errorMsg.toLowerCase().includes('rate limit') ||
        err.statusCode === 429 ||
        err.status === 429 ||
        err.name === 'rate_limit_exceeded';

      if (isRateLimit && attempt < maxRetries) {
        const jitter = Math.random() * 200;
        const totalDelay = delayMs + jitter;
        console.warn(
          `[Resend Rate Limit Exception] Attempt ${attempt} failed: ${errorMsg}. Retrying in ${Math.round(totalDelay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
        delayMs = delayMs * 2; // Exponential backoff
        continue;
      }

      return {
        data: null,
        error: { name: 'send_exception', message: errorMsg },
      } as unknown as CreateEmailResponse;
    }
  }

  return {
    data: null,
    error: {
      name: 'rate_limit_exceeded',
      message: `Failed to send email after ${maxRetries} attempts due to rate limits.`,
    },
  } as unknown as CreateEmailResponse;
}

/**
 * Sends a cohort welcome/access email with their Telegram invite link using Resend.
 * @param email - Recipient email
 * @param name - Recipient name
 * @param inviteLink - Telegram invite link
 * @param cohortTitle - Title of the cohort (e.g. "Next Avarthanam")
 */
export async function sendCohortWelcomeEmail(
  email: string,
  name: string,
  inviteLink: string,
  cohortTitle: string = 'Cohort',
  isReminder: boolean = false
) {
  try {
    const html = await render(CohortWelcome({ name, inviteLink, isReminder }));

    const subject = isReminder
      ? `⏳ Action Required: Join your Telegram group for ${cohortTitle}`
      : `🎉 Welcome to ${cohortTitle}! Your Access Link`;

    return sendEmailWithRetry({
      from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
      to: email,
      subject,
      html,
      replyTo: 'official@aishwaryamanikarnike.com',
    });
  } catch (err: any) {
    return { data: null, error: { message: `Render/Send failed: ${err.message}` } };
  }
}
