import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { newsApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
    Bold, Italic, UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Link2, ImageIcon, Undo2, Redo2, RemoveFormatting
} from 'lucide-react';

// Nút toolbar
const ToolBtn = ({ onClick, active, title, children, disabled }) => (
    <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={`w-7 h-7 flex items-center justify-center rounded text-sm transition
            ${active
                ? 'bg-primary-700 text-white'
                : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5" />;

export default function NewsEditor({ value, onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false, autolink: true }),
            Image.configure({ inline: false, allowBase64: true }),
            Placeholder.configure({ placeholder: 'Nhập nội dung bài viết...' }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[280px] px-4 py-3 focus:outline-none'
            }
        }
    });

    // Upload ảnh vào editor
    const handleInsertImage = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('image', file);
            try {
                const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                const res = await newsApi.uploadEditorImage(formData);
                const url = `${BASE}${res.data.url}`;
                editor?.chain().focus().setImage({ src: url }).run();
            } catch {
                toast.error('Không thể upload ảnh vào nội dung');
            }
        };
        input.click();
    }, [editor]);

    // Thêm link
    const handleSetLink = useCallback(() => {
        const prev = editor?.getAttributes('link').href;
        const url = window.prompt('Nhập URL:', prev || 'https://');
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().unsetLink().run();
        } else {
            editor?.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary-600 transition">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                {/* Undo / Redo */}
                <ToolBtn title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo2 size={13} />
                </ToolBtn>
                <ToolBtn title="Làm lại" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo2 size={13} />
                </ToolBtn>

                <Divider />

                {/* Heading */}
                <ToolBtn title="Tiêu đề 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 size={13} />
                </ToolBtn>
                <ToolBtn title="Tiêu đề 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 size={13} />
                </ToolBtn>
                <ToolBtn title="Tiêu đề 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 size={13} />
                </ToolBtn>

                <Divider />

                {/* Text format */}
                <ToolBtn title="In đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold size={13} />
                </ToolBtn>
                <ToolBtn title="In nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic size={13} />
                </ToolBtn>
                <ToolBtn title="Gạch chân" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon size={13} />
                </ToolBtn>
                <ToolBtn title="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough size={13} />
                </ToolBtn>

                <Divider />

                {/* Align */}
                <ToolBtn title="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft size={13} />
                </ToolBtn>
                <ToolBtn title="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter size={13} />
                </ToolBtn>
                <ToolBtn title="Căn phải" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight size={13} />
                </ToolBtn>
                <ToolBtn title="Căn đều" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                    <AlignJustify size={13} />
                </ToolBtn>

                <Divider />

                {/* Lists */}
                <ToolBtn title="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List size={13} />
                </ToolBtn>
                <ToolBtn title="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered size={13} />
                </ToolBtn>
                <ToolBtn title="Trích dẫn" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote size={13} />
                </ToolBtn>
                <ToolBtn title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus size={13} />
                </ToolBtn>

                <Divider />

                {/* Link & Image */}
                <ToolBtn title="Chèn link" active={editor.isActive('link')} onClick={handleSetLink}>
                    <Link2 size={13} />
                </ToolBtn>
                <ToolBtn title="Chèn ảnh" onClick={handleInsertImage}>
                    <ImageIcon size={13} />
                </ToolBtn>

                <Divider />

                {/* Clear format */}
                <ToolBtn title="Xóa định dạng" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <RemoveFormatting size={13} />
                </ToolBtn>
            </div>

            {/* Editor area */}
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
