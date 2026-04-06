import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Pencil, Trash2, Network, User as UserIcon, Users, Filter, CheckCircle2, XCircle, Calendar, MapPin, GraduationCap, History, RotateCcw, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cellApi, branchApi, locationApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const SELECT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition bg-white";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const CELL_STATUS = [
    { value: 'active', label: 'Đang hoạt động', color: 'bg-green-100 text-green-700' },
    { value: 'graduated', label: 'Đã tốt nghiệp', color: 'bg-blue-100 text-blue-700' },
    { value: 'dissolved', label: 'Đã giải thể', color: 'bg-gray-100 text-gray-700' },
];

function CellModal({ cell, branches, locations, onClose, onSave }) {
    const [form, setForm] = useState(cell || { 
        code: '', name: '', unionBranchId: '', courseYear: '', academicYear: '', 
        status: 'active', establishedDate: '', defaultMeetingLocationId: '' 
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{cell ? 'Cập nhật Chi đoàn' : 'Thêm Chi đoàn mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Liên chi đoàn (Khoa) *</label>
                        <select className={SELECT} value={form.unionBranchId} onChange={e => set('unionBranchId', e.target.value)}>
                            <option value="">-- Chọn Liên chi đoàn --</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Mã Chi đoàn *</label>
                            <input className={INPUT} value={form.code} onChange={e => set('code', e.target.value)} placeholder="VD: CD-CNTT20A" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Khóa (VD: K20)</label>
                            <input className={INPUT} value={form.courseYear} onChange={e => set('courseYear', e.target.value)} placeholder="K20" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Chi đoàn *</label>
                        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Chi đoàn Kỹ thuật phần mềm 20A" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Niên khóa (VD: 2020-2024)</label>
                            <input className={INPUT} value={form.academicYear} onChange={e => set('academicYear', e.target.value)} placeholder="2020-2024" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
                            <select className={SELECT} value={form.status} onChange={e => set('status', e.target.value)}>
                                {CELL_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày thành lập</label>
                            <input type="date" className={INPUT} value={form.establishedDate?.slice(0, 10) || ''} onChange={e => set('establishedDate', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Địa điểm sinh hoạt mặc định</label>
                            <select className={SELECT} value={form.defaultMeetingLocationId || ''} onChange={e => set('defaultMeetingLocationId', e.target.value)}>
                                <option value="">-- Chọn địa điểm --</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu dữ liệu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function CellsPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data: cellRes, isLoading } = useQuery({
        queryKey: ['cells', search, page, statusFilter, branchFilter, showTrash],
        queryFn: () => cellApi.getAll({ 
            search, page, limit: 10,
            status: statusFilter || undefined,
            unionBranchId: branchFilter || undefined,
            onlyDeleted: showTrash
        }),
        keepPreviousData: true,
    });

    const { data: branchRes } = useQuery({ queryKey: ['branches-all'], queryFn: branchApi.getAll });
    const { data: locRes } = useQuery({ queryKey: ['locations-all'], queryFn: locationApi.getAll });

    const cells = cellRes?.data?.data || [];
    const pagination = cellRes?.data?.pagination || {};
    const branches = branchRes?.data?.data || [];
    const locations = locRes?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: cellApi.create,
        onSuccess: () => { qc.invalidateQueries(['cells']); setModal(null); toast.success('Đã thêm Chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => cellApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['cells']); setModal(null); toast.success('Đã cập nhật!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const deleteMutation = useMutation({
        mutationFn: cellApi.delete,
        onSuccess: () => { qc.invalidateQueries(['cells']); toast.success('Đã chuyển chi đoàn vào thùng rác!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const restoreMutation = useMutation({
        mutationFn: cellApi.restore,
        onSuccess: () => { qc.invalidateQueries(['cells']); toast.success('Đã khôi phục chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const forceDeleteMutation = useMutation({
        mutationFn: cellApi.forceDelete,
        onSuccess: () => { qc.invalidateQueries(['cells']); toast.success('Đã xóa vĩnh viễn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const handleSave = (form) => {
        if (modal?.id) updateMutation.mutate({ id: modal.id, data: form });
        else createMutation.mutate(form);
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${avatar}`;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition font-medium" 
                            placeholder="Tìm kiếm Chi đoàn..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
                        <option value="">Liên chi đoàn (Khoa)</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">Trạng thái</option>
                        {CELL_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    {hasPermission('cell:delete') && (
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
                        <button className={BTN_PRIMARY} onClick={() => setModal('add')}>
                            <Plus size={16} /> Thêm Chi đoàn
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Network size={16} className="text-primary-700" />
                        {showTrash ? 'Thùng rác Chi đoàn' : 'Cơ cấu Chi đoàn'}
                    </h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full">{pagination.total || 0} đơn vị</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : cells.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm italic font-medium">Không tìm thấy dữ liệu chi đoàn</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Chi đoàn / Khóa</th>
                                    <th className="px-6 py-4">Liên chi đoàn</th>
                                    <th className="px-6 py-4">Ban chấp hành</th>
                                    <th className="px-6 py-4 text-center">Trạng thái / Quy mô</th>
                                    <th className="px-6 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cells.map(c => {
                                    const statusObj = CELL_STATUS.find(s => s.value === c.status) || CELL_STATUS[0];
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-black text-primary-700 text-xs uppercase tracking-tight mb-0.5">{c.code}</span>
                                                    <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase ring-1 ring-blue-100">
                                                            <GraduationCap size={10} /> {c.courseYear || '—'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold tracking-tight italic">
                                                            NK: {c.academicYear || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-700 text-[11px] uppercase tracking-tighter">{c.UnionBranch?.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">{c.UnionBranch?.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {c.SecretaryOfCell ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative">
                                                            {c.SecretaryOfCell.User?.avatar ? (
                                                                <img src={getAvatarUrl(c.SecretaryOfCell.User.avatar)} className="w-8 h-8 rounded-xl border-2 border-white shadow-sm object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-black text-[10px] border-2 border-white shadow-sm uppercase">
                                                                    {c.SecretaryOfCell.fullName?.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white flex items-center justify-center" title="Bí thư">
                                                                <Shield size={6} className="text-white" fill="currentColor" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-800 leading-none mb-0.5">{c.SecretaryOfCell.fullName}</p>
                                                            <p className="text-[9px] text-primary-600 font-black uppercase tracking-widest">Bí thư</p>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight italic">Chưa phân công</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 justify-center w-fit mx-auto shadow-xs ${statusObj.color}`}>
                                                        {statusObj.label}
                                                    </span>
                                                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                                        <Users size={10} className="text-gray-400" />
                                                        <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">{c.totalMembers || 0} ĐV</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!showTrash ? (
                                                        <>
                                                            <button 
                                                                className={`${BTN_ICON} bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100 shadow-sm`}
                                                                title="Xem danh sách đoàn viên"
                                                                onClick={() => navigate(`/admin/members?unionCellId=${c.id}`)}
                                                            >
                                                                <Users size={16} />
                                                            </button>
                                                            <button className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`} onClick={() => setModal(c)}>
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const res = await confirmDelete(c.name);
                                                                    if (res.isConfirmed) deleteMutation.mutate(c.id);
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const res = await confirmRestore(c.name);
                                                                    if (res.isConfirmed) restoreMutation.mutate(c.id);
                                                                }}
                                                                title="Khôi phục"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button 
                                                                className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const res = await confirmForceDelete(c.name);
                                                                    if (res.isConfirmed) forceDeleteMutation.mutate(c.id);
                                                                }}
                                                                title="Xóa vĩnh viễn"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
                    {Array.from({ length: pagination.totalPages || 0 }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white hover:border-primary-700 hover:text-primary-700'}`}>{p}</button>
                    ))}
                    <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
                    <span className="text-xs text-gray-500 ml-1">Tổng: {pagination.total}</span>
                </div>
            </div>

            {modal && <CellModal cell={modal === 'add' ? null : modal} branches={branches} locations={locations} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}

