export interface TwilioResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Formats a phone number to E.164 format.
 * Twilio requires the + prefix and country code.
 */
function formatE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Indian number handling
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  
  // If already has + or seems complete, just ensure + prefix
  return phone.startsWith('+') ? phone : `+${digits}`;
}


/**
 * Sends a WhatsApp message via Twilio.
 * In production, you MUST use a template (ContentSid) if the 24h window is closed.
 * @param to - Recipient phone
 * @param body - Message body (used for sandbox or session messages)
 * @param contentSid - (Optional) Twilio Content SID for pre-approved templates
 * @param contentVariables - (Optional) JSON string of variables for the template
 */
export async function sendTwilioWhatsApp(
  to: string,
  body: string,
  contentSid?: string,
  contentVariables?: string
): Promise<TwilioResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const formattedTo = formatE164(to);
  const waTo = `whatsapp:${formattedTo}`;
  const waFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const params: any = {
      To: waTo,
      From: waFrom,
    };

    if (contentSid) {
      params.ContentSid = contentSid;
      if (contentVariables) {
        params.ContentVariables = contentVariables;
      }
    } else {
      params.Body = body;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams(params),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageSid: data.sid };
    } else {
      return {
        success: false,
        error: `Twilio WA Error: ${data.message} (code: ${data.code})`,
      };
    }
  } catch (error: any) {
    return { success: false, error: `Twilio WA fetch failed: ${error.message}` };
  }
}
