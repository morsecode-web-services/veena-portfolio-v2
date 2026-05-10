import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Use service role for internal config lookup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { formSlug, phone, email, name, paymentType: clientPaymentType } = await request.json();

    if (!formSlug) {
      return NextResponse.json({ error: 'Form slug is required' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay keys are not configured' },
        { status: 500 }
      );
    }

    // SECURITY: Fetch the official payment config from the database
    // Do not trust the amount or plan_id sent from the client!
    const { data: config, error: configError } = await supabase
      .from('form_configs')
      .select('payment_type, razorpay_amount, razorpay_plan_id, is_active, requires_payment')
      .eq('form_slug', formSlug)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Form configuration not found' }, { status: 404 });
    }

    if (!config.is_active || !config.requires_payment) {
      return NextResponse.json({ error: 'This form does not accept payments' }, { status: 403 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentType = config.payment_type;

    // Handle both subscriptions and one-time orders
    if (paymentType === 'one_time') {
      const amount = config.razorpay_amount;
      if (!amount) throw new Error('Amount is not configured for this form');
      
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise (amount * 100)
        currency: 'INR',
        notes: {
          formSlug: formSlug,
          phone: phone || '',
          email: email || '',
          name: name || 'Anonymous User'
        }
      });

      return NextResponse.json({
        type: 'order',
        order_id: order.id,
        key_id: process.env.RAZORPAY_KEY_ID,
      });

    } else {
      // Create a Razorpay subscription (Recurring)
      const plan_id = config.razorpay_plan_id;
      if (!plan_id) throw new Error('Plan ID is not configured for this form');

      const subscription = await razorpay.subscriptions.create({
        plan_id: plan_id,
        customer_notify: 1,
        total_count: 120, // Default 10 years (120 months) limit for recurring
        notes: {
          formSlug: formSlug,
          phone: phone || '',
          email: email || '',
          name: name || 'Anonymous User'
        }
      });

      return NextResponse.json({
        type: 'subscription',
        subscription_id: subscription.id,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    }
  } catch (error: any) {
    console.error('Razorpay Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
