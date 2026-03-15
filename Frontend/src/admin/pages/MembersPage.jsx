import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle, Eye, FilterX, UserPlus, Shield, History, UserCheck, Camera, Building2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { memberApi, positionApi } from '../../services/api';
import { confirmDelete, confirmAction } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const SELECT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition bg-white";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const ACTIVITY_STATUS = [
    { value: 'active', label: 'Đang sinh hoạt', color: 'bg-green-100 text-green-700' },
    { value: 'transferred', label: 'Đã điều chuyển', color: 'bg-blue-100 text-blue-700' },
    { value: 'graduated', label: 'Đã tốt nghiệp', color: 'bg-gray-100 text-gray-700' },
    { value: 'paused', label: 'Tạm dừng sinh hoạt', color: 'bg-orange-100 text-orange-700' },
];

const ROLES_IN_UNION = [
    { value: 'member', label: 'Đoàn viên' },
    { value: 'vice_secretary', label: 'Phó Bí thư' },
    { value: 'secretary', label: 'Bí thư' },
    { value: 'commissioner', label: 'Ủy viên' },
];

function MemberModal({ member, onClose, onSave }) {
    const [form, setForm] = useState(member || { 
        memberCode: '', fullName: '', dateOfBirth: '', gender: 'male', 
        email: '', phoneNumber: '', permanentAddress: '', hometown: '', 
        joinedDate: '', activityStatus: 'active', roleInUnion: 'member' 
    });
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
                            <select className={SELECT} value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="male">Nam</option><option value="female">Nữ</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên *</label><input className={INPUT} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" /></div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ Đoàn</label>
                            <select className={SELECT} value={form.roleInUnion} onChange={e => set('roleInUnion', e.target.value)}>
                                {ROLES_IN_UNION.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái sinh hoạt</label>
                            <select className={SELECT} value={form.activityStatus} onChange={e => set('activityStatus', e.target.value)}>
                                {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

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

function AppointmentModal({ member, positions, onClose, onAssign }) {
    const [form, setForm] = useState({ positionId: '', assignedDate: new Date().toISOString().split('T')[0] });
    
    // Tìm thông tin chức vụ đang chọn để lấy scopeLevel
    const selectedPos = positions.find(p => p.id === form.positionId);
    
    // Xác định tên đơn vị sẽ quản lý dựa trên scopeLevel
    const getTargetEntity = () => {
        if (!selectedPos) return null;
        if (selectedPos.scopeLevel === 'CELL') return { type: 'Chi đoàn', name: member.UnionCell?.name };
        if (selectedPos.scopeLevel === 'BRANCH') return { type: 'Liên chi đoàn', name: member.UnionCell?.UnionBranch?.name };
        return { type: 'Hệ thống', name: 'Toàn trường' };
    };

    const target = getTargetEntity();

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-primary-700" />
                        <h3 className="font-bold text-gray-800">Quyết định Bổ nhiệm</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    {/* Thông tin nhân sự */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-primary-700 border border-primary-100 shadow-sm">
                            {member.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Đoàn viên bổ nhiệm</p>
                            <p className="text-sm font-bold text-gray-800">{member.fullName}</p>
                        </div>
                    </div>

                    {/* Chọn chức vụ */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ bổ nhiệm *</label>
                        <select 
                            className={SELECT} 
                            value={form.positionId} 
                            onChange={e => setForm(f => ({ ...f, positionId: e.target.value }))}
                        >
                            <option value="">-- Chọn chức danh --</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Cấp {p.scopeLevel === 'CELL' ? 'Lớp' : p.scopeLevel === 'BRANCH' ? 'Khoa' : 'Trường'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Hiển thị phạm vi quản lý (QUAN TRỌNG) */}
                    {target && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="mt-0.5 bg-blue-600 text-white p-1 rounded-lg">
                                {selectedPos.scopeLevel === 'CELL' ? <BookOpen size={14} /> : <Building2 size={14} />}
                            </div>
                            <div>
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Phạm vi quản trị</p>
                                <p className="text-sm font-bold text-blue-900">
                                    {target.type}: <span className="underline decoration-blue-300">{target.name || 'Hệ thống'}</span>
                                </p>
                                <p className="mt-1 text-[10px] text-blue-500 italic font-medium leading-tight">
                                    * Sau khi bổ nhiệm, tài khoản sẽ có quyền Admin quản lý dữ liệu của {target.type} này.
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu nhiệm kỳ</label>
                        <input type="date" className={INPUT} value={form.assignedDate} onChange={e => setForm(f => ({ ...f, assignedDate: e.target.value }))} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy bỏ</button>
                    <button 
                        className={BTN_PRIMARY} 
                        disabled={!form.positionId} 
                        onClick={() => onAssign(form)}
                    >
                        Xác nhận Bổ nhiệm
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

function MemberDetailModal({ member, onClose, onApprove, onReject }) {
    if (!member) return null;
    const isPending = member.status === 'pending';
    const statusInfo = ACTIVITY_STATUS.find(s => s.value === member.activityStatus) || ACTIVITY_STATUS[0];
    const roleInfo = ROLES_IN_UNION.find(r => r.value === member.roleInUnion) || ROLES_IN_UNION[0];

    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${avatar}`;
    }

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="font-bold text-gray-800">
                        {isPending ? 'Xét duyệt thông tin Đoàn viên' : 'Hồ sơ Chi tiết Đoàn viên'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar & Basic */}
                        <div className="flex flex-col items-center gap-4 min-w-[160px]">
                            <div className="relative group">
                                {member.avatar ? (
                                    <img src={getAvatarUrl(member.avatar)} className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg ring-1 ring-gray-100" alt="" />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-700 font-black text-4xl border-4 border-white shadow-lg ring-1 ring-gray-100 uppercase">
                                        {member.fullName.charAt(0)}
                                    </div>
                                )}
                                {!isPending && (
                                    <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-md border border-gray-100 text-primary-700" title={roleInfo.label}>
                                        <Shield size={16} fill="currentColor" className="opacity-20" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                <h4 className="mt-2 text-lg font-bold text-gray-800 leading-tight">{member.fullName}</h4>
                                <p className="text-xs text-gray-400 font-mono mt-1 font-bold">{member.memberCode}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <UserCheck size={18} className="text-blue-600" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Chức vụ hiện tại</p>
                                        <p className="text-sm font-bold text-gray-800">{roleInfo.label}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <Shield size={18} className="text-orange-600" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Đơn vị sinh hoạt</p>
                                        <p className="text-sm font-bold text-gray-800">{member.UnionCell?.name || '—'} - {member.UnionCell?.UnionBranch?.name || '—'}</p>
                                    </div>
                                </div>
                                <div><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Ngày sinh</label><p className="text-sm text-gray-700">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</p></div>
                                <div><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Giới tính</label><p className="text-sm text-gray-700">{member.gender === 'female' ? 'Nữ' : 'Nam'}</p></div>
                                <div><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Số điện thoại</label><p className="text-sm text-gray-700 font-medium">{member.phoneNumber || '—'}</p></div>
                                <div><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Email</label><p className="text-sm text-gray-700 font-medium">{member.email || '—'}</p></div>
                                <div className="col-span-2"><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Quê quán</label><p className="text-sm text-gray-700">{member.hometown || '—'}</p></div>
                                <div className="col-span-2"><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Thường trú</label><p className="text-sm text-gray-700">{member.permanentAddress || '—'}</p></div>
                                <div className="col-span-2"><label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Ngày gia nhập Đoàn</label><p className="text-sm text-gray-700">{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('vi-VN') : '—'}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    {member.UnionMemberHistories?.length > 0 && (
                        <div className="mt-8">
                            <h5 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
                                <History size={16} className="text-primary-700" />
                                Lịch sử biến động
                            </h5>
                            <div className="space-y-3 border-l-2 border-gray-100 ml-2 pl-4">
                                {member.UnionMemberHistories.map(h => (
                                    <div key={h.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-primary-500" />
                                        <p className="text-[10px] text-gray-400 font-bold">{new Date(h.createdAt).toLocaleDateString('vi-VN')} {new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {h.type === 'transfer' ? 'Chuyển chi đoàn' : 
                                             h.type === 'role_change' ? 'Thay đổi chức vụ' : 
                                             h.type === 'status_change' ? 'Thay đổi trạng thái' : h.type}
                                        </p>
                                        {h.note && <p className="text-[11px] text-gray-500 italic mt-0.5">{h.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
                    <button className={BTN_SECONDARY} onClick={onClose}>Đóng hồ sơ</button>
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
    const [searchParams, setSearchParams] = useSearchParams();
    const unionCellId = searchParams.get('unionCellId') || '';
    
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [activityStatusFilter, setActivityStatusFilter] = useState('');
    const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [cellFilter, setCellFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [appointmentModal, setAppointmentModal] = useState(null);

    const { data: posRes } = useQuery({ queryKey: ['positions'], queryFn: positionApi.getAll });
    const positions = posRes?.data?.data || [];

    const { data: branchRes } = useQuery({ queryKey: ['branches-all'], queryFn: () => memberApi.getBranches() });
    const branchesAll = branchRes?.data?.data || [];

    const { data: cellsRes } = useQuery({ 
        queryKey: ['cells-by-branch', branchFilter], 
        queryFn: () => memberApi.getCells(branchFilter),
        enabled: !!branchFilter 
    });
    const cellsByBranch = cellsRes?.data?.data || [];

    const { data, isLoading } = useQuery({
        queryKey: ['members', search, page, unionCellId, roleFilter, activityStatusFilter, approvalStatusFilter, branchFilter, cellFilter],
        queryFn: () => memberApi.getAll({ 
            search, page, limit: 10, 
            unionCellId: cellFilter || unionCellId || undefined,
            roleInUnion: roleFilter || undefined,
            activityStatus: activityStatusFilter || undefined,
            status: approvalStatusFilter || undefined,
            unionBranchId: branchFilter || undefined
        }),
        keepPreviousData: true,
    });

    const members = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: memberApi.create, onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã thêm đoàn viên!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => memberApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: memberApi.delete, onSuccess: () => { qc.invalidateQueries(['members']); toast.success('Đã xóa!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const approveMutation = useMutation({ mutationFn: memberApi.approve, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã duyệt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const rejectMutation = useMutation({ mutationFn: memberApi.reject, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã từ chối!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const appointMutation = useMutation({ mutationFn: ({ id, data }) => memberApi.assignPosition(id, data), onSuccess: () => { qc.invalidateQueries(['members']); setAppointmentModal(null); toast.success('Bổ nhiệm thành công! Tài khoản đã được đồng bộ quyền Admin.'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);
    
    const handleApprove = async (m) => {
        const result = await confirmAction('Duyệt đoàn viên', `Xác nhận duyệt thông tin đoàn viên "${m.fullName}"?`, 'Duyệt');
        if (result.isConfirmed) approveMutation.mutate(m.id);
    };
    
    const handleReject = async (m) => {
        const result = await confirmAction('Từ chối', `Từ chối thông tin đoàn viên "${m.fullName}"?`, 'Từ chối');
        if (result.isConfirmed) rejectMutation.mutate(m.id);
    };

    const handleAppoint = (form) => {
        appointMutation.mutate({ id: appointmentModal.id, data: form });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3 flex-wrap items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition font-medium" placeholder="Tìm theo tên, mã, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setCellFilter(''); setPage(1); }}>
                    <option value="">Liên chi đoàn</option>
                    {branchesAll.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                
                {branchFilter && (
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={cellFilter} onChange={e => { setCellFilter(e.target.value); setPage(1); }}>
                        <option value="">Chi đoàn</option>
                        {cellsByBranch.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                    <option value="">Chức vụ</option>
                    {ROLES_IN_UNION.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={activityStatusFilter} onChange={e => { setActivityStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Trạng thái SH</option>
                    {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={approvalStatusFilter} onChange={e => { setApprovalStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Hồ sơ</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                </select>

                {unionCellId && (
                    <button 
                        className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 text-[11px] font-black uppercase rounded-lg border border-orange-100 hover:bg-orange-100 transition tracking-tighter"
                        onClick={() => setSearchParams({})}
                    >
                        <FilterX size={14} /> Xóa lọc Chi đoàn
                    </button>
                )}
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Thêm đoàn viên</button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                        <Shield size={16} className="text-primary-700" />
                        Danh sách Đoàn viên
                    </h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none flex items-center justify-center min-w-[40px] shadow-sm shadow-primary-200">{pagination.total || 0}</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm font-medium italic">Chưa có đoàn viên nào trong danh sách</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] ont-black uppercase text-gray-500 tracking-widest">
                                <th className="px-6 py-4 text-left">Hồ sơ</th><th className="px-6 py-4 text-left">Thông tin</th><th className="px-6 py-4 text-left">Chức vụ / Trạng thái</th><th className="px-6 py-4 text-left">Đơn vị</th><th className="px-6 py-4 text-left">Thao tác</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.map(m => {
                                    const statusObj = ACTIVITY_STATUS.find(s => s.value === (m.activityStatus || 'active')) || ACTIVITY_STATUS[0];
                                    const roleObj = ROLES_IN_UNION.find(r => r.value === (m.roleInUnion || 'member')) || ROLES_IN_UNION[0];
                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-black text-sm border border-primary-100 shadow-sm uppercase group-hover:scale-110 transition">
                                                        {m.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-mono text-[10px] font-black text-primary-700 uppercase tracking-tight">{m.memberCode}</p>
                                                        <p className="font-bold text-gray-800">{m.fullName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-600 font-medium">{m.email || '—'}</p>
                                                <p className="text-xs text-gray-400">{m.phoneNumber || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Shield size={12} className="text-primary-700 opacity-50" />
                                                        <span className="text-[11px] font-bold text-gray-700">{roleObj.label}</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit shadow-xs ${statusObj.color}`}>
                                                        {statusObj.label}
                                                    </span>
                                                    {m.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">Chờ duyệt hồ sơ</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[11px] font-bold text-gray-700">{m.UnionCell?.name || '—'}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{m.UnionCell?.UnionBranch?.name || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap min-w-[120px]">
                                                    {m.status === 'pending' ? (
                                                        <button title="Xét duyệt hồ sơ" className={`${BTN_ICON} bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 shadow-sm`} onClick={() => setDetailModal(m)}>
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button title="Xem chi tiết" className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm`} onClick={() => setDetailModal(m)}>
                                                                <Eye size={16} />
                                                            </button>
                                                            <button title="Bổ nhiệm chức vụ" className={`${BTN_ICON} bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100 shadow-sm`} onClick={() => setAppointmentModal(m)}>
                                                                <UserPlus size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button title="Sửa" className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`} onClick={() => setModal(m)}><Pencil size={16} /></button>
                                                    <button title="Xóa" className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`} onClick={async () => {
                                                        const result = await confirmDelete(m.fullName);
                                                        if (result.isConfirmed) deleteMutation.mutate(m.id);
                                                    }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <Pagination pagination={pagination} page={page} setPage={setPage} />
            </div>

            {modal && <MemberModal member={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {detailModal && <MemberDetailModal member={detailModal} onClose={() => setDetailModal(null)} onApprove={handleApprove} onReject={handleReject} />}
            {appointmentModal && <AppointmentModal member={appointmentModal} positions={positions} onClose={() => setAppointmentModal(null)} onAssign={handleAppoint} />}
        </div>
    );
}
