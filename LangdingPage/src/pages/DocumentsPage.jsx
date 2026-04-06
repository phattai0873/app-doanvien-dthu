import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Search, ChevronRight, ChevronLeft, Download, X, Calendar } from 'lucide-react';
import { landingApi } from '../services/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const PAGE_SIZE = 12;

const ext_colors = {
  pdf:  { bg: 'bg-red-50',    text: 'text-red-600',    label: 'PDF' },
  doc:  { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'DOC' },
  docx: { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'DOCX' },
  xls:  { bg: 'bg-emerald-50',text: 'text-emerald-600',label: 'XLS' },
  xlsx: { bg: 'bg-emerald-50',text: 'text-emerald-600',label: 'XLSX' },
  ppt:  { bg: 'bg-orange-50', text: 'text-orange-600', label: 'PPT' },
  pptx: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'PPTX' },
  zip:  { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'ZIP' },
};
const getExt = (filePath = '') => {
  // filePath có dạng: /uploads/documents/filename-uuid.pdf
  const parts = filePath.split('.');
  const e = parts.length > 1 ? parts.pop().toLowerCase().split('?')[0] : '';
  return ext_colors[e] || { bg: 'bg-gray-100', text: 'text-gray-600', label: e ? e.toUpperCase() : 'FILE' };
};

const DocumentsPage = ({ onBack }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState({});

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      const res = await landingApi.getDocuments(params);
      const data = res.data;
      const items = data.data || [];
      setDocs(items);
      const t = data.total ?? items.length;
      setTotal(t);
      setTotalPages((data.totalPages ?? Math.ceil(t / PAGE_SIZE)) || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); fetchDocs(); }, [fetchDocs]);

  const applySearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };

  const handleDownload = (fileUrl, title) => {
    // Mở URL trực tiếp trong tab mới — backend đã serve file tĩnh tại /uploads/*
    // Trình duyệt sẽ tự download nếu Content-Disposition: attachment
    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
          <span className="text-sm font-semibold text-gray-500 hidden md:block">Tài liệu & Văn bản</span>
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
            <FileText size={12} /> Kho tài liệu số
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            Tài liệu & Văn bản
          </h1>
          <p className="text-primary-100 text-lg opacity-90 max-w-xl mx-auto">
            Toàn bộ văn bản chỉ đạo, hướng dẫn và tài liệu Đoàn được số hóa, dễ dàng tìm kiếm và tải về.
          </p>

          {/* Search bar */}
          <form onSubmit={applySearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm tài liệu..."
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
        {/* Result count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">
              {search ? (
                <span>Kết quả: <strong className="text-gray-800">{total}</strong> tài liệu cho &ldquo;{search}&rdquo;</span>
              ) : (
                <span>Tổng cộng <strong className="text-gray-800">{total}</strong> tài liệu</span>
              )}
            </p>
            <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded-full mb-2" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center">
              <FileText size={36} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Không tìm thấy tài liệu nào{search ? ` cho "${search}"` : ''}.</p>
            {search && <button onClick={clearSearch} className="text-primary-600 font-bold hover:underline">Xoá tìm kiếm</button>}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${search}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {docs.map((doc, i) => {
                // Backend trả về field 'filePath', không phải 'fileUrl'
                const rawPath = doc.filePath || doc.fileUrl || '';
                const fileUrl = rawPath.startsWith('http') ? rawPath : `${BASE_URL}${rawPath}`;
                const extInfo = getExt(rawPath);
                const isLoading = downloading[fileUrl];
                return (
                  <motion.div
                    key={doc._id || doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative"
                  >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 premium-gradient" />

                    <div className="p-6 flex-1 flex flex-col pt-7">
                      {/* Icon + ext badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0">
                          <FileText size={22} className="text-white" />
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${extInfo.bg} ${extInfo.text}`}>
                          {extInfo.label}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-3 flex-1 group-hover:text-primary-700 transition-colors">
                        {doc.title}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 mb-5">
                        <Calendar size={11} />
                        {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </div>

                      <button
                        onClick={() => handleDownload(fileUrl, doc.title)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white rounded-xl font-bold text-sm border border-primary-100 hover:border-transparent transition-all duration-200 group-hover:shadow-md"
                      >
                        <Download size={15} />
                        Tải tài liệu
                      </button>
                    </div>
                  </motion.div>
                );
              })}
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

export default DocumentsPage;
