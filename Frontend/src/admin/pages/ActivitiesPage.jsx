import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

function ActivityModal({ activity, onClose, onSave }) {
    const [form, setForm] = useState(activity || { title: '', description: '', location: '', startDate: '', endDate: '', point: 0, isMandatory: false });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{activity ? 'Cập nhật Hoạt động' : 'Thêm Hoạt động mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tên hoạt động *</label><input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Hiến máu nhân đạo 2026" /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Địa điểm</label><input className={INPUT} value={form.location || ''} onChange={e => set('location', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu</label><input type="datetime-local" className={INPUT} value={form.startDate?.slice(0, 16) || ''} onChange={e => set('startDate', e.target.value)} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày kết thúc</label><input type="datetime-local" className={INPUT} value={form.endDate?.slice(0, 16) || ''} onChange={e => set('endDate', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Điểm rèn luyện</label><input type="number" className={INPUT} value={form.point} onChange={e => set('point', +e.target.value)} min={0} max={100} /></div>
                        <div className="flex items-end pb-2"><label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" className="w-4 h-4 accent-primary-700" checked={form.isMandatory} onChange={e => set('isMandatory', e.target.checked)} /><span>Bắt buộc</span></label></div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mô tả</label><textarea className={INPUT} rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function ActivitiesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);

    const { data, isLoading } = useQuery({ queryKey: ['activities', search, page], queryFn: () => activityApi.getAll({ search, page, limit: 10 }), keepPreviousData: true });
    const activities = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: activityApi.create, onSuccess: () => { qc.invalidateQueries(['activities']); setModal(null); toast.success('Đã thêm!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => activityApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['activities']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: activityApi.delete, onSuccess: () => { qc.invalidateQueries(['activities']); toast.success('Đã xóa!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm hoạt động..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Thêm hoạt động</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Danh sách Hoạt động</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} hoạt động</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : activities.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có hoạt động nào</div>
                            : <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-3 text-left">Tên hoạt động</th><th className="px-4 py-3 text-left">Địa điểm</th><th className="px-4 py-3 text-left">Ngày BĐ</th><th className="px-4 py-3 text-left">Điểm RL</th><th className="px-4 py-3 text-left">Loại</th><th className="px-4 py-3 text-left">Thao tác</th>
                                </tr></thead>
                                <tbody>
                                    {activities.map(a => (
                                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold">{a.title}</td>
                                            <td className="px-4 py-3 text-gray-500">{a.location || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{a.startDate ? new Date(a.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                            <td className="px-4 py-3"><span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"><Star size={10} />{a.point || 0}</span></td>
                                            <td className="px-4 py-3">{a.isMandatory ? <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">Bắt buộc</span> : <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">Tự nguyện</span>}</td>
                                            <td className="px-4 py-3"><div className="flex gap-2">
                                                <button className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(a)}><Pencil size={16} /></button>
                                                <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                    const result = await confirmDelete(a.title);
                                                    if (result.isConfirmed) deleteMutation.mutate(a.id);
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
            {modal && <ActivityModal activity={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
