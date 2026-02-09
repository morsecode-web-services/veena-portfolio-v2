'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import type { InquiryType } from '@/types';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  inquiry_type: InquiryType;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'archived';
  created_at: string;
  updated_at: string;
}

type FilterType = InquiryType | 'all';
type StatusFilter = Lead['status'] | 'all';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryFilter, setInquiryFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchLeads();

    // Realtime subscription
    const channel = supabase
      .channel('leads_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLead = payload.new as Lead;
            setLeads((prev) => [newLead, ...prev]);
            addToast(`New lead from ${newLead.name}!`, 'success');
          } else if (payload.eventType === 'UPDATE') {
            const updatedLead = payload.new as Lead;
            setLeads((prev) =>
              prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id; // Correctly get ID from payload.old
            setLeads((prev) => prev.filter((lead) => lead.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterLeads();
  }, [leads, inquiryFilter, statusFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      addToast('Failed to fetch leads', 'error');
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Filter by inquiry type
    if (inquiryFilter !== 'all') {
      filtered = filtered.filter(lead => lead.inquiry_type === inquiryFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.message.toLowerCase().includes(query)
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
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Inquiry Type', 'Status', 'Message'];
    const rows = filteredLeads.map(lead => [
      new Date(lead.created_at).toLocaleDateString(),
      lead.name,
      lead.email,
      lead.phone,
      lead.inquiry_type,
      lead.status,
      `"${lead.message.replace(/"/g, '""')}"`, // Escape quotes
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

  const getInquiryTypeColor = (type: InquiryType) => {
    const colors = {
      performance: 'bg-purple-100 text-purple-800',
      classes: 'bg-blue-100 text-blue-800',
      collaboration: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[type];
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      converted: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Lead['status']) => {
    const icons = {
      new: '🆕',
      contacted: '📧',
      converted: '✅',
      archived: '📁',
    };
    return icons[status];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Leads</h1>
          <p className="text-slate-600 mt-1">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            {inquiryFilter !== 'all' || statusFilter !== 'all' || searchQuery
              ? ` (filtered from ${leads.length})`
              : ''}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2"
          disabled={filteredLeads.length === 0}
        >
          <span>📥</span>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          {/* Inquiry Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inquiry Type
            </label>
            <select
              value={inquiryFilter}
              onChange={(e) => setInquiryFilter(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="performance">Performance</option>
              <option value="classes">Classes</option>
              <option value="collaboration">Collaboration</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setInquiryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-500"></div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No leads found</p>
          {(inquiryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setInquiryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 text-navy-500 hover:text-navy-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <div className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getInquiryTypeColor(
                          lead.inquiry_type
                        )}`}
                      >
                        {lead.inquiry_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        <option value="new">🆕 New</option>
                        <option value="contacted">📧 Contacted</option>
                        <option value="converted">✅ Converted</option>
                        <option value="archived">📁 Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowModal(true);
                        }}
                        className="text-navy-600 hover:text-navy-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showModal && selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-navy-900">Lead Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Status and Type */}
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      selectedLead.status
                    )}`}
                  >
                    {getStatusIcon(selectedLead.status)} {selectedLead.status}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getInquiryTypeColor(
                      selectedLead.inquiry_type
                    )}`}
                  >
                    {selectedLead.inquiry_type}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="text-gray-900 font-medium">{selectedLead.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="text-navy-600 hover:text-navy-800 underline"
                      >
                        {selectedLead.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>{' '}
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-navy-600 hover:text-navy-800 underline"
                      >
                        {selectedLead.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedLead.message}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <div>
                    Submitted: {new Date(selectedLead.created_at).toLocaleString('en-US')}
                  </div>
                  {selectedLead.updated_at !== selectedLead.created_at && (
                    <div>
                      Updated: {new Date(selectedLead.updated_at).toLocaleString('en-US')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <a
                    href={`mailto:${selectedLead.email}?subject=Re: Your ${selectedLead.inquiry_type} inquiry`}
                    className="flex-1 px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors text-center"
                  >
                    Reply via Email
                  </a>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
