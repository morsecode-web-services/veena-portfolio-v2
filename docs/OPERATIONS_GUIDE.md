# Operations & Maintenance Guide

Now that the system is built, this guide explains how to manage the day-to-day operations of your portfolio and subscription business.

---

## 1. Daily Operations (The "Admin" Routine)
- **Check Submissions**: Visit `yourdomain.com/admin/responses` to see new inquiries.
- **Respond to Inquiries**: Since users get an auto-reply, they may reply to that email. You will see these in your linked Gmail account.
- **Lead Management**: Check `yourdomain.com/admin/leads` to follow up with high-value collaboration or performance requests.

---

## 2. Managing Subscriptions & Payments
All money-related tasks happen in the **Razorpay Dashboard**.

- **Monitoring Revenue**: Use the "Reports" section to track monthly growth.
- **Failed Payments**: If a subscription payment fails, Razorpay will automatically retry. If it fails 3 times, the subscription is cancelled.
- **Refunds**: You can issue full or partial refunds directly from the "Payments" tab in Razorpay.
- **Changing Prices**: To change a price, create a **New Plan** in Razorpay and update the **Plan ID** in your website's Admin Form settings.

---

## 3. Automation Monitoring (Make.com)
Your automation runs in the background, but it's good to check on it occasionally.

- **Execution History**: If a user reports they didn't get their Telegram link, log in to **Make.com** and check the **History** tab of your scenario.
- **Fixing Errors**: If a module shows a "red bubble," click it to see why. Usually, it's a temporary API timeout or a missing email address.
- **Manual Resend**: If automation fails, you can always manually create an invite link in Telegram and email it to the user from your Gmail.

---

## 4. Community Management (Telegram)
- **Content Delivery**: Your main job is to post content! 
- **Removing Members**: When a user cancels their subscription in Razorpay, you will receive an email. Use that to manually remove the user from your Private Telegram Channel to keep the group exclusive.
- **Engagement**: Use Telegram's built-in polls and comments to engage with your paid members.

---

## 5. Website Updates
- **Enabling/Disabling Forms**: Use the "Active" toggle in your Admin Dashboard to open or close registrations for specific classes or events.
- **Deadlines**: You can set deadlines for forms so they automatically close at a specific date/time.

---

## 6. Technical Maintenance
- **Resend Logs**: If users report not getting emails, check the **Logs** in your Resend dashboard to see if the emails were delivered or bounced.
- **Netlify Logs**: If the website feels slow or shows errors, check the **Function Logs** in the Netlify dashboard for the `send-email` or `checkout` routes.

---

## Support Checklist
If a user is stuck:
1. Check **Razorpay** to see if their payment was successful.
2. Check **Make.com** to see if the automation triggered.
3. Check **Resend** to see if the email was sent.
4. If all else fails, manually email them the link!
