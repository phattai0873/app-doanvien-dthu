import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Pencil, Trash2, Building2, Calendar, Shield, Hash, Layers, History, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { branchApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const SELECT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition bg-white";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const BRANCH_STATUS = [
    { value: 'active', label: 'Hoạt động', color: 'bg-green-100 text-green-700' },
    { value: 'inactive', label: 'Tạm ngưng', color: 'bg-gray-100 text-gray-500' },
    { value: 'dissolved', label: 'Giải thể', color: 'bg-red-100 text-red-700' },
];

function BranchModal({ branch, onClose, onSave }) {
    const [form, setForm] = useState(branch || { 
        code: '', name: '', unionLevel: 'Cấp Khoa', officeAddress: '', 
        phoneNumber: '', status: 'active', termStartYear: '', termEndYear: '', 
        displayOrder: 0 
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{branch ? 'Cập nhật Liên chi đoàn' : 'Thêm Liên chi đoàn mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Mã đơn vị *</label>
                            <input className={INPUT} value={form.code} onChange={e => set('code', e.target.value)} placeholder="VD: LCD-CNTT" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Thứ tự hiển thị</label>
                            <input type="number" className={INPUT} value={form.displayOrder} onChange={e => set('displayOrder', parseInt(e.target.value))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Liên chi đoàn *</label>
                        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Liên chi đoàn Khoa CNTT" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cấp quản lý</label>
                            <input className={INPUT} value={form.unionLevel} onChange={e => set('unionLevel', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
                            <select className={SELECT} value={form.status} onChange={e => set('status', e.target.value)}>
                                {BRANCH_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-50">
                        <div className="col-span-2 text-[10px] font-bold text-primary-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Calendar size={12} /> Nhiệm kỳ công tác
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 italic">Năm bắt đầu</label>
                            <input type="number" className={INPUT} value={form.termStartYear || ''} onChange={e => set('termStartYear', e.target.value)} placeholder="2022" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 italic">Năm kết thúc</label>
                            <input type="number" className={INPUT} value={form.termEndYear || ''} onChange={e => set('termEndYear', e.target.value)} placeholder="2024" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Văn phòng / Địa chỉ</label>
                        <input className={INPUT} value={form.officeAddress} onChange={e => set('officeAddress', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại liên hệ</label>
                        <input className={INPUT} value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
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

export default function BranchesPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data: res, isLoading } = useQuery({
        queryKey: ['branches', search, page, statusFilter, levelFilter, showTrash],
        queryFn: () => branchApi.getAll({ 
            search, page, limit: 10, 
            status: statusFilter || undefined,
            unionLevel: levelFilter || undefined,
            onlyDeleted: showTrash
        }),
        keepPreviousData: true,
    });

    const branches = res?.data?.data || [];
    const pagination = res?.data?.pagination || {};

    const createMutation = useMutation({
        mutationFn: branchApi.create,
        onSuccess: () => { qc.invalidateQueries(['branches']); setModal(null); toast.success('Đã thêm Liên chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => branchApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['branches']); setModal(null); toast.success('Đã cập nhật!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const deleteMutation = useMutation({
        mutationFn: branchApi.delete,
        onSuccess: () => { qc.invalidateQueries(['branches']); toast.success('Đã chuyển liên chi đoàn vào thùng rác!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const restoreMutation = useMutation({
        mutationFn: branchApi.restore,
        onSuccess: () => { qc.invalidateQueries(['branches']); toast.success('Đã khôi phục liên chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const forceDeleteMutation = useMutation({
        mutationFn: branchApi.forceDelete,
        onSuccess: () => { qc.invalidateQueries(['branches']); toast.success('Đã xóa vĩnh viễn sản phẩm!'); },
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
            <div className="flex gap-4 flex-wrap items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition font-medium" 
                        placeholder="Tìm theo tên, mã..." 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                    />
                </div>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Trạng thái</option>
                    {BRANCH_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}>
                    <option value="">Cấp quản lý</option>
                    <option value="Cấp Khoa">Cấp Khoa</option>
                    <option value="Cấp Trường">Cấp Trường</option>
                </select>
                {hasPermission('branch:delete') && (
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
                        <Plus size={16} /> Thêm Liên chi đoàn
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-primary-700" />
                        {showTrash ? 'Thùng rác Liên chi đoàn' : 'Hệ thống Liên chi đoàn'}
                    </h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none flex items-center justify-center shadow-sm shadow-primary-200">{pagination.total || 0} Đơn vị</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : branches.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm font-medium italic">Không tìm thấy dữ liệu liên chi đoàn</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">STT</th>
                                    <th className="px-6 py-4">Cơ cấu tổ chức</th>
                                    <th className="px-6 py-4">Nhiệm kỳ / Trạng thái</th>
                                    <th className="px-6 py-4">Đại diện ban chấp hành</th>
                                    <th className="px-6 py-4">Thông tin liên hệ</th>
                                    <th className="px-6 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {branches.map((b, idx) => {
                                    const statusObj = BRANCH_STATUS.find(s => s.value === b.status) || BRANCH_STATUS[0];
                                    return (
                                        <tr key={b.id} className="hover:bg-gray-50/50 transition border-l-4 border-l-transparent hover:border-l-primary-700">
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-black text-gray-400 bg-gray-50 rounded-lg w-8 h-8 flex items-center justify-center mx-auto border border-gray-100 italic">#{b.displayOrder || idx + 1}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 border border-primary-100 shadow-sm shadow-primary-50 group-hover:bg-primary-700 group-hover:text-white transition group">
                                                        {b.logoUrl ? (
                                                            <img src={b.logoUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                        ) : (
                                                            <Building2 size={20} className="group-hover:scale-110 transition" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-black text-[10px] text-primary-700 uppercase tracking-tighter mb-0.5">{b.code}</span>
                                                        <span className="font-bold text-gray-800 text-sm">{b.name}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{b.unionLevel || 'Cấp khoa'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 w-fit">
                                                        <Calendar size={12} className="text-primary-700" />
                                                        {b.termStartYear && b.termEndYear ? `${b.termStartYear}-${b.termEndYear}` : 'Chưa cập nhật'}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit shadow-xs ${statusObj.color}`}>
                                                        {statusObj.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {b.SecretaryOfBranch ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative">
                                                            {b.SecretaryOfBranch.User?.avatar ? (
                                                                <img src={getAvatarUrl(b.SecretaryOfBranch.User.avatar)} className="w-8 h-8 rounded-xl border-2 border-white shadow-sm object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-black text-[10px] border-2 border-white shadow-sm uppercase">
                                                                    {b.SecretaryOfBranch.fullName?.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-700 rounded-full border-2 border-white flex items-center justify-center" title="Bí thư">
                                                                <Shield size={6} className="text-white" fill="currentColor" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-800 leading-none mb-0.5">{b.SecretaryOfBranch.fullName}</p>
                                                            <p className="text-[9px] text-primary-600 font-black uppercase tracking-widest">Bí thư LCĐ</p>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-bold uppercase tracking-tight">Chưa bầu bí thư</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-xs font-medium text-gray-600 truncate max-w-[150px]">{b.officeAddress || '—'}</p>
                                                    <p className="text-[10px] font-bold text-primary-700">{b.phoneNumber || '—'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!showTrash ? (
                                                        <>
                                                            <button className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`} onClick={() => setModal(b)}>
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const res = await confirmDelete(b.name);
                                                                    if (res.isConfirmed) deleteMutation.mutate(b.id);
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
                                                                    const res = await confirmRestore(b.name);
                                                                    if (res.isConfirmed) restoreMutation.mutate(b.id);
                                                                }}
                                                                title="Khôi phục"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button 
                                                                className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const res = await confirmForceDelete(b.name);
                                                                    if (res.isConfirmed) forceDeleteMutation.mutate(b.id);
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
                </div>
            </div>

            {modal && <BranchModal branch={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}

