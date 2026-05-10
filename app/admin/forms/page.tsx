"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/system/Button";
import {
  Plus,
  Trash2,
  Save,
  MoveUp,
  MoveDown,
  Settings2,
  X,
  Link,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import TipTapEditor from "@/components/admin/TipTapEditor";

interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "email"
    | "tel"
    | "select"
    | "date"
    | "checkbox"
    | "content"
    | "image";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  content?: string;
}

interface FormConfig {
  id: string;
  form_slug: string;
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  email_notifications_enabled: boolean;
  auto_reply_subject?: string;
  auto_reply_message?: string;
  success_message?: string;
  requires_payment?: boolean;
  payment_type?: "subscription" | "one_time";
  razorpay_plan_id?: string;
  razorpay_amount?: number;
}

export default function FormManagementPage() {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState<FormConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<FormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormDetails, setNewFormDetails] = useState({
    title: "",
    slug: "",
    description: "",
  });
  const [isAutoReplyOpen, setIsAutoReplyOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (selectedConfig) {
      localStorage.setItem(`form_preview_${selectedConfig.form_slug}`, JSON.stringify(selectedConfig));
    }
  }, [selectedConfig]);

  async function fetchConfigs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_configs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data) setConfigs(data);
    } catch (err: any) {
      addToast(err.message || "Failed to fetch form configs", "error");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddField = () => {
    if (!selectedConfig) return;
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    setSelectedConfig({
      ...selectedConfig,
      fields: [...selectedConfig.fields, newField],
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

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (!selectedConfig) return;
    const newFields = [...selectedConfig.fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    setSelectedConfig({ ...selectedConfig, fields: newFields });
  };

  const handleCreateForm = async () => {
    if (!newFormDetails.title || !newFormDetails.slug) {
      addToast("Title and Slug are required", "error");
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase
      .from("form_configs")
      .insert([
        {
          title: newFormDetails.title,
          form_slug: newFormDetails.slug.toLowerCase().replace(/\s+/g, "_"),
          description: newFormDetails.description,
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
          ],
          is_active: true,
          email_notifications_enabled: true,
        },
      ])
      .select();

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast("Form created successfully!", "success");
      setShowCreateModal(false);
      setNewFormDetails({ title: "", slug: "", description: "" });
      fetchConfigs();
      if (data?.[0]) setSelectedConfig(data[0]);
    }
    setIsCreating(false);
  };

  const handleDeleteForm = async (id: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this form? \n\nExisting lead data will NOT be deleted.`,
    );

    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("form_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      addToast("Form deleted successfully", "success");
      if (selectedConfig?.id === id) setSelectedConfig(null);
      fetchConfigs();
    } catch (err: any) {
      addToast(err.message || "Failed to delete form", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedConfig) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("form_configs")
        .update({
          title: selectedConfig.title,
          description: selectedConfig.description,
          fields: selectedConfig.fields,
          is_active: selectedConfig.is_active,
          email_notifications_enabled: selectedConfig.email_notifications_enabled,
          auto_reply_subject: selectedConfig.auto_reply_subject,
          auto_reply_message: selectedConfig.auto_reply_message,
          success_message: selectedConfig.success_message,
          requires_payment: selectedConfig.requires_payment || false,
          payment_type: selectedConfig.payment_type || "subscription",
          razorpay_plan_id: selectedConfig.razorpay_plan_id || null,
          razorpay_amount: selectedConfig.razorpay_amount || null,
        })
        .eq("id", selectedConfig.id);

      if (error) throw error;
      addToast("Configuration saved successfully!", "success");
      fetchConfigs();
    } catch (err: any) {
      addToast(err.message || "Failed to save configuration", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy-900">
            Form Configuration
          </h1>
          <p className="text-gray-500">
            Customize the fields for your website contact forms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedConfig?.id === config.id
                    ? "bg-navy-900 text-white shadow-lg border-navy-900"
                    : "bg-white text-navy-900 hover:border-navy-300"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  {config.form_slug.toUpperCase()}
                  {!config.is_active && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs mt-1 ${selectedConfig?.id === config.id ? "text-navy-300" : "text-gray-500"}`}
                >
                  {config.fields.length} Fields
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {!selectedConfig ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-gray-100 gap-4 mb-8">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Form Title
                    </label>
                    <input
                      className="text-3xl font-serif font-bold text-navy-900 w-full outline-none focus:border-b focus:border-gold-400 bg-transparent transition-colors"
                      value={selectedConfig.title}
                      onChange={(e) =>
                        setSelectedConfig({
                          ...selectedConfig,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/forms/${selectedConfig.form_slug}`;
                        navigator.clipboard.writeText(url);
                        addToast("Share link copied to clipboard!", "success");
                      }}
                      className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 shadow-sm"
                    >
                      <Link className="w-4 h-4 mr-1.5" /> Copy Link
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowPreviewModal(true)}
                      className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 shadow-sm"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Preview Form
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      isLoading={isSaving}
                      className="shadow-premium"
                    >
                      <Save className="w-4 h-4 mr-1.5" /> Save Changes
                    </Button>

                    <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => handleDeleteForm(selectedConfig.id)}
                      isLoading={isSaving}
                      className="text-red-400 hover:text-red-600 border-transparent hover:bg-red-50 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-8 pb-6 border-b border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Form Slug (Read-only)
                      </label>
                      <div className="text-sm font-mono text-navy-600 bg-navy-50 px-3 py-2 rounded-lg border border-navy-100 w-full overflow-hidden text-ellipsis">
                        {selectedConfig.form_slug}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Description
                      </label>
                      <textarea
                        className="text-sm text-navy-800 w-full bg-gray-50 border border-gray-200 p-2 rounded-lg outline-none focus:border-gold-400 min-h-[42px] transition-colors"
                        value={selectedConfig.description}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter description..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedConfig.is_active}
                          onChange={(e) =>
                            setSelectedConfig({
                              ...selectedConfig,
                              is_active: e.target.checked,
                            })
                          }
                        />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-navy-900 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                      </div>
                      <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">
                        Status:{" "}
                        {selectedConfig.is_active ? "Active" : "Inactive"}
                      </span>
                    </label>

                    <div className="hidden sm:block w-px h-6 bg-gray-200" />

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedConfig.email_notifications_enabled}
                          onChange={(e) =>
                            setSelectedConfig({
                              ...selectedConfig,
                              email_notifications_enabled: e.target.checked,
                            })
                          }
                        />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-navy-900 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                      </div>
                      <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">
                        Email Alerts:{" "}
                        {selectedConfig.email_notifications_enabled
                          ? "ON"
                          : "OFF"}
                      </span>
                    </label>

                    <div className="hidden sm:block w-px h-6 bg-gray-200" />

                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Success Message (On-screen)
                      </label>
                      <input
                        className="text-xs text-navy-900 bg-white border border-gray-200 p-2 rounded-lg w-full outline-none focus:border-gold-400 transition-colors"
                        value={selectedConfig.success_message || ""}
                        onChange={(e) =>
                          setSelectedConfig({
                            ...selectedConfig,
                            success_message: e.target.value,
                          })
                        }
                        placeholder="e.g. Thank you! We will contact you soon."
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAutoReplyOpen(!isAutoReplyOpen)}
                    className="flex items-center justify-between w-full text-left focus:outline-none group p-4 border border-gray-100 rounded-xl hover:border-gold-300 transition-colors bg-white shadow-sm"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 group-hover:text-gold-600 transition-colors">
                        Auto-Reply Settings
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Customize the email sent to users upon form submission.
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gold-600 transition-colors bg-gray-50 rounded-full p-2">
                      {isAutoReplyOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isAutoReplyOpen && (
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pb-2 space-y-4 px-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Reply Subject
                            </label>
                            <input
                              className="text-sm text-navy-900 bg-gray-50 p-3 rounded-xl w-full border border-gray-200 outline-none focus:border-gold-400 transition-colors"
                              value={selectedConfig.auto_reply_subject || ""}
                              onChange={(e) =>
                                setSelectedConfig({
                                  ...selectedConfig,
                                  auto_reply_subject: e.target.value,
                                })
                              }
                              placeholder="e.g. Thanks for registering!"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Message Body
                            </label>
                            <div className="mt-1 shadow-sm rounded-xl overflow-hidden ring-1 ring-gray-200">
                              <TipTapEditor
                                content={
                                  selectedConfig.auto_reply_message || ""
                                }
                                onChange={(content) =>
                                  setSelectedConfig({
                                    ...selectedConfig,
                                    auto_reply_message: content,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() =>
                      setIsPaymentSettingsOpen(!isPaymentSettingsOpen)
                    }
                    className="flex items-center justify-between w-full text-left focus:outline-none group p-4 border border-gray-100 rounded-xl hover:border-gold-300 transition-colors bg-white shadow-sm mt-4"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 group-hover:text-gold-600 transition-colors">
                        Payment Settings (Razorpay)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Require users to pay before their form is successfully
                        submitted.
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gold-600 transition-colors bg-gray-50 rounded-full p-2">
                      {isPaymentSettingsOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isPaymentSettingsOpen && (
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pb-2 space-y-4 px-2">
                          <label className="flex items-center gap-3 cursor-pointer group mb-4">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={
                                  selectedConfig.requires_payment || false
                                }
                                onChange={(e) =>
                                  setSelectedConfig({
                                    ...selectedConfig,
                                    requires_payment: e.target.checked,
                                  })
                                }
                              />
                              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-navy-900 transition-colors"></div>
                              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                            </div>
                            <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-gold-600 transition-colors">
                              Require Payment:{" "}
                              {selectedConfig.requires_payment ? "ON" : "OFF"}
                            </span>
                          </label>

                          {selectedConfig.requires_payment && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                  Payment Type
                                </label>
                                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                  <button
                                    onClick={() =>
                                      setSelectedConfig({
                                        ...selectedConfig,
                                        payment_type: "subscription",
                                      })
                                    }
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedConfig.payment_type === "subscription" || !selectedConfig.payment_type ? "bg-white text-navy-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                  >
                                    Subscription
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedConfig({
                                        ...selectedConfig,
                                        payment_type: "one_time",
                                      })
                                    }
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedConfig.payment_type === "one_time" ? "bg-white text-navy-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                  >
                                    One-Time
                                  </button>
                                </div>
                              </div>

                              {selectedConfig.payment_type === "one_time" ? (
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                    Amount (INR)
                                  </label>
                                  <input
                                    type="number"
                                    className="text-sm text-navy-900 bg-gray-50 p-3 rounded-xl w-full border border-gray-200 outline-none focus:border-gold-400 transition-colors"
                                    value={selectedConfig.razorpay_amount || ""}
                                    onChange={(e) =>
                                      setSelectedConfig({
                                        ...selectedConfig,
                                        razorpay_amount: parseInt(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    placeholder="e.g. 500"
                                  />
                                  <p className="text-xs text-gray-400 mt-2">
                                    Enter the flat amount in Rupees for this
                                    vault.
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                    Razorpay Plan ID
                                  </label>
                                  <input
                                    className="text-sm text-navy-900 bg-gray-50 p-3 rounded-xl w-full border border-gray-200 outline-none focus:border-gold-400 transition-colors"
                                    value={
                                      selectedConfig.razorpay_plan_id || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedConfig({
                                        ...selectedConfig,
                                        razorpay_plan_id: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. plan_yourplanid123"
                                  />
                                  <p className="text-xs text-gray-400 mt-2">
                                    Find this in your Razorpay Dashboard under
                                    Subscriptions -{">"} Plans.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h4 className="text-lg font-serif font-bold text-navy-900 inline-block">
                      Form Builder
                    </h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddField}
                      className="bg-navy-50 text-navy-700 hover:bg-navy-100 border-0"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Field
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {selectedConfig.fields.map((field, index) => (
                      <m.div
                        key={index}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-4 group"
                      >
                        <div className="flex flex-col gap-1 mt-2">
                          <button
                            onClick={() => handleMoveField(index, "up")}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveField(index, "down")}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4">
                          <div className="sm:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Type
                            </label>
                            <select
                              className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none font-bold text-navy-900 border-l-4 border-l-gold-400 shadow-sm"
                              value={field.type}
                              onChange={(e) =>
                                handleUpdateField(index, {
                                  type: e.target.value as any,
                                })
                              }
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="select">Dropdown</option>
                              <option value="date">Date</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="image">Image Upload</option>
                              <option value="content">Content Block</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Label
                            </label>
                            <input
                              className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                              value={field.label}
                              onChange={(e) =>
                                handleUpdateField(index, {
                                  label: e.target.value,
                                  name: e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, "_"),
                                })
                              }
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Placeholder
                            </label>
                            {["text", "textarea", "email", "tel"].includes(
                              field.type,
                            ) ? (
                              <input
                                className="w-full bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  handleUpdateField(index, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="Enter hint text..."
                              />
                            ) : (
                              <div className="w-full bg-slate-50 border border-slate-100 p-2 rounded text-[10px] text-slate-400 italic flex items-center h-[38px]">
                                Not applicable
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                              Req.
                            </label>
                            <input
                              type="checkbox"
                              className="mt-2 w-4 h-4 rounded text-navy-600 focus:ring-navy-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              checked={field.required}
                              onChange={(e) =>
                                handleUpdateField(index, {
                                  required: e.target.checked,
                                })
                              }
                              disabled={field.type === "content"}
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

                          {field.type === "select" && (
                            <div className="col-span-full border-t border-gray-200 pt-4 mt-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold text-gray-400">
                                  Dropdown Options
                                </label>
                                <button
                                  onClick={() => {
                                    const newOptions = [
                                      ...(field.options || []),
                                      `Option ${(field.options?.length || 0) + 1}`,
                                    ];
                                    handleUpdateField(index, {
                                      options: newOptions,
                                    });
                                  }}
                                  className="text-[10px] font-bold text-navy-600 hover:text-navy-900 uppercase tracking-widest flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Option
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(field.options || []).map(
                                  (option, optIndex) => (
                                    <div key={optIndex} className="flex gap-2">
                                      <input
                                        className="flex-1 bg-white border border-gray-200 p-2 rounded text-sm outline-none focus:border-navy-500"
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...(field.options || []),
                                          ];
                                          newOptions[optIndex] = e.target.value;
                                          handleUpdateField(index, {
                                            options: newOptions,
                                          });
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          const newOptions = [
                                            ...(field.options || []),
                                          ];
                                          newOptions.splice(optIndex, 1);
                                          handleUpdateField(index, {
                                            options: newOptions,
                                          });
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ),
                                )}
                              </div>
                              {(!field.options ||
                                field.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic">
                                  No options added yet.
                                </p>
                              )}
                            </div>
                          )}

                          {field.type === "content" && (
                            <div className="col-span-full border-t border-gray-200 pt-4 mt-1">
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                                Content Block Text
                              </label>
                              <div className="bg-white rounded border border-gray-200">
                                <TipTapEditor
                                  content={field.content || ""}
                                  onChange={(c) =>
                                    handleUpdateField(index, { content: c })
                                  }
                                />
                              </div>
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
      
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-premium-xl max-w-md w-full p-8"
            >
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">
                Create New Form
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Display Title
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500"
                    placeholder="e.g. Workshop Registration"
                    value={newFormDetails.title}
                    onChange={(e) =>
                      setNewFormDetails({
                        ...newFormDetails,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Form Slug (Unique Identifier)
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500"
                    placeholder="e.g. workshops"
                    value={newFormDetails.slug}
                    onChange={(e) =>
                      setNewFormDetails({
                        ...newFormDetails,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-navy-500 h-24"
                    placeholder="What is this form for?"
                    value={newFormDetails.description}
                    onChange={(e) =>
                      setNewFormDetails({
                        ...newFormDetails,
                        description: e.target.value,
                      })
                    }
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

      <AnimatePresence>
        {showPreviewModal && selectedConfig && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-[100]">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-100 rounded-2xl shadow-premium-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 ring-1 ring-white/10"
            >
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10 sticky top-0">
                <div>
                  <h2 className="text-xl font-serif font-bold text-navy-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-400" />
                    Preview: {selectedConfig.title}
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {window.location.origin}/forms/{selectedConfig.form_slug}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-100 mr-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                    Live Preview
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPreviewModal(false)}
                    className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-0"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 w-full bg-gray-100 overflow-hidden relative">
                <iframe
                    src={`/forms/${selectedConfig.form_slug}?preview=true`}
                    className="w-full h-full border-0 absolute inset-0 bg-white"
                    title="Form Preview"
                />
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
