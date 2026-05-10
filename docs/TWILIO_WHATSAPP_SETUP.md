# Twilio WhatsApp Setup Guide

This guide explains how to set up Twilio to send automated WhatsApp messages via Make.com.

## 1. Create a Twilio Account
1. Go to [Twilio.com](https://www.twilio.com/) and sign up for a free trial.
2. Complete the verification steps (Email and Phone).
3. You will receive a **Trial Credit** (usually $15) which is enough for hundreds of test messages.

## 2. Activate the WhatsApp Sandbox
Before you can send messages to any number, you need to use the Sandbox for testing.
1. In the Twilio Console, go to **Messaging** -> **Try it Out** -> **Send a WhatsApp Message**.
2. Follow the instructions to join the sandbox by sending a message from your phone (e.g., `join optic-focus`) to the provided Twilio number.
3. Once joined, your phone is "whitelisted" to receive automated messages from this sandbox.

## 3. Get Your API Credentials
1. Go to your [Twilio Dashboard](https://www.twilio.com/console).
2. Look for the **Account SID** and **Auth Token**.
3. Copy these; you will need them for Make.com.

## 4. Connect to Make.com
1. In your Make.com scenario, add the **Twilio** module.
2. Select the action **Send a Message**.
3. Click **Add** next to the Connection field.
4. Paste your **Account SID** and **Auth Token**.
5. **From**: Enter your Twilio Sandbox number (e.g., `whatsapp:+14155238886`).
6. **To**: Map the phone number from Razorpay. **Crucial**: You must add `whatsapp:` before the number. 
   - Example: `whatsapp:{{1.payload.payment.entity.notes.phone}}`
7. **Body**: Enter your message with the Telegram link.

## 5. Moving to Production (Optional)
The Sandbox only works for numbers that have manually "joined" it. To send messages to *any* customer automatically:
1. Go to **Messaging** -> **Senders** -> **WhatsApp Senders**.
2. Click **Register a WhatsApp Sender**.
3. You will need a verified Meta Business Manager ID.
4. Once approved, you can use your own business number instead of the Sandbox number.
