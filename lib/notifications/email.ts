import { Resend } from 'resend';
import { render } from '@react-email/render';
import CohortWelcome from '@/emails/CohortWelcome';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
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
  const resend = getResend();
  if (!resend) return { error: 'RESEND_API_KEY not configured' };

  try {
    const html = await render(CohortWelcome({ name, inviteLink, isReminder }));

    const subject = isReminder 
      ? `⏳ Action Required: Join your Telegram group for ${cohortTitle}`
      : `🎉 Welcome to ${cohortTitle}! Your Access Link`;

    return resend.emails.send({
      from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
      to: email,
      subject,
      html,
      replyTo: 'official@aishwaryamanikarnike.com',
    });
  } catch (err: any) {
    return { error: `Render/Send failed: ${err.message}` };
  }
}
