// Email service utility using EmailJS
import emailjs from '@emailjs/browser';
import { ContactFormData } from '@/types';

/**
 * Custom error class for email service errors
 */
export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'TIMEOUT_ERROR' | 'CONFIG_ERROR',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

/**
 * Validates EmailJS configuration
 */
function validateEmailJSConfig(): void {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new EmailServiceError(
      'EmailJS is not configured. Please set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in your .env.local file.',
      'CONFIG_ERROR',
      false
    );
  }
}

/**
 * Sends a contact form email using EmailJS
 * EmailJS documentation: https://www.emailjs.com/docs/
 */
export async function sendContactEmail(
  data: ContactFormData,
  options: { timeout?: number; retries?: number } = {}
): Promise<void> {
  const { timeout = 10000, retries = 2 } = options;
  
  // Validate the data
  if (!data.name || !data.email || !data.phone || !data.purpose) {
    throw new EmailServiceError(
      'All fields are required',
      'VALIDATION_ERROR',
      false
    );
  }

  // Validate EmailJS configuration
  validateEmailJSConfig();

  // Attempt to send with retries
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await sendEmailWithTimeout(data, timeout);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation or config errors
      if (error instanceof EmailServiceError && !error.retryable) {
        throw error;
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // All retries failed
  throw new EmailServiceError(
    lastError?.message || 'Failed to send email after multiple attempts',
    'NETWORK_ERROR',
    false
  );
}

/**
 * Internal function to send email with timeout using EmailJS
 */
async function sendEmailWithTimeout(
  data: ContactFormData,
  timeout: number
): Promise<void> {
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new EmailServiceError(
        'Request timed out',
        'TIMEOUT_ERROR',
        true
      ));
    }, timeout);
  });

  // Create send promise using EmailJS
  const sendPromise = (async () => {
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

      // Prepare template parameters for EmailJS
      // These variable names should match your EmailJS template variables
      const templateParams = {
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        message: data.purpose,
        timestamp: data.timestamp?.toLocaleString() || new Date().toLocaleString(),
      };

      // Send email using EmailJS
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      // Check response status
      if (response.status !== 200) {
        throw new EmailServiceError(
          `EmailJS returned status ${response.status}: ${response.text}`,
          'SERVER_ERROR',
          true
        );
      }

      console.log('Email sent successfully via EmailJS:', response);
    } catch (error: any) {
      // Handle EmailJS specific errors
      if (error instanceof EmailServiceError) {
        throw error;
      }

      // Network or EmailJS API errors
      const errorMessage = error?.text || error?.message || 'Unknown error occurred';
      
      throw new EmailServiceError(
        `Failed to send email: ${errorMessage}`,
        'NETWORK_ERROR',
        true
      );
    }
  })();

  // Race between send and timeout
  return Promise.race([sendPromise, timeoutPromise]);
}

/**
 * EmailJS Setup Instructions:
 * 
 * 1. Create an account at https://www.emailjs.com/
 * 
 * 2. Add an email service (Gmail, Outlook, etc.)
 *    - Go to Email Services and connect your email provider
 * 
 * 3. Create an email template
 *    - Go to Email Templates and create a new template
 *    - Use these variable names in your template:
 *      {{from_name}} - Sender's name
 *      {{from_email}} - Sender's email
 *      {{phone}} - Sender's phone number
 *      {{message}} - The message content
 *      {{timestamp}} - When the form was submitted
 * 
 * 4. Get your credentials
 *    - Service ID: From your Email Services page
 *    - Template ID: From your Email Templates page
 *    - Public Key: From Account > General (formerly called User ID)
 * 
 * 5. Create .env.local file in your project root:
 *    NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
 *    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
 *    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
 * 
 * Example EmailJS Template:
 * 
 * Subject: New Contact Form Submission from {{from_name}}
 * 
 * Body:
 * You have received a new contact form submission:
 * 
 * Name: {{from_name}}
 * Email: {{from_email}}
 * Phone: {{phone}}
 * 
 * Message:
 * {{message}}
 * 
 * Submitted: {{timestamp}}
 */
