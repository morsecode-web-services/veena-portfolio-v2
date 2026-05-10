'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/system/Button';
import { useToast } from '@/context/ToastContext';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  inquiry_type: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'converted' | 'archived';
  form_slug: string | null;
  form_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface FormField {
  name: string;
  label: string;
  type: string;
}

interface FormConfig {
  form_slug: string;
  fields: FormField[];
}

type StatusFilter = Lead['status'] | 'all';

export default function LeadsPage() {
  const { addToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [configs, setConfigs] = useState<Record<string, FormConfig>>({});
  const [loading, setLoading] = useState(true);
  const [slugFilter, setSlugFilter] = useState<string>('dashboard');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(null);

  // Helper for semantic discovery - shared across functions
  const getField = useCallback((lead: Lead, type: string, keywords: string[]) => {
    // 1. Try legacy columns
    if (type === 'text' && lead.name && lead.name !== 'Anonymous') return lead.name;
    if (type === 'email' && lead.email) return lead.email;
    if (type === 'tel' && lead.phone) return lead.phone;

    const config = lead.form_slug ? configs[lead.form_slug] : null;
    if (!config) return null;

    // 2. Try by type
    const byType = config.fields.find(f => f.type === type);
    if (byType && lead.form_data?.[byType.name]) return lead.form_data[byType.name];

    // 3. Try by keywords
    const byName = config.fields.find(f =>
      keywords.some(kw =>
        f.name.toLowerCase().includes(kw) ||
        f.label.toLowerCase().includes(kw)
      )
    );
    if (byName && lead.form_data?.[byName.name]) return lead.form_data[byName.name];

    return null;
  }, [configs]);


  const fetchLastViewed = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_leads_viewed_at')
        .eq('id', session.user.id)
        .single();

      if (profile?.last_leads_viewed_at) {
        setLastViewedAt(profile.last_leads_viewed_at);
      }
    }
  }, []);

  const updateLastViewed = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ last_leads_viewed_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  }, []);

  const fetchConfigs = useCallback(async () => {
    const { data } = await supabase.from('form_configs').select('form_slug, fields');
    if (data) {
      const configMap = data.reduce((acc, config) => {
        acc[config.form_slug] = config;
        return acc;
      }, {} as Record<string, FormConfig>);
      setConfigs(configMap);
    }
  }, []);

  const filterLeads = useCallback(() => {
    let filtered = [...leads];

    // Filter by form slug (dashboard and all show everything)
    if (slugFilter !== 'all' && slugFilter !== 'dashboard') {
      filtered = filtered.filter(lead => lead.form_slug === slugFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead => {
          const leadName = (getField(lead, 'text', ['name', 'full name']) || 'Anonymous').toLowerCase();
          const leadEmail = (getField(lead, 'email', ['email', 'email address']) || '').toLowerCase();
          const leadPhone = (getField(lead, 'tel', ['phone', 'contact', 'mobile', 'whatsapp']) || '');
          const leadMessage = (lead.message || lead.form_data?.message || '').toLowerCase();
          const jsonData = JSON.stringify(lead.form_data).toLowerCase();

          return leadName.includes(query) ||
            leadEmail.includes(query) ||
            leadPhone.includes(query) ||
            leadMessage.includes(query) ||
            jsonData.includes(query);
        }
      );
    }

    setFilteredLeads(filtered);
  }, [leads, slugFilter, statusFilter, searchQuery, getField]);

  useEffect(() => {
    async function init() {
      await fetchLastViewed();
      await Promise.all([fetchLeads(), fetchConfigs()]);
      updateLastViewed();
    }
    init();
  }, [fetchLastViewed, fetchLeads, fetchConfigs, updateLastViewed]);

  useEffect(() => {
    filterLeads();
  }, [filterLeads]);

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      addToast('Failed to update status', 'error');
    } else {
      addToast('Status updated successfully', 'success');
      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    }
  };

  const exportToCSV = () => {
    // Collect all unique dynamic field names across filtered leads
    const dynamicKeys = new Set<string>();
    filteredLeads.forEach(lead => {
      Object.keys(lead.form_data).forEach(key => dynamicKeys.add(key));
    });
    const dynamicHeaders = Array.from(dynamicKeys);

    const headers = ['Date', 'Display Name', 'Email', 'Phone', 'Form', 'Status', ...dynamicHeaders, 'Legacy Message'];
    const rows = filteredLeads.map(lead => [
      new Date(lead.created_at).toLocaleDateString(),
      getField(lead, 'text', ['name', 'full name']) || 'Anonymous',
      getField(lead, 'email', ['email', 'email address']) || '',
      getField(lead, 'tel', ['phone', 'contact', 'mobile', 'whatsapp']) || '',
      lead.form_slug || lead.inquiry_type,
      lead.status,
      ...dynamicHeaders.map(key => `"${(lead.form_data[key] || '').toString().replace(/"/g, '""')}"`),
      `"${(lead.message || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 font-serif">Leads Tracker</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            {slugFilter !== 'all' || statusFilter !== 'all' || searchQuery
              ? ` (filtered from ${leads.length})`
              : ''}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-6 py-2.5 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition-all shadow-premium hover:shadow-premium-lg flex items-center gap-2 font-semibold text-sm"
          disabled={filteredLeads.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Tabs for Form Type */}
      <div className="bg-white rounded-2xl shadow-premium border border-slate-100 mb-6">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {(() => {
            // Calculate new leads per form type
            const newClassesCount = lastViewedAt
              ? leads.filter(l => l.form_slug === 'classes' && new Date(l.created_at) > new Date(lastViewedAt)).length
              : 0;
            const newPerformanceCount = lastViewedAt
              ? leads.filter(l => l.form_slug === 'performance' && new Date(l.created_at) > new Date(lastViewedAt)).length
              : 0;

            const tabs = [
              { value: 'dashboard', label: 'Dashboard', badge: null },
              { value: 'classes', label: 'Classes', badge: newClassesCount },
              { value: 'performance', label: 'Performance', badge: newPerformanceCount },
              { value: 'all', label: 'All Leads', badge: null },
            ];

            return tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSlugFilter(tab.value)}
                className={`px-6 py-4 font-semibold text-sm uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${slugFilter === tab.value
                  ? 'text-navy-900 border-b-2 border-gold-500 bg-gold-50/30'
                  : 'text-slate-500 hover:text-navy-700 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ));
          })()}
        </div>
      </div>

      {/* Dashboard View */}
      {slugFilter === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Leads */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Leads</p>
                  <p className="text-3xl font-bold text-navy-900 mt-2">{leads.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* New Leads */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Leads</p>
                  <p className="text-3xl font-bold text-navy-900 mt-2">
                    {lastViewedAt ? leads.filter(l => new Date(l.created_at) > new Date(lastViewedAt)).length : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Classes Leads */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classes</p>
                  <p className="text-3xl font-bold text-navy-900 mt-2">
                    {leads.filter(l => l.form_slug === 'classes').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Performance Leads */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</p>
                  <p className="text-3xl font-bold text-navy-900 mt-2">
                    {leads.filter(l => l.form_slug === 'performance').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Lead Status</h3>
              <div className="space-y-3">
                {['new', 'contacted', 'converted', 'archived'].map((status) => {
                  const count = leads.filter(l => l.status === status).length;
                  const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                  const colors = {
                    new: 'bg-yellow-500',
                    contacted: 'bg-blue-500',
                    converted: 'bg-green-500',
                    archived: 'bg-slate-400'
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-navy-900 capitalize">{status}</span>
                        <span className="text-slate-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`${colors[status as keyof typeof colors]} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-navy-900">
                        {getField(lead, 'text', ['name', 'full name']) || 'Anonymous'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lead.form_slug || lead.inquiry_type} • {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-[9px] font-bold rounded-lg uppercase ${lead.status === 'new' ? 'bg-yellow-50 text-yellow-700' :
                      lead.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                        lead.status === 'converted' ? 'bg-green-50 text-green-700' :
                          'bg-slate-50 text-slate-600'
                      }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View (for non-dashboard tabs) */}
      {slugFilter !== 'dashboard' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">
                  Search Leads
                </label>
                <input
                  type="text"
                  placeholder="Name, email, or data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none text-sm transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none text-sm transition-all appearance-none bg-no-repeat bg-[length:16px_16px] bg-[right_1rem_center]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Reset */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSlugFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold text-navy-600 bg-navy-50 rounded-xl hover:bg-navy-100 transition-all uppercase tracking-widest"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-premium">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-navy-100 border-t-gold-500"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-premium p-20 text-center border border-slate-100">
              <p className="text-navy-900 font-serif font-bold text-xl">No matching leads found</p>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-premium overflow-hidden border border-slate-100 animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                        Submission
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                        Contact Info
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                        Source
                      </th>
                      {/* Dynamic Headers - Only show columns for current tab */}
                      {(() => {
                        // For "All" tab, show only common columns (no dynamic fields)
                        if (slugFilter === 'all') {
                          return null;
                        }

                        // For specific tabs, show only fields from that form type
                        const relevantLeads = filteredLeads.filter(l =>
                          slugFilter === 'general'
                            ? !l.form_slug || l.form_slug === 'general'
                            : l.form_slug === slugFilter
                        );

                        const dynamicKeys = Array.from(
                          new Set(relevantLeads.flatMap(l => Object.keys(l.form_data)))
                        );

                        return dynamicKeys.map(key => {
                          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          return (
                            <th key={key} className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                              {label}
                            </th>
                          );
                        });
                      })()}
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap sticky right-0 bg-slate-50 border-l-2 border-slate-200 shadow-[-8px_0_16px_rgba(0,0,0,0.1)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {filteredLeads.map((lead) => {
                      // Calculate dynamic keys based on current tab
                      let dynamicKeys: string[] = [];
                      if (slugFilter !== 'all') {
                        const relevantLeads = filteredLeads.filter(l =>
                          slugFilter === 'general'
                            ? !l.form_slug || l.form_slug === 'general'
                            : l.form_slug === slugFilter
                        );
                        dynamicKeys = Array.from(new Set(relevantLeads.flatMap(l => Object.keys(l.form_data))));
                      }

                      // Check if lead is new (created after last viewed)
                      const isNew = lastViewedAt && new Date(lead.created_at) > new Date(lastViewedAt);

                      return (
                        <tr key={lead.id} className={`hover:bg-slate-50/50 transition-colors group ${isNew ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-semibold text-navy-900">
                                  {new Date(lead.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {new Date(lead.created_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              {isNew && (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500 text-white rounded-full uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-navy-900">
                              {getField(lead, 'text', ['name', 'full name']) || 'Anonymous'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getField(lead, 'email', ['email', 'email address']) || 'No email provided'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${lead.form_slug === 'classes' ? 'bg-blue-50 text-blue-600' :
                                lead.form_slug === 'performance' ? 'bg-purple-50 text-purple-600' :
                                  'bg-slate-100 text-slate-500'
                                }`}
                            >
                              {lead.form_slug || lead.inquiry_type}
                            </span>
                          </td>
                          {/* Dynamic Columns Data - Only show for specific tabs */}
                          {dynamicKeys.map(key => (
                            <td key={key} className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                              {lead.form_data[key] || '-'}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white border-l-2 border-slate-200 shadow-[-8px_0_16px_rgba(0,0,0,0.1)]">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className={`text-[10px] font-bold rounded-lg px-2.5 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-navy-500/10 ${lead.status === 'new' ? 'bg-yellow-50 text-yellow-700' :
                                lead.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                                  lead.status === 'converted' ? 'bg-green-50 text-green-700' :
                                    'bg-slate-50 text-slate-600'
                                }`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
