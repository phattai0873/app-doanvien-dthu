import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Newspaper, Tag } from 'lucide-react';
import { landingApi } from './services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const NewsDetail = ({ newsId, onBack }) => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const res = await landingApi.getNewsById(newsId);
        setNews(res.data.data);
      } catch (err) {
        console.error('Error loading news detail', err);
        setError('Không thể tải chi tiết tin tức. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    if (newsId) fetchNewsDetail();
  }, [newsId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 premium-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl animate-pulse">Đ</div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải nội dung...</p>
      </div>
    </div>
  );

  if (error || !news) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-5 px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
        <Newspaper size={28} className="text-red-300" />
      </div>
      <p className="text-gray-500 max-w-sm">{error || 'Tin tức không tồn tại hoặc đã bị xóa.'}</p>
      <button onClick={onBack}
        className="px-7 py-3 premium-gradient text-white rounded-full font-bold btn-glow transition active:scale-95 shadow-lg">
        Trở về trang chủ
      </button>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-white selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-700 transition active:scale-90 shrink-0">
            <ArrowLeft size={20} />
          </button>
          <p className="font-bold text-gray-800 line-clamp-1 flex-1 text-sm">Chi tiết tin tức</p>
          <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-base shrink-0">Đ</div>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-6">
        <article className="max-w-3xl mx-auto">

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(news.NewsCategory?.name || news.category?.name) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 premium-gradient text-white text-xs font-bold rounded-full shadow">
                <Tag size={11} /> {news.NewsCategory?.name || news.category?.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
              <Calendar size={11} /> {new Date(news.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.2] mb-6">
            {news.title}
          </h1>

          {/* Summary */}
          {news.summary && (
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed border-l-4 border-primary-600 pl-5 mb-8 italic">
              {news.summary}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-primary-600/50 via-primary-300/30 to-transparent mb-8" />

          {/* Banner / Thumbnail */}
          {(news.bannerUrl || news.thumbnailUrl) && (
            <figure className="mb-10 rounded-3xl overflow-hidden shadow-2xl shadow-primary-100 border border-gray-100">
              <img
                src={`${BASE_URL}${news.bannerUrl || news.thumbnailUrl}`}
                alt={news.title}
                className="w-full h-auto max-h-[60vh] object-cover"
              />
            </figure>
          )}

          {/* Body */}
          <div
            className="news-content text-lg text-gray-800"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {/* Back button bottom */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <button onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-2xl font-bold text-sm border border-gray-200 hover:border-primary-200 transition">
              <ArrowLeft size={16} /> Quay lại trang chủ
            </button>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-6 text-center text-xs">
        © 2026 App Đoàn Viên. Tất cả quyền được bảo lưu.
      </footer>
    </div>
  );
};

export default NewsDetail;
