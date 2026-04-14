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
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from './extensions/FontSize';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/error-handling';
import imageCompression from 'browser-image-compression';

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
                // Validate file size
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('Image size must be less than 5MB. Please choose a smaller image.');
                    return;
                }

                // Compress image
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };

                let uploadFile = file;
                try {
                    uploadFile = await imageCompression(file, options);
                } catch (error) {
                    console.error('Compression failed, using original file:', error);
                }

                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

                if (!uploadPreset || !cloudName) {
                    alert('Cloudinary upload preset or cloud name is missing. Please configure NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
                    return;
                }

                const formData = new FormData();
                formData.append('file', uploadFile);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', 'forms/admin-content');

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image');

                // Cloudinary fetch mode formatting for optimization
                const transforms = 'f_auto,q_auto,w_1200,c_limit';
                // Extract just the path from the secure URL to pass to fetch mode
                const urlParts = data.secure_url.split('/upload/');
                const finalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${urlParts[1]}`;

                editor.chain().focus().setImage({ src: finalUrl }).run();

            } catch (error: any) {
                console.error('Error uploading image:', error);
                alert(getErrorMessage(error));
            }
        };

        input.click();
    }, [editor]);

    if (!editor) return null;

    const Button = ({ onClick, isActive, title, icon: Icon }: any) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded hover:bg-white hover:shadow-sm transition-all ${isActive ? 'text-navy-900 bg-white shadow-sm scale-105' : 'text-gray-500'}`}
            title={title}
        >
            <Icon className="h-4 w-4" />
        </button>
    );

    const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1 self-center" />;

    return (
        <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 p-2 flex flex-wrap gap-1 sticky top-0 z-10 items-center">

            <select
                className="h-8 text-xs border border-gray-200 rounded px-2 bg-white text-gray-600 focus:outline-none focus:border-navy-500 min-w-[100px]"
                onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                        editor.chain().focus().setFontFamily(value).run();
                    } else {
                        editor.chain().focus().unsetFontFamily().run();
                    }
                }}
                value={editor.getAttributes('textStyle').fontFamily || ''}
            >
                <option value="">Default Font</option>
                <option value="Inter, sans-serif">Sans Serif</option>
                <option value="Merriweather, serif">Serif</option>
                <option value="'JetBrains Mono', monospace">Monospace</option>
                <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
            </select>

            <select
                className="h-8 text-xs border border-gray-200 rounded px-2 bg-white text-gray-600 focus:outline-none focus:border-navy-500 w-[80px]"
                onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                        editor.chain().focus().setFontSize(value).run();
                    } else {
                        editor.chain().focus().unsetFontSize().run();
                    }
                }}
                value={editor.getAttributes('textStyle').fontSize || ''}
            >
                <option value="">Size</option>
                <option value="12px">Small</option>
                <option value="16px">Normal</option>
                <option value="20px">Large</option>
                <option value="24px">Huge</option>
                <option value="32px">Giant</option>
            </select>

            <Divider />
            <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold" icon={Bold} />
            <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic" icon={Italic} />
            <Button onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline" icon={UnderlineIcon} />

            <Divider />

            <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left" icon={AlignLeft} />
            <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center" icon={AlignCenter} />
            <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right" icon={AlignRight} />

            <Divider />

            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1" icon={Heading1} />
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2" icon={Heading2} />

            <Divider />

            <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List" icon={List} />
            <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List" icon={ListOrdered} />
            <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote" icon={Quote} />

            <Divider />

            <Button onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript" icon={SubscriptIcon} />
            <Button onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript" icon={SuperscriptIcon} />

            <Divider />

            <Button onClick={addImage} isActive={false} title="Add Image" icon={ImageIcon} />
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
                <Button onClick={() => editor.chain().focus().undo().run()} isActive={false} title="Undo" icon={Undo} />
                <Button onClick={() => editor.chain().focus().redo().run()} isActive={false} title="Redo" icon={Redo} />
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
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('bold') ? 'text-gold-400' : 'text-navy-100'}`}><Bold className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('italic') ? 'text-gold-400' : 'text-navy-100'}`}><Italic className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('underline') ? 'text-gold-400' : 'text-navy-100'}`}><UnderlineIcon className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => { const url = window.prompt('Enter Link URL'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} className={`p-1.5 rounded hover:bg-navy-800 transition-colors ${editor.isActive('link') ? 'text-gold-400' : 'text-navy-100'}`}><LinkIcon className="h-3.5 w-3.5" /></button>
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
            bulletList: { keepMarks: true, keepAttributes: false },
            orderedList: { keepMarks: true, keepAttributes: false },
        }),
        Image.configure({
            HTMLAttributes: { class: 'rounded-2xl shadow-lg border border-gray-100' },
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: { class: 'text-gold-600 underline' },
        }),
        Placeholder.configure({
            placeholder: 'Write something amazing...',
        }),
        Underline,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Subscript,
        Superscript,
        TextStyle,
        FontFamily,
        FontSize,
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
