import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
    ToggleLeft, ToggleRight, Eye, Heart, Share2,
    RotateCcw, History, Newspaper, Tag, Search, Clock, Plus, CheckCircle, Edit2, X, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { newsApi, branchApi, cellApi } from '../../services/api';
import BannerUpload from '../components/BannerUpload';
import NewsEditor from '../components/NewsEditor';
import ModalPortal from '../../components/ModalPortal';
import { useDirtyModal } from '../../hooks/useDirtyModal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

/**
 * Format số lượt xem (Rút gọn)
 * @param {number} views - Lượt xem
 * @returns {string} - Lượt xem đã được format (k, tr)
 */
const formatViews = (views) => {
    if (!views || views < 1000) return String(views || 0);
    if (views < 1000000) {
        const kValue = views / 1000;
        return (kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)).replace('.0', '') + 'k';
    }
    const trValue = views / 1000000;
    return (trValue % 1 === 0 ? trValue.toFixed(0) : trValue.toFixed(1)).replace('.0', '') + ' tr';
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ─── Trạng thái bài viết ─────────────────────────────────
const StatusBadge = ({ item }) => {
    const isPublished = item.status === 'PUBLISHED';
    const isScheduled = isPublished && new Date(item.publishedAt) > new Date();

    if (isScheduled) {
        return (
            <span className="inline-flex flex-col">
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 w-fit">
                    <Clock size={10} /> Hẹn giờ
                </span>
                <span className="text-[9px] text-gray-400 font-medium pl-1">
                    {new Date(item.publishedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
            </span>
        );
    }

    return isPublished
        ? <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full"><CheckCircle size={10} />Đã đăng</span>
        : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full"><Clock size={10} />Nháp</span>;
};

const SCOPE_LABELS = {
    'Trường': 'Cấp Trường',
    'Tỉnh': 'Cấp Tỉnh'
};

// ─── Form mặc định bài viết ───────────────────────────────
const defaultNewsForm = () => ({
    title: '', summary: '', content: '', status: 'DRAFT', categoryId: '', scope: 'Trường'
});

// ─────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';

export default function NewsPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { hasPermission, isSuperAdmin } = useAuth();
    const [tab, setTab] = useState('news'); // 'news' | 'categories'

    // ── State bài viết ──────────────────────────────────
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [scopeFilter, setScopeFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [cellFilter, setCellFilter] = useState('');
    
    const [form, setForm] = useState(defaultNewsForm());
    const [showTrash, setShowTrash] = useState(false);

    // ── State chuyên mục ────────────────────────────────
    const [catModal, setCatModal] = useState(null); // null | 'add' | 'edit'
    const [catForm, setCatForm] = useState({ name: '', description: '', isActive: true });
    const [catEditId, setCatEditId] = useState(null);

    const { handleAttemptClose: handleAttemptCloseCat } = useDirtyModal(catForm, () => setCatModal(null));

    // ─── Queries ─────────────────────────────────────────
    const { data: newsData, isLoading: newsLoading } = useQuery({
        queryKey: ['news', search, page, statusFilter, categoryFilter, scopeFilter, branchFilter, cellFilter, showTrash],
        queryFn: () => newsApi.getAll({ 
            search, page, limit: 10, 
            status: statusFilter || undefined, 
            categoryId: categoryFilter || undefined, 
            scope: scopeFilter || undefined,
            unionBranchId: branchFilter || undefined,
            unionCellId: cellFilter || undefined,
            onlyDeleted: showTrash
        }),
        keepPreviousData: true
    });
    const newsList = newsData?.data?.data || [];
    const pagination = newsData?.data?.pagination || {};

    const { data: catData, isLoading: catLoading } = useQuery({
        queryKey: ['newsCategories'],
        queryFn: () => newsApi.getCategories()
    });
    const categoryList = catData?.data?.data || catData?.data || [];

    const { data: branchesRes } = useQuery({
        queryKey: ['union-branches'],
        queryFn: () => branchApi.getAll({ limit: 100 }),
        enabled: isSuperAdmin
    });
    const branches = branchesRes?.data?.data || [];

    const { data: cellsRes } = useQuery({
        queryKey: ['union-cells', branchFilter],
        queryFn: () => cellApi.getAll({ unionBranchId: branchFilter, limit: 100 }),
        enabled: !!branchFilter
    });
    const cells = cellsRes?.data?.data || [];

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
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã chuyển bài vào thùng rác!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const restoreNews = useMutation({
        mutationFn: newsApi.restore,
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã khôi phục bài viết!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const forceDeleteNews = useMutation({
        mutationFn: newsApi.forceDelete,
        onSuccess: () => { qc.invalidateQueries(['news']); toast.success('Đã xóa vĩnh viễn!'); },
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
    const openViewNews = (n) => navigate(`/admin/news/view/${n.id}`);
    const closeNewsModal = () => { /* No longer needed for 'view' */ };

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
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">Trạng thái</option>
                                <option value="DRAFT">Bản nháp</option>
                                <option value="PUBLISHED">Đã đăng</option>
                            </select>
                            <select
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition"
                                value={categoryFilter}
                                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">Tất cả chuyên mục</option>
                                {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium text-primary-700 bg-primary-50 border-primary-100"
                                value={scopeFilter}
                                onChange={e => { setScopeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">Phạm vi</option>
                                <option value="Trường">Cấp Trường</option>
                                <option value="Tỉnh">Cấp Tỉnh</option>
                            </select>

                            {isSuperAdmin && (
                                <>
                                    <select
                                        className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white"
                                        value={branchFilter}
                                        onChange={e => { setBranchFilter(e.target.value); setCellFilter(''); setPage(1); }}
                                    >
                                        <option value="">Liên chi đoàn (Khoa)</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    {branchFilter && (
                                        <select
                                            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white"
                                            value={cellFilter}
                                            onChange={e => { setCellFilter(e.target.value); setPage(1); }}
                                        >
                                            <option value="">Chi đoàn (Lớp)</option>
                                            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                </>
                            )}

                            {hasPermission('news:delete') && (
                                <button 
                                    onClick={() => { setShowTrash(!showTrash); setPage(1); }}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border-2 
                                        ${showTrash 
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <History size={16} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                                </button>
                            )}

                            {!showTrash && hasPermission('news:create') && (
                                <button className={BTN_PRIMARY} onClick={openAddNews}>
                                    <Plus size={16} /> Viết bài mới
                                </button>
                            )}
                        </div>

                        {/* Bảng */}
                        <div className="flex items-center justify-between px-5 py-3">
                            <span className="text-xs font-semibold text-gray-500">
                                {showTrash ? 'Thùng rác: ' : ''}{pagination.total || 0} bài viết
                            </span>
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
                                                <th className="px-4 py-3 text-left">Lượt xem</th>
                                                <th className="px-4 py-3 text-left">Tương tác</th>
                                                <th className="px-4 py-3 text-left">Trạng thái</th>
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
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.scope === 'Trường' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {SCOPE_LABELS[n.scope] || n.scope}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{n.NewsCategory?.name || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                                                            <Eye size={12} /> {formatViews(n.viewsCount || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-1 text-[10px] text-pink-600 font-bold">
                                                                <Heart size={10} fill="currentColor" /> {n.likesCount || 0} tim
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                                                                <Share2 size={10} /> {n.sharesCount || 0} chia sẻ
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{showTrash ? <span className="text-[10px] text-red-500 font-bold">Đã xóa</span> : <StatusBadge item={n} />}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            {!showTrash ? (
                                                                <>
                                                                    <button
                                                                        title="Xem"
                                                                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                                                        onClick={() => openViewNews(n)}
                                                                    ><Eye size={16} /></button>
                                                                    
                                                                    {hasPermission('news:edit') && (
                                                                        <button
                                                                            title="Sửa"
                                                                            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                                                            onClick={() => openEditNews(n)}
                                                                        ><Edit2 size={16} /></button>
                                                                    )}

                                                                    {hasPermission('news:publish') && (
                                                                        n.status !== 'PUBLISHED'
                                                                            ? <button 
                                                                                className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition" 
                                                                                onClick={() => {
                                                                                    Swal.fire({
                                                                                        title: 'Xác nhận đăng bài?',
                                                                                        text: `Bạn có chắc muốn đăng bài viết "${n.title}"?`,
                                                                                        icon: 'question',
                                                                                        showCancelButton: true,
                                                                                        confirmButtonColor: '#15803d',
                                                                                        cancelButtonColor: '#6b7280',
                                                                                        confirmButtonText: 'Đăng ngay',
                                                                                        cancelButtonText: 'Hủy'
                                                                                    }).then((result) => {
                                                                                        if (result.isConfirmed) publishNews.mutate(n.id);
                                                                                    });
                                                                                }}
                                                                            >Đăng</button>
                                                                            : <button 
                                                                                className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-lg transition" 
                                                                                onClick={() => {
                                                                                    Swal.fire({
                                                                                        title: 'Thu hồi bài viết?',
                                                                                        text: 'Bài viết sẽ được chuyển về trạng thái bản nháp.',
                                                                                        icon: 'warning',
                                                                                        showCancelButton: true,
                                                                                        confirmButtonColor: '#ea580c',
                                                                                        cancelButtonColor: '#6b7280',
                                                                                        confirmButtonText: 'Thu hồi',
                                                                                        cancelButtonText: 'Hủy'
                                                                                    }).then((result) => {
                                                                                        if (result.isConfirmed) unpublishNews.mutate(n.id);
                                                                                    });
                                                                                }}
                                                                            >Thu hồi</button>
                                                                    )}

                                                                    {hasPermission('news:delete') && (
                                                                        <button
                                                                            title="Xóa"
                                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                                                            onClick={() => {
                                                                                Swal.fire({
                                                                                    title: 'Xóa bài viết?',
                                                                                    text: "Bài viết sẽ bị chuyển vào thùng rác.",
                                                                                    icon: 'warning',
                                                                                    showCancelButton: true,
                                                                                    confirmButtonColor: '#dc2626',
                                                                                    cancelButtonColor: '#6b7280',
                                                                                    confirmButtonText: 'Xóa vào thùng rác',
                                                                                    cancelButtonText: 'Hủy'
                                                                                }).then((result) => {
                                                                                    if (result.isConfirmed) deleteNews.mutate(n.id);
                                                                                });
                                                                            }}
                                                                        ><Trash2 size={16} /></button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        title="Khôi phục"
                                                                        className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                                                                        onClick={() => {
                                                                            Swal.fire({
                                                                                title: 'Khôi phục bài viết?',
                                                                                text: `Bài viết "${n.title}" sẽ quay trở lại danh sách bài viết.`,
                                                                                icon: 'question',
                                                                                showCancelButton: true,
                                                                                confirmButtonText: 'Khôi phục ngay',
                                                                                cancelButtonText: 'Hủy'
                                                                            }).then((result) => {
                                                                                if (result.isConfirmed) restoreNews.mutate(n.id);
                                                                            });
                                                                        }}
                                                                    ><RotateCcw size={16} /></button>
                                                                    <button
                                                                        title="Xóa vĩnh viễn"
                                                                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                                                        onClick={() => {
                                                                            Swal.fire({
                                                                                title: 'XÓA VĨNH VIỄN?',
                                                                                text: "HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC! Dữ liệu bài viết và tệp tin ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.",
                                                                                icon: 'error',
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: '#dc2626',
                                                                                confirmButtonText: 'XÓA VĨNH VIỄN',
                                                                                cancelButtonText: 'Hủy'
                                                                            }).then((result) => {
                                                                                if (result.isConfirmed) forceDeleteNews.mutate(n.id);
                                                                            });
                                                                        }}
                                                                    ><Trash2 size={16} /></button>
                                                                </>
                                                            )}
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
                            {hasPermission('category:write') && (
                                <button className={BTN_PRIMARY} onClick={openAddCat}><Plus size={16} /> Thêm chuyên mục</button>
                            )}
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
                                                            <button 
                                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" 
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: 'Xóa chuyên mục?',
                                                                        text: `Bạn có chắc muốn xóa chuyên mục "${c.name}"? Các bài viết thuộc chuyên mục này sẽ bị ảnh hưởng.`,
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#dc2626',
                                                                        cancelButtonColor: '#6b7280',
                                                                        confirmButtonText: 'Xóa ngay',
                                                                        cancelButtonText: 'Hủy'
                                                                    }).then((result) => {
                                                                        if (result.isConfirmed) deleteCat.mutate(c.id);
                                                                    });
                                                                }}
                                                            ><Trash2 size={16} /></button>
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
            {/* MODAL: Xem bài viết ĐÃ XÓA (Chuyển sang trang riêng) */}

            {/* ═══════════════════════════════════════════════════
                MODAL: Thêm / Sửa chuyên mục
                ═══════════════════════════════════════════════════ */}
            {catModal && (
                <ModalPortal onAttemptClose={handleAttemptCloseCat}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">{catModal === 'add' ? 'Thêm chuyên mục' : 'Sửa chuyên mục'}</h3>
                            <button onClick={handleAttemptCloseCat} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
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
                            <button className={BTN_SECONDARY} onClick={handleAttemptCloseCat}>Hủy</button>
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
