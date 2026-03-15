import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Newspaper, Calendar, User, Tag, Globe } from 'lucide-react';
import { newsApi } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function NewsDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['news', id],
        queryFn: () => newsApi.getById(id),
        enabled: !!id
    });

    const news = response?.data?.data || response?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner" />
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>Không tìm thấy bài viết hoặc có lỗi xảy ra.</p>
                <button
                    onClick={() => navigate('/admin/news')}
                    className="mt-4 text-primary-700 font-semibold hover:underline"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-10xl mx-auto space-y-6 pb-12">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/news')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                    title="Quay lại"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">Chi tiết bài viết</h1>
                    <p className="text-sm text-gray-500 font-medium">Xem nội dung bài viết đã đăng</p>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Banner */}
                {news.bannerUrl ? (
                    <div className="w-full h-80 relative">
                        <img
                            src={`${BASE_URL}${news.bannerUrl}`}
                            alt="Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 left-8 right-8 text-white">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${news.scope === 'Tỉnh' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                {news.scope || 'Trường'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300">
                        <Newspaper size={48} />
                    </div>
                )}

                <div className="p-8 space-y-8">
                    {/* Meta segments */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-gray-500 border-b border-gray-100 pb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>Ngày đăng: {new Date(news.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span>Tác giả: <span className="font-semibold text-gray-700">{news.User?.username || '—'}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-gray-400" />
                            <span>Chuyên mục: <span className="font-semibold text-primary-700">{news.NewsCategory?.name || '—'}</span></span>
                        </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">
                            {news.title}
                        </h2>
                        {news.summary && (
                            <div className="p-4 bg-primary-50 rounded-xl border-l-4 border-primary-500">
                                <p className="text-gray-700 text-base italic leading-relaxed">
                                    "{news.summary}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="prose prose-primary max-w-none text-gray-800 leading-loose">
                        <div
                            dangerouslySetInnerHTML={{ __html: news.content }}
                            className="rich-text-content"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="flex justify-between items-center py-4 px-2">
                <button
                    onClick={() => navigate('/admin/news')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-semibold transition"
                >
                    <ArrowLeft size={16} /> Quay về danh sách
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/admin/news/edit/${news.id}`)}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-amber-200"
                    >
                        Chỉnh sửa bài viết
                    </button>
                </div>
            </div>
        </div>
    );
}
