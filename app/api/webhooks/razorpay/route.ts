import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        // SECURITY: Verify the Razorpay signature to prevent spoofing

        // Check if webhook secret is configured
        if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
            console.error('Webhook failed: RAZORPAY_WEBHOOK_SECRET is not configured');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify Razorpay Webhook Signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);

        // Handle both subscriptions and one-time orders
        if (event.event === 'subscription.charged' || event.event === 'order.paid') {
            const isSubscription = event.event === 'subscription.charged';
            const entity = isSubscription ? event.payload.subscription.entity : event.payload.order.entity;
            const paymentEntity = !isSubscription ? event.payload.payment.entity : null;
            
            const subId = isSubscription ? entity.id : null;
            const orderId = !isSubscription ? entity.id : null;
            const paymentId = !isSubscription ? paymentEntity.id : null;
            const customerId = isSubscription ? entity.customer_id : null;
            const notes = entity.notes || {};

            // 1. Check if the submission already exists (frontend succeeded)
            const query = supabaseAdmin.from('form_submissions').select('id');
            if (isSubscription) {
                query.eq('razorpay_subscription_id', subId);
            } else {
                query.eq('razorpay_order_id', orderId);
            }

            const { data: existingSubmissions, error: fetchError } = await query;

            // 2. If it does NOT exist (frontend failed / orphaned), create a fallback record
            if (!existingSubmissions || existingSubmissions.length === 0) {
                console.log(`Orphaned ${isSubscription ? 'subscription' : 'order'} detected (${subId || orderId}). Reconstructing record...`);
                
                const fallbackData = {
                    form_slug: notes.formSlug || 'payment_fallback',
                    user_name: notes.name || 'Anonymous User',
                    user_email: notes.email || null,
                    form_data: {
                        name: notes.name || '',
                        email: notes.email || '',
                        phone: notes.phone || '',
                        _note: `This record was automatically reconstructed via Webhook (${event.event}) due to a client-side drop-off.`
                    },
                    status: 'unread',
                    payment_status: 'paid',
                    razorpay_subscription_id: subId,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    razorpay_customer_id: customerId,
                    cohort_id: notes.cohortId || null,
                    is_verified: true // Automatically verify paid submissions
                };

                const { error: insertError } = await supabaseAdmin
                    .from('form_submissions')
                    .insert([fallbackData]);

                if (insertError) {
                    console.error('Error inserting orphaned record:', insertError);
                    return NextResponse.json({ error: 'Failed to insert fallback' }, { status: 500 });
                }
                
                console.log('Successfully reconstructed orphaned record.');
            } else {
                console.log(`${isSubscription ? 'Subscription' : 'Order'} ${subId || orderId} already exists in DB. Syncing status...`);
                // Update the existing record to ensure payment_status is 'paid' and IDs are set
                const updateData: any = { payment_status: 'paid', is_verified: true };
                if (paymentId) updateData.razorpay_payment_id = paymentId;

                const updateQuery = supabaseAdmin.from('form_submissions').update(updateData);
                if (isSubscription) {
                    updateQuery.eq('razorpay_subscription_id', subId);
                } else {
                    updateQuery.eq('razorpay_order_id', orderId);
                }
                
                await updateQuery;
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (err: any) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
