import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay API keys are missing in environment variables');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Generates a personalized payment link for a student
 */
export async function createPersonalizedPaymentLink({
  name,
  email,
  phone,
  amount,
  description,
  cohortId,
}: {
  name: string;
  email: string;
  phone?: string;
  amount: number;
  description: string;
  cohortId: string;
}) {
  try {
    const response = await razorpay.paymentLink.create({
      amount: amount, // in paise
      currency: 'INR',
      accept_partial: false,
      description: description,
      customer: {
        name,
        email,
        contact: phone || '',
      },
      notify: {
        email: true,
        sms: false,
      },
      reminder_enable: true,
      expire_by: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      notes: {
        cohortId: cohortId,
        studentEmail: email,
        studentName: name,
        formSlug: 'cohort_reenrollment',
        source: 'automated_reenrollment',
      },
      // Callback URL - where student goes after payment
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aishwaryamanikarnike.com'}/cohorts?success=true`,
      callback_method: 'get',
    });

    return {
      success: true,
      id: response.id,
      short_url: response.short_url,
    };
  } catch (error: any) {
    console.error('Razorpay Payment Link creation failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
