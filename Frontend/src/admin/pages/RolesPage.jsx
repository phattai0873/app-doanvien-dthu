import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, Pencil, Trash2, Shield, ShieldCheck, 
    CheckSquare, Square, ChevronRight, LayoutGrid, ListChecks 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { roleApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

// Design System Constants
const INPUT = "w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-sm outline-none hover:border-primary-200 focus:border-primary-600 focus:ring-4 focus:ring-primary-50/50 transition-all duration-200";
const BTN_PRIMARY = "flex items-center gap-2 px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary-700/20 active:scale-95";
const BTN_SECONDARY = "flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all duration-300 active:scale-95";
const BTN_ICON = "p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90";

const MODULE_LABELS = {
    'news': { label: 'Tin tức', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    'member': { label: 'Đoàn viên', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'branch': { label: 'Liên chi đoàn', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    'cell': { label: 'Chi đoàn', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    'activity': { label: 'Hoạt động', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    'meeting': { label: 'Sinh hoạt', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    'quiz': { label: 'Thi & Khảo sát', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    'document': { label: 'Văn bản', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    'fee': { label: 'Đoàn phí', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    'notification': { label: 'Thông báo', color: 'bg-pink-50 text-pink-700 border-pink-100' },
    'system': { label: 'Hệ thống', color: 'bg-slate-50 text-slate-700 border-slate-100' },
    'banner': { label: 'Quảng cáo', color: 'bg-violet-50 text-violet-700 border-violet-100' },
    'location': { label: 'Địa điểm', color: 'bg-teal-50 text-teal-700 border-teal-100' },
};

function RoleModal({ role, onClose, onSave, allPermissions }) {
    const isEdit = !!role;
    const [form, setForm] = useState(role ? {
        name: role.name,
        description: role.description || '',
        permissionIds: role.Permissions?.map(p => p.id) || []
    } : {
        code: '',
        name: '',
        description: '',
        permissionIds: []
    });

    const togglePermission = (id) => {
        setForm(f => ({
            ...f,
            permissionIds: f.permissionIds.includes(id)
                ? f.permissionIds.filter(pid => pid !== id)
                : [...f.permissionIds, id]
        }));
    };

    const toggleModule = (module, permissions) => {
        const pIds = permissions.map(p => p.id);
        const allSelected = pIds.every(id => form.permissionIds.includes(id));
        
        if (allSelected) {
            setForm(f => ({ ...f, permissionIds: f.permissionIds.filter(id => !pIds.includes(id)) }));
        } else {
            setForm(f => ({ ...f, permissionIds: [...new Set([...f.permissionIds, ...pIds])] }));
        }
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-tight">
                            {isEdit ? 'Cập nhật Vai trò' : 'Tạo Vai trò mới'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        {!isEdit && (
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mã Vai trò (CODE) *</label>
                                <input 
                                    className={INPUT} 
                                    value={form.code} 
                                    onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase().replace(/\s/g, '_')}))} 
                                    placeholder="VD: BAN_TRUYEN_THONG"
                                />
                            </div>
                        )}
                        <div className={isEdit ? "col-span-2" : "col-span-1"}>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tên hiển thị *</label>
                            <input 
                                className={INPUT} 
                                value={form.name} 
                                onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                                placeholder="VD: Ban Truyền thông"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mô tả nhiệm vụ</label>
                            <textarea 
                                className={`${INPUT} min-h-[80px] py-3`} 
                                value={form.description} 
                                onChange={e => setForm(f => ({...f, description: e.target.value}))} 
                                placeholder="Ghi chú ngắn gọn về vai trò này..."
                            />
                        </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <ListChecks size={14} /> Danh sách quyền hạn
                            </h4>
                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                Đã chọn {form.permissionIds.length} quyền
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(allPermissions).map(([module, perms]) => {
                                const moduleInfo = MODULE_LABELS[module] || { label: module, color: 'bg-gray-50 text-gray-700' };
                                const allInModuleSelected = perms.every(p => form.permissionIds.includes(p.id));
                                
                                return (
                                    <div key={module} className="group border border-gray-100 rounded-2xl p-4 hover:border-primary-100 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${moduleInfo.color}`}>
                                                {moduleInfo.label}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => toggleModule(module, perms)}
                                                className={`flex items-center gap-1.5 text-[10px] font-bold transition-all duration-200 ${allInModuleSelected ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {allInModuleSelected ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                                {allInModuleSelected ? 'Hủy chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {perms.map(p => {
                                                const isSelected = form.permissionIds.includes(p.id);
                                                return (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => togglePermission(p.id)}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary-50/50 border-primary-100 text-primary-900 border' : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
                                                    >
                                                        <div className={isSelected ? 'text-primary-600' : 'text-gray-300'}>
                                                            {isSelected ? <CheckSquare size={18} fill="currentColor" fillOpacity={0.1} /> : <Square size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-bold leading-none">{p.name}</p>
                                                            <p className="text-[9px] font-mono mt-1 opacity-60 uppercase">{p.code}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button 
                        className={BTN_PRIMARY} 
                        onClick={() => {
                            if (!form.name || (!isEdit && !form.code)) return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                            onSave(form);
                        }}
                    >
                        {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function RolesPage() {
    const qc = useQueryClient();
    const [modal, setModal] = useState(null); // null | 'add' | role object

    const { data: rolesData, isLoading: loadingRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: () => roleApi.getAll()
    });

    const { data: permsData, isLoading: loadingPerms } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => roleApi.getPermissions()
    });

    const roles = rolesData?.data?.data || [];
    const allPermissions = permsData?.data?.data || {};

    const createMutation = useMutation({
        mutationFn: roleApi.create,
        onSuccess: () => { qc.invalidateQueries(['roles']); setModal(null); toast.success('Đã tạo Vai trò mới!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => roleApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['roles']); setModal(null); toast.success('Đã cập nhật Vai trò!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const deleteMutation = useMutation({
        mutationFn: roleApi.delete,
        onSuccess: () => { qc.invalidateQueries(['roles']); toast.success('Đã xóa Vai trò!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        <Shield className="text-primary-700" size={24} /> Quản lý Phân quyền (RBAC)
                    </h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Phân cấp vai trò và gán quyền hạn chi tiết cho hệ thống</p>
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}>
                    <Plus size={18} /> Tạo Vai trò mới
                </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {loadingRoles ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <div className="spinner" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Đang tải dữ liệu vai trò...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                        <Shield size={64} className="opacity-20 mb-4" />
                        <p className="font-bold italic">Chưa có vai trò nào được định nghĩa</p>
                    </div>
                ) : (
                    roles.map(role => (
                        <div key={role.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-primary-700/5 hover:-translate-y-1 transition-all duration-300">
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className={`${BTN_ICON} bg-primary-50 text-primary-600 hover:bg-primary-100`} onClick={() => setModal(role)}>
                                    <Pencil size={16} />
                                </button>
                                {!role.isSystem && (
                                    <button 
                                        className={`${BTN_ICON} bg-red-50 text-red-600 hover:bg-red-100`}
                                        onClick={async () => {
                                            if (role.userCount > 0) return toast.error(`Không thể xóa vì đang có ${role.userCount} người dùng sử dụng vai trò này!`);
                                            const res = await confirmDelete(role.name);
                                            if (res.isConfirmed) deleteMutation.mutate(role.id);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col h-full">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black font-mono text-gray-400 tracking-tighter uppercase">{role.code}</span>
                                        {role.isSystem && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[8px] font-black uppercase rounded">System</span>}
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight leading-none mb-2">{role.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">{role.description || 'Không có mô tả nhiệm vụ.'}</p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Users size={14} />
                                            <span className="text-[10px] font-black uppercase">{role.userCount} người dùng</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                            <ShieldCheck size={14} />
                                            <span className="text-[10px] font-black uppercase">{role.Permissions?.length || 0} quyền</span>
                                        </div>
                                    </div>

                                    {/* Preview Permission Badges */}
                                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-hidden relative">
                                        {role.Permissions?.slice(0, 6).map(p => (
                                            <span key={p.id} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-bold rounded-lg border border-gray-100 whitespace-nowrap">
                                                {p.name}
                                            </span>
                                        ))}
                                        {(role.Permissions?.length || 0) > 6 && (
                                            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] font-bold rounded-lg border border-gray-100 italic">
                                                +{role.Permissions.length - 6} khác
                                            </span>
                                        )}
                                        {(!role.Permissions || role.Permissions.length === 0) && (
                                            <span className="text-[10px] text-gray-300 italic">Chưa gán quyền hạn</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            {modal && (
                <RoleModal
                    role={modal === 'add' ? null : modal}
                    allPermissions={allPermissions}
                    onClose={() => setModal(null)}
                    onSave={(data) => {
                        if (modal === 'add') createMutation.mutate(data);
                        else updateMutation.mutate({ id: modal.id, data });
                    }}
                />
            )}
        </div>
    );
}

const Users = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
