import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Lock, Unlock, KeyRound, ShieldCheck, ShieldOff, Shield, Building2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { userMgmtApi } from '../../services/api';
import { confirmDelete, confirmAction } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const ROLE_LABELS = {
    'SUPER_ADMIN': { label: 'Admin Trường', color: 'bg-red-100 text-red-700 border-red-200' },
    'BRANCH_ADMIN': { label: 'Admin Khoa', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'CELL_ADMIN': { label: 'Admin Lớp', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'MEMBER': { label: 'Đoàn viên', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function UserModal({ user, onClose, onSave }) {
    const isEdit = !!user;
    const [form, setForm] = useState(user || { username: '', password: '' });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.avatar ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}` : null);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append('username', form.username);
        if (form.password) formData.append('password', form.password);
        if (form.isActive !== undefined) formData.append('isActive', form.isActive);
        if (file) formData.append('avatar', file);
        onSave(formData);
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{isEdit ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên đăng nhập *</label>
                        <input className={INPUT} value={form.username} onChange={e => set('username', e.target.value)} placeholder="admin, bithuvien01..." disabled={isEdit} />
                        {isEdit && <p className="text-xs text-gray-400 mt-1">Không thể thay đổi tên đăng nhập</p>}
                    </div>
                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu *</label>
                            <input type="password" className={INPUT} value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Ít nhất 6 ký tự" />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={handleSave}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function ResetPasswordModal({ user, onClose, onSave }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Đặt lại mật khẩu</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-500">Đặt lại mật khẩu cho <strong className="text-gray-800">{user.username}</strong></p>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu mới *</label>
                        <input type="password" className={INPUT} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Xác nhận mật khẩu *</label>
                        <input type="password" className={INPUT} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" />
                    </div>
                    {newPassword && confirm && newPassword !== confirm && (
                        <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                    )}
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button
                        className={BTN_PRIMARY}
                        onClick={() => { if (newPassword === confirm && newPassword.length >= 6) onSave(newPassword); else toast.error('Mật khẩu không hợp lệ hoặc không khớp'); }}
                    >Xác nhận</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UsersPage() {
    const qc = useQueryClient();
    const [modal, setModal] = useState(null); // null | 'add' | user object
    const [resetModal, setResetModal] = useState(null); // user object

    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: userMgmtApi.getAll,
    });

    const users = data?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: userMgmtApi.create,
        onSuccess: () => { qc.invalidateQueries(['users']); setModal(null); toast.success('Đã tạo tài khoản!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi tạo tài khoản!')
    });
    const toggleLockMutation = useMutation({
        mutationFn: userMgmtApi.toggleLock,
        onSuccess: (res) => {
            qc.invalidateQueries(['users']);
            toast.success(res.data.data.isLocked ? '🔒 Đã khóa tài khoản' : '🔓 Đã mở khóa tài khoản');
        },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });
    const toggleActiveMutation = useMutation({
        mutationFn: userMgmtApi.toggleActive,
        onSuccess: (res) => {
            qc.invalidateQueries(['users']);
            toast.success(res.data?.data?.isActive ? '✅ Đã duyệt tài khoản' : '❌ Đã hủy hoạt động tài khoản');
        },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });
    const resetPwMutation = useMutation({
        mutationFn: ({ id, newPassword }) => userMgmtApi.resetPassword(id, newPassword),
        onSuccess: () => { setResetModal(null); toast.success('✅ Đã đặt lại mật khẩu!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });
    const deleteMutation = useMutation({
        mutationFn: userMgmtApi.delete,
        onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Đã xóa tài khoản!'); },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3 flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-primary-800 text-xs font-bold px-3 py-2 bg-primary-50 rounded-lg border border-primary-100 uppercase tracking-tight">
                    <Shield size={14} /> Quản lý tài khoản hệ thống
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Tạo tài khoản Admin</button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Tổng tài khoản', value: users.length, color: 'text-primary-700' },
                    { label: 'Đang hoạt động', value: users.filter(u => u.isActive && !u.isLocked).length, color: 'text-green-700' },
                    { label: 'Đã khóa', value: users.filter(u => u.isLocked).length, color: 'text-red-700' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center">
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Danh sách Tài khoản</h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase">{users.length} tài khoản</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : users.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm font-medium italic">Chưa có tài khoản nào</div>
                            : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                            <th className="px-6 py-4 text-left">Người dùng</th>
                                            <th className="px-6 py-4 text-left">Vai trò / Quyền hạn</th>
                                            <th className="px-6 py-4 text-left">Phạm vi quản lý</th>
                                            <th className="px-6 py-4 text-left">Trạng thái</th>
                                            <th className="px-6 py-4 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(u => {
                                            const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS['MEMBER'];
                                            return (
                                                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                                                    {/* Tài khoản */}
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{u.username}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-tighter">ID: {u.id?.slice(0, 8)}</p>
                                                        </div>
                                                    </td>
                                                    {/* Vai trò */}
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-xs ${roleInfo.color}`}>
                                                            {roleInfo.label}
                                                        </span>
                                                    </td>
                                                    {/* Phạm vi */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {u.role === 'BRANCH_ADMIN' && u.UnionBranch && (
                                                                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                                                                    <Building2 size={12} /> {u.UnionBranch.name}
                                                                </div>
                                                            )}
                                                            {u.role === 'CELL_ADMIN' && u.UnionCell && (
                                                                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-700">
                                                                    <BookOpen size={12} /> {u.UnionCell.name}
                                                                </div>
                                                            )}
                                                            {u.role === 'SUPER_ADMIN' && (
                                                                <span className="text-[10px] font-black text-red-600 uppercase italic tracking-tighter">Toàn trường</span>
                                                            )}
                                                            {!u.UnionBranch && !u.UnionCell && u.role !== 'SUPER_ADMIN' && (
                                                                <span className="text-[10px] text-gray-400 italic">Cá nhân</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Trạng thái */}
                                                    <td className="px-6 py-4">
                                                        {u.isLocked ? (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full w-fit">
                                                                <Lock size={10} /> Đã khóa
                                                            </span>
                                                        ) : u.isActive ? (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full w-fit">
                                                                <ShieldCheck size={10} /> Đang hoạt động
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full w-fit">
                                                                <ShieldOff size={10} /> Chờ kích hoạt
                                                            </span>
                                                        )}
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2 justify-center flex-wrap">
                                                            <button
                                                                className={`${BTN_ICON} bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const action = u.isActive ? 'hủy hoạt động' : 'duyệt';
                                                                    const result = await confirmAction(
                                                                        `${u.isActive ? 'Hủy hoạt động' : 'Duyệt'} tài khoản?`,
                                                                        `Bạn có chắc muốn ${action} tài khoản "${u.username}"?`,
                                                                        u.isActive ? 'Hủy hoạt động' : 'Duyệt'
                                                                    );
                                                                    if (result.isConfirmed) toggleActiveMutation.mutate(u.id);
                                                                }}
                                                                title={u.isActive ? 'Hủy duyệt tài khoản' : 'Duyệt tài khoản'}
                                                            >
                                                                {u.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                                            </button>
                                                            <button
                                                                className={`${BTN_ICON} ${u.isLocked ? 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-100'} border shadow-sm`}
                                                                onClick={async () => {
                                                                    const action = u.isLocked ? 'mở khóa' : 'khóa';
                                                                    const result = await confirmAction(
                                                                        `${u.isLocked ? 'Mở khóa' : 'Khóa'} tài khoản?`,
                                                                        `Bạn có chắc muốn ${action} tài khoản "${u.username}"?`,
                                                                        u.isLocked ? 'Mở khóa' : 'Khóa tài khoản'
                                                                    );
                                                                    if (result.isConfirmed) toggleLockMutation.mutate(u.id);
                                                                }}
                                                                title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                            >
                                                                {u.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                                            </button>
                                                            <button
                                                                className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm`}
                                                                onClick={() => setResetModal(u)}
                                                                title="Đặt lại mật khẩu"
                                                            ><KeyRound size={16} /></button>
                                                            <button
                                                                className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`}
                                                                onClick={async () => {
                                                                    const result = await confirmDelete(u.username);
                                                                    if (result.isConfirmed) deleteMutation.mutate(u.id);
                                                                }}
                                                                title="Xóa tài khoản"
                                                            ><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                </div>
            </div>

            {/* Modals */}
            {modal && (
                <UserModal
                    user={modal === 'add' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={(form) => createMutation.mutate(form)}
                />
            )}
            {resetModal && (
                <ResetPasswordModal
                    user={resetModal}
                    onClose={() => setResetModal(null)}
                    onSave={(pw) => resetPwMutation.mutate({ id: resetModal.id, newPassword: pw })}
                />
            )}
        </div>
    );
}
