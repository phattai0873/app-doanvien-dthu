import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Pencil, Trash2, FileText, Download, Upload, File, X, Tag, BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { documentApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

function DocumentModal({ doc, onClose, onSave }) {
    const [form, setForm] = useState(doc || {
        title: '', filePath: '', issuedDate: '', issuingAuthority: '', categoryId: '', status: 'PUBLISH'
    });
    const [file, setFile] = useState(null);
    const { data: catRes } = useQuery({ queryKey: ['doc-categories'], queryFn: documentApi.getCategories });
    const categories = catRes?.data?.data || [];

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        const formData = new FormData();
        Object.keys(form).forEach(k => {
            if (form[k]) formData.append(k, form[k]);
        });
        if (file) formData.append('file', file);
        onSave(formData);
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{doc ? 'Cập nhật Tài liệu' : 'Thêm Tài liệu mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 whitespace-nowrap"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề tài liệu *</label>
                        <input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Nghị quyết Đại hội XIII của Đảng" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Chuyên mục</label>
                            <select className={INPUT} value={form.categoryId || ''} onChange={e => set('categoryId', e.target.value)}>
                                <option value="">Chọn chuyên mục</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cơ quan ban hành</label>
                            <input className={INPUT} value={form.issuingAuthority || ''} onChange={e => set('issuingAuthority', e.target.value)} placeholder="VD: Trung ương Đảng" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tải tập tin tài liệu *</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-gray-50/50">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-primary-100 p-3 rounded-full text-primary-700 mb-2"><File size={24} /></div>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <button onClick={() => setFile(null)} className="mt-1 text-xs text-red-500 flex items-center gap-1"><X size={12} /> Gỡ bỏ</button>
                                    </div>
                                ) : doc?.filePath ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-green-100 p-3 rounded-full text-green-700 mb-2"><File size={24} /></div>
                                        <p className="text-xs text-gray-500 break-all mb-1">Hiện tại: {doc.filePath.split('/').pop()}</p>
                                        <label className="cursor-pointer text-xs text-primary-600 font-semibold hover:underline">
                                            Thay đổi file khác
                                            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp" />
                                        </label>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                                <span>Tải lên tập tin</span>
                                                <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp" />
                                            </label>
                                            <p className="pl-1">hoặc kéo thả vào đây</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, Word, Excel, Ảnh, ZIP tối đa 20MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái hiển thị</label>
                            <select className={INPUT} value={form.status || 'PUBLISH'} onChange={e => set('status', e.target.value)}>
                                <option value="PUBLISH">Công khai (Publish)</option>
                                <option value="PRIVATE">Riêng tư (Private)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày ban hành</label>
                            <input type="date" className={INPUT} value={form.issuedDate?.slice(0, 10) || ''} onChange={e => set('issuedDate', e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={handleSave} disabled={!form.title || (!file && !doc?.filePath)}>Lưu tài liệu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function CategoryModal({ category, onClose, onSave }) {
    const [form, setForm] = useState(category || { name: '', description: '' });
    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{category ? 'Sửa chuyên mục' : 'Thêm chuyên mục'}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên chuyên mục <span className="text-red-500">*</span></label>
                        <input className={INPUT} placeholder="VD: Văn bản pháp quy, Nghị quyết..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mô tả</label>
                        <textarea className={INPUT} rows={3} placeholder="Mô tả ngắn về chuyên mục..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} disabled={!form.name} onClick={() => onSave(form)}>Lưu chuyên mục</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function DocumentsPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const [tab, setTab] = useState('docs'); // 'docs' | 'categories'
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [catModal, setCatModal] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['documents', search, page, statusFilter, categoryFilter, showTrash],
        queryFn: () => documentApi.getAll({
            search, page, limit: 10,
            status: statusFilter || undefined,
            categoryId: categoryFilter || undefined,
            onlyDeleted: showTrash
        }),
        keepPreviousData: true,
    });

    const { data: catRes, isLoading: catLoading } = useQuery({
        queryKey: ['doc-categories', showTrash],
        queryFn: () => documentApi.getCategories({ onlyDeleted: showTrash })
    });
    const categories = catRes?.data?.data || [];

    const docs = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: documentApi.create, onSuccess: () => { qc.invalidateQueries(['documents']); setModal(null); toast.success('Đã thêm tài liệu!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => documentApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['documents']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: documentApi.delete, onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Đã chuyển tài liệu vào thùng rác!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const restoreMutation = useMutation({ mutationFn: documentApi.restore, onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Đã khôi phục tài liệu!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const forceDeleteMutation = useMutation({ mutationFn: documentApi.forceDelete, onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Đã xóa vĩnh viễn!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const toggleStatusMutation = useMutation({ mutationFn: documentApi.toggleStatus, onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Đã cập nhật trạng thái!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const createCatMutation = useMutation({ mutationFn: documentApi.createCategory, onSuccess: () => { qc.invalidateQueries(['doc-categories']); setCatModal(null); toast.success('Đã thêm chuyên mục!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateCatMutation = useMutation({ mutationFn: ({ id, data }) => documentApi.updateCategory(id, data), onSuccess: () => { qc.invalidateQueries(['doc-categories']); setCatModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteCatMutation = useMutation({ mutationFn: documentApi.deleteCategory, onSuccess: () => { qc.invalidateQueries(['doc-categories']); toast.success('Đã chuyển chuyên mục vào thùng rác!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const restoreCatMutation = useMutation({ mutationFn: documentApi.restoreCategory, onSuccess: () => { qc.invalidateQueries(['doc-categories']); toast.success('Đã khôi phục chuyên mục!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const forceDeleteCatMutation = useMutation({ mutationFn: documentApi.forceDeleteCategory, onSuccess: () => { qc.invalidateQueries(['doc-categories']); toast.success('Đã xóa vĩnh viễn chuyên mục!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (formData) => modal?.id ? updateMutation.mutate({ id: modal.id, data: formData }) : createMutation.mutate(formData);
    const handleSaveCategory = (formData) => catModal?.id ? updateCatMutation.mutate({ id: catModal.id, data: formData }) : createCatMutation.mutate(formData);

    const TabBtn = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-wider transition border-b-2
                ${tab === id ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div className="flex border-b border-gray-200 px-2">
                    <TabBtn id="docs" icon={BookOpen} label="Tài liệu" />
                    <TabBtn id="categories" icon={Tag} label="Mục tài liệu" />
                </div>
            </div>

            {tab === 'docs' ? (
                <>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm tài liệu..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">Tất cả</option>
                            <option value="PUBLISH">Công khai</option>
                            <option value="PRIVATE">Riêng tư</option>
                        </select>
                        <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                            <option value="">Tất cả chuyên mục</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {hasPermission('document:delete') && (
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
                        {!showTrash && (
                            <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Thêm tài liệu</button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{showTrash ? 'Thùng rác Tài liệu' : 'Kho Tài liệu'}</h2>
                            <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} tài liệu</span>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                                : docs.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có tài liệu nào</div>
                                    : <table className="w-full text-sm">
                                        <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                            <th className="px-4 py-3 text-left">Tiêu đề / Chuyên mục</th>
                                            <th className="px-4 py-3 text-left">Trạng thái</th>
                                            <th className="px-4 py-3 text-left">Cơ quan ban hành</th>
                                            <th className="px-4 py-3 text-left">Ngày ban hành</th>
                                            <th className="px-4 py-3 text-left">Thao tác</th>
                                        </tr></thead>
                                        <tbody>
                                            {docs.map(d => (
                                                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                                                                <span className="font-semibold">{d.title}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium ml-6 uppercase whitespace-nowrap">{d.DocumentCategory?.name || 'Chưa phân loại'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === '' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {d.status === 'PUBLISH' ? 'Công khai' : 'Riêng tư'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]">{d.issuingAuthority || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{d.issuedDate ? new Date(d.issuedDate).toLocaleDateString('vi-VN') : '—'}</td>
                                                    <td className="px-4 py-3"><div className="flex gap-2">
                                                        {!showTrash ? (
                                                            <>
                                                                <button
                                                                    className={`${BTN_ICON} ${d.status === 'PUBLISH' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                    onClick={() => toggleStatusMutation.mutate(d.id)}
                                                                    title={d.status === 'PUBLISH' ? 'Chuyển sang Riêng tư' : 'Chuyển sang Công khai'}
                                                                >
                                                                    {d.status === 'PUBLISH' ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                </button>
                                                                {d.filePath && <a href={d.filePath.startsWith('http') ? d.filePath : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${d.filePath}`} target="_blank" rel="noreferrer" download className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600`}><Download size={16} /></a>}
                                                                <button className={`${BTN_ICON} bg-amber-50 hover:bg-amber-100 text-amber-600`} onClick={() => setModal(d)}><Pencil size={16} /></button>
                                                                <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                                    const result = await confirmDelete(d.title);
                                                                    if (result.isConfirmed) deleteMutation.mutate(d.id);
                                                                }}><Trash2 size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmRestore(d.title);
                                                                        if (result.isConfirmed) restoreMutation.mutate(d.id);
                                                                    }}
                                                                    title="Khôi phục tài liệu"
                                                                ><RotateCcw size={16} /></button>
                                                                <button
                                                                    className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmForceDelete(d.title);
                                                                        if (result.isConfirmed) forceDeleteMutation.mutate(d.id);
                                                                    }}
                                                                    title="Xóa vĩnh viễn"
                                                                ><Trash2 size={16} /></button>
                                                            </>
                                                        )}
                                                    </div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>}
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                                <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}><ChevronLeft size={16} /></button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white hover:border-primary-700'}`}>{p}</button>
                                ))}
                                <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{showTrash ? 'Thùng rác Chuyên mục' : 'Quản lý Chuyên mục'}</h2>
                            {hasPermission('document:delete') && (
                                <button
                                    onClick={() => setShowTrash(!showTrash)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition border-2 
                                        ${showTrash
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <History size={14} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                                </button>
                            )}
                        </div>
                        {!showTrash && <button className={BTN_PRIMARY} onClick={() => setCatModal('add')}><Plus size={16} /> Thêm chuyên mục</button>}
                    </div>
                    <div className="overflow-x-auto">
                        {catLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                            : categories.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có chuyên mục nào</div>
                                : <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                        <th className="px-6 py-3 text-left">Tên chuyên mục</th>
                                        <th className="px-6 py-3 text-left">Mô tả</th>
                                        <th className="px-6 py-3 text-right">Thao tác</th>
                                    </tr></thead>
                                    <tbody>
                                        {categories.map(c => (
                                            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">{c.description || '—'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {!showTrash ? (
                                                            <>
                                                                <button className={`${BTN_ICON} bg-amber-50 hover:bg-amber-100 text-amber-600`} onClick={() => setCatModal(c)}><Pencil size={16} /></button>
                                                                <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                                    const result = await confirmDelete(c.name);
                                                                    if (result.isConfirmed) deleteCatMutation.mutate(c.id);
                                                                }}><Trash2 size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmRestore(c.name);
                                                                        if (result.isConfirmed) restoreCatMutation.mutate(c.id);
                                                                    }}
                                                                    title="Khôi phục chuyên mục"
                                                                ><RotateCcw size={16} /></button>
                                                                <button
                                                                    className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmForceDelete(c.name);
                                                                        if (result.isConfirmed) forceDeleteCatMutation.mutate(c.id);
                                                                    }}
                                                                    title="Xóa vĩnh viễn"
                                                                ><Trash2 size={16} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}
                    </div>
                </div>
            )}

            {modal && <DocumentModal doc={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {catModal && <CategoryModal category={catModal === 'add' ? null : catModal} onClose={() => setCatModal(null)} onSave={handleSaveCategory} />}
        </div>
    );
}
