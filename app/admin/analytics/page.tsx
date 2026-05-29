'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
    BarChart3, Users, Eye, TrendingUp, TrendingDown, Clock, ArrowUpRight,
    Globe, Smartphone, Monitor, Tablet, Zap, RefreshCw, Link as LinkIcon,
    FileSearch, Calendar as CalendarIcon, Compass, Cpu, MousePointer,
} from 'lucide-react';

const C = {
    blue: '#3B82F6', green: '#10B981', purple: '#8B5CF6', orange: '#F59E0B',
    pink: '#EC4899', cyan: '#06B6D4', red: '#EF4444', slate: '#64748B', gold: '#d4af37',
};
const PIE = [C.blue, C.green, C.purple, C.orange, C.pink, C.cyan];

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function dur(s: number) { return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`; }
function fdate(d: string) { return `${d.substring(4, 6)}/${d.substring(6, 8)}`; }

const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-navy-950 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
            <p className="font-bold text-amber-400 mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }} />
                    {e.name}: <b>{e.value?.toLocaleString()}</b>
                </p>
            ))}
        </div>
    );
};

function KPI({ title, value, change, icon, color }: any) {
    const pos = title === 'Bounce Rate' ? change <= 0 : change >= 0;
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <div className="p-1.5 rounded-lg" style={{ background: `${color}15`, color }}>{icon}</div>
            </div>
            <p className="text-2xl font-bold text-navy-900">{typeof value === 'number' ? fmt(value) : value}</p>
            <div className="mt-2 flex items-center gap-1">
                {pos ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className={`text-[11px] font-bold ${pos ? 'text-emerald-500' : 'text-red-400'}`}>{change > 0 ? '+' : ''}{change}%</span>
                <span className="text-[11px] text-gray-400">vs prev</span>
            </div>
        </div>
    );
}

function Bar1({ label, value, max, color, sub }: any) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="relative py-2 px-3 rounded-lg overflow-hidden">
            <div className="absolute inset-0 rounded-lg opacity-10" style={{ background: color, width: `${pct}%` }} />
            <div className="relative flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-medium text-navy-900 truncate">{label}</p>
                    {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            </div>
        </div>
    );
}

function Section({ title, icon, action, children }: any) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <div className="text-gray-400">{icon}</div>
                    <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide">{title}</h2>
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>
            {children}
        </div>
    );
}

const PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: '7', label: '7d' },
    { value: '30', label: '30d' },
    { value: '90', label: '90d' },
    { value: 'custom', label: 'Custom' }
];

const getRangeLabel = (range: string) => {
    if (range === 'today') return 'Today';
    if (range === 'this_week') return 'This Week';
    if (range === 'custom') return 'Custom Range';
    return `${range} Days`;
};

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [cohortStats, setCohortStats] = useState<any[]>([]);
    const [overallStats, setOverallStats] = useState({
        totalRevenue: 0,
        totalPaidStudents: 0,
        overallAverage: 0,
        totalLeads: 0
    });
    const [selectedCohortId, setSelectedCohortId] = useState<string>('all');
    const [cohortsList, setCohortsList] = useState<any[]>([]);
    const [paidSubmissions, setPaidSubmissions] = useState<any[]>([]);
    const [webhookLogsMap, setWebhookLogsMap] = useState<Map<string, any>>(new Map());

    const fetch_ = useCallback(async (refresh = false) => {
        try {
            // Prevent fetching if custom is selected but no date is picked
            if (dateRange === 'custom' && !customStart) return;

            if (refresh) setRefreshing(true); else setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            let url = `/api/admin/analytics/ga?range=${dateRange}`;
            if (dateRange === 'custom' && customStart) {
                url = `/api/admin/analytics/ga?start=${customStart}&end=${customEnd || new Date().toISOString().split('T')[0]}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed');
            if (json.daily) json.daily = json.daily.map((d: any) => ({ ...d, d: fdate(d.date) }));
            setData(json); setError(null);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, [dateRange, customStart, customEnd]);

    const fetchCohortStats = useCallback(async () => {
        // Fetch cohorts pricing details
        const { data: cohorts } = await supabase.from('cohorts').select('id, title, price, pricing_type');
        
        // Fetch only paid submissions for revenue calculations
        const { data: subs } = await supabase
            .from('form_submissions')
            .select('cohort_id, razorpay_payment_id, razorpay_amount')
            .eq('payment_status', 'paid')
            .not('cohort_id', 'is', null);
            
        // Fetch leads for total interest metrics
        const { data: leads } = await supabase.from('leads').select('cohort_id').not('cohort_id', 'is', null);
        
        // Fetch unpaid submissions as additional leads/interest
        const { data: unpaidSubs } = await supabase
            .from('form_submissions')
            .select('cohort_id')
            .neq('payment_status', 'paid')
            .not('cohort_id', 'is', null);

        // Map matching webhook logs for actual payment amount lookup (handles custom "Pay As You Wish" amounts)
        const paymentIds = subs?.map(s => s.razorpay_payment_id).filter(Boolean) || [];
        const logsMap = new Map();
        
        try {
            if (paymentIds.length > 0) {
                // Paginate or fetch in batches if extremely large, but a standard .in is perfect here
                const { data: logs, error: logsError } = await supabase
                    .from('webhook_logs')
                    .select('event_id, payload')
                    .in('event_id', paymentIds);
                    
                if (logsError) throw logsError;
                
                logs?.forEach(log => {
                    if (log.event_id) {
                        logsMap.set(log.event_id, log.payload);
                    }
                });
            }
        } catch (err) {
            console.warn('[Analytics] Failed to fetch actual payment amounts from webhook_logs:', err);
        }

        if (cohorts) {
                const stats = cohorts.map(c => {
                const cohortSubs = subs?.filter(s => s.cohort_id === c.id) || [];
                
                // Sum actual payments
                let totalRevenue = 0;
                cohortSubs.forEach(s => {
                    let amount = 0;
                    if (s.razorpay_amount !== undefined && s.razorpay_amount !== null) {
                        amount = Number(s.razorpay_amount) / 100;
                    } else if (s.razorpay_payment_id && logsMap.has(s.razorpay_payment_id)) {
                        const payload = logsMap.get(s.razorpay_payment_id);
                        const paise = payload?.payload?.payment?.entity?.amount;
                        if (paise !== undefined && paise !== null) {
                            amount = Number(paise) / 100;
                        }
                    }
                    
                    // Fallback to default set price if no webhook payload log exists
                    if (amount === 0) {
                        amount = c.price / 100;
                    }
                    
                    totalRevenue += amount;
                });

                // Lead/Interest count
                const leadCount = (leads?.filter(l => l.cohort_id === c.id).length || 0) + 
                                  (unpaidSubs?.filter(us => us.cohort_id === c.id).length || 0);

                return {
                    id: c.id,
                    title: c.title,
                    pricing_type: c.pricing_type || 'fixed',
                    cohort_price: c.price / 100,
                    student_count: cohortSubs.length,
                    lead_count: leadCount,
                    revenue: totalRevenue,
                    average: cohortSubs.length > 0 ? (totalRevenue / cohortSubs.length) : 0
                };
            });

            // Sort by revenue descending
            stats.sort((a, b) => b.revenue - a.revenue);
            setCohortStats(stats);

            // Calculate overall aggregates
            let overallRevenue = 0;
            let overallPaidStudents = 0;
            let overallLeads = 0;

            stats.forEach(s => {
                overallRevenue += s.revenue;
                overallPaidStudents += s.student_count;
                overallLeads += s.lead_count;
            });

            setOverallStats({
                totalRevenue: overallRevenue,
                totalPaidStudents: overallPaidStudents,
                overallAverage: overallPaidStudents > 0 ? (overallRevenue / overallPaidStudents) : 0,
                totalLeads: overallLeads
            });

            setCohortsList(cohorts || []);
            setPaidSubmissions(subs || []);
            setWebhookLogsMap(logsMap);
        }
    }, []);

    const paymentDist = React.useMemo(() => {
        const distMap = new Map();
        
        // Filter submissions by selected cohort
        const filteredSubs = selectedCohortId === 'all'
            ? paidSubmissions
            : paidSubmissions.filter(s => s.cohort_id === selectedCohortId);

        filteredSubs.forEach(s => {
            let amount = 0;
            if (s.razorpay_amount !== undefined && s.razorpay_amount !== null) {
                amount = Number(s.razorpay_amount) / 100;
            } else if (s.razorpay_payment_id && webhookLogsMap.has(s.razorpay_payment_id)) {
                const payload = webhookLogsMap.get(s.razorpay_payment_id);
                const paise = payload?.payload?.payment?.entity?.amount;
                if (paise !== undefined && paise !== null) {
                    amount = Number(paise) / 100;
                }
            }
            
            if (amount === 0 && s.cohort_id) {
                const c = cohortsList.find(x => x.id === s.cohort_id);
                if (c) amount = c.price / 100;
            }
            
            if (amount > 0) {
                distMap.set(amount, (distMap.get(amount) || 0) + 1);
            }
        });

        return Array.from(distMap.entries())
            .map(([amount, count]) => ({
                amount,
                amountLabel: `₹${amount.toLocaleString()}`,
                students: count
            }))
            .sort((a, b) => a.amount - b.amount);
    }, [paidSubmissions, cohortsList, webhookLogsMap, selectedCohortId]);

    useEffect(() => { 
        fetch_(); 
        fetchCohortStats();
    }, [dateRange, fetch_, fetchCohortStats]);

    if (error) return (
        <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-red-600">
            <p className="font-bold">Error</p><p>{error}</p>
        </div>
    );

    if (loading && !data) return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div>
            <div className="h-72 bg-gray-200 rounded-xl" />
        </div>
    );

    const { overview, today, daily, topPages, countries, devices, sources,
        heatmap, browsers, landingPages, smartLinks, cities, operatingSystems, events } = data || {};

    const totalDevUsers = devices?.reduce((a: number, d: any) => a + d.users, 0) || 0;
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const maxHeat = Math.max(...(heatmap || []).map((h: any) => h.users), 1);
    const maxEvt = events?.[0]?.count || 1;
    const maxOS = operatingSystems?.[0]?.users || 1;

    return (
        <div className="max-w-[1400px] mx-auto pb-20 relative">
            {/* Loading overlay */}
            {loading && data && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-xl px-6 py-4 border border-gray-100">
                        <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                        <p className="text-xs font-bold text-navy-900">Loading {getRangeLabel(dateRange).toLowerCase()} data…</p>
                    </div>
                </div>
            )}

            <div className={`space-y-5 transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-navy-900">Analytics</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Google Analytics · Unified Dashboard</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            {PRESETS.map(p => (
                                <button key={p.value} onClick={() => setDateRange(p.value)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${dateRange === p.value ? 'bg-navy-900 text-white' : 'text-gray-500 hover:text-navy-900'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {dateRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 animate-in slide-in-from-right-4">
                                <input 
                                    type="date" 
                                    value={customStart} 
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-[10px] font-bold p-1 border-none focus:ring-0 bg-transparent"
                                />
                                <span className="text-[10px] text-gray-400 font-bold">TO</span>
                                <input 
                                    type="date" 
                                    value={customEnd} 
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-[10px] font-bold p-1 border-none focus:ring-0 bg-transparent"
                                />
                            </div>
                        )}
                        {today && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 text-xs font-bold">
                                <Zap className="w-3.5 h-3.5" />{today.users} users today · {today.pageViews} views
                            </div>
                        )}
                        <button onClick={() => fetch_(true)} disabled={refreshing}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KPI title="Users" value={overview.users.value} change={overview.users.change} icon={<Users className="w-4 h-4" />} color={C.blue} />
                    <KPI title="Page Views" value={overview.pageViews.value} change={overview.pageViews.change} icon={<Eye className="w-4 h-4" />} color={C.green} />
                    <KPI title="Sessions" value={overview.sessions.value} change={overview.sessions.change} icon={<BarChart3 className="w-4 h-4" />} color={C.purple} />
                    <KPI title="Avg Duration" value={dur(overview.avgDuration.value)} change={overview.avgDuration.change} icon={<Clock className="w-4 h-4" />} color={C.orange} />
                    <KPI title="Bounce Rate" value={`${overview.bounceRate.value}%`} change={overview.bounceRate.change} icon={<ArrowUpRight className="w-4 h-4" />} color={C.red} />
                    <KPI title="New Users" value={overview.newUsers.value} change={overview.newUsers.change} icon={<TrendingUp className="w-4 h-4" />} color={C.cyan} />
                </div>

                {/* Traffic Chart */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide mb-4">Traffic Trend · {getRangeLabel(dateRange)}</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.12} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.green} stopOpacity={0.12} /><stop offset="95%" stopColor={C.green} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <Tooltip content={<Tip />} />
                                <Area type="monotone" name="Views" dataKey="pageViews" stroke={C.green} strokeWidth={2} fill="url(#gv)" dot={false} activeDot={{ r: 4 }} />
                                <Area type="monotone" name="Users" dataKey="users" stroke={C.blue} strokeWidth={2} fill="url(#gu)" dot={false} activeDot={{ r: 4 }} />
                                <Area type="monotone" name="Sessions" dataKey="sessions" stroke={C.purple} strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cohort Analytics Dashboard: Conversion Funnel & Revenue Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        {data.funnel ? (
                            <Section title="Cohort Enrollment Funnel" icon={<Zap className="w-4 h-4 text-gold-500" />}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    {[
                                        { label: 'Cohort Views', value: data.funnel.view_item, color: C.blue, sub: 'Initial Interest' },
                                        { label: 'Form Opens', value: data.funnel.begin_checkout, color: C.purple, sub: 'Purchase Intent' },
                                        { label: 'Enrollments', value: data.funnel.purchase, color: C.green, sub: 'Revenue Realized' }
                                    ].map((step, i, arr) => {
                                        const prev = arr[i-1];
                                        const conversion = prev ? Math.round((step.value / prev.value) * 100) || 0 : 100;
                                        
                                        return (
                                            <div key={step.label} className="relative group">
                                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-gold-200 transition-all hover:bg-white hover:shadow-md">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{step.label}</span>
                                                        {i > 0 && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                conversion > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {conversion}% conv.
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-3xl font-bold text-navy-900 mb-1">{step.value.toLocaleString()}</div>
                                                    <div className="text-[10px] font-medium text-slate-400">{step.sub}</div>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                                        <div className="w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                                                            <ArrowUpRight className="w-3 h-3 text-slate-300 rotate-90" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 flex items-center justify-center text-slate-400 text-sm h-full">
                                Funnel data currently unavailable
                            </div>
                        )}
                    </div>
                    
                    <div className="lg:col-span-1">
                        <Section title="Cohort Revenue & Enrollment" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
                            <div className="space-y-4 pt-1">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 text-center shadow-sm">
                                        <span className="text-[8px] font-bold text-emerald-600 block uppercase tracking-wider">Revenue</span>
                                        <span className="text-xs font-black text-emerald-800">₹{overallStats.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2 text-center shadow-sm">
                                        <span className="text-[8px] font-bold text-blue-600 block uppercase tracking-wider">Students</span>
                                        <span className="text-xs font-black text-blue-800">{overallStats.totalPaidStudents}</span>
                                    </div>
                                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2 text-center shadow-sm">
                                        <span className="text-[8px] font-bold text-purple-600 block uppercase tracking-wider">Average</span>
                                        <span className="text-xs font-black text-purple-800">₹{Math.round(overallStats.overallAverage).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                    {cohortStats.length > 0 ? (
                                        cohortStats.map((c: any, i: number) => (
                                            <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="font-bold text-[11px] text-navy-900 truncate max-w-[140px]" title={c.title}>
                                                        {c.title}
                                                    </div>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                                        c.pricing_type === 'pay_as_you_wish' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {c.pricing_type === 'pay_as_you_wish' ? 'Dakshina' : 'Fixed'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                                    <span>{c.student_count} Paid {c.lead_count > 0 && <span className="text-slate-400">({c.lead_count} Leads)</span>}</span>
                                                    <span className="font-bold text-navy-950">₹{c.revenue.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                                                    <span>Suggested: ₹{c.cohort_price}</span>
                                                    <span>Avg: ₹{Math.round(c.average).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 py-4 text-center">No enrollments yet.</p>
                                    )}
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>

                {/* Cohort Payment Distribution Chart */}
                <Section 
                    title="Cohort Payment Distribution" 
                    icon={<BarChart3 className="w-4 h-4 text-purple-500" />}
                    action={
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cohort:</span>
                            <select
                                value={selectedCohortId}
                                onChange={(e) => setSelectedCohortId(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500"
                            >
                                <option value="all">All Cohorts</option>
                                {cohortsList.map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    }
                >
                    <div className="h-64 pt-4">
                        {paymentDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="amountLabel" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="students" fill={C.purple} radius={[4, 4, 0, 0]} maxBarSize={50} name="Students" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-xs text-gray-400 py-20 text-center">No payment distribution data available for this cohort.</p>
                        )}
                    </div>
                </Section>

                {/* Row 1: Pages + Sources */}

                {/* Row 1: Pages + Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Pages table with more columns */}
                    <Section title="Top Pages" icon={<FileSearch className="w-4 h-4" />}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-100">
                                        <th className="pb-2 text-left font-semibold">Page</th>
                                        <th className="pb-2 text-right font-semibold">Views</th>
                                        <th className="pb-2 text-right font-semibold">Users</th>
                                        <th className="pb-2 text-right font-semibold">Dur.</th>
                                        <th className="pb-2 text-right font-semibold">Bounce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {topPages?.map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-2 pr-2">
                                                <div className="font-medium text-navy-900 truncate max-w-[160px]" title={p.title}>{p.title || p.path}</div>
                                                <div className="text-gray-400 truncate max-w-[160px]">{p.path}</div>
                                            </td>
                                            <td className="py-2 text-right font-bold text-navy-900">{p.views.toLocaleString()}</td>
                                            <td className="py-2 text-right text-gray-500">{p.users.toLocaleString()}</td>
                                            <td className="py-2 text-right text-gray-500">{dur(p.avgDuration)}</td>
                                            <td className={`py-2 text-right font-medium ${p.bounceRate > 70 ? 'text-red-500' : p.bounceRate > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                {p.bounceRate}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* Sources table */}
                    <Section title="Traffic Sources" icon={<Compass className="w-4 h-4" />}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-100">
                                        <th className="pb-2 text-left font-semibold">Channel / Source</th>
                                        <th className="pb-2 text-right font-semibold">Sessions</th>
                                        <th className="pb-2 text-right font-semibold">Users</th>
                                        <th className="pb-2 text-right font-semibold">Bounce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sources?.map((s: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-2 pr-2">
                                                <div className="font-medium text-navy-900">{s.channel}</div>
                                                <div className="text-gray-400">{s.source !== '(direct)' && s.source !== s.channel ? s.source : ''}</div>
                                            </td>
                                            <td className="py-2 text-right font-bold text-navy-900">{s.sessions.toLocaleString()}</td>
                                            <td className="py-2 text-right text-gray-500">{s.users.toLocaleString()}</td>
                                            <td className={`py-2 text-right font-medium ${s.bounceRate > 70 ? 'text-red-500' : s.bounceRate > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                {s.bounceRate}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                </div>

                {/* Row 2: Countries + Cities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Section title="Countries" icon={<Globe className="w-4 h-4" />}>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                            {countries?.map((c: any, i: number) => (
                                <Bar1 key={i} label={c.country} value={c.users} max={countries[0]?.users} color={C.blue} sub={`${c.sessions} sessions`} />
                            ))}
                        </div>
                    </Section>
                    <Section title="Top Cities" icon={<Globe className="w-4 h-4" />}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-100">
                                        <th className="pb-2 text-left font-semibold">City</th>
                                        <th className="pb-2 text-right font-semibold">Country</th>
                                        <th className="pb-2 text-right font-semibold">Users</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {cities?.map((c: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-2 font-medium text-navy-900">{c.city}</td>
                                            <td className="py-2 text-right text-gray-400">{c.country}</td>
                                            <td className="py-2 text-right font-bold text-navy-900">{c.users.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                </div>

                {/* Row 3: Devices + OS + Browsers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Section title="Devices" icon={<Monitor className="w-4 h-4" />}>
                        <div className="h-36 mb-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={devices} dataKey="users" nameKey="device" cx="50%" cy="50%" innerRadius={36} outerRadius={58} strokeWidth={2} stroke="#fff">
                                        {devices?.map((_: any, i: number) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {devices?.map((d: any, i: number) => {
                            const pct = totalDevUsers > 0 ? Math.round((d.users / totalDevUsers) * 100) : 0;
                            return (
                                <div key={d.device} className="flex items-center justify-between text-xs mb-1.5">
                                    <div className="flex items-center gap-1.5 capitalize">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE[i] }} />
                                        {d.device}
                                    </div>
                                    <span className="font-bold">{pct}% <span className="text-gray-400 font-normal">({d.users})</span></span>
                                </div>
                            );
                        })}
                    </Section>

                    <Section title="Operating Systems" icon={<Cpu className="w-4 h-4" />}>
                        <div className="space-y-3">
                            {operatingSystems?.map((o: any, i: number) => (
                                <div key={o.os}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-navy-900">{o.os}</span>
                                        <span className="font-bold text-gray-600">{o.users.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-full rounded-full" style={{ width: `${Math.round((o.users / maxOS) * 100)}%`, background: PIE[i % PIE.length] }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Browsers" icon={<Compass className="w-4 h-4" />}>
                        <div className="space-y-3">
                            {browsers?.map((b: any, i: number) => (
                                <div key={b.browser}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-navy-900">{b.browser}</span>
                                        <span className="font-bold text-gray-600">{b.sessions.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-full rounded-full" style={{ width: `${Math.round((b.sessions / (browsers[0]?.sessions || 1)) * 100)}%`, background: C.purple }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Row 4: Landing Pages + Events + Smart Links */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <Section title="Landing Pages" icon={<FileSearch className="w-4 h-4" />}>
                        <div className="space-y-1">
                            {landingPages?.map((p: any, i: number) => (
                                <Bar1 key={i} label={p.page} value={p.sessions} max={landingPages[0]?.sessions} color={C.orange}
                                    sub={`${p.users} users · ${p.bounceRate}% bounce`} />
                            ))}
                        </div>
                    </Section>

                    <Section title="GA4 Events" icon={<MousePointer className="w-4 h-4" />}>
                        <div className="space-y-3">
                            {events?.map((e: any, i: number) => (
                                <div key={e.event}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-navy-900 font-mono">{e.event}</span>
                                        <span className="font-bold text-gray-600">{e.count.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-full rounded-full" style={{ width: `${Math.round((e.count / maxEvt) * 100)}%`, background: C.pink }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Smart Link Clicks (All Time)" icon={<LinkIcon className="w-4 h-4" />}>
                        <div className="space-y-1">
                            {smartLinks?.length > 0
                                ? smartLinks.map((l: any, i: number) => (
                                    <Bar1 key={i} label={l.title} value={l.clicks} max={smartLinks[0]?.clicks} color={C.gold} sub={`/link/${l.slug}`} />
                                ))
                                : <p className="text-xs text-gray-400 py-4 text-center">No clicks recorded yet.</p>
                            }
                        </div>
                    </Section>


                </div>

                {/* Heatmap */}
                <Section title="Activity Heatmap · Day × Hour (Local Time)" icon={<CalendarIcon className="w-4 h-4" />}>
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[44px_repeat(24,1fr)] gap-[3px] mb-1">
                                <div />
                                {HOURS.map(h => (
                                    <div key={h} className="text-[9px] text-gray-400 text-center">{h % 3 === 0 ? h : ''}</div>
                                ))}
                            </div>
                            {DAYS.map((day, di) => (
                                <div key={day} className="grid grid-cols-[44px_repeat(24,1fr)] gap-[3px] mb-[3px] items-center">
                                    <div className="text-[10px] text-gray-500 font-medium pr-1 text-right">{day.substring(0, 3)}</div>
                                    {HOURS.map(h => {
                                        const cell = heatmap?.find((x: any) => x.dayIndex === di && x.hour === h);
                                        const v = cell?.users || 0;
                                        const opacity = v === 0 ? 0.06 : Math.max(0.12, v / maxHeat);
                                        return (
                                            <div key={h}
                                                className="aspect-square rounded-[2px] cursor-default hover:scale-150 hover:z-10 transition-transform"
                                                style={{ background: C.orange, opacity }}
                                                title={`${day} ${h}:00 — ${v} users`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                            <div className="flex items-center justify-end gap-2 mt-3">
                                <span className="text-[10px] text-gray-400">Less</span>
                                {[0.06, 0.2, 0.4, 0.65, 0.9].map(o => (
                                    <div key={o} className="w-3 h-3 rounded-sm" style={{ background: C.orange, opacity: o }} />
                                ))}
                                <span className="text-[10px] text-gray-400">More</span>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
}
