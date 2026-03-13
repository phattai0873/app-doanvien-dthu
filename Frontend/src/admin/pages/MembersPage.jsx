import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { memberApi } from '../../services/api';
import { confirmDelete, confirmAction } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

function MemberModal({ member, onClose, onSave }) {
    const [form, setForm] = useState(member || { memberCode: '', fullName: '', dateOfBirth: '', gender: 'Nam', email: '', phoneNumber: '', permanentAddress: '', hometown: '', joinedDate: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{member ? 'Cập nhật Đoàn viên' : 'Thêm Đoàn viên mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mã đoàn viên *</label><input className={INPUT} value={form.memberCode} onChange={e => set('memberCode', e.target.value)} placeholder="DV001" /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Giới tính</label>
                            <select className={INPUT} value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="Nam">Nam</option><option value="Nu">Nữ</option><option value="Khac">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên *</label><input className={INPUT} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày sinh</label><input type="date" className={INPUT} value={form.dateOfBirth?.slice(0, 10) || ''} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày gia nhập</label><input type="date" className={INPUT} value={form.joinedDate?.slice(0, 10) || ''} onChange={e => set('joinedDate', e.target.value)} /></div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input className={INPUT} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@dthu.edu.vn" /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label><input className={INPUT} value={form.phoneNumber || ''} onChange={e => set('phoneNumber', e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quê quán</label><input className={INPUT} value={form.hometown || ''} onChange={e => set('hometown', e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Thường trú</label><input className={INPUT} value={form.permanentAddress || ''} onChange={e => set('permanentAddress', e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function MemberDetailModal({ member, onClose, onApprove, onReject }) {
    if (!member) return null;
    const isPending = member.status === 'pending';
    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">
                        {isPending ? 'Xét duyệt thông tin Đoàn viên' : 'Chi tiết thông tin Đoàn viên'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Họ và tên</strong><p className="font-semibold text-gray-800">{member.fullName}</p></div>
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Mã đoàn viên</strong><p className="font-mono text-primary-700">{member.memberCode}</p></div>
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Ngày sinh</strong><p>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</p></div>
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Giới tính</strong><p>{member.gender === 'Nu' ? 'Nữ' : member.gender || '—'}</p></div>
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Số điện thoại</strong><p>{member.phoneNumber || '—'}</p></div>
                        <div><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Email</strong><p>{member.email || '—'}</p></div>
                        <div className="col-span-2"><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Quê quán</strong><p>{member.hometown || '—'}</p></div>
                        <div className="col-span-2"><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Thường trú</strong><p>{member.permanentAddress || '—'}</p></div>
                        <div className="col-span-2"><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Ngày gia nhập</strong><p>{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('vi-VN') : '—'}</p></div>
                        <div className="col-span-2"><strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wide">Chi đoàn đang sinh hoạt</strong><p>{member.UnionCell?.name || '—'} {member.UnionBranch ? `- ${member.UnionBranch.name}` : ''}</p></div>
                        {member.Approver && (
                            <div className="col-span-2 flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                                <CheckCircle size={14} className="text-green-600" />
                                <span className="text-xs text-green-700">Đã được duyệt bởi <strong>{member.Approver.username}</strong></span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Đóng</button>
                    {isPending && (
                        <>
                            <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-lg transition" onClick={() => onReject(member)}>Từ chối</button>
                            <button className={BTN_PRIMARY} onClick={() => onApprove(member)}>Duyệt hồ sơ</button>
                        </>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
}

function Pagination({ pagination, page, setPage }) {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-end gap-2 px-5 py-4">
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white hover:border-primary-700 hover:text-primary-700'}`}>{p}</button>
            ))}
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
            <span className="text-xs text-gray-500 ml-1">Tổng: {pagination.total}</span>
        </div>
    );
}

export default function MembersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['members', search, page],
        queryFn: () => memberApi.getAll({ search, page, limit: 10 }),
        keepPreviousData: true,
    });

    const members = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: memberApi.create, onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã thêm đoàn viên!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => memberApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: memberApi.delete, onSuccess: () => { qc.invalidateQueries(['members']); toast.success('Đã xóa!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const approveMutation = useMutation({ mutationFn: memberApi.approve, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã duyệt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const rejectMutation = useMutation({ mutationFn: memberApi.reject, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã từ chối!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);
    
    const handleApprove = async (m) => {
        const result = await confirmAction('Duyệt đoàn viên', `Xác nhận duyệt thông tin đoàn viên "${m.fullName}"?`, 'Duyệt');
        if (result.isConfirmed) approveMutation.mutate(m.id);
    };
    
    const handleReject = async (m) => {
        const result = await confirmAction('Từ chối', `Từ chối thông tin đoàn viên "${m.fullName}"?`, 'Từ chối');
        if (result.isConfirmed) rejectMutation.mutate(m.id);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" placeholder="Tìm theo tên, mã, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Thêm đoàn viên</button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Danh sách Đoàn viên</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} đoàn viên</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">Chưa có đoàn viên nào</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 tracking-wide">
                                <th className="px-4 py-3 text-left">Mã ĐV</th><th className="px-4 py-3 text-left">Họ tên</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">SĐT</th><th className="px-4 py-3 text-left">Người duyệt</th><th className="px-4 py-3 text-left">Thao tác</th>
                            </tr></thead>
                            <tbody>
                                {members.map(m => (
                                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">{m.memberCode}</span></td>
                                        <td className="px-4 py-3 font-semibold">{m.fullName}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {m.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold">Chờ duyệt</span>}
                                            {(!m.status || m.status === 'approved') && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">Đã duyệt</span>}
                                            {m.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Từ chối</span>}
                                        </td>
                                        <td className="px-4 py-3">{m.phoneNumber || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {m.Approver?.username ? (
                                                <span className="font-semibold text-gray-700">{m.Approver.username}</span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 flex-wrap">
                                                {m.status === 'pending' && (
                                                    <button title="Xét duyệt hồ sơ" className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600`} onClick={() => setDetailModal(m)}>
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                {m.status !== 'pending' && (
                                                    <button title="Xem thông tin chi tiết" className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600`} onClick={() => setDetailModal(m)}>
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                <button title="Sửa thông tin" className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(m)}><Pencil size={16} /></button>
                                                <button title="Xóa" className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`} onClick={async () => {
                                                    const result = await confirmDelete(m.fullName);
                                                    if (result.isConfirmed) deleteMutation.mutate(m.id);
                                                }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <Pagination pagination={pagination} page={page} setPage={setPage} />
            </div>

            {modal && <MemberModal member={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {detailModal && <MemberDetailModal member={detailModal} onClose={() => setDetailModal(null)} onApprove={handleApprove} onReject={handleReject} />}
        </div>
    );
}
