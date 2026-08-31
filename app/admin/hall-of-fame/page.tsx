'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Trophy,
  Video,
  Search,
  ExternalLink,
  CheckCircle,
  X,
  Settings,
  Save,
  Loader2,
  Heart,
  Users,
  Award,
  MessageSquare,
  RefreshCw,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { HallOfFamer } from '@/types/hall-of-fame';
import { extractGoogleDriveId } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { supabase } from '@/lib/supabase';

export default function AdminHallOfFamePage() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'entries' | 'settings'>('entries');
  const [entries, setEntries] = useState<HallOfFamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingVideos, setSyncingVideos] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Settings State & Full Config
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [pageSettings, setPageSettings] = useState({
    title: 'Cohort: Vande Mataram',
    subtitle: 'HALL OF FAME',
    description:
      'These students showed exceptional display of talent across our Veena learning challenges.',
    enabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Entry Form State
  const [formData, setFormData] = useState({
    studentName: '',
    cohort: 'Vande Mataram',
    location: 'Bengaluru, India',
    studentDescription: '',
    videoUrl: '',
    customThumbnailUrl: '',
    mentorCommentText: '',
    likesCount: 0,
  });

  const [urlPreviewId, setUrlPreviewId] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn('Could not retrieve auth session token:', err);
    }
    return headers;
  };

  const fetchSiteConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data);
        if (data.hallOfFame) {
          setPageSettings({
            title: data.hallOfFame.title || 'Cohort: Vande Mataram',
            subtitle: data.hallOfFame.subtitle || 'HALL OF FAME',
            description:
              data.hallOfFame.description ||
              'These students showed exceptional display of talent across our Veena learning challenges.',
            enabled: data.hallOfFame.enabled !== undefined ? data.hallOfFame.enabled : true,
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching site config for hall of fame:', err);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hall-of-fame');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEntries(
          json.data.map((item: any, idx: number) => ({
            id: item.id,
            studentName: item.student_name,
            cohort: item.cohort || 'Vande Mataram',
            location: item.location,
            studentDescription: item.student_description,
            videoUrl: item.video_url,
            videoType: item.video_type || 'gdrive',
            customThumbnailUrl: item.thumbnail_url,
            mentorPraise: item.mentor_praise,
            mentorComment: item.mentor_comment || {
              authorName: 'Aishwarya Manikarnike',
              authorAvatar: '/images/contact/contact-image.jpg',
              commentText:
                item.mentor_praise || `${item.student_name} has shown wonderful proficiency!`,
              timestamp: 'Recently',
              likesCount: item.likes_count || 18,
              isVerified: true,
            },
            dateFeatured: '2026',
            badges: [],
            isFeatured: true,
            order_index: item.order_index ?? idx,
            orderIndex: item.order_index ?? idx,
          }))
        );
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.warn('API error fetching hall of fame entries:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllVideos = async () => {
    setSyncingVideos(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/hall-of-fame/sync', {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        await fetchEntries();
        addToast('All Google Drive videos synced to Cloudflare R2 successfully!', 'success');
      } else {
        addToast(`Sync error: ${json.error || 'Failed to sync'}`, 'error');
      }
    } catch (err: any) {
      addToast(`Sync error: ${err.message || 'Server error'}`, 'error');
    } finally {
      setSyncingVideos(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchSiteConfig();
  }, []);

  useEffect(() => {
    if (formData.videoUrl) {
      const gId = extractGoogleDriveId(formData.videoUrl);
      setUrlPreviewId(gId);
    } else {
      setUrlPreviewId(null);
    }
  }, [formData.videoUrl]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      studentName: '',
      cohort: 'Vande Mataram',
      location: 'Bengaluru, India',
      studentDescription: '',
      videoUrl: '',
      customThumbnailUrl: '',
      mentorCommentText: '',
      likesCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: HallOfFamer) => {
    setEditingId(entry.id);
    setFormData({
      studentName: entry.studentName,
      cohort: entry.cohort || 'Vande Mataram',
      location: entry.location || '',
      studentDescription: entry.studentDescription || '',
      videoUrl: entry.videoUrl || '',
      customThumbnailUrl: entry.customThumbnailUrl || '',
      mentorCommentText: entry.mentorComment?.commentText || entry.mentorPraise || '',
      likesCount:
        entry.mentorComment?.likesCount ??
        (entry as any).likesCount ??
        (entry as any).likes_count ??
        0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm('Are you sure you want to remove this student performance from the Hall of Fame?')
    ) {
      return;
    }

    const isRealUuid =
      id &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    if (!isRealUuid) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      addToast('Performance entry removed from view', 'info');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/hall-of-fame?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        addToast('Performance entry deleted from database', 'success');
      } else {
        addToast(`Failed to delete: ${json.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      addToast(`Error deleting entry: ${err.message || 'Server error'}`, 'error');
    }
  };

  const handleMoveEntry = async (index: number, direction: 'up' | 'down') => {
    if (searchQuery) {
      addToast('Please clear the search filter to reorder all showcases.', 'info');
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const newEntries = [...entries];
    const temp = newEntries[index];
    newEntries[index] = newEntries[targetIndex];
    newEntries[targetIndex] = temp;

    // Optimistically update UI
    setEntries(newEntries);
    setReordering(true);

    try {
      const headers = await getAuthHeaders();
      const orderedIds = newEntries.map((item) => item.id);
      const res = await fetch('/api/admin/hall-of-fame', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ orderedIds }),
      });

      const json = await res.json();
      if (!json.success) {
        addToast(`Failed to save order: ${json.error || 'Database error'}`, 'error');
        fetchEntries();
      } else {
        addToast('Showcase order updated successfully', 'success');
      }
    } catch (err: any) {
      console.error('Error saving order:', err);
      addToast('Network error while saving order', 'error');
      fetchEntries();
    } finally {
      setReordering(false);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.videoUrl) {
      addToast('Please fill out Student Name and Google Drive Video URL', 'error');
      return;
    }

    setSavingEntry(true);

    const mentorCommentObj = {
      authorName: 'Aishwarya Manikarnike',
      authorAvatar: '/images/contact/contact-image.jpg',
      commentText:
        formData.mentorCommentText || `${formData.studentName} has shown wonderful proficiency!`,
      timestamp: 'Recently',
      likesCount: 18,
      isVerified: true,
    };

    const isRealUuid =
      editingId &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        editingId
      );

    const payload: any = {
      id: isRealUuid ? editingId : undefined,
      studentName: formData.studentName,
      cohort: formData.cohort || 'Vande Mataram',
      location: formData.location,
      studentDescription: formData.studentDescription,
      videoUrl: formData.videoUrl,
      thumbnailUrl: formData.customThumbnailUrl,
      mentorPraise: formData.mentorCommentText,
      mentorComment: mentorCommentObj,
      likesCount: Number(formData.likesCount) || 0,
      order_index: !isRealUuid ? entries.length : undefined,
    };

    try {
      const headers = await getAuthHeaders();
      const method = isRealUuid ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/hall-of-fame', {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success && json.data) {
        await fetchEntries();
        addToast(
          isRealUuid
            ? 'Entry updated successfully in Supabase database'
            : 'New entry saved successfully to Supabase database',
          'success'
        );
        setIsModalOpen(false);
      } else {
        console.error('Failed to save to Supabase:', json);
        addToast(`Failed to save to database: ${json.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving entry:', err);
      addToast(`Network or server error: ${err.message || 'Failed to save'}`, 'error');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const headers = await getAuthHeaders();

      // Retrieve full config if not already cached
      let baseConfig = siteConfig;
      if (!baseConfig) {
        const cfgRes = await fetch('/api/admin/config');
        if (cfgRes.ok) {
          baseConfig = await cfgRes.json();
        }
      }

      if (!baseConfig) {
        throw new Error('Failed to retrieve current site configuration');
      }

      const updatedConfig = {
        ...baseConfig,
        hallOfFame: {
          ...baseConfig.hallOfFame,
          title: pageSettings.title,
          subtitle: pageSettings.subtitle,
          description: pageSettings.description,
          enabled: pageSettings.enabled,
        },
      };

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedConfig),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        setSiteConfig(updatedConfig);
        addToast('Hall of Fame page settings updated and published successfully!', 'success');
      } else {
        addToast(`Failed to save settings: ${json.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving HOF settings:', err);
      addToast(`Error saving settings: ${err.message || 'Server error'}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredEntries = entries.filter(
    (item) =>
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.studentDescription &&
        item.studentDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalLikes = entries.reduce((sum, item) => sum + (item.mentorComment?.likesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5 font-sans">
            <Trophy className="w-6 h-6 text-slate-700" /> Hall of Fame
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage student showcases, video embeds, page configuration, and showcase display order.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSyncAllVideos}
            disabled={syncingVideos}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            title="Sync all Google Drive videos to Cloudflare R2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingVideos ? 'animate-spin' : ''}`} />
            {syncingVideos ? 'Syncing...' : 'Sync to R2'}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Student Showcase
          </button>
        </div>
      </div>

      {/* 2. Stats Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Showcases
            </p>
            <p className="text-lg font-bold text-slate-800">{entries.length} Students</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Cohort / Title
            </p>
            <p
              className="text-lg font-bold text-slate-800 truncate max-w-[200px]"
              title={pageSettings.title}
            >
              {pageSettings.title || 'Vande Mataram'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Student Likes
            </p>
            <p className="text-lg font-bold text-slate-800">{totalLikes} Interactions</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('entries')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'entries'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Entries ({entries.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Page Settings
        </button>
      </div>

      {/* 4. Tab 1: Student Entries */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Reset
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" /> Loading database
                entries...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No student showcases found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 w-16 text-center">Order</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Tagline / Description</th>
                      <th className="px-4 py-3">Google Drive Link</th>
                      <th className="px-4 py-3">Instructor Comment</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredEntries.map((entry, idx) => {
                      const driveId = extractGoogleDriveId(entry.videoUrl);
                      const commentText =
                        entry.mentorComment?.commentText || entry.mentorPraise || '-';
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-right">
                                #{idx + 1}
                              </span>
                              <div className="flex flex-col gap-0.5 ml-1">
                                <button
                                  type="button"
                                  disabled={idx === 0 || !!searchQuery || reordering}
                                  onClick={() => handleMoveEntry(idx, 'up')}
                                  className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                                  title="Move showcase up"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    idx === filteredEntries.length - 1 ||
                                    !!searchQuery ||
                                    reordering
                                  }
                                  onClick={() => handleMoveEntry(idx, 'down')}
                                  className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                                  title="Move showcase down"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {entry.studentName}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{entry.location || 'India'}</td>
                          <td className="px-4 py-3 max-w-xs text-slate-600 truncate">
                            {entry.studentDescription || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={entry.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-mono font-medium hover:underline"
                            >
                              <Video className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              {driveId ? `Drive ID: ${driveId.slice(0, 8)}...` : 'Link'}
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                          </td>
                          <td
                            className="px-4 py-3 max-w-xs text-slate-600 italic truncate"
                            title={commentText}
                          >
                            &ldquo;{commentText}&rdquo;
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit entry & comment"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Page Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" /> Page Configuration
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Page Title</label>
              <input
                type="text"
                value={pageSettings.title}
                onChange={(e) => setPageSettings({ ...pageSettings, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="e.g. Cohort: Vande Mataram"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Main title displayed at top of the Hall of Fame page.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Badge / Subtitle Label
              </label>
              <input
                type="text"
                value={pageSettings.subtitle}
                onChange={(e) => setPageSettings({ ...pageSettings, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="e.g. HALL OF FAME"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subtitle / Description Text
              </label>
              <textarea
                rows={3}
                value={pageSettings.description}
                onChange={(e) => setPageSettings({ ...pageSettings, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="e.g. These students showed exceptional display of talent across our Veena learning challenges."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The descriptive paragraph displayed right beneath the page title on /hall-of-fame.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="hofEnabled"
                checked={pageSettings.enabled}
                onChange={(e) => setPageSettings({ ...pageSettings, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label
                htmlFor="hofEnabled"
                className="font-semibold text-slate-700 cursor-pointer select-none"
              >
                Enable Hall of Fame page publicly
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {savingSettings ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 relative my-8 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-800 mb-4">
              {editingId ? 'Edit Student Showcase' : 'Add New Student Showcase'}
            </h2>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder="e.g. Deepa Hegde"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder="e.g. Bengaluru, India"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student Tagline / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.studentDescription}
                  onChange={(e) => setFormData({ ...formData, studentDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="e.g. Deepa performed Shankarabharanam Geetham with remarkable tonal clarity and smooth finger movement."
                />
              </div>

              {/* INSTRUCTOR COMMENT FIELD */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5">
                <label className="block font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                    Instructor Comment (Aishwarya&apos;s Feedback)
                  </span>
                  <span className="text-[10px] font-normal text-amber-700 font-mono">
                    Shown on card & modal
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={formData.mentorCommentText}
                  onChange={(e) => setFormData({ ...formData, mentorCommentText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  placeholder="e.g. Deepa has shown wonderful proficiency in a short time. Her finger placement and meetu precision are remarkable!"
                />
              </div>

              {/* LIKES COUNT FIELD */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Likes Count (Default: 0)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.likesCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      likesCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Video Share URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                />
                {urlPreviewId && (
                  <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Google Drive File ID: {urlPreviewId}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Thumbnail</label>
                <ImageUpload
                  value={formData.customThumbnailUrl}
                  onChange={(url) => setFormData({ ...formData, customThumbnailUrl: url })}
                  bucket="hall-of-fame"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {savingEntry && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? 'Update Showcase' : 'Add Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
