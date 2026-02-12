'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/system/Button';

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [configs, setConfigs] = useState<Record<string, FormConfig>>({});
  const [loading, setLoading] = useState(true);
  const [slugFilter, setSlugFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper for semantic discovery - shared across functions
  const getField = (lead: Lead, type: string, keywords: string[]) => {
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
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchLeads(), fetchConfigs()]);
    }
    init();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, slugFilter, statusFilter, searchQuery]);

  const fetchLeads = async () => {
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
  };

  const fetchConfigs = async () => {
    const { data } = await supabase.from('form_configs').select('form_slug, fields');
    if (data) {
      const configMap = data.reduce((acc, config) => {
        acc[config.form_slug] = config;
        return acc;
      }, {} as Record<string, FormConfig>);
      setConfigs(configMap);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Filter by form slug
    if (slugFilter !== 'all') {
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
  };

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      alert('Failed to update status');
    } else {
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

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* Form Filter */}
          <div>
            <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2">
              Form Source
            </label>
            <select
              value={slugFilter}
              onChange={(e) => setSlugFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none text-sm transition-all appearance-none bg-no-repeat bg-[length:16px_16px] bg-[right_1rem_center]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
            >
              <option value="all">All Forms</option>
              {Object.keys(configs).map(slug => (
                <option key={slug} value={slug}>{slug.toUpperCase()}</option>
              ))}
              <option value="general">Legacy General</option>
            </select>
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
                  {/* Dynamic Headers */}
                  {Array.from(new Set(filteredLeads.flatMap(l => Object.keys(l.form_data)))).map(key => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <th key={key} className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                        {label}
                      </th>
                    );
                  })}
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-navy-400 uppercase tracking-widest whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredLeads.map((lead) => {
                  const dynamicKeys = Array.from(new Set(filteredLeads.flatMap(l => Object.keys(l.form_data))));

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      {/* Dynamic Columns Data */}
                      {dynamicKeys.map(key => (
                        <td key={key} className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                          {lead.form_data[key] || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
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

    </div>
  );
}
