import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { newsApi } from '../../services/api';
import BannerUpload from '../components/BannerUpload';
import NewsEditor from '../components/NewsEditor';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

export default function CreateNewsPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [form, setForm] = useState({
        title: '', summary: '', content: '', status: 'DRAFT', categoryId: '', level: 'SCHOOL'
    });
    const [bannerFile, setBannerFile] = useState(null);

    const { data: catData } = useQuery({
        queryKey: ['newsCategories'],
        queryFn: () => newsApi.getCategories()
    });
    const categoryList = catData?.data?.data || catData?.data || [];

    const createNews = useMutation({
        mutationFn: (fd) => newsApi.create(fd),
        onSuccess: () => {
            qc.invalidateQueries(['news']);
            toast.success('Đã tạo bài viết thành công!');
            navigate('/admin/news');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi khi tạo bài viết!')
    });

    const handleSubmit = () => {
        if (!form.title || !form.content) {
            return toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
        }

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== undefined && v !== null) fd.append(k, v);
        });
        if (bannerFile) fd.append('banner', bannerFile);

        createNews.mutate(fd);
    };

    return (
        <div className="max-w-10xl mx-auto space-y-4 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/news')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 text-base">Viết bài mới</h2>
                        <p className="text-xs text-gray-500">Tạo nội dung mới cho bảng tin</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className={BTN_SECONDARY} onClick={() => navigate('/admin/news')}>Hủy</button>
                    <button
                        className={BTN_PRIMARY}
                        onClick={handleSubmit}
                        disabled={createNews.isPending}
                    >
                        <Save size={16} />
                        {createNews.isPending ? 'Đang lưu...' : 'Lưu bài viết'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                            <input
                                className={`${INPUT} text-base font-medium`}
                                placeholder="Nhập tiêu đề hấp dẫn..."
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tóm tắt ngắn</label>
                            <textarea
                                className={INPUT}
                                rows={3}
                                placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                                value={form.summary}
                                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nội dung chi tiết <span className="text-red-500">*</span></label>
                            <NewsEditor
                                initialContent={form.content}
                                onChange={(html) => setForm(f => ({ ...f, content: html }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
                        <h3 className="font-bold text-sm text-gray-800 border-b pb-3">Cấu hình bài viết</h3>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ảnh đại diện (Banner)</label>
                            <BannerUpload
                                value={null}
                                file={bannerFile}
                                onChange={(file) => setBannerFile(file)}
                                onRemove={() => setBannerFile(null)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chuyên mục</label>
                            <select className={INPUT} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                <option value="">-- Chọn chuyên mục --</option>
                                {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phạm vi hiển thị</label>
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                {[
                                    { value: 'SCHOOL', label: 'Trường' },
                                    { value: 'BRANCH', label: 'Khoa' },
                                    { value: 'CELL', label: 'Lớp' }
                                ].map(s => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, level: s.value }))}
                                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-md transition ${form.level === s.value ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái xuất bản</label>
                            <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                <option value="DRAFT">Lưu nháp</option>
                                <option value="PUBLISHED">Đăng ngay</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
