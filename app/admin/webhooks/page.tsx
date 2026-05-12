'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Mail, 
  MessageSquare, 
  Send,
  Eye,
  Search,
  Filter,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  student_name: string;
  student_email: string;
  status: 'success' | 'failed' | 'partial_success';
  notification_status: {
    telegram: { status: string; error?: string; link?: string };
    email: { status: string; error?: string };
    whatsapp: { status: string; error?: string };
  };
  payload: any;
  created_at: string;
}

export default function WebhookDashboard() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'partial_success'>('all');
  const [activeTab, setActiveTab] = useState<'logs' | 'settings'>('logs');
  const [settings, setSettings] = useState({
    email_enabled: true,
    whatsapp_enabled: false,
    telegram_enabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchSettings();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('webhook_logs_realtime')
      // @ts-ignore - Fixing type mismatch in certain Supabase SDK versions
      .on('postgres_changes', { event: 'INSERT', table: 'webhook_logs', schema: 'public' }, (payload) => {
        setLogs(prev => [payload.new as WebhookLog, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as WebhookLog[]);
    }
    setLoading(false);
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('site_config')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (data?.data?.automation) {
      setSettings(data.data.automation);
    }
  }

  async function saveSettings(newSettings: typeof settings) {
    setSavingSettings(true);
    
    // Get current config
    const { data: current } = await supabase
      .from('site_config')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    const updatedData = {
      ...current?.data,
      automation: newSettings
    };

    const { error } = await supabase
      .from('site_config')
      .update({ data: updatedData })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (!error) {
      setSettings(newSettings);
      // alert('Settings saved successfully!');
    }
    setSavingSettings(false);
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || log.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial_success': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationBadge = (channel: string, data: any) => {
    const status = data?.status || 'pending';
    const isSuccess = status === 'success';
    const isFailed = status === 'failed';
    const isSkipped = status === 'skipped';

    let icon = <Clock className="h-3 w-3" />;
    if (isSuccess) icon = <CheckCircle2 className="h-3 w-3" />;
    if (isFailed) icon = <XCircle className="h-3 w-3" />;

    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isSuccess ? 'bg-emerald-50 text-emerald-700' : 
        isFailed ? 'bg-red-50 text-red-700' : 
        isSkipped ? 'bg-gray-100 text-gray-500' :
        'bg-gray-50 text-gray-400'
      }`}>
        {icon}
        {channel}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy-950 flex items-center gap-3">
            <Zap className="h-8 w-8 text-gold-500" />
            Automations
          </h1>
          <div className="flex items-center gap-6 mt-2">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`text-sm font-bold uppercase tracking-widest pb-1 transition-all ${activeTab === 'logs' ? 'text-navy-900 border-b-2 border-gold-500' : 'text-gray-400 hover:text-navy-400'}`}
            >
              Execution Logs
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-sm font-bold uppercase tracking-widest pb-1 transition-all ${activeTab === 'settings' ? 'text-navy-900 border-b-2 border-gold-500' : 'text-gray-400 hover:text-navy-400'}`}
            >
              Pipeline Settings
            </button>
          </div>
        </div>
        {activeTab === 'logs' && (
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-navy-50 text-navy-700 rounded-xl hover:bg-navy-100 transition-colors font-medium text-sm self-start md:self-center"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'logs' ? (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
        {/* Logs List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by name, email or event ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1">
              <Filter className="h-4 w-4 text-gray-400" />
              <select 
                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none pr-8 cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="partial_success">Partial Success</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading && logs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                <p className="font-medium animate-pulse uppercase tracking-widest text-xs">Loading logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No webhook logs found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-4 hover:bg-gray-50/80 transition-all flex items-center gap-4 group ${selectedLog?.id === log.id ? 'bg-navy-50/50 ring-1 ring-inset ring-navy-100' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-navy-950 truncate max-w-[150px]">
                          {log.student_name || 'Anonymous'}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase">
                          {log.event_type.split('.')[0]}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-navy-400 truncate mb-2">
                        {log.student_email || 'No email provided'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getNotificationBadge('TG', log.notification_status.telegram)}
                        {getNotificationBadge('Email', log.notification_status.email)}
                        {getNotificationBadge('WA', log.notification_status.whatsapp)}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${selectedLog?.id === log.id ? 'translate-x-1 text-navy-400' : 'group-hover:translate-x-1'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedLog ? (
              <motion.div
                key={selectedLog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full lg:sticky lg:top-8"
              >
                <div className="p-6 border-b border-gray-50 bg-navy-950 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedLog.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      selectedLog.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedLog.status.replace('_', ' ')}
                    </span>
                    <button 
                      onClick={() => setSelectedLog(null)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mb-1 truncate">
                    {selectedLog.student_name}
                  </h3>
                  <p className="text-navy-300 text-sm mb-4 font-mono truncate">{selectedLog.event_id}</p>
                  <div className="flex items-center gap-3 text-[11px] text-navy-400">
                    <Clock className="h-3 w-3" />
                    {format(new Date(selectedLog.created_at), 'PPPP p')}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Notification Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-navy-400 uppercase tracking-widest flex items-center gap-2">
                      <Send className="h-3 w-3" />
                      Delivery Report
                    </h4>
                    
                    {/* Telegram */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-navy-900 flex items-center gap-2">
                          <Activity className="h-3 w-3" /> Telegram Invite
                        </span>
                        {getNotificationBadge('', selectedLog.notification_status.telegram)}
                      </div>
                      {selectedLog.notification_status.telegram.error && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded">
                          {selectedLog.notification_status.telegram.error}
                        </p>
                      )}
                      {selectedLog.notification_status.telegram.link && (
                        <div className="mt-2 text-[11px]">
                          <span className="text-gray-400 block mb-1">Generated Link:</span>
                          <code className="block p-2 bg-white rounded border border-gray-200 text-gold-600 break-all">
                            {selectedLog.notification_status.telegram.link}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-navy-900 flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Welcome Email
                        </span>
                        {getNotificationBadge('', selectedLog.notification_status.email)}
                      </div>
                      {selectedLog.notification_status.email.error && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded">
                          {selectedLog.notification_status.email.error}
                        </p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-navy-900 flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" /> WhatsApp Notification
                        </span>
                        {getNotificationBadge('', selectedLog.notification_status.whatsapp)}
                      </div>
                      {selectedLog.notification_status.whatsapp.error && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded">
                          {selectedLog.notification_status.whatsapp.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Raw Payload */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-navy-400 uppercase tracking-widest flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Razorpay Payload
                    </h4>
                    <div className="relative">
                      <pre className="text-[10px] bg-gray-900 text-gray-300 p-4 rounded-xl overflow-x-auto max-h-[300px] custom-scrollbar">
                        {JSON.stringify(selectedLog.payload, null, 2)}
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors text-[10px]"
                      >
                        Copy JSON
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button 
                    className="w-full py-3 bg-navy-950 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-navy-900 transition-colors shadow-lg shadow-navy-950/10 active:scale-[0.98]"
                    onClick={() => alert('Manual retry functionality coming soon. You can trigger it via Postman/curl using the payload above.')}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Retry Notifications
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-navy-200" />
                </div>
                <h3 className="text-lg font-serif font-bold text-navy-950 mb-2">Log Inspector</h3>
                <p className="text-sm text-navy-400">Select an execution from the list to view delivery details and raw payment data.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="settings"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-serif font-bold text-navy-950">Notification Pipeline</h2>
            <p className="text-sm text-navy-400 mt-1">Enable or disable specific automation channels globally.</p>
          </div>
          
          <div className="divide-y divide-gray-50">
            {/* Email Setting */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">Welcome Email (Resend)</h3>
                  <p className="text-xs text-navy-400">Sends the private invite link via email immediately after payment.</p>
                </div>
              </div>
              <button
                disabled={savingSettings}
                onClick={() => saveSettings({ ...settings, email_enabled: !settings.email_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.email_enabled ? 'bg-gold-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.email_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Telegram Setting */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">Telegram Invite Link</h3>
                  <p className="text-xs text-navy-400">Generates a unique link. If disabled, email/WA won&apos;t be sent as they require the link.</p>
                </div>
              </div>
              <button
                disabled={savingSettings}
                onClick={() => saveSettings({ ...settings, telegram_enabled: !settings.telegram_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.telegram_enabled ? 'bg-gold-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.telegram_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* WhatsApp Setting */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">WhatsApp Notification</h3>
                  <p className="text-xs text-navy-400">Sends the invite link via Meta Cloud API. (Requires approved template)</p>
                </div>
              </div>
              <button
                disabled={savingSettings}
                onClick={() => saveSettings({ ...settings, whatsapp_enabled: !settings.whatsapp_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-gold-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-navy-50/50 border-t border-navy-50">
            <div className="flex items-center gap-3 text-navy-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-xs font-medium">
                Changes take effect immediately for all future incoming payments.
                Make sure your API keys in <code>.env.local</code> are correct before enabling WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {savingSettings && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-navy-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
            <RefreshCcw className="h-4 w-4 animate-spin text-gold-400" />
            <span className="text-sm font-bold uppercase tracking-widest">Saving Pipeline...</span>
          </div>
        )}
      </motion.div>
    )}
    </AnimatePresence>
    </div>
  );
}

