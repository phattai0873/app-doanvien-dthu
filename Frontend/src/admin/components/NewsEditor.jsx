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
    Bold, Italic, UnderlineIcon,
    Heading1, Heading2, Heading3,
    List, AlignLeft, AlignCenter, AlignRight,
    Link2, ImageIcon, Undo2, Redo2, RemoveFormatting
} from 'lucide-react';

// ===================================================================
// Khai báo extensions ở cấp MODULE (ngoài component) - chỉ tạo 1 lần.
// Đây là nguyên nhân gốc của lỗi "Duplicate extension names":
// Nếu định nghĩa trong component, mỗi render tạo instance mới → Tiptap báo trùng.
// ===================================================================
const EDITOR_EXTENSIONS = [
    StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit v3 đã tích hợp sẵn Link và Underline.
        // Phải TẮT chúng ở đây trước khi dùng bản cấu hình riêng bên dưới,
        // nếu không Tiptap sẽ báo "Duplicate extension names".
        link: false,
        underline: false,
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false, autolink: true }),
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder: 'Nhập nội dung bài viết...' }),
];

const ToolBtn = ({ onClick, active, title, children, disabled }) => (
    <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={`w-7 h-7 flex items-center justify-center rounded text-sm transition
            ${active ? 'bg-primary-700 text-white' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5" />;

/**
 * NewsEditor
 * - initialContent: HTML string truyền vào lúc mount (không đồng bộ sau này)
 * - onChange: callback khi nội dung thay đổi
 * - Dùng key từ component cha để force remount khi cần load content mới
 */
export default function NewsEditor({ initialContent, onChange }) {
    const editor = useEditor({
        extensions: EDITOR_EXTENSIONS,
        content: initialContent || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const handleInsertImage = useCallback(async () => {
        if (!editor) return;
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
                editor.chain().focus().setImage({ src: url }).run();
            } catch {
                toast.error('Không thể upload ảnh vào nội dung');
            }
        };
        input.click();
    }, [editor]);

    const handleSetLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href;
        const url = window.prompt('Nhập URL:', prev || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary-600 transition bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                <ToolBtn title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={13} /></ToolBtn>
                <ToolBtn title="Làm lại" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={13} /></ToolBtn>
                <Divider />
                <ToolBtn title="T1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={13} /></ToolBtn>
                <ToolBtn title="T2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={13} /></ToolBtn>
                <ToolBtn title="T3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={13} /></ToolBtn>
                <Divider />
                <ToolBtn title="Đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></ToolBtn>
                <ToolBtn title="Nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></ToolBtn>
                <ToolBtn title="Gạch chân" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></ToolBtn>
                <Divider />
                <ToolBtn title="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={13} /></ToolBtn>
                <ToolBtn title="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={13} /></ToolBtn>
                <ToolBtn title="Căn phải" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={13} /></ToolBtn>
                <Divider />
                <ToolBtn title="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></ToolBtn>
                <ToolBtn title="Ảnh" onClick={handleInsertImage}><ImageIcon size={13} /></ToolBtn>
                <ToolBtn title="Link" active={editor.isActive('link')} onClick={handleSetLink}><Link2 size={13} /></ToolBtn>
                <Divider />
                <ToolBtn title="Xóa định dạng" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <RemoveFormatting size={13} />
                </ToolBtn>
            </div>

            {/* Vùng soạn thảo */}
            <div className="min-h-[300px] cursor-text">
                <EditorContent editor={editor} className="outline-none" />
            </div>
        </div>
    );
}
