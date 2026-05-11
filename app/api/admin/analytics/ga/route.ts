import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
    const auth = new GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) throw new Error('Failed to obtain access token');
    return tokenResponse.token;
}

async function runReport(accessToken: string, propertyId: string, body: any) {
    const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    );
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `GA4 API ${res.status}`);
    }
    return res.json();
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Create an authenticated Supabase client using the user's token
        // This ensures they have admin RLS access without needing the service_role key
        const userSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const propertyId = process.env.GA_PROPERTY_ID;
        const clientEmail = process.env.GA_CLIENT_EMAIL;
        const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!propertyId || !clientEmail || !privateKey) {
            const missing = [!propertyId && 'GA_PROPERTY_ID', !clientEmail && 'GA_CLIENT_EMAIL', !privateKey && 'GA_PRIVATE_KEY'].filter(Boolean).join(', ');
            return NextResponse.json({ error: `Missing: ${missing}` }, { status: 503 });
        }

        // Parse date range from query params
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30';
        const days = parseInt(range, 10);
        const startDate = `${days}daysAgo`;
        const prevStartDate = `${days * 2}daysAgo`;
        const prevEndDate = `${days + 1}daysAgo`;

        const accessToken = await getAccessToken(clientEmail, privateKey);

        // Fetch smart link data from Supabase using the authenticated client
        // Note: Clicks are tracked as a total count on the smart_links table itself
        const smartLinksPromise = userSupabase
            .from('smart_links')
            .select('slug, title, clicks')
            .order('clicks', { ascending: false })
            .limit(10);

        const [
            dailyReport, pagesReport, countriesReport, devicesReport,
            sourcesReport, overviewReport, realtimeReport,
            heatmapReport, browsersReport, landingReport,
            citiesReport, osReport, eventsReport, funnelReport,
            smartLinksResult
        ] = await Promise.all([
            // 1. Daily traffic trend
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
            }),
            // 2. Detailed Pages (more metrics)
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
                limit: 15,
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            }),
            // 3. Top countries
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'country' }],
                metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                limit: 10,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
            // 4. Device breakdown
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
            }),
            // 5. Traffic sources (Detailed)
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 12,
            }),
            // 6. Overview totals with comparison
            runReport(accessToken, propertyId, {
                dateRanges: [
                    { startDate, endDate: 'today' },
                    { startDate: prevStartDate, endDate: prevEndDate },
                ],
                metrics: [
                    { name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' },
                    { name: 'averageSessionDuration' }, { name: 'bounceRate' }, { name: 'newUsers' },
                ],
            }),
            // 7. Today
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate: 'today', endDate: 'today' }],
                metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
            }),
            // 8. Hourly heatmap (day of week x hour)
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'dayOfWeekName' }, { name: 'hour' }],
                metrics: [{ name: 'activeUsers' }],
            }),
            // 9. Browsers
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'browser' }],
                metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                limit: 8,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            }),
            // 10. Landing pages
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'landingPagePlusQueryString' }],
                metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }],
                limit: 8,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            }),
            // 11. Top Cities
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'city' }, { name: 'country' }],
                metrics: [{ name: 'activeUsers' }],
                limit: 8,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
            // 12. Operating Systems
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'operatingSystem' }],
                metrics: [{ name: 'activeUsers' }],
                limit: 6,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            }),
            // 13. Events
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
                limit: 10,
                orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            }),
            // 14. Cohort Funnel
            runReport(accessToken, propertyId, {
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
                dimensionFilter: {
                    filter: {
                        fieldName: 'eventName',
                        inListFilter: { values: ['view_item', 'begin_checkout', 'purchase'] }
                    }
                }
            }),
            // Smart links from Supabase
            smartLinksPromise,
        ]);

        // Parse Funnel
        const funnel = funnelReport.rows?.reduce((acc: any, row: any) => {
            acc[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10);
            return acc;
        }, { view_item: 0, begin_checkout: 0, purchase: 0 }) || { view_item: 0, begin_checkout: 0, purchase: 0 };

        // Parse daily trend
        const daily = dailyReport.rows?.map((row: any) => ({
            date: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            pageViews: parseInt(row.metricValues[1].value, 10),
            sessions: parseInt(row.metricValues[2].value, 10),
        })).sort((a: any, b: any) => a.date.localeCompare(b.date)) || [];

        // Parse top pages (with duration + bounce)
        const topPages = pagesReport.rows?.map((row: any) => ({
            title: row.dimensionValues[0].value,
            path: row.dimensionValues[1].value,
            views: parseInt(row.metricValues[0].value, 10),
            users: parseInt(row.metricValues[1].value, 10),
            avgDuration: Math.round(parseFloat(row.metricValues[2].value || '0')),
            bounceRate: Math.round(parseFloat(row.metricValues[3].value || '0') * 100),
        })) || [];

        // Parse countries
        const countries = countriesReport.rows?.map((row: any) => ({
            country: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10),
        })) || [];

        // Parse devices
        const devices = devicesReport.rows?.map((row: any) => ({
            device: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10),
        })) || [];

        // Parse traffic sources (now includes source detail + bounce rate)
        const sources = sourcesReport.rows?.map((row: any) => ({
            channel: row.dimensionValues[0].value,
            source: row.dimensionValues[1].value,
            sessions: parseInt(row.metricValues[0].value, 10),
            users: parseInt(row.metricValues[1].value, 10),
            bounceRate: Math.round(parseFloat(row.metricValues[2].value || '0') * 100),
        })) || [];

        // Parse cities
        const cities = citiesReport.rows?.map((row: any) => ({
            city: row.dimensionValues[0].value,
            country: row.dimensionValues[1].value,
            users: parseInt(row.metricValues[0].value, 10),
        })).filter((c: any) => c.city !== '(not set)') || [];

        // Parse OS
        const operatingSystems = osReport.rows?.map((row: any) => ({
            os: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
        })) || [];

        // Parse events
        const events = eventsReport.rows?.map((row: any) => ({
            event: row.dimensionValues[0].value,
            count: parseInt(row.metricValues[0].value, 10),
        })) || [];

        // Parse overview with comparison
        const currentMetrics = overviewReport.rows?.[0]?.metricValues || [];
        const previousMetrics = overviewReport.rows?.[1]?.metricValues || [];
        const getVal = (arr: any[], i: number) => parseFloat(arr[i]?.value || '0');
        const getPct = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const overview = {
            users: { value: getVal(currentMetrics, 0), change: getPct(getVal(currentMetrics, 0), getVal(previousMetrics, 0)) },
            pageViews: { value: getVal(currentMetrics, 1), change: getPct(getVal(currentMetrics, 1), getVal(previousMetrics, 1)) },
            sessions: { value: getVal(currentMetrics, 2), change: getPct(getVal(currentMetrics, 2), getVal(previousMetrics, 2)) },
            avgDuration: { value: Math.round(getVal(currentMetrics, 3)), change: getPct(getVal(currentMetrics, 3), getVal(previousMetrics, 3)) },
            bounceRate: { value: Math.round(getVal(currentMetrics, 4) * 100), change: getPct(getVal(currentMetrics, 4), getVal(previousMetrics, 4)) },
            newUsers: { value: getVal(currentMetrics, 5), change: getPct(getVal(currentMetrics, 5), getVal(previousMetrics, 5)) },
        };

        // Parse today
        const todayRow = realtimeReport.rows?.[0]?.metricValues || [];
        const today = {
            users: parseInt(todayRow[0]?.value || '0', 10),
            pageViews: parseInt(todayRow[1]?.value || '0', 10),
        };

        // Parse heatmap
        const DAY_ORDER: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
        const heatmap = heatmapReport.rows?.map((row: any) => ({
            day: row.dimensionValues[0].value,
            dayIndex: DAY_ORDER[row.dimensionValues[0].value] ?? 0,
            hour: parseInt(row.dimensionValues[1].value, 10),
            users: parseInt(row.metricValues[0].value, 10),
        })) || [];

        // Parse browsers
        const browsers = browsersReport.rows?.map((row: any) => ({
            browser: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value, 10),
            sessions: parseInt(row.metricValues[1].value, 10),
        })) || [];

        // Parse landing pages
        const landingPages = landingReport.rows?.map((row: any) => ({
            page: row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value, 10),
            users: parseInt(row.metricValues[1].value, 10),
            bounceRate: Math.round(parseFloat(row.metricValues[2].value || '0') * 100),
        })) || [];

        // Parse smart link clicks
        let smartLinks: { slug: string; title: string; clicks: number }[] = [];
        if (smartLinksResult.data) {
            smartLinks = smartLinksResult.data.map(link => ({
                slug: link.slug,
                title: link.title || link.slug,
                clicks: link.clicks || 0
            })).filter(link => link.clicks > 0);
        }

        return NextResponse.json({
            success: true,
            overview, today, daily, topPages, countries, devices,
            sources, heatmap, browsers, landingPages, smartLinks,
            cities, operatingSystems, events, funnel,
        });
    } catch (error: any) {
        console.error('[GA4] Error:', error.message || error);
        return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
    }
}
