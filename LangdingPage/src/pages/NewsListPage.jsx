import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Newspaper, Search, ChevronRight, ChevronLeft, Tag, Calendar, X } from 'lucide-react';
import { landingApi } from '../services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const PAGE_SIZE = 9;

const NewsListPage = ({ onBack, onSelectNews }) => {
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch categories
  useEffect(() => {
    landingApi.getNewsCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search)      params.search = search;
      if (selectedCat) params.categoryId = selectedCat;
      const res = await landingApi.getNews(params);
      const data = res.data;
      const items = data.data || [];
      setNewsList(items);
      const t = data.total ?? items.length;
      setTotal(t);
      setTotalPages((data.totalPages ?? Math.ceil(t / PAGE_SIZE)) || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCat]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); fetchNews(); }, [fetchNews]);

  const applySearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };
  const changeCat = (id) => { setSelectedCat(id); setPage(1); };

  return (
    <div className="min-h-screen font-sans bg-gray-50 selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-700 transition active:scale-90 shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center text-white font-black text-base">Đ</div>
            <span className="font-black text-lg text-gray-900 hidden sm:block">App <span className="text-gradient">Đoàn Viên</span></span>
          </div>
          <span className="text-sm font-semibold text-gray-500 hidden md:block">Tin tức & Sự kiện</span>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 animate-gradient-bg opacity-95" />
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute -bottom-1 left-0 right-0 wave-divider">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,20 C360,60 1080,0 1440,20 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center py-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 text-white rounded-full text-xs font-bold tracking-widest uppercase border border-white/25 mb-5">
            <Newspaper size={12} /> Bản tin Đoàn
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            Tin tức & Sự kiện
          </h1>
          <p className="text-primary-100 text-lg opacity-90 max-w-xl mx-auto">
            Cập nhật những hoạt động, sự kiện và tin tức mới nhất từ Liên chi đoàn.
          </p>

          {/* Search bar */}
          <form onSubmit={applySearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm tin tức..."
                className="w-full pl-11 pr-24 py-4 rounded-2xl border-2 border-white/30 bg-white/95 backdrop-blur-sm focus:border-primary-400 focus:bg-white outline-none text-gray-800 font-medium shadow-xl transition"
              />
              {searchInput && (
                <button type="button" onClick={clearSearch} className="absolute right-[5.5rem] text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="absolute right-2 px-4 py-2 premium-gradient text-white rounded-xl font-bold text-sm btn-glow transition">
                Tìm
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 -mt-2">
        {/* Categories filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => changeCat('')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${selectedCat === '' ? 'premium-gradient text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'}`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat._id || cat.id}
                onClick={() => changeCat(cat._id || cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${selectedCat === (cat._id || cat.id) ? 'premium-gradient text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">
              {search || selectedCat ? (
                <span>Kết quả tìm kiếm: <strong className="text-gray-800">{total}</strong> bài viết</span>
              ) : (
                <span>Tổng cộng <strong className="text-gray-800">{total}</strong> bài viết</span>
              )}
            </p>
            <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center">
              <Newspaper size={36} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Không có tin tức nào{search ? ` cho "${search}"` : ''}.</p>
            {search && <button onClick={clearSearch} className="text-primary-600 font-bold hover:underline">Xoá tìm kiếm</button>}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${search}-${selectedCat}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {newsList.map((item, i) => (
                <motion.div
                  key={item._id || item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => onSelectNews(item._id || item.id)}
                  className="news-card bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary-100/60 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-primary-50 relative">
                    {(item.bannerUrl || item.thumbnailUrl) ? (
                      <img
                        src={`${BASE_URL}${item.bannerUrl || item.thumbnailUrl}`}
                        alt={item.title}
                        className="news-img w-full h-full object-cover transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-200">
                        <Newspaper size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      {(item.NewsCategory?.name || item.category?.name) && (
                        <span className="px-2.5 py-1 premium-gradient text-white text-[10px] font-bold rounded-full shadow">
                          {item.NewsCategory?.name || item.category?.name}
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold rounded-full shadow flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{item.title}</h2>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">{item.summary}</p>
                    <div className="flex items-center gap-1.5 text-primary-600 text-sm font-bold group-hover:gap-3 transition-all mt-auto w-fit">
                      Đọc ngay <ChevronRight size={15} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold border transition ${p === page ? 'premium-gradient text-white border-transparent shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600'}`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-6 text-center text-xs border-t border-gray-800">
        © 2026 App Đoàn Viên. Tất cả quyền được bảo lưu.
      </footer>
    </div>
  );
};

export default NewsListPage;
