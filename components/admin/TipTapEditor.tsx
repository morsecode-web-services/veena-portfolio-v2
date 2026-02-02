'use client';

import {
    EditorProvider,
    useCurrentEditor,
    TiptapBubbleMenu as BubbleMenu,
    TiptapContent as EditorContent
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

function EditorToolbar() {
    const { editor } = useCurrentEditor();

    const addImage = useCallback(async () => {
        if (!editor) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    alert('Image size must be less than 5MB. Please choose a smaller image.');
                    return;
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `inline-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('blog-assets')
                    .upload(filePath, file, {
                        contentType: file.type,
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('blog-assets')
                    .getPublicUrl(filePath);

                if (data?.publicUrl) {
                    editor.chain().focus().setImage({ src: data.publicUrl }).run();
                }
            } catch (error: any) {
                console.error('Error uploading image:', error);
                const errorMessage = error?.message || 'Failed to upload image. Please try again.';
                alert(`Upload failed: ${errorMessage}`);
            }
        };

        input.click();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bold') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Bold"
            >
                <Bold className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('italic') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Italic"
            >
                <Italic className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('heading', { level: 1 }) ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="H1"
            >
                <Heading1 className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('heading', { level: 2 }) ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="H2"
            >
                <Heading2 className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('bulletList') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Bullet List"
            >
                <List className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('orderedList') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Ordered List"
            >
                <ListOrdered className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('blockquote') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Quote"
            >
                <Quote className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
                type="button"
                onClick={addImage}
                className="p-2 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500"
                title="Add Image"
            >
                <ImageIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => {
                    const url = window.prompt('Enter Link URL');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
                className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${editor.isActive('link') ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
                title="Add Link"
            >
                <LinkIcon className="h-4 w-4" />
            </button>
            <div className="ml-auto flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="p-2 rounded hover:bg-white hover:shadow-sm transition-all text-gray-400"
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="p-2 rounded hover:bg-white hover:shadow-sm transition-all text-gray-400"
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function EditorBubbleMenu() {
    const { editor } = useCurrentEditor();
    if (!editor) return null;

    return (
        <BubbleMenu>
            <div className="bg-navy-950 text-white rounded-lg shadow-xl p-1 flex items-center gap-0.5 border border-navy-800">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('bold') ? 'text-gold-400' : 'text-navy-100'}`}
                >
                    <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('italic') ? 'text-gold-400' : 'text-navy-100'}`}
                >
                    <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const url = window.prompt('Enter Link URL');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('link') ? 'text-gold-400' : 'text-navy-100'}`}
                >
                    <LinkIcon className="h-3.5 w-3.5" />
                </button>
            </div>
        </BubbleMenu>
    );
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const extensions = useMemo(() => [
        StarterKit.configure({
            bulletList: {
                keepMarks: true,
                keepAttributes: false,
            },
            orderedList: {
                keepMarks: true,
                keepAttributes: false,
            },
        }),
        Image.configure({
            HTMLAttributes: {
                class: 'rounded-2xl shadow-lg border border-gray-100',
            },
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-gold-600 underline',
            },
        }),
        Placeholder.configure({
            placeholder: 'Write something amazing...',
        }),
    ], []);

    if (!mounted) {
        return (
            <div className="min-h-[400px] border border-gray-200 rounded-xl bg-gray-50 animate-pulse flex items-center justify-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initializing Editor...</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
            <EditorProvider
                extensions={extensions}
                content={content}
                immediatelyRender={false}
                onUpdate={({ editor }) => {
                    onChange(editor.getHTML());
                }}
                editorProps={{
                    attributes: {
                        class: 'prose prose-lg prose-navy max-w-none focus:outline-none min-h-[400px] px-4 py-8 bg-white font-serif',
                    },
                }}
                slotBefore={<EditorToolbar />}
                slotAfter={
                    <div className="bg-gray-50 p-2 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest font-black">
                        Press &apos;/&apos; to bring up the slash menu (coming soon) or use the floating toolbar
                    </div>
                }
            >
                <EditorBubbleMenu />
                <div className="max-h-[600px] overflow-y-auto">
                    <EditorContent />
                </div>
            </EditorProvider>
        </div>
    );
}
