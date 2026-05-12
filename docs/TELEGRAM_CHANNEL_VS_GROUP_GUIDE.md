# Telegram Channel vs Group — Cohort Setup Guide

> **Last Updated**: May 2026  
> **Context**: Paid cohort flow — Razorpay → Make.com → Telegram invite link → Student access

---

## 1. Channel vs Group — Which One for Your Cohort?

### TL;DR Recommendation
**Use a Private Channel** for content delivery, optionally paired with a **Discussion Group** for Q&A.

---

### Comparison Table

| Feature | Channel | Group (Supergroup) |
|---|---|---|
| Who can post? | **Admins only** | Everyone (unless restricted) |
| Who can see members? | Nobody | Members can see each other |
| Max members | **Unlimited** | 200,000 |
| Restrict Saving Content | ✅ Yes | ✅ Yes |
| Bot can post content | ✅ Yes | ✅ Yes |
| Bot can create invite links | ✅ Yes | ✅ Yes |
| Linked Discussion Group | ✅ Yes | N/A |
| Message threading | ❌ No (unless linked group) | ✅ Yes |
| Good for cohorts? | ✅ **Best** | ✅ Good for community |

---

### Why Channel is Better for Your Use Case

1. **You control the feed** — Only you (and your bot) can post. No student noise.
2. **Anonymous members** — Students can't see who else enrolled (privacy-friendly).
3. **Restrict Saving Content** works well on channels.
4. **Scales infinitely** — No member cap concerns.
5. **Your automation already creates invite links for channels** (see `MAKE_COM_SETUP_GUIDE.md`).

### When to Also Add a Discussion Group

If students need to ask questions or interact with each other, link a **Discussion Group** to the channel:
- Students comment on your channel posts via the linked group.
- You moderate the group separately.
- The channel stays clean and broadcast-only.

---

## 2. How to Create Your Cohort Channel (Step-by-Step)

### On Mobile (Android / iOS)

1. **Open Telegram** → tap the **pencil/compose icon** (bottom right on Android, top right on iOS).
2. Tap **New Channel**.
3. **Channel Name**: e.g., `Veena's Cohort — May 2026` (you can rename each month).
4. **Description**: e.g., `Private cohort access for enrolled students.`
5. Tap **Next**.
6. Set type to **Private** → tap **Next**.
7. (Optional) Skip adding contacts. Tap **Create**.

### On Desktop (Telegram for Mac / Windows / Web)

1. Click the **pencil icon** (top left near search bar).
2. Click **New Channel**.
3. Fill in Name and Description.
4. Click **Next** → select **Private** → click **Create**.

---

## 3. Enable Content Protection (Restrict Saving Content)

This prevents forwarding, downloading media, and screenshots on mobile.

### On Mobile (iOS & Android)

1. Open your channel → tap the **channel name** at the top.
2. Tap **Edit** (pencil icon, top right).
3. Tap **"Channel Type"** ← ⚠️ the toggle is **inside this submenu**, not on the main Edit screen.
4. Scroll to the **bottom** of the Channel Type screen.
5. Find **"Restrict Saving Content"** → toggle it **ON**.
6. Tap the **checkmark** to save, then **Done** again to exit Edit.

> ⚠️ **This only works on Private channels.** If your channel is Public, switch it to Private first — the option is on the same Channel Type screen.

### On Desktop

1. Click the channel name → click the **pencil icon** to edit.
2. Click **"Channel Type"**.
3. Scroll to the bottom — **"Restrict Saving Content"** toggle is there.
4. Toggle **ON** → Save.

---

## 4. Add Your Bot as Admin

Your Make.com automation uses a Telegram bot to generate invite links. The bot must be an admin of the channel.

1. Inside your channel → tap **Channel Name → Administrators → Add Administrator**.
2. Search for your bot's username (the one created via @BotFather).
3. Add it and ensure the following permissions are **ON**:
   - ✅ **Invite Users via Link** (critical for automation)
   - ✅ **Post Messages** (if you want the bot to send content)
   - ✅ **Edit Messages** (optional but useful)
   - ❌ Everything else can be OFF.
4. Tap **Save**.

---

## 5. Get Your Channel ID

Your Make.com scenario needs the Channel ID (not the name).

### Method 1: Via Bot API (Recommended)

1. Send a test message in your channel.
2. Visit in your browser:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Look for `"chat":{"id":-100XXXXXXXXX}`.
4. Copy the **full number including `-100`** prefix — e.g., `-1001234567890`.

> ⚠️ Missing the `-100` prefix is the #1 cause of "Chat Not Found" errors in Make.com.

### Method 2: Via @userinfobot

1. Forward any message from your channel to **@userinfobot** on Telegram.
2. It will reply with the Channel ID.

---

## 6. (Optional) Link a Discussion Group

If you want students to be able to ask questions:

1. Create a **New Group** (not channel) — e.g., `Veena's Cohort May 2026 — Discussion`.
2. Go to your **Channel Settings → Edit → Discussion**.
3. Select the group you just created.
4. This links them — channel posts now have a "Comment" button that opens the group.

---

## 7. Monthly Cohort Rotation Workflow

Since your cohorts are monthly, you'll create a **new channel every month**.

| Task | When | How |
|---|---|---|
| Create new private channel | 1–2 days before month starts | Steps above |
| Enable Restrict Saving Content | Same day | Channel settings |
| Add bot as admin | Same day | Channel settings |
| Get new Channel ID | Same day | Bot API URL |
| Update Channel ID in Make.com | Same day | Paste into Telegram module in scenario |
| Archive old channel | End of month | Leave it or delete |

> 💡 **Pro tip**: Rename the channel each month (e.g., `Veena Cohort — June 2026`) so returning students know which one is current.

---

## 8. Quick Checklist Before Going Live

- [ ] Channel created and set to **Private**
- [ ] "Restrict Saving Content" is **ON**
- [ ] Bot is added as **Admin** with "Invite Users via Link" permission
- [ ] Channel ID (with `-100` prefix) is copied
- [ ] Channel ID is updated in Make.com scenario
- [ ] Test invite link generated via Make.com works
- [ ] Old channel ID removed / archived

---

## Related Docs

- [`MAKE_COM_SETUP_GUIDE.md`](./MAKE_COM_SETUP_GUIDE.md) — Full automation flow
- [`OPERATIONS_GUIDE.md`](./OPERATIONS_GUIDE.md) — Monthly operations checklist
- [`REENROLLMENT_STRATEGY_ANALYSIS.md`](./REENROLLMENT_STRATEGY_ANALYSIS.md) — Returning student flow
