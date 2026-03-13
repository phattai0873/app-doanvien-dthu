import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, FileText, ExternalLink, Upload, File, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const FILE_TYPE_OPTIONS = ['pdf', 'docx', 'xlsx', 'pptx', 'other'];

function DocumentModal({ doc, onClose, onSave }) {
    const [form, setForm] = useState(doc || {
        title: '', filePath: '', fileType: 'pdf', issuedDate: '', issuingAuthority: '', categoryId: ''
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
                    <h3 className="font-bold text-gray-800">{doc ? 'Cập nhật Văn bản' : 'Thêm Văn bản mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề văn bản *</label>
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
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tải tập tin văn bản *</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-gray-50/50">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-primary-100 p-3 rounded-full text-primary-700 mb-2"><File size={24} /></div>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <button onClick={() => setFile(null)} className="mt-1 text-xs text-red-500 flex items-center gap-1"><X size={12}/> Gỡ bỏ</button>
                                    </div>
                                ) : doc?.filePath ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-green-100 p-3 rounded-full text-green-700 mb-2"><File size={24} /></div>
                                        <p className="text-xs text-gray-500 break-all mb-1">Hiện tại: {doc.filePath.split('/').pop()}</p>
                                        <label className="cursor-pointer text-xs text-primary-600 font-semibold hover:underline">
                                            Thay đổi file khác
                                            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                                        </label>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                                <span>Tải lên tập tin</span>
                                                <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                                            </label>
                                            <p className="pl-1">hoặc kéo thả vào đây</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, Word, Excel, ZIP tối đa 20MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Loại tập tin hiển thị</label>
                            <select className={INPUT} value={form.fileType || 'pdf'} onChange={e => set('fileType', e.target.value)}>
                                {FILE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
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
                    <button className={BTN_PRIMARY} onClick={handleSave} disabled={!form.title || (!file && !doc?.filePath)}>Lưu văn bản</button>
                </div>
            </div>
        </ModalPortal>
    );
}

const FILE_TYPE_COLORS = {
    pdf: 'bg-red-50 text-red-700',
    docx: 'bg-blue-50 text-blue-700',
    xlsx: 'bg-green-50 text-green-700',
    pptx: 'bg-orange-50 text-orange-700',
};

export default function DocumentsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['documents', search, page],
        queryFn: () => documentApi.getAll({ search, page, limit: 10 }),
        keepPreviousData: true,
    });

    const docs = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: documentApi.create, onSuccess: () => { qc.invalidateQueries(['documents']); setModal(null); toast.success('Đã thêm văn bản!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => documentApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['documents']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: documentApi.delete, onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Đã xóa văn bản!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm văn bản..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Thêm văn bản</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Kho Văn bản</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} văn bản</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : docs.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có văn bản nào</div>
                            : <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-3 text-left">Tiêu đề</th><th className="px-4 py-3 text-left">Loại</th><th className="px-4 py-3 text-left">Cơ quan ban hành</th><th className="px-4 py-3 text-left">Ngày ban hành</th><th className="px-4 py-3 text-left">Thao tác</th>
                                </tr></thead>
                                <tbody>
                                    {docs.map(d => (
                                        <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-gray-400 flex-shrink-0" />
                                                    <span className="font-semibold">{d.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${FILE_TYPE_COLORS[d.fileType] || 'bg-gray-100 text-gray-600'}`}>{d.fileType || 'file'}</span></td>
                                            <td className="px-4 py-3 text-gray-500">{d.issuingAuthority || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{d.issuedDate ? new Date(d.issuedDate).toLocaleDateString('vi-VN') : '—'}</td>
                                            <td className="px-4 py-3"><div className="flex gap-2">
                                                {d.filePath && <a href={d.filePath.startsWith('http') ? d.filePath : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${d.filePath}`} target="_blank" rel="noreferrer" className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600`}><ExternalLink size={16} /></a>}
                                                <button className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(d)}><Pencil size={16} /></button>
                                                <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                    const result = await confirmDelete(d.title);
                                                    if (result.isConfirmed) deleteMutation.mutate(d.id);
                                                }}><Trash2 size={16} /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>}
                </div>
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 px-5 py-4">
                        <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white hover:border-primary-700'}`}>{p}</button>
                        ))}
                        <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
                    </div>
                )}
            </div>
            {modal && <DocumentModal doc={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
