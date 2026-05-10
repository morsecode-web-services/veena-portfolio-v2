# Google Analytics 4 (GA4) Admin Dashboard Setup Guide

To pull your GA4 traffic data securely into your custom admin dashboard, you need to create a **Service Account** in Google Cloud that has "Read & Analyze" permissions to your GA4 property.

## Step 1: Find your GA4 Property ID
1. Go to [Google Analytics](https://analytics.google.com).
2. Click the **Admin** gear icon in the bottom left.
3. Under the **Property** column, click **Property Settings**.
4. Copy the **Property ID** (a number like `123456789`).
5. Add it to your `.env.local` file:
   ```env
   GA_PROPERTY_ID=123456789
   ```

## Step 2: Create a Google Cloud Service Account
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for **Google Analytics Data API** and click **Enable**.
4. Go to **IAM & Admin** > **Service Accounts**.
5. Click **Create Service Account**. Name it `portfolio-analytics` and click Create.
6. Once created, click on the new service account to view its details.
7. Copy the **Email** address (it will look like `portfolio-analytics@project-id.iam.gserviceaccount.com`).
8. Go to the **Keys** tab, click **Add Key** > **Create New Key**, and choose **JSON**. A file will download to your computer.

## Step 3: Grant the Service Account Access to GA4
1. Go back to [Google Analytics](https://analytics.google.com).
2. Go to **Admin** > **Property Access Management**.
3. Click the blue **+** button and select **Add users**.
4. Paste the **Email** address from the service account you just created.
5. Select the **Viewer** role and click **Add**.

## Step 4: Add the Credentials to your Environment Variables
Open the JSON file that downloaded from Google Cloud. Extract the `client_email` and `private_key` and add them to your `.env.local` file.

**Important:** The private key has newline characters (`\n`). Copy the exact string inside the quotes, including the `\n` characters.

```env
GA_CLIENT_EMAIL=portfolio-analytics@project-id.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Once these three variables are set, restart your development server. Your custom dashboard will immediately start graphing your Google Analytics data!
