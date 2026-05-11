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
    const { formSlug, phone, email, name, paymentType: clientPaymentType, cohortId } = await request.json();

    if (!formSlug && !cohortId) {
      return NextResponse.json({ error: 'Form slug or Cohort ID is required' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay keys are not configured' },
        { status: 500 }
      );
    }

    let paymentType = 'subscription';
    let razorpayAmount = 0;
    let razorpayPlanId = '';
    let telegramChatId = '';

    if (cohortId) {
      // Fetch cohort config
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('price, razorpay_plan_id, telegram_chat_id, status')
        .eq('id', cohortId)
        .single();

      if (cohortError || !cohort) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }

      if (cohort.status !== 'active') {
        return NextResponse.json({ error: 'This cohort is not accepting enrollments' }, { status: 403 });
      }

      razorpayAmount = cohort.price;
      razorpayPlanId = cohort.razorpay_plan_id;
      telegramChatId = cohort.telegram_chat_id;
      // Cohorts can be one-time or subscription. If plan_id exists, it's a subscription.
      paymentType = razorpayPlanId ? 'subscription' : 'one_time';
    } else {
      // SECURITY: Fetch the official payment config from the database
      // Do not trust the amount or plan_id sent from the client!
      const { data: config, error: configError } = await supabase
        .from('form_configs')
        .select('payment_type, razorpay_amount, razorpay_plan_id, is_active, requires_payment, telegram_chat_id')
        .eq('form_slug', formSlug)
        .single();

      if (configError || !config) {
        return NextResponse.json({ error: 'Form configuration not found' }, { status: 404 });
      }

      if (!config.is_active || !config.requires_payment) {
        return NextResponse.json({ error: 'This form does not accept payments' }, { status: 403 });
      }

      paymentType = config.payment_type;
      razorpayAmount = config.razorpay_amount;
      razorpayPlanId = config.razorpay_plan_id;
      telegramChatId = config.telegram_chat_id;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const notes = {
      formSlug: formSlug || 'cohort_enrollment',
      cohortId: cohortId || '',
      phone: phone || '',
      email: email || '',
      name: name || 'Anonymous User',
      telegram_chat_id: telegramChatId || '' // Pass the dynamic chat ID
    };

    // Handle both subscriptions and one-time orders
    if (paymentType === 'one_time') {
      if (!razorpayAmount) throw new Error('Amount is not configured');
      
      const order = await razorpay.orders.create({
        amount: Math.round(razorpayAmount), // Cohort price is already in paise if we follow the schema
        currency: 'INR',
        notes: notes
      });

      return NextResponse.json({
        type: 'order',
        order_id: order.id,
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: razorpayAmount,
        telegram_chat_id: telegramChatId
      });

    } else {
      // Create a Razorpay subscription (Recurring)
      if (!razorpayPlanId) throw new Error('Plan ID is not configured');

      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        total_count: 120, // Default 10 years (120 months) limit for recurring
        notes: notes
      });

      return NextResponse.json({
        type: 'subscription',
        subscription_id: subscription.id,
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: razorpayAmount,
        telegram_chat_id: telegramChatId
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
