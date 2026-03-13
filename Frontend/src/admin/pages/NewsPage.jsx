import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Trash2, CheckCircle, Clock, Edit2,
    Newspaper, Tag, X, ChevronLeft, ChevronRight,
    ToggleLeft, ToggleRight, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsApi } from '../../services/api';
import BannerUpload from '../components/BannerUpload';
import NewsEditor from '../components/NewsEditor';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ─── Trạng thái bài viết ─────────────────────────────────
const StatusBadge = ({ status }) =>
    status === 'Đã đăng'
        ? <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><CheckCircle size={10} />Đã đăng</span>
        : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full"><Clock size={10} />Nháp</span>;

// ─── Form mặc định bài viết ───────────────────────────────
const defaultNewsForm = () => ({
    title: '', summary: '', content: '', status: 'Nháp', categoryId: '', scope: 'Trường'
});

// ─────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';

export default function NewsPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [tab, setTab] = useState('news'); // 'news' | 'categories'

    // ── State bài viết ──────────────────────────────────
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [scopeFilter, setScopeFilter] = useState('');
    const [modal, setModal] = useState(null); // Chỉ dùng cho 'view'

    // Form state dự phòng cho modal view
    const [form, setForm] = useState(defaultNewsForm());

    // ── State chuyên mục ────────────────────────────────
    const [catModal, setCatModal] = useState(null); // null | 'add' | 'edit'
    const [catForm, setCatForm] = useState({ name: '', description: '', isActive: true });
    const [catEditId, setCatEditId] = useState(null);

    // ─── Queries ─────────────────────────────────────────
    const { data: newsData, isLoading: newsLoading } = useQuery({
        queryKey: ['news', search, page, statusFilter, categoryFilter, scopeFilter],
        queryFn: () => newsApi.getAll({ search, page, limit: 10, status: statusFilter, categoryId: categoryFilter, scope: scopeFilter }),
        keepPreviousData: true
    });
    const newsList = newsData?.data?.data || [];
    const pagination = newsData?.data?.pagination || {};

    const { data: catData, isLoading: catLoading } = useQuery({
        queryKey: ['newsCategories'],
        queryFn: () => newsApi.getCategories()
    });
    const categoryList = catData?.data?.data || catData?.data || [];

    // ─── Mutations bài viết ───────────────────────────────
    const publishNews = useMutation({
        mutationFn: newsApi.publish,
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã đăng bài!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const unpublishNews = useMutation({
        mutationFn: newsApi.unpublish,
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã thu hồi bài!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const deleteNews = useMutation({
        mutationFn: newsApi.delete,
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã xóa bài!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    // ─── Mutations chuyên mục ─────────────────────────────
    const createCat = useMutation({
        mutationFn: () => newsApi.createCategory(catForm),
        onSuccess: () => { qc.invalidateQueries(['newsCategories']); closeCatModal(); toast.success('Đã tạo chuyên mục!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const updateCat = useMutation({
        mutationFn: () => newsApi.updateCategory(catEditId, catForm),
        onSuccess: () => { qc.invalidateQueries(['newsCategories']); closeCatModal(); toast.success('Đã cập nhật chuyên mục!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const deleteCat = useMutation({
        mutationFn: newsApi.deleteCategory,
        onSuccess: () => { qc.invalidateQueries(['newsCategories']); toast.success('Đã xóa chuyên mục!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    // ─── Helpers ─────────────────────────────────────────
    const openAddNews = () => navigate('/admin/news/create');
    const openEditNews = (n) => navigate(`/admin/news/edit/${n.id}`);
    const openViewNews = (n) => { setForm({ ...n }); setModal('view'); };
    const closeNewsModal = () => { setModal(null); };

    const openAddCat = () => { setCatForm({ name: '', description: '', isActive: true }); setCatEditId(null); setCatModal('add'); };
    const openEditCat = (c) => { setCatForm({ name: c.name, description: c.description || '', isActive: c.isActive }); setCatEditId(c.id); setCatModal('edit'); };
    const closeCatModal = () => { setCatModal(null); setCatEditId(null); };

    // ─── Render: Tab điều hướng ───────────────────────────
    const TabBtn = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition
                ${tab === id ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="space-y-4">
            {/* ── Tabs ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 px-2">
                    <TabBtn id="news" icon={Newspaper} label="Bài viết" />
                    <TabBtn id="categories" icon={Tag} label="Chuyên mục" />
                </div>

                {/* ═══ TAB BÀI VIẾT ════════════════════════════════ */}
                {tab === 'news' && (
                    <div>
                        {/* Toolbar */}
                        <div className="flex gap-3 flex-wrap items-center px-5 py-4 border-b border-gray-100">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-primary-700 transition"
                                    placeholder="Tìm tiêu đề..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <select
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="Nháp">Bản nháp</option>
                                <option value="Đã đăng">Đã đăng</option>
                            </select>
                            <select
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                <option value="">Tất cả chuyên mục</option>
                                {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium text-primary-700 bg-primary-50 border-primary-100"
                                value={scopeFilter}
                                onChange={e => setScopeFilter(e.target.value)}
                            >
                                <option value="">Tất cả phạm vi</option>
                                <option value="Tỉnh">Cấp Tỉnh</option>
                                <option value="Trường">Cấp Trường</option>
                            </select>
                            <button className={BTN_PRIMARY} onClick={openAddNews}>
                                <Plus size={16} /> Viết bài mới
                            </button>
                        </div>

                        {/* Bảng */}
                        <div className="flex items-center justify-between px-5 py-3">
                            <span className="text-xs font-semibold text-gray-500">{pagination.total || 0} bài viết</span>
                        </div>
                        <div className="overflow-x-auto">
                            {newsLoading
                                ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                                : newsList.length === 0
                                    ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có bài viết nào</div>
                                    : <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                                <th className="px-4 py-3 text-left">Banner</th>
                                                <th className="px-4 py-3 text-left">Tiêu đề</th>
                                                <th className="px-4 py-3 text-left">Phạm vi</th>
                                                <th className="px-4 py-3 text-left">Chuyên mục</th>
                                                <th className="px-4 py-3 text-left">Tác giả</th>
                                                <th className="px-4 py-3 text-left">Trạng thái</th>
                                                <th className="px-4 py-3 text-left">Ngày tạo</th>
                                                <th className="px-4 py-3 text-left">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {newsList.map(n => (
                                                <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-2">
                                                        {n.bannerUrl
                                                            ? <img src={`${BASE_URL}${n.bannerUrl}`} alt="banner" className="w-14 h-10 object-cover rounded-lg border border-gray-200" />
                                                            : <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><Newspaper size={16} /></div>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold max-w-xs truncate" title={n.title}>{n.title}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.scope === 'Tỉnh' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {n.scope || 'Trường'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{n.NewsCategory?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{n.User?.username || '—'}</td>
                                                    <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                title="Xem"
                                                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                                                onClick={() => openViewNews(n)}
                                                            ><Eye size={16} /></button>
                                                            <button
                                                                title="Sửa"
                                                                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                                                onClick={() => openEditNews(n)}
                                                            ><Edit2 size={16} /></button>
                                                            {n.status !== 'Đã đăng'
                                                                ? <button className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition" onClick={() => { if (confirm('Đăng bài này?')) publishNews.mutate(n.id); }}>Đăng</button>
                                                                : <button className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-lg transition" onClick={() => { if (confirm('Thu hồi bài này về nháp?')) unpublishNews.mutate(n.id); }}>Thu hồi</button>
                                                            }
                                                            <button
                                                                title="Xóa"
                                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                                                onClick={() => { if (confirm('Bạn có chắc muốn xóa bài viết này?')) deleteNews.mutate(n.id); }}
                                                            ><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            }
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                                <button className="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}><ChevronLeft size={16} /></button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white'}`}>{p}</button>
                                ))}
                                <button className="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB CHUYÊN MỤC ══════════════════════════════ */}
                {tab === 'categories' && (
                    <div>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500">{categoryList.length} chuyên mục</span>
                            <button className={BTN_PRIMARY} onClick={openAddCat}><Plus size={16} /> Thêm chuyên mục</button>
                        </div>
                        <div className="overflow-x-auto">
                            {catLoading
                                ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                                : categoryList.length === 0
                                    ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có chuyên mục nào</div>
                                    : <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                                <th className="px-4 py-3 text-left">Tên chuyên mục</th>
                                                <th className="px-4 py-3 text-left">Slug</th>
                                                <th className="px-4 py-3 text-left">Mô tả</th>
                                                <th className="px-4 py-3 text-left">Trạng thái</th>
                                                <th className="px-4 py-3 text-left">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryList.map(c => (
                                                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.slug || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{c.description || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {c.isActive
                                                            ? <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><ToggleRight size={11} />Hoạt động</span>
                                                            : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full"><ToggleLeft size={11} />Ẩn</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <button className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition" onClick={() => openEditCat(c)}><Edit2 size={16} /></button>
                                                            <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" onClick={() => { if (confirm(`Xóa chuyên mục "${c.name}"?`)) deleteCat.mutate(c.id); }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════
                MODAL: Thêm / Sửa / Xem bài viết
                ═══════════════════════════════════════════════════ */}
            {modal && (
                <ModalPortal onClose={closeNewsModal} overlayClassName="items-start overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-base">Xem bài viết</h3>
                            <button onClick={closeNewsModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {form.bannerUrl && (
                                <img src={`${BASE_URL}${form.bannerUrl}`} alt="banner" className="w-full h-56 object-cover rounded-xl border border-gray-200" />
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{form.title}</h2>
                                {form.summary && <p className="text-gray-500 text-sm mt-1">{form.summary}</p>}
                            </div>
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                            <div className="flex justify-end pt-2">
                                <button className={BTN_SECONDARY} onClick={closeNewsModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ═══════════════════════════════════════════════════
                MODAL: Thêm / Sửa chuyên mục
                ═══════════════════════════════════════════════════ */}
            {catModal && (
                <ModalPortal onClose={closeCatModal}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">{catModal === 'add' ? 'Thêm chuyên mục' : 'Sửa chuyên mục'}</h3>
                            <button onClick={closeCatModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tên chuyên mục <span className="text-red-500">*</span></label>
                                <input className={INPUT} placeholder="VD: Tin hoạt động, Thông báo..." value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mô tả</label>
                                <textarea className={INPUT} rows={2} placeholder="Mô tả ngắn về chuyên mục..." value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-semibold text-gray-600">Hiển thị</label>
                                <button
                                    type="button"
                                    onClick={() => setCatForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${catForm.isActive ? 'bg-primary-700' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${catForm.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-xs text-gray-500">{catForm.isActive ? 'Đang hoạt động' : 'Đang ẩn'}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                            <button className={BTN_SECONDARY} onClick={closeCatModal}>Hủy</button>
                            <button
                                className={BTN_PRIMARY}
                                disabled={!catForm.name || createCat.isPending || updateCat.isPending}
                                onClick={() => catModal === 'add' ? createCat.mutate() : updateCat.mutate()}
                            >
                                {(createCat.isPending || updateCat.isPending) ? 'Đang lưu...' : catModal === 'add' ? 'Tạo chuyên mục' : 'Cập nhật'}
                            </button>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
