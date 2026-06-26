const TELEGRAM_API = 'https://api.telegram.org';

export interface TelegramInviteResult {
  success: boolean;
  inviteLink?: string;
  error?: string;
}

/**
 * Generates a single-use Telegram invite link for a private channel.
 * Requires the bot to be an admin with "Invite Users via Link" permission.
 * @param chatId - The channel ID including the -100 prefix (e.g. -1001234567890)
 * @param expireHours - How long the link is valid for (default: 24 hours)
 */
export async function generateTelegramInviteLink(
  chatId: string,
  expireHours: number = 24,
  inviteName?: string
): Promise<TelegramInviteResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  if (!chatId) {
    return { success: false, error: 'No telegram_chat_id provided in payment notes' };
  }

  try {
    const expireDate = Math.floor(Date.now() / 1000) + expireHours * 3600;

    const response = await fetch(`${TELEGRAM_API}/bot${botToken}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        member_limit: 1, // Single-use — cannot be shared
        expire_date: expireDate,
        name: inviteName ? inviteName.substring(0, 32) : 'Cohort Access', // Label visible in Telegram admin panel
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: `Telegram API error: ${data.description} (error_code: ${data.error_code})`,
      };
    }

    return { success: true, inviteLink: data.result.invite_link };
  } catch (error: any) {
    return { success: false, error: `Telegram fetch failed: ${error.message}` };
  }
}
