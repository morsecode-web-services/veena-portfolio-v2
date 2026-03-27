'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    Eye,
    MessageSquare,
    Share2,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Instagram,
    Youtube,
    MoreHorizontal,
    ExternalLink
} from 'lucide-react';
import Image from 'next/image';

// Mock Data for Social Analytics
const MOCK_TRENDS = [
    { name: 'Mon', impressions: 4000, engagement: 2400, growth: 240 },
    { name: 'Tue', impressions: 3000, engagement: 1398, growth: 210 },
    { name: 'Wed', impressions: 2000, engagement: 9800, growth: 229 },
    { name: 'Thu', impressions: 2780, engagement: 3908, growth: 200 },
    { name: 'Fri', impressions: 1890, engagement: 4800, growth: 218 },
    { name: 'Sat', impressions: 2390, engagement: 3800, growth: 250 },
    { name: 'Sun', impressions: 3490, engagement: 4300, growth: 210 },
];

const TOP_POSTS = [
    {
        id: '1',
        type: 'Reel',
        caption: 'Performing at the Royal Opera House was a dream come true! 🎻✨ #musician #live',
        likes: 1240,
        comments: 156,
        shares: 89,
        thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
        date: '2026-03-20',
        platform: 'Instagram'
    },
    {
        id: '2',
        type: 'Video',
        caption: 'Behind the scenes: Preparing for the upcoming world tour. Practice makes perfect.',
        likes: 850,
        comments: 42,
        shares: 12,
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        date: '2026-03-18',
        platform: 'YouTube'
    },
    {
        id: '3',
        type: 'Photo',
        caption: 'Exploring new soundscapes in the studio today. Something big is coming!',
        likes: 2100,
        comments: 89,
        shares: 45,
        thumbnail: 'https://images.unsplash.com/photo-1520529613142-6cc6ae6238b1?w=300&h=300&fit=crop',
        date: '2026-03-15',
        platform: 'Instagram'
    }
];

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState('7D');
    const [platform, setPlatform] = useState('All');
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchAnalytics = async () => {
        try {
            const resp = await fetch('/api/admin/social/analytics');
            const json = await resp.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchAnalytics();
    }, []);

    if (loading || !data) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
            </div>
        );
    }

    const { stats, topPosts, trends, isLive } = data;

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Social Analytics</h1>
                        <p className="text-sm text-gray-500">Track your performance across Instagram and YouTube</p>
                    </div>
                    {isLive && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-tighter rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
                {/* ... existing filters ... */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-500"
                    >
                        <option value="All">All Platforms</option>
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                    </select>
                    <div className="flex border border-gray-200 rounded-lg bg-white overflow-hidden">
                        {['7D', '30D', '90D', 'All'].map((range) => (
                            <button
                                key={range}
                                className={`px-4 py-2 text-xs font-bold border-r last:border-r-0 border-gray-200 transition-colors ${dateRange === range ? 'bg-gray-100 text-navy-900' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                onClick={() => setDateRange(range)}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat: any, index: number) => {
                    const Icon = [Eye, MessageSquare, Users, TrendingUp][index % 4];
                    const bg = ['bg-blue-50', 'bg-purple-50', 'bg-orange-50', 'bg-green-50'][index % 4];
                    const color = ['text-blue-600', 'text-purple-600', 'text-orange-600', 'text-green-600'][index % 4];

                    return (
                        <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${bg}`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.change}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-navy-900 mb-1">{stat.value}</div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-serif font-bold text-navy-900">Performance Trends</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Impressions vs Engagement</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-navy-900"></div>
                                <span className="text-xs font-medium text-gray-500">Reach</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gold-400"></div>
                                <span className="text-xs font-medium text-gray-500">Action</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0a192f" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0a192f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="impressions"
                                        stroke="#0a192f"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorImpressions)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="engagement"
                                        stroke="#d4af37"
                                        strokeWidth={3}
                                        fillOpacity={0}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-navy-900 mb-6">Audience Growth</h3>
                    <div className="space-y-6">
                        <div className="h-[200px]">
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" hide />
                                        <Tooltip />
                                        <Bar dataKey="growth" fill="#0a192f" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-navy-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Instagram className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">Instagram</span>
                                </div>
                                <span className="text-sm font-bold">+840</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Youtube className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">YouTube</span>
                                </div>
                                <span className="text-sm font-bold">+440</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Posts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-navy-900">Top Content</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Based on highest engagement</p>
                    </div>
                    <button className="text-navy-900 text-sm font-bold flex items-center gap-1 hover:text-gold-400 transition-colors">
                        View All Posts <ArrowUpRight className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topPosts.map((post: any) => (
                                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                                                <Image src={post.thumbnail} alt="post" fill className="object-cover" />
                                            </div>
                                            <div className="max-w-[300px]">
                                                <div className="text-xs font-bold text-navy-900 mb-1 line-clamp-2 leading-relaxed">
                                                    {post.caption}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{post.type} • {post.date}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {post.platform === 'Instagram' ? (
                                                <Instagram className="h-4 w-4 text-purple-600" />
                                            ) : (
                                                <Youtube className="h-4 w-4 text-red-600" />
                                            )}
                                            <span className="text-sm font-medium">{post.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-navy-900">{post.likes}</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-black tracking-tight">Likes</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-navy-900">{post.comments}</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-black tracking-tight">Comms</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-navy-900">{post.shares}</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-black tracking-tight">Shares</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-navy-900">
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
