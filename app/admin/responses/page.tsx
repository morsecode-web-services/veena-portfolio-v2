'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Button } from '@/components/system/Button';
import {
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
  Mail,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface FormSubmission {
  id: string;
  form_slug: string;
  form_data: Record<string, any>;
  user_name: string | null;
  user_email: string | null;
  status: 'unread' | 'read' | 'archived';
  is_verified: boolean;
  created_at: string;
  payment_status?: string;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  cohort_id?: string | null;
  razorpay_amount?: number | null;
}

interface FormConfig {
  form_slug: string;
  title: string;
  fields: any[];
}

export default function ResponsesPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [configs, setConfigs] = useState<Record<string, FormConfig>>({});
  const [cohorts, setCohorts] = useState<Record<string, { title: string }>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [slugFilter, setSlugFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }, []);

  const fetchConfigs = useCallback(async () => {
    const { data } = await supabase.from('form_configs').select('form_slug, title, fields');
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

  const fetchCohorts = useCallback(async () => {
    const { data } = await supabase.from('cohorts').select('id, title');
    if (data) {
      const cohortMap = data.reduce(
        (acc, c) => {
          acc[c.id] = { title: c.title };
          return acc;
        },
        {} as Record<string, { title: string }>
      );
      setCohorts(cohortMap);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    fetchConfigs();
    fetchCohorts();

    // Add Escape key listener
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSubmission(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fetchSubmissions, fetchConfigs, fetchCohorts]);

  useEffect(() => {
    let filtered = [...submissions];

    if (statusFilter === 'unread') {
      filtered = filtered.filter((s) => s.status === 'unread');
    } else if (statusFilter === 'verified') {
      filtered = filtered.filter((s) => s.is_verified);
    }

    if (slugFilter !== 'all') {
      filtered = filtered.filter((s) => s.form_slug === slugFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.user_name?.toLowerCase().includes(q) ||
          s.user_email?.toLowerCase().includes(q) ||
          s.form_slug.toLowerCase().includes(q) ||
          JSON.stringify(s.form_data).toLowerCase().includes(q)
      );
    }

    setFilteredSubmissions(filtered);
  }, [submissions, statusFilter, slugFilter, searchQuery]);

  const updateStatus = async (id: string, status: FormSubmission['status']) => {
    const { error } = await supabase.from('form_submissions').update({ status }).eq('id', id);

    if (!error) {
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status } : s)));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
    }
  };

  const toggleVerified = async (id: string, isVerified: boolean) => {
    const { error } = await supabase
      .from('form_submissions')
      .update({ is_verified: isVerified })
      .eq('id', id);

    if (!error) {
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, is_verified: isVerified } : s)));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, is_verified: isVerified });
      }
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;

    const { error } = await supabase.from('form_submissions').delete().eq('id', id);

    if (!error) {
      setSubmissions(submissions.filter((s) => s.id !== id));
      setSelectedSubmission(null);
    }
  };

  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) return;

    // Collect all possible keys from form_data for the header
    const dataKeys = new Set<string>();
    filteredSubmissions.forEach((s) => {
      Object.keys(s.form_data).forEach((key) => dataKeys.add(key));
    });
    const dynamicHeaders = Array.from(dataKeys);

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Date',
      'Form',
      'Name',
      'Email',
      'Status',
      ...dynamicHeaders.map((h) => h.toUpperCase()),
    ];
    const rows = filteredSubmissions.map((s) => [
      escapeCSV(new Date(s.created_at).toLocaleString()),
      escapeCSV(s.form_slug),
      escapeCSV(s.user_name || 'N/A'),
      escapeCSV(s.user_email || 'N/A'),
      escapeCSV(s.status),
      ...dynamicHeaders.map((key) => escapeCSV(s.form_data[key])),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `form_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markAllAsRead = async () => {
    const unreadIds = submissions.filter((s) => s.status === 'unread').map((s) => s.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('form_submissions')
      .update({ status: 'read' })
      .in('id', unreadIds);

    if (!error) {
      setSubmissions(
        submissions.map((s) => (unreadIds.includes(s.id) ? { ...s, status: 'read' } : s))
      );
    }
  };

  const getFormTitle = (slug: string) =>
    configs[slug]?.title || slug.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Form Responses</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage registrations and inquiries from your dynamic forms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {submissions.some((s) => s.status === 'unread') && (
            <Button
              variant="tertiary"
              onClick={markAllAsRead}
              className="text-slate-500 hover:text-slate-800 text-xs border-none bg-transparent shadow-none"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark all as read
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={filteredSubmissions.length === 0}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded flex items-center shadow-none"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or content..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-colors text-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer text-slate-700 font-semibold"
            value={slugFilter}
            onChange={(e) => setSlugFilter(e.target.value)}
          >
            <option value="all">All Forms</option>
            {Object.keys(configs).map((slug) => (
              <option key={slug} value={slug}>
                {configs[slug].title}
              </option>
            ))}
          </select>

          <select
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer text-slate-700 font-semibold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread Only</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  User Details
                </th>
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Form Source
                </th>
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Received At
                </th>
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Payment
                </th>
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-5 py-4 border-b border-slate-100">
                        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                      </td>
                    </tr>
                  ))
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">
                    No submissions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${submission.status === 'unread' ? 'bg-slate-50/50 font-medium' : ''}`}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      if (submission.status === 'unread') updateStatus(submission.id, 'read');
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${submission.status === 'unread' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {(submission.user_name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div
                            className={`font-semibold text-slate-800 ${submission.status === 'unread' ? 'text-slate-950 font-bold' : ''}`}
                          >
                            {submission.user_name || 'Anonymous User'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {submission.user_email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                        {getFormTitle(submission.form_slug)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {submission.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 uppercase tracking-wide">
                          Paid
                        </span>
                      ) : submission.payment_status === 'none' || !submission.payment_status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[9px] font-bold border border-slate-200 uppercase tracking-wide">
                          N/A
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200 uppercase tracking-wide">
                          {submission.payment_status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {submission.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 uppercase tracking-wide">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[9px] font-bold border border-slate-200 uppercase tracking-wide">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVerified(submission.id, !submission.is_verified);
                          }}
                          className={`p-1.5 transition-colors ${submission.is_verified ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                          title={submission.is_verified ? 'Revoke Verification' : 'Verify Response'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubmission(submission.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setSelectedSubmission(null)}
          >
            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white w-full max-w-lg h-full shadow-lg flex flex-col overflow-hidden border-l border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Sticky */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center text-lg font-bold">
                    {(selectedSubmission.user_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedSubmission.user_name || 'Anonymous User'}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      {getFormTitle(selectedSubmission.form_slug)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1 bg-white rounded border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Metadata Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {selectedSubmission.user_email || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Submitted
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {new Date(selectedSubmission.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedSubmission.payment_status &&
                    selectedSubmission.payment_status !== 'none' && (
                      <div className="p-3.5 bg-slate-50 rounded border border-slate-200 col-span-2">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Payment Info
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-250 uppercase tracking-wide">
                            {selectedSubmission.payment_status}
                          </span>
                        </div>
                        {selectedSubmission.razorpay_amount !== undefined &&
                          selectedSubmission.razorpay_amount !== null && (
                            <div className="text-xs text-slate-600 mb-2">
                              <span className="font-bold">Amount Paid:</span>{' '}
                              <span className="font-bold text-slate-900">
                                ₹
                                {(selectedSubmission.razorpay_amount / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        {selectedSubmission.razorpay_subscription_id && (
                          <div className="text-xs text-slate-600 mb-1.5">
                            <span className="font-bold">Subscription ID:</span>{' '}
                            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                              {selectedSubmission.razorpay_subscription_id}
                            </code>
                          </div>
                        )}
                        {selectedSubmission.razorpay_customer_id && (
                          <div className="text-xs text-slate-600 mb-1.5">
                            <span className="font-bold">Customer ID:</span>{' '}
                            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                              {selectedSubmission.razorpay_customer_id}
                            </code>
                          </div>
                        )}
                        {selectedSubmission.razorpay_order_id && (
                          <div className="text-xs text-slate-600 mb-1.5">
                            <span className="font-bold">Order ID:</span>{' '}
                            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                              {selectedSubmission.razorpay_order_id}
                            </code>
                          </div>
                        )}
                        {selectedSubmission.razorpay_payment_id && (
                          <div className="text-xs text-slate-600">
                            <span className="font-bold">Payment ID:</span>{' '}
                            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                              {selectedSubmission.razorpay_payment_id}
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                  {selectedSubmission.cohort_id && (
                    <div className="p-3.5 bg-slate-50 rounded border border-slate-200 col-span-2">
                      <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Enrolled Cohort
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {cohorts[selectedSubmission.cohort_id]?.title || 'Unknown Batch'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Submission Data
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {Object.entries(selectedSubmission.form_data || {}).map(([key, value]) => {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      const isImage =
                        typeof value === 'string' &&
                        value.startsWith('http') &&
                        (value.includes('cloudinary.com') ||
                          /\.(jpg|jpeg|png|webp|gif)/i.test(value));

                      return (
                        <div key={key} className="group">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            {label}
                          </label>
                          {isImage ? (
                            <div className="relative rounded overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                              <Image
                                src={value as string}
                                alt={label}
                                fill
                                className="object-contain"
                                unoptimized // External URLs from submissions
                              />
                              <a
                                href={value as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold border border-slate-200 z-10 hover:bg-white transition-colors"
                              >
                                View Full Size
                              </a>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-800 bg-slate-50/50 p-3 rounded border border-slate-200 leading-relaxed min-h-[40px] flex items-center break-all">
                              {typeof value === 'object'
                                ? JSON.stringify(value, null, 2)
                                : String(value || '—')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="tertiary"
                    onClick={() => setSelectedSubmission(null)}
                    className="bg-white border-slate-200 text-xs py-1.5 px-3 hover:bg-slate-50"
                  >
                    Close
                  </Button>
                  <Button
                    variant="tertiary"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 min-w-0"
                    onClick={() => deleteSubmission(selectedSubmission.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <label className="flex items-center gap-3.5 cursor-pointer group bg-white px-4 py-2 rounded border border-slate-200 hover:border-slate-350 transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={selectedSubmission.is_verified || false}
                      onChange={(e) => toggleVerified(selectedSubmission.id, e.target.checked)}
                    />
                    <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-slate-900 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 peer-checked:text-slate-900 uppercase tracking-wider">
                    {selectedSubmission.is_verified ? 'Verified' : 'Verify Response'}
                  </span>
                </label>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
