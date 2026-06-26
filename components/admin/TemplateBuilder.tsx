'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useToast } from '@/context/ToastContext';
import { Save, Plus, ArrowLeft, Trash2, Image as ImageIcon } from 'lucide-react';
import type { TemplateFieldConfig } from '@/lib/certificates/ParticipationCertificateImage';

const DEFAULT_FONT_FAMILIES = ['Playfair Display', 'Inter', 'Georgia', 'Arial'];

const DYNAMIC_FIELDS = [
  { id: 'student_name', label: 'Student Name' },
  { id: 'cohort_title', label: 'Cohort Title' },
  { id: 'month_name', label: 'Month Name' },
  { id: 'issued_date', label: 'Issued Date' },
  { id: 'learning_outcomes', label: 'Learning Outcomes' },
];

export function TemplateBuilder({ cohortId }: { cohortId: string }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [fieldsConfig, setFieldsConfig] = useState<TemplateFieldConfig[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Canvas dimensions (based on our 800x1000 PDF)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1000;

  // Canvas scaling for the editor UI so it fits on screen
  const CANVAS_SCALE = 0.6;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch Cohort Name
        const { data: cohort } = await supabase
          .from('cohorts')
          .select('title')
          .eq('id', cohortId)
          .single();
        if (cohort) setCohortName(cohort.title);

        // Fetch existing template
        const { data: template } = await supabase
          .from('cohort_certificate_templates')
          .select('background_url, fields_config')
          .eq('cohort_id', cohortId)
          .maybeSingle();

        if (template) {
          setBackgroundUrl(template.background_url);
          setFieldsConfig(
            typeof template.fields_config === 'string'
              ? JSON.parse(template.fields_config)
              : template.fields_config
          );
        }
      } catch (err: any) {
        addToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [cohortId, addToast]);

  const handleSave = async () => {
    if (!backgroundUrl) {
      addToast('Background image is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cohort_id: cohortId,
        background_url: backgroundUrl,
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        fields_config: fieldsConfig,
      };

      const { data: existing } = await supabase
        .from('cohort_certificate_templates')
        .select('id')
        .eq('cohort_id', cohortId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cohort_certificate_templates')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cohort_certificate_templates').insert([payload]);
        if (error) throw error;
      }

      addToast('Template saved successfully', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addDynamicField = (id: string) => {
    if (fieldsConfig.find((f) => f.id === id)) {
      addToast('Field already added', 'info');
      return;
    }
    const newField: TemplateFieldConfig = {
      id,
      type: 'dynamic',
      x: 100,
      y: 100,
      width: 400,
      height: 60,
      fontSize: 24,
      fontFamily: 'Playfair Display',
      color: '#f8fafc',
      textAlign: 'center',
    };
    setFieldsConfig([...fieldsConfig, newField]);
    setSelectedFieldId(id);
  };

  const addStaticField = () => {
    const id = `static_${Date.now()}`;
    const newField: TemplateFieldConfig = {
      id,
      type: 'static',
      content: 'Custom Text Here',
      x: 100,
      y: 100,
      width: 400,
      height: 60,
      fontSize: 20,
      fontFamily: 'Playfair Display',
      color: '#94a3b8',
      textAlign: 'center',
    };
    setFieldsConfig([...fieldsConfig, newField]);
    setSelectedFieldId(id);
  };

  const updateField = (id: string, updates: Partial<TemplateFieldConfig>) => {
    setFieldsConfig((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFieldsConfig((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // --- Drag Logic ---
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedFieldId(id);
    setDraggingId(id);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const dx = (e.clientX - startPos.x) / CANVAS_SCALE;
    const dy = (e.clientY - startPos.y) / CANVAS_SCALE;

    setFieldsConfig((prev) =>
      prev.map((f) => {
        if (f.id === draggingId) {
          let newX = Math.round(f.x + dx);
          let newY = Math.round(f.y + dy);

          // Clamp to canvas boundaries
          newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - f.width));
          newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - f.height));

          return { ...f, x: newX, y: newY };
        }
        return f;
      })
    );

    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  const selectedField = fieldsConfig.find((f) => f.id === selectedFieldId);

  return (
    <div
      className="max-w-7xl mx-auto space-y-6 pb-20 p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Certificate Template Builder</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Cohort: <span className="font-bold text-slate-700">{cohortName}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel: Tools & Properties */}
        <div className="xl:col-span-1 space-y-6">
          {/* Background Upload */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-500" /> Background Image
            </h3>
            <ImageUpload
              bucket="certificate_templates"
              value={backgroundUrl}
              onChange={setBackgroundUrl}
            />
            <p className="text-[10px] text-slate-400 mt-2 text-center">Recommended: 800x1000px</p>
          </div>

          {/* Field Palette */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={14} className="text-slate-500" /> Add Elements
            </h3>
            <div className="space-y-2">
              {DYNAMIC_FIELDS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => addDynamicField(f.id)}
                  disabled={!!fieldsConfig.find((existing) => existing.id === f.id)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + {f.label}
                </button>
              ))}
              <div className="border-t border-slate-100 my-2 pt-2"></div>
              <button
                onClick={addStaticField}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                + Custom Static Text
              </button>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedField && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Properties
                </h3>
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                  title="Delete Element"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500 mb-2 truncate">
                ID: {selectedField.id}
              </div>

              {selectedField.type === 'static' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Text Content
                  </label>
                  <textarea
                    value={selectedField.content || ''}
                    onChange={(e) => updateField(selectedField.id, { content: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all min-h-[60px]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={selectedField.width}
                    onChange={(e) =>
                      updateField(selectedField.id, { width: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={selectedField.height}
                    onChange={(e) =>
                      updateField(selectedField.id, { height: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={selectedField.fontSize}
                    onChange={(e) =>
                      updateField(selectedField.id, { fontSize: parseInt(e.target.value) || 12 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={selectedField.color}
                      onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedField.color}
                      onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Font Family
                </label>
                <select
                  value={selectedField.fontFamily}
                  onChange={(e) => updateField(selectedField.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 transition-all"
                >
                  {DEFAULT_FONT_FAMILIES.map((ff) => (
                    <option key={ff} value={ff}>
                      {ff}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Text Align
                </label>
                <div className="flex border border-slate-200 rounded overflow-hidden">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => updateField(selectedField.id, { textAlign: align as any })}
                      className={`flex-1 py-1.5 text-xs font-semibold capitalize transition-colors ${selectedField.textAlign === align ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Pos X: {selectedField.x}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Pos Y: {selectedField.y}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Canvas */}
        <div className="xl:col-span-3 bg-slate-100 border border-slate-200 rounded-lg p-6 flex items-start justify-center overflow-auto min-h-[600px]">
          <div
            ref={canvasRef}
            className="relative shadow-2xl bg-white select-none shrink-0"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${CANVAS_SCALE})`,
              transformOrigin: 'top center',
              backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!backgroundUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-2xl uppercase tracking-widest border-2 border-dashed border-slate-200">
                Upload Background First
              </div>
            )}

            {fieldsConfig.map((field) => {
              const isSelected = field.id === selectedFieldId;
              let displayText = field.content;
              if (field.type === 'dynamic') {
                displayText = `[ ${DYNAMIC_FIELDS.find((f) => f.id === field.id)?.label || field.id} ]`;
                if (field.id === 'learning_outcomes')
                  displayText = '• Outcome 1\n• Outcome 2\n• Outcome 3';
              }

              return (
                <div
                  key={field.id}
                  onMouseDown={(e) => handleMouseDown(e, field.id)}
                  className={`absolute cursor-move overflow-hidden transition-shadow ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:ring-1 hover:ring-slate-400'}`}
                  style={{
                    top: `${field.y}px`,
                    left: `${field.x}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    fontSize: `${field.fontSize}px`,
                    fontFamily: field.fontFamily,
                    color: field.color,
                    textAlign: field.textAlign,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems:
                      field.textAlign === 'center'
                        ? 'center'
                        : field.textAlign === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  }}
                >
                  {displayText}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
