'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/system/Button';
import { Plus, Trash2, Save, MoveUp, MoveDown, Settings2, X, Link } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'tel' | 'select' | 'date' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: string[];
}

interface FormConfig {
    id: string;
    form_slug: string;
    title: string;
    description: string;
    fields: FormField[];
    is_active: boolean;
    email_notifications_enabled: boolean;
}

// Local component to handle comma-separated options without syncing issues (REMOVED)

export default function FormManagementPage() {
    const [configs, setConfigs] = useState<FormConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<FormConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFormDetails, setNewFormDetails] = useState({ title: '', slug: '', description: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    async function fetchConfigs() {
        setIsLoading(true);
        const { data, error } = await supabase.from('form_configs').select('*').order('created_at', { ascending: true });
        if (data) setConfigs(data);
        if (error) setMessage({ type: 'error', text: 'Failed to fetch form configs' });
        setIsLoading(false);
    }

    const handleAddField = () => {
        if (!selectedConfig) return;
        const newField: FormField = { name: `field_${Date.now()}`, label: 'New Field', type: 'text', required: false };
        setSelectedConfig({
            ...selectedConfig,
            fields: [...selectedConfig.fields, newField]
        });
    };

    const handleRemoveField = (index: number) => {
        if (!selectedConfig) return;
        const newFields = [...selectedConfig.fields];
        newFields.splice(index, 1);
        setSelectedConfig({ ...selectedConfig, fields: newFields });
    };

    const handleUpdateField = (index: number, updates: Partial<FormField>) => {
        if (!selectedConfig) return;
        const newFields = [...selectedConfig.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setSelectedConfig({ ...selectedConfig, fields: newFields });
    };

    const handleMoveField = (index: number, direction: 'up' | 'down') => {
        if (!selectedConfig) return;
        const newFields = [...selectedConfig.fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setSelectedConfig({ ...selectedConfig, fields: newFields });
    };

    const handleCreateForm = async () => {
        if (!newFormDetails.title || !newFormDetails.slug) {
            setMessage({ type: 'error', text: 'Title and Slug are required' });
            return;
        }

        setIsCreating(true);
        const { data, error } = await supabase
            .from('form_configs')
            .insert([{
                title: newFormDetails.title,
                form_slug: newFormDetails.slug.toLowerCase().replace(/\s+/g, '_'),
                description: newFormDetails.description,
                fields: [
                    { name: 'name', label: 'Name', type: 'text', required: true }
                ],
                is_active: true,
                email_notifications_enabled: true
            }])
            .select();

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Form created successfully!' });
            setShowCreateModal(false);
            setNewFormDetails({ title: '', slug: '', description: '' });
            fetchConfigs();
            if (data?.[0]) setSelectedConfig(data[0]);
        }
        setIsCreating(false);
    };

    const handleDeleteForm = async () => {
        if (!selectedConfig) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the "${selectedConfig.title}" form? \n\nExisting lead data for this form will NOT be deleted, but users will no longer be able to submit this form.`
        );

        if (!confirmDelete) return;

        setIsSaving(true);
        const { error } = await supabase
            .from('form_configs')
            .delete()
            .eq('id', selectedConfig.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Form deleted successfully!' });
            setSelectedConfig(null);
            fetchConfigs();
        }
        setIsSaving(false);
    };

    const handleSave = async () => {
        if (!selectedConfig) return;
        setIsSaving(true);
        setMessage(null);

        const { error } = await supabase
            .from('form_configs')
            .update({
                title: selectedConfig.title,
                description: selectedConfig.description,
                fields: selectedConfig.fields,
                is_active: selectedConfig.is_active,
                email_notifications_enabled: selectedConfig.email_notifications_enabled
            })
            .eq('id', selectedConfig.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
            fetchConfigs();
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Form Configuration</h1>
                    <p className="text-gray-500">Customize the fields for your website contact forms</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar - Form List */}
                <div className="md:col-span-1 space-y-4">
                    <Button
                        variant="secondary"
                        className="w-full justify-start gap-2 bg-navy-50 text-navy-900 border-navy-100 hover:bg-navy-100"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus className="w-4 h-4" /> New Form
                    </Button>

                    <div className="space-y-2">
                        {configs.map((config) => (
                            <button
                                key={config.id}
                                onClick={() => setSelectedConfig(config)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedConfig?.id === config.id
                                    ? 'bg-navy-900 text-white shadow-lg border-navy-900'
                                    : 'bg-white text-navy-900 hover:border-navy-300'
                                    }`}
                            >
                                <div className="font-bold flex items-center justify-between">
                                    {config.form_slug.toUpperCase()}
                                    {!config.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                                </div>
                                <div className={`text-xs mt-1 ${selectedConfig?.id === config.id ? 'text-navy-300' : 'text-gray-500'}`}>
                                    {config.fields.length} Fields
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="md:col-span-3">
                    <AnimatePresence mode="wait">
                        {!selectedConfig ? (
                            <m.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-white border-2 border-dashed border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400"
                            >
                                <Settings2 className="w-12 h-12 mb-4 opacity-20" />
                                Select a form to begin editing
                            </m.div>
                        ) : (
                            <m.div
                                key={selectedConfig.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6 space-y-8"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-gray-100 gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Form Title</label>
                                            <input
                                                className="text-2xl font-serif font-bold text-navy-900 w-full outline-none focus:border-b focus:border-gold-400 bg-transparent"
                                                value={selectedConfig.title}
                                                onChange={(e) => setSelectedConfig({ ...selectedConfig, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Form Slug (Read-only)</label>
                                                <div className="text-sm font-mono text-navy-600 bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-100 w-fit">
                                                    {selectedConfig.form_slug}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                                                <input
                                                    className="text-sm text-gray-500 w-full outline-none focus:border-b focus:border-gold-200 bg-transparent"
                                                    value={selectedConfig.description}
                                                    onChange={(e) => setSelectedConfig({ ...selectedConfig, description: e.target.value })}
                                                    placeholder="Enter description..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 pt-2 border-t border-gray-50">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={selectedConfig.is_active}
                                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, is_active: e.target.checked })}
                                                    />
                                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-navy-900 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                                </div>
                                                <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">
                                                    Status: {selectedConfig.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={selectedConfig.email_notifications_enabled}
                                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, email_notifications_enabled: e.target.checked })}
                                                    />
                                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-navy-900 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                                </div>
                                                <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">
                                                    Email Alerts: {selectedConfig.email_notifications_enabled ? 'ON' : 'OFF'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 lg:self-start pt-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                const url = `${window.location.origin}/?form=${selectedConfig.form_slug}#contact`;
                                                navigator.clipboard.writeText(url);
                                                setMessage({ type: 'success', text: 'Share link copied to clipboard!' });
                                            }}
                                            className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        >
                                            <Link className="w-4 h-4 mr-1.5" /> Copy Link
                                        </Button>

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleSave}
                                            isLoading={isSaving}
                                            className="px-6 shadow-premium"
                                        >
                                            <Save className="w-4 h-4 mr-1.5" /> Save Changes
                                        </Button>

                                        <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            onClick={handleDeleteForm}
                                            isLoading={isSaving}
                                            className="text-red-400 hover:text-red-600 border-transparent hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {message && (
                                    <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {message.text}
                                    </m.div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-navy-900">Fields</h4>
                                        <Button variant="ghost" size="sm" onClick={handleAddField}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Field
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedConfig.fields.map((field, index) => (
                                            <m.div
                                                key={index}
                                                layout
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-4 group"
                                            >
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <button onClick={() => handleMoveField(index, 'up')} className="p-1 hover:bg-gray-200 rounded text-gray-400"><MoveUp className="w-3 h-3" /></button>
                                                    <button onClick={() => handleMoveField(index, 'down')} className="p-1 hover:bg-gray-200 rounded text-gray-400"><MoveDown className="w-3 h-3" /></button>
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                    <div className="sm:col-span-3">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Label</label>
                                                        <input
                                                            className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                                                            value={field.label}
                                                            onChange={(e) => handleUpdateField(index, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-3">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Placeholder</label>
                                                        {['text', 'textarea', 'email', 'tel'].includes(field.type) ? (
                                                            <input
                                                                className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                                                                placeholder="Enter hint text..."
                                                            />
                                                        ) : (
                                                            <div className="w-full bg-slate-50 border border-slate-100 p-2 rounded text-[10px] text-slate-400 italic flex items-center h-[38px]">
                                                                Not applicable
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="sm:col-span-3">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Type</label>
                                                        <select
                                                            className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none"
                                                            value={field.type}
                                                            onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="textarea">Long Text</option>
                                                            <option value="email">Email</option>
                                                            <option value="tel">Phone</option>
                                                            <option value="select">Dropdown</option>
                                                            <option value="date">Date</option>
                                                            <option value="checkbox">Checkbox</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Req.</label>
                                                        <input
                                                            type="checkbox"
                                                            className="mt-2 w-4 h-4 rounded text-navy-600 focus:ring-navy-500"
                                                            checked={field.required}
                                                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2 flex items-end">
                                                        <button
                                                            onClick={() => handleRemoveField(index)}
                                                            className="text-red-400 hover:text-red-600 p-2 transition-colors ml-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {field.type === 'select' && (
                                                        <div className="col-span-full border-t border-gray-200 pt-4 mt-1 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] uppercase font-bold text-gray-400">Dropdown Options</label>
                                                                <button
                                                                    onClick={() => {
                                                                        const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                                                                        handleUpdateField(index, { options: newOptions });
                                                                    }}
                                                                    className="text-[10px] font-bold text-navy-600 hover:text-navy-900 uppercase tracking-widest flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add Option
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {(field.options || []).map((option, optIndex) => (
                                                                    <div key={optIndex} className="flex gap-2">
                                                                        <input
                                                                            className="flex-1 bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                                                                            value={option}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...(field.options || [])];
                                                                                newOptions[optIndex] = e.target.value;
                                                                                handleUpdateField(index, { options: newOptions });
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newOptions = [...(field.options || [])];
                                                                                newOptions.splice(optIndex, 1);
                                                                                handleUpdateField(index, { options: newOptions });
                                                                            }}
                                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {(!field.options || field.options.length === 0) && (
                                                                <p className="text-xs text-gray-400 italic">No options added yet.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </m.div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex justify-center">
                                        <Button
                                            variant="secondary"
                                            className="gap-2"
                                            onClick={handleAddField}
                                        >
                                            <Plus className="w-4 h-4" /> Add Another Field
                                        </Button>
                                    </div>
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Create Form Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <m.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-premium-xl max-w-md w-full p-8"
                        >
                            <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">Create New Form</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Display Title</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500"
                                        placeholder="e.g. Workshop Registration"
                                        value={newFormDetails.title}
                                        onChange={e => setNewFormDetails({ ...newFormDetails, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Form Slug (Unique Identifier)</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500"
                                        placeholder="e.g. workshops"
                                        value={newFormDetails.slug}
                                        onChange={e => setNewFormDetails({ ...newFormDetails, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500 h-24"
                                        placeholder="What is this form for?"
                                        value={newFormDetails.description}
                                        onChange={e => setNewFormDetails({ ...newFormDetails, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="tertiary"
                                        className="flex-1"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleCreateForm}
                                        isLoading={isCreating}
                                    >
                                        Create Form
                                    </Button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
