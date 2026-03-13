import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingApi, cellApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const STATUS_CONFIG = {
    'Chưa diễn ra': { label: 'Chưa diễn ra', cls: 'bg-yellow-50 text-yellow-700' },
    'Đang diễn ra': { label: 'Đang diễn ra', cls: 'bg-blue-50 text-blue-700' },
    'Đã kết thúc': { label: 'Đã kết thúc', cls: 'bg-green-50 text-green-700' },
    'Đã hủy': { label: 'Đã hủy', cls: 'bg-red-50 text-red-700' },
};

function MeetingModal({ meeting, cells, onClose, onSave }) {
    const [form, setForm] = useState(meeting || {
        title: '', description: '', startTime: '', location: '', unionCellId: ''
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{meeting ? 'Cập nhật Sinh hoạt' : 'Tạo Sinh hoạt mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề *</label><input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Sinh hoạt Chi đoàn tháng 3" /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chi đoàn</label>
                        <select className={INPUT} value={form.unionCellId || ''} onChange={e => set('unionCellId', e.target.value)}>
                            <option value="">-- Chọn chi đoàn --</option>
                            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Thời gian *</label><input type="datetime-local" className={INPUT} value={form.startTime?.slice(0, 16) || ''} onChange={e => set('startTime', e.target.value)} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Địa điểm</label><input className={INPUT} value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="VD: Hội trường A" /></div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nội dung / Chương trình</label><textarea className={INPUT} rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function MeetingsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['meetings', search, page],
        queryFn: () => meetingApi.getAll({ search, page, limit: 10 }),
        keepPreviousData: true,
    });
    const { data: cellsData } = useQuery({ queryKey: ['cells-all'], queryFn: () => cellApi.getAll({}) });

    const meetings = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};
    const cells = cellsData?.data?.data || [];

    const createMutation = useMutation({ mutationFn: meetingApi.create, onSuccess: () => { qc.invalidateQueries(['meetings']); setModal(null); toast.success('Đã tạo sinh hoạt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => meetingApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['meetings']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: meetingApi.delete || ((id) => {}), onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã xóa!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const statusMutation = useMutation({ mutationFn: ({ id, status }) => meetingApi.updateStatus(id, status), onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã cập nhật trạng thái!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm sinh hoạt..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Tạo sinh hoạt</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Danh sách Sinh hoạt Chi đoàn</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} buổi</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : meetings.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có buổi sinh hoạt nào</div>
                            : <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-3 text-left">Tiêu đề</th><th className="px-4 py-3 text-left">Chi đoàn</th><th className="px-4 py-3 text-left">Thời gian</th><th className="px-4 py-3 text-left">Địa điểm</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">Thao tác</th>
                                </tr></thead>
                                <tbody>
                                    {meetings.map(m => {
                                        const st = STATUS_CONFIG[m.status] || { label: m.status, cls: 'bg-gray-100 text-gray-600' };
                                        return (
                                            <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 font-semibold">{m.title}</td>
                                                <td className="px-4 py-3 text-gray-500">{m.UnionCell?.name || '—'}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{m.startTime ? new Date(m.startTime).toLocaleString('vi-VN') : '—'}</td>
                                                <td className="px-4 py-3 text-gray-500">{m.location || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${st.cls}`}
                                                        value={m.status || 'Chưa diễn ra'}
                                                        onChange={e => statusMutation.mutate({ id: m.id, status: e.target.value })}
                                                    >
                                                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3"><div className="flex gap-2">
                                                    <button className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(m)}><Pencil size={16} /></button>
                                                    <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                        const result = await confirmDelete(m.title);
                                                        if (result.isConfirmed) deleteMutation.mutate(m.id);
                                                    }}><Trash2 size={16} /></button>
                                                </div></td>
                                            </tr>
                                        );
                                    })}
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
            {modal && <MeetingModal meeting={modal === 'add' ? null : modal} cells={cells} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
