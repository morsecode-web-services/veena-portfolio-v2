# Social Analytics Integration Guide

Follow these steps to connect your Instagram and YouTube accounts to your custom analytics dashboard.

## 1. Instagram Insights (Meta API)

To pull your Instagram follower growth, impressions, and engagement:

1.  **Convert to Business/Creator**: Your Instagram account must be a **Business** or **Creator** account and linked to a **Facebook Page**.
2.  **Create a Meta App**:
    - Go to [Meta for Developers](https://developers.facebook.com/).
    - Click **My Apps** > **Create App**.
    - Select **Business** as the app type.
3.  **Add Instagram Graph API**:
    - In your App Dashboard, find **Instagram Graph API** and click **Set Up**.
4.  **Generate Access Token**:
    - Go to **Tools** > **Graph API Explorer**.
    - Select your App.
    - Add these permissions: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `pages_show_list`.
    - Click **Get Token** > **Get User Access Token**.
5.  **Long-Lived Token (Required)**:
    - User access tokens expire in 1-2 hours. You must exchange it for a **Long-Lived Token** (60 days).
    - Use the Meta [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to "Extend" your token.

## 2. YouTube Analytics (Google API)

1.  **Google Cloud Console**:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project.
2.  **Enable APIs**:
    - Go to **APIs & Services** > **Library**.
    - Enable **YouTube Data API v3**.
3.  **Create Credentials**:
    - Go to **APIs & Services** > **Credentials**.
    - Click **Create Credentials** > **API Key**.
    - (Optional) Restrict the API key to "YouTube Data API v3" for security.

## 3. Configure Your Portfolio

Add the following to your `.env.local` file:

```env
# Instagram
META_ACCESS_TOKEN=your_long_lived_token_here
INSTAGRAM_BUSINESS_ID=your_instagram_id_here

# YouTube
YOUTUBE_API_KEY=your_google_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here
```

> [!TIP]
> You can find your **Instagram Business ID** by using the Graph API Explorer and querying `me?fields=instagram_business_account`.
