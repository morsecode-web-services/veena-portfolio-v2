# Gmail Integration Guide (Titan Email)

This guide explains how to link your professional email (`official@aishwaryamanikarnike.com`) to your personal Gmail account so you can read and send emails directly from Gmail for free.

## Prerequisites
- Your email address: `official@aishwaryamanikarnike.com`
- Your Titan Email password.
- Access to your personal `@gmail.com` account on a desktop browser.

---

## Part 1: Receiving Emails (POP3)
This will "fetch" emails from Titan and show them in your Gmail inbox.

1.  Open [Gmail Settings](https://mail.google.com/mail/u/0/#settings/accounts).
2.  Go to the **Accounts and Import** tab.
3.  In the **Check mail from other accounts** section, click **Add a mail account**.
4.  Enter your email: `official@aishwaryamanikarnike.com` and click **Next**.
5.  Select **Import emails from my other account (POP3)** and click **Next**.
6.  Enter the following settings:
    - **Username**: `official@aishwaryamanikarnike.com`
    - **Password**: Your Titan password.
    - **POP Server**: `pop.titan.email`
    - **Port**: `995`
    - **Check these boxes**:
        - [x] Leave a copy of retrieved message on the server (Recommended so Titan still has a backup).
        - [x] Always use a secure connection (SSL) when retrieving mail.
        - [x] Label incoming messages (Helps distinguish official mail from personal mail).
7.  Click **Add Account**.

---

## Part 2: Sending Emails (SMTP)
This allows you to select your official address in the "From" field when composing a new email in Gmail.

1.  Once Part 1 is finished, Gmail will ask if you want to be able to send mail as this address. Select **Yes** and click **Next**.
    - *Alternatively, go to Settings > Accounts and Import > Send mail as > Add another email address.*
2.  **Name**: Your Name (as it should appear to recipients).
3.  **Email Address**: `official@aishwaryamanikarnike.com`.
4.  **Treat as an alias**: Uncheck this box (Recommended).
5.  Click **Next Step**.
6.  Enter the following **SMTP Server** settings:
    - **SMTP Server**: `smtp.titan.email`
    - **Port**: `465`
    - **Username**: `official@aishwaryamanikarnike.com`
    - **Password**: Your Titan password.
    - **Secure Connection**: Select **SSL** (Recommended for Port 465).
7.  Click **Add Account**.

---

## Part 3: Verification
1.  Gmail will send a verification code to `official@aishwaryamanikarnike.com`.
2.  Open your Titan webmail (or wait a minute for it to show up in your Gmail inbox) to get the code.
3.  Enter the code in the Gmail popup and click **Verify**.

---

## Part 4: Final Touch (Make it Default)
1.  In Gmail **Settings** > **Accounts and Import**.
2.  Under **Send mail as**, you can click **"make default"** next to your official address if you want to use it for most of your emails.
3.  Under **When replying to a message**, select **"Reply from the same address the message was sent to"**.

---

## Troubleshooting
- **Authentication Error**: Double-check your password. If you've forgotten it, you must reset it in the GoDaddy/Titan dashboard.
- **Connection Timed Out**: Ensure you are using Port **995** for POP and **465** for SMTP with SSL.
- **Emails are slow to arrive**: Gmail fetches mail from other accounts every few minutes. You can force a refresh by clicking the **Refresh** button in the main Gmail inbox or by going to Settings > Accounts and Import and clicking **"Check mail now"**.
