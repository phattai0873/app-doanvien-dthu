import React, { useRef, useState } from 'react';
import { ImagePlus, X, Upload } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * BannerUpload – chọn & preview ảnh banner bài viết
 * Props:
 *   value: string | null  – URL ảnh hiện tại (từ server)
 *   file: File | null     – File mới được chọn
 *   onChange: (file) => void
 *   onRemove: () => void
 */
export default function BannerUpload({ value, file, onChange, onRemove }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    // Preview: ưu tiên file mới, sau đó URL từ server
    const previewSrc = file
        ? URL.createObjectURL(file)
        : value
            ? (value.startsWith('http') ? value : `${BASE_URL}${value}`)
            : null;

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type.startsWith('image/')) onChange(dropped);
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600">Ảnh Banner</label>

            {previewSrc ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 group">
                    <img
                        src={previewSrc}
                        alt="Banner preview"
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg shadow hover:bg-gray-50 transition"
                        >
                            <Upload size={13} /> Đổi ảnh
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg shadow hover:bg-red-600 transition"
                        >
                            <X size={13} /> Xóa
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer transition select-none
                        ${dragging
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
                >
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                        <ImagePlus size={20} className="text-primary-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                        {dragging ? 'Thả ảnh vào đây' : 'Kéo thả hoặc click để chọn ảnh'}
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP – tối đa 5MB</p>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChange(f);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
