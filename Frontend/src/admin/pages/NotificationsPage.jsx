import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const PRIORITY_CONFIG = {
    'LOW': { label: 'Thấp', cls: 'bg-gray-100 text-gray-600' },
    'MEDIUM': { label: 'Trung bình', cls: 'bg-blue-50 text-blue-700' },
    'HIGH': { label: 'Cao', cls: 'bg-orange-50 text-orange-700' },
};
const STATUS_CONFIG = {
    'DRAFT': { label: 'Bản nháp', cls: 'bg-yellow-50 text-yellow-700' },
    'SENT': { label: 'Đã gửi', cls: 'bg-green-50 text-green-700' },
    'CANCELLED': { label: 'Đã hủy', cls: 'bg-red-50 text-red-700' },
};
const CATEGORY_LABELS = { 
    SYSTEM: 'Hệ thống', ACTIVITY: 'Hoạt động', MEETING: 'Cuộc họp', FEE: 'Đoàn phí', DOCUMENT: 'Văn bản' 
};

function NotificationModal({ notif, onClose, onSave }) {
    const [form, setForm] = useState(notif || {
        title: '', content: '', category: 'SYSTEM', targetType: 'ALL', targetId: '', priority: 'MEDIUM'
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const { data: branchesRes } = useQuery({ queryKey: ['branches'], queryFn: () => notificationApi.getBranches() });
    const { data: cellsRes } = useQuery({ 
        queryKey: ['cells', form.targetId], 
        queryFn: () => notificationApi.getCells(form.targetId),
        enabled: form.targetType === 'CELL' // This logic is slightly flawed for choosing cell, let's fix
    });
    
    // Logic fetch cells based on branch if needed, but for notification, we usually want to pick a cell directly 
    // or pick a branch. Let's assume we fetch all branches and all cells for selection.
    const branches = branchesRes?.data?.data || [];

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{notif ? 'Cập nhật Thông báo' : 'Tạo Thông báo mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tiêu đề *</label><input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Triệu tập họp Chi đoàn tháng 3" /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nội dung *</label><textarea className={INPUT} rows={4} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Nội dung chi tiết thông báo..." /></div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phân mục</label>
                            <select className={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
                                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Độ ưu tiên</label>
                            <select className={INPUT} value={form.priority} onChange={e => set('priority', e.target.value)}>
                                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Đối tượng nhận</label>
                            <select className={INPUT} value={form.targetType} onChange={e => { set('targetType', e.target.value); set('targetId', ''); }}>
                                <option value="ALL">Toàn trường</option>
                                <option value="BRANCH">Theo Khoa (Liên chi đoàn)</option>
                                <option value="CELL">Theo Lớp (Chi đoàn)</option>
                                <option value="INDIVIDUAL">Cá nhân (Mã ĐV)</option>
                            </select>
                        </div>
                        {form.targetType === 'BRANCH' && (
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chọn Khoa</label>
                                <select className={INPUT} value={form.targetId} onChange={e => set('targetId', e.target.value)}>
                                    <option value="">-- Chọn Khoa --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        )}
                        {(form.targetType === 'INDIVIDUAL' || form.targetType === 'CELL') && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    {form.targetType === 'CELL' ? 'ID Chi đoàn' : 'ID/Mã Đoàn viên'}
                                </label>
                                <input className={INPUT} value={form.targetId} onChange={e => set('targetId', e.target.value)} placeholder="Nhập ID/Mã..." />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

const TARGET_LABELS = { ALL: 'Tất cả', BRANCH: 'Liên chi đoàn', CELL: 'Chi đoàn', INDIVIDUAL: 'Cá nhân' };

export default function NotificationsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', search, filterStatus, page],
        queryFn: () => notificationApi.getAll({ search, status: filterStatus || undefined, page, limit: 10 }),
        keepPreviousData: true,
    });

    const notifs = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: notificationApi.create, onSuccess: () => { qc.invalidateQueries(['notifications']); setModal(null); toast.success('Đã tạo thông báo!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => notificationApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['notifications']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: notificationApi.delete, onSuccess: () => { qc.invalidateQueries(['notifications']); toast.success('Đã xóa!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const sendMutation = useMutation({
        mutationFn: notificationApi.send,
        onSuccess: () => { qc.invalidateQueries(['notifications']); toast.success('📣 Đã gửi thông báo thành công!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi khi gửi!')
    });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm thông báo..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Tạo thông báo</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Danh sách Thông báo</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} thông báo</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : notifs.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có thông báo nào</div>
                            : <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-3 text-left">Tiêu đề / Phân mục</th><th className="px-4 py-3 text-left">Đối tượng</th><th className="px-4 py-3 text-left">Ưu tiên</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">Thao tác</th>
                                </tr></thead>
                                <tbody>
                                    {notifs.map(n => {
                                        const isSent = n.status === 'Đã gửi';
                                        const st = STATUS_CONFIG[n.status] || { cls: 'bg-gray-100 text-gray-600' };
                                        const pr = PRIORITY_CONFIG[n.priority] || { cls: 'bg-gray-100 text-gray-600' };
                                        return (
                                            <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold">{n.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold text-primary-700 uppercase tracking-tight">{CATEGORY_LABELS[n.category] || n.category}</span>
                                                        <span className="text-gray-200">|</span>
                                                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{n.content}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">{TARGET_LABELS[n.targetType] || n.targetType}</span></td>
                                                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pr.cls}`}>{pr.label}</span></td>
                                                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span></td>
                                                <td className="px-4 py-3"><div className="flex gap-2">
                                                    <button
                                                        className={`${BTN_ICON} ${isSent ? 'opacity-40 cursor-not-allowed bg-green-50 text-green-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                                                        onClick={() => !isSent && sendMutation.mutate(n.id)}
                                                        disabled={isSent}
                                                        title={isSent ? 'Đã gửi' : 'Gửi thông báo'}
                                                    ><Send size={16} /></button>
                                                    <button className={`${BTN_ICON} ${isSent ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} onClick={() => !isSent && setModal(n)} disabled={isSent}><Pencil size={16} /></button>
                                                    <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                        const result = await confirmDelete(n.title);
                                                        if (result.isConfirmed) deleteMutation.mutate(n.id);
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
            {modal && <NotificationModal notif={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
