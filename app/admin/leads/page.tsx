'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  const getField = useCallback(
    (lead: Lead, type: string, keywords: string[]) => {
      // 1. Try legacy columns
      if (type === 'text' && lead.name && lead.name !== 'Anonymous') return lead.name;
      if (type === 'email' && lead.email) return lead.email;
      if (type === 'tel' && lead.phone) return lead.phone;

      const config = lead.form_slug ? configs[lead.form_slug] : null;
      if (!config) return null;

      // 2. Try by type
      const byType = config.fields.find((f) => f.type === type);
      if (byType && lead.form_data?.[byType.name]) return lead.form_data[byType.name];

      // 3. Try by keywords
      const byName = config.fields.find((f) =>
        keywords.some(
          (kw) => f.name.toLowerCase().includes(kw) || f.label.toLowerCase().includes(kw)
        )
      );
      if (byName && lead.form_data?.[byName.name]) return lead.form_data[byName.name];

      return null;
    },
    [configs]
  );

  const fetchLastViewed = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
      const configMap = data.reduce(
        (acc, config) => {
          acc[config.form_slug] = config;
          return acc;
        },
        {} as Record<string, FormConfig>
      );
      setConfigs(configMap);
    }
  }, []);

  const filterLeads = useCallback(() => {
    let filtered = [...leads];

    // Filter by form slug (dashboard and all show everything)
    if (slugFilter !== 'all' && slugFilter !== 'dashboard') {
      filtered = filtered.filter((lead) => lead.form_slug === slugFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((lead) => {
        const leadName = (
          getField(lead, 'text', ['name', 'full name']) || 'Anonymous'
        ).toLowerCase();
        const leadEmail = (getField(lead, 'email', ['email', 'email address']) || '').toLowerCase();
        const leadPhone = getField(lead, 'tel', ['phone', 'contact', 'mobile', 'whatsapp']) || '';
        const leadMessage = (lead.message || lead.form_data?.message || '').toLowerCase();
        const jsonData = JSON.stringify(lead.form_data).toLowerCase();

        return (
          leadName.includes(query) ||
          leadEmail.includes(query) ||
          leadPhone.includes(query) ||
          leadMessage.includes(query) ||
          jsonData.includes(query)
        );
      });
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
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      addToast('Failed to update status', 'error');
    } else {
      addToast('Status updated successfully', 'success');
      // Update local state
      setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)));
    }
  };

  const exportToCSV = () => {
    // Collect all unique dynamic field names across filtered leads
    const dynamicKeys = new Set<string>();
    filteredLeads.forEach((lead) => {
      Object.keys(lead.form_data).forEach((key) => dynamicKeys.add(key));
    });
    const dynamicHeaders = Array.from(dynamicKeys);

    const headers = [
      'Date',
      'Display Name',
      'Email',
      'Phone',
      'Form',
      'Status',
      ...dynamicHeaders,
      'Legacy Message',
    ];
    const rows = filteredLeads.map((lead) => [
      new Date(lead.created_at).toLocaleDateString(),
      getField(lead, 'text', ['name', 'full name']) || 'Anonymous',
      getField(lead, 'email', ['email', 'email address']) || '',
      getField(lead, 'tel', ['phone', 'contact', 'mobile', 'whatsapp']) || '',
      lead.form_slug || lead.inquiry_type,
      lead.status,
      ...dynamicHeaders.map(
        (key) => `"${(lead.form_data[key] || '').toString().replace(/"/g, '""')}"`
      ),
      `"${(lead.message || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads Tracker</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage custom form submissions, classes inquiry leads, and performance bookings.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-slate-900 text-white hover:bg-slate-800 px-4.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          disabled={filteredLeads.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Tabs for Form Type */}
      <div className="flex flex-col gap-4 border-b border-slate-200">
        <div className="flex gap-6 overflow-x-auto pb-0.5">
          {(() => {
            // Calculate new leads per form type
            const newClassesCount = lastViewedAt
              ? leads.filter(
                  (l) =>
                    l.form_slug === 'classes' && new Date(l.created_at) > new Date(lastViewedAt)
                ).length
              : 0;
            const newPerformanceCount = lastViewedAt
              ? leads.filter(
                  (l) =>
                    l.form_slug === 'performance' && new Date(l.created_at) > new Date(lastViewedAt)
                ).length
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
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 relative whitespace-nowrap ${
                  slugFilter === tab.value
                    ? 'border-slate-900 text-slate-950'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Leads
              </span>
              <span className="text-xl font-bold text-slate-800 block mt-1">{leads.length}</span>
            </div>

            {/* New Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                New Leads
              </span>
              <span className="text-xl font-bold text-slate-800 block mt-1">
                {lastViewedAt
                  ? leads.filter((l) => new Date(l.created_at) > new Date(lastViewedAt)).length
                  : 0}
              </span>
            </div>

            {/* Classes Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Classes
              </span>
              <span className="text-xl font-bold text-slate-800 block mt-1">
                {leads.filter((l) => l.form_slug === 'classes').length}
              </span>
            </div>

            {/* Performance Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Performance
              </span>
              <span className="text-xl font-bold text-slate-800 block mt-1">
                {leads.filter((l) => l.form_slug === 'performance').length}
              </span>
            </div>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-4">
                Lead Status Distribution
              </h3>
              <div className="space-y-4">
                {['new', 'contacted', 'converted', 'archived'].map((status) => {
                  const count = leads.filter((l) => l.status === status).length;
                  const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                  const colors = {
                    new: 'bg-amber-500',
                    contacted: 'bg-blue-500',
                    converted: 'bg-emerald-500',
                    archived: 'bg-slate-400',
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 capitalize">{status}</span>
                        <span className="text-slate-500 font-medium">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`${colors[status as keyof typeof colors]} h-1.5 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3.5 text-xs">
                {leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">
                        {getField(lead, 'text', ['name', 'full name']) || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lead.form_slug || lead.inquiry_type} •{' '}
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border ${
                        lead.status === 'new'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : lead.status === 'contacted'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : lead.status === 'converted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
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
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {/* Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Search Leads
                </label>
                <input
                  type="text"
                  placeholder="Name, email, or data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-805 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-805 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
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
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-all text-center"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 bg-white border border-slate-200 rounded-lg">
              <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-850">No matching leads found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">Submission</th>
                      <th className="px-5 py-3.5">Contact Info</th>
                      <th className="px-5 py-3.5">Source</th>
                      {/* Dynamic Headers - Only show columns for current tab */}
                      {(() => {
                        // For "All" tab, show only common columns (no dynamic fields)
                        if (slugFilter === 'all') {
                          return null;
                        }

                        // For specific tabs, show only fields from that form type
                        const relevantLeads = filteredLeads.filter((l) =>
                          slugFilter === 'general'
                            ? !l.form_slug || l.form_slug === 'general'
                            : l.form_slug === slugFilter
                        );

                        const dynamicKeys = Array.from(
                          new Set(relevantLeads.flatMap((l) => Object.keys(l.form_data)))
                        );

                        return dynamicKeys.map((key) => {
                          const label = key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                          return (
                            <th key={key} className="px-5 py-3.5">
                              {label}
                            </th>
                          );
                        });
                      })()}
                      <th className="px-5 py-3.5 text-right sticky right-0 bg-slate-50 border-l border-slate-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLeads.map((lead) => {
                      // Calculate dynamic keys based on current tab
                      let dynamicKeys: string[] = [];
                      if (slugFilter !== 'all') {
                        const relevantLeads = filteredLeads.filter((l) =>
                          slugFilter === 'general'
                            ? !l.form_slug || l.form_slug === 'general'
                            : l.form_slug === slugFilter
                        );
                        dynamicKeys = Array.from(
                          new Set(relevantLeads.flatMap((l) => Object.keys(l.form_data)))
                        );
                      }

                      // Check if lead is new (created after last viewed)
                      const isNew =
                        lastViewedAt && new Date(lead.created_at) > new Date(lastViewedAt);

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-slate-50/50 transition-colors ${isNew ? 'bg-blue-50/10' : ''}`}
                        >
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div>
                                <div className="font-bold text-slate-800">
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
                                <span className="px-1 py-0.5 text-[8px] font-bold bg-blue-100 border border-blue-200 text-blue-800 rounded uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {getField(lead, 'text', ['name', 'full name']) || 'Anonymous'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium space-y-0.5">
                              <div>
                                {getField(lead, 'email', ['email', 'email address']) || 'No email'}
                              </div>
                              {getField(lead, 'tel', [
                                'phone',
                                'contact',
                                'mobile',
                                'whatsapp',
                              ]) && (
                                <div>
                                  {getField(lead, 'tel', [
                                    'phone',
                                    'contact',
                                    'mobile',
                                    'whatsapp',
                                  ])}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border ${
                                lead.form_slug === 'classes'
                                  ? 'bg-blue-50 text-blue-750 border-blue-100'
                                  : lead.form_slug === 'performance'
                                    ? 'bg-purple-50 text-purple-750 border-purple-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-205'
                              }`}
                            >
                              {lead.form_slug || lead.inquiry_type}
                            </span>
                          </td>
                          {/* Dynamic Columns Data - Only show for specific tabs */}
                          {dynamicKeys.map((key) => (
                            <td
                              key={key}
                              className="px-5 py-3 text-slate-600 whitespace-nowrap max-w-[150px] truncate"
                            >
                              {lead.form_data[key] || '-'}
                            </td>
                          ))}
                          <td className="px-5 py-3 text-right sticky right-0 bg-white border-l border-slate-200">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                updateLeadStatus(lead.id, e.target.value as Lead['status'])
                              }
                              className={`text-[10px] font-bold rounded border px-2 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-slate-900 transition-colors ${
                                lead.status === 'new'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : lead.status === 'contacted'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : lead.status === 'converted'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
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
        </div>
      )}
    </div>
  );
}
