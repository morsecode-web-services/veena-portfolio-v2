export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formats any Indian phone number to the E.164 format required by WhatsApp.
 * Handles: 10-digit, 0-prefixed, and already-formatted numbers.
 */
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length === 12) return digits; // Already correct
  if (digits.startsWith('0') && digits.length === 11) return '91' + digits.slice(1); // 0XXXXXXXXXX
  if (digits.length === 10) return '91' + digits; // XXXXXXXXXX

  return digits; // Pass through anything else as-is
}

/**
 * Sends a WhatsApp notification via Meta Cloud API using a pre-approved template.
 *
 * PREREQUISITES:
 * - Create a template named `cohort_welcome` (or set META_WHATSAPP_TEMPLATE_NAME) in
 *   Meta Business Manager → WhatsApp → Message Templates.
 * - Template body must have exactly 2 variables: {{1}} = name, {{2}} = invite link
 * - Wait for Meta approval (usually 24-48 hours) before this works in production.
 *
 * @param phone - Student phone number (any common Indian format)
 * @param name - Student first name for personalisation
 * @param inviteLink - The Telegram single-use invite link
 */
export async function sendWhatsAppNotification(
  phone: string,
  name: string,
  inviteLink: string
): Promise<WhatsAppResult> {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME || 'cohort_welcome';

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'WhatsApp credentials not configured (META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN missing)' };
  }

  if (!phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: name || 'there' },   // {{1}}
                  { type: 'text', text: inviteLink },         // {{2}}
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: `WhatsApp API error: ${data.error.message} (code: ${data.error.code})`,
      };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error: any) {
    return { success: false, error: `WhatsApp fetch failed: ${error.message}` };
  }
}
