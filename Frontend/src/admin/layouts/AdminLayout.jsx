import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Users, Building2, Network,
    Calendar, Newspaper, BookOpen, Wallet, LogOut, Shield,
    CalendarClock, FileText, Bell, UserCog, Image as ImageIcon, KeyRound, Plus, MousePointer2, MapPin, Eye, EyeOff
} from 'lucide-react';
import { authApi } from '../../services/api';
import ModalPortal from '../../components/ModalPortal';
import { confirmUnsavedChanges } from '../../utils/swal';
import logoDthu from '../../assets/logodthu.png';

import { NAV, PAGE_TITLES, getSidebarNav } from '../constants/navigation';
import CommandPalette from '../components/CommandPalette';
import { Search, Command } from 'lucide-react';

export default function AdminLayout() {
    const { user, setUser, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Lắng nghe phím tắt Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.success('Đã đăng xuất');
        navigate('/login');
    };

    const [pwModal, setPwModal] = useState(false);
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const isProfileDirty = !!file || !!pwForm.oldPassword || !!pwForm.newPassword || !!pwForm.confirm;

    const handleAttemptClose = async () => {
        if (isProfileDirty) {
            const result = await confirmUnsavedChanges();
            if (result.isConfirmed) {
                setPwModal(false);
                setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
                setFile(null);
                setPreview(null);
            }
        } else {
            setPwModal(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setPwLoading(true);

            let updated = false;

            // 1. Upload Avatar
            if (file) {
                const formData = new FormData();
                formData.append('avatar', file);
                const res = await authApi.updateMe(formData);
                if (setUser) setUser(res.data.data);
                updated = true;
            }

            // 2. Change Password
            if (pwForm.oldPassword || pwForm.newPassword || pwForm.confirm) {
                if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirm) {
                    toast.error('Vui lòng điền đủ thông tin mật khẩu');
                    setPwLoading(false);
                    return;
                }
                if (pwForm.newPassword !== pwForm.confirm) {
                    toast.error('Mật khẩu xác nhận không khớp');
                    setPwLoading(false);
                    return;
                }
                const oldPw = pwForm.oldPassword.trim();
                const newPw = pwForm.newPassword.trim();

                if (newPw.length < 6) {
                    toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
                    setPwLoading(false);
                    return;
                }
                await authApi.changeMyPassword({ oldPassword: oldPw, newPassword: newPw });
                updated = true;
            }

            if (updated) {
                toast.success('Đã lưu thay đổi hồ sơ');
                setPwModal(false);
                setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
                setFile(null);
                setPreview(null);
            } else {
                setPwModal(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setPwLoading(false);
        }
    };

    const sidebarNav = getSidebarNav();

    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar flex flex-col fixed top-0 left-0 h-full z-50 shadow-xl transition-all">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                    <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                        <img src={logoDthu} alt="Logo DTHU" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-extrabold tracking-tight">ĐTHU Admin</p>
                        <p className="text-white text-[10px] uppercase font-bold tracking-wider">Đoàn viên trực thuộc DTHU</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
                    {sidebarNav.map((item, i) => {
                        if (item.permission && !hasPermission(item.permission)) return null;

                        if (item.isHeader) {
                            const nextItems = sidebarNav.slice(i + 1);
                            const sectionHasVisibleItem = nextItems.some(sub => {
                                if (sub.isHeader) return false;
                                return !sub.permission || hasPermission(sub.permission);
                            });
                            if (item.section === 'Hệ thống' && !sectionHasVisibleItem) return null;

                            return (
                                <p key={i} className="text-[10px] font-bold uppercase tracking-[0.2em] text-white px-6 pt-6 pb-2 opacity-50">
                                    {item.section}
                                </p>
                            );
                        }


                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/admin'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-all duration-200 border-l-4 ${isActive
                                        ? 'bg-white/20 text-white border-white'
                                        : 'text-white border-transparent hover:bg-white/10'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="px-5 py-5 border-t border-white/10 bg-black/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden shrink-0">
                            {user?.avatar ? (
                                <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.username?.[0]?.toUpperCase() || 'A'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate">{user?.username || 'Admin'}</p>
                            <p className="text-white text-[10px] uppercase font-bold">{user?.Roles?.[0]?.name || 'Quản trị viên'}</p>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPwModal(true)}
                                className="p-2 rounded-lg text-white hover:bg-white/10 transition-all active:scale-95"
                                title="Đổi mật khẩu"
                            >
                                <KeyRound size={16} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-white hover:bg-white/10 transition-all active:scale-95 text-red-300 hover:text-red-400"
                                title="Đăng xuất"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="ml-64 flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">{pageTitle}</h1>
                    <div className="flex items-center gap-6">
                        {/* Search Trigger */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                        >
                            <Search size={16} className="group-hover:text-primary-600" />
                            <span className="text-xs font-semibold">Tìm kiếm...</span>
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] font-bold text-gray-400">
                                <Command size={10} /> K
                            </kbd>
                        </button>

                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <Shield size={14} className="text-primary-700" />
                            Trường Đại học Đồng Tháp
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>

            {/* Command Palette */}
            <CommandPalette
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            {/* Change Profile Modal */}
            {pwModal && (
                <ModalPortal onAttemptClose={handleAttemptClose}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Cập nhật hồ sơ</h3>
                            <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Update Avatar Section */}
                            <div className="flex flex-col items-center gap-3">
                                <label className="w-20 h-20 rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden relative group shrink-0 hover:border-primary-500 transition">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    {preview || user?.avatar ? (
                                        <img src={preview || `http://localhost:5000${user.avatar}`} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Plus size={24} className="text-gray-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 items-center justify-center flex opacity-0 group-hover:opacity-100 transition">
                                        <span className="text-white text-[10px] uppercase font-bold text-center">Đổi ảnh</span>
                                    </div>
                                </label>
                                <p className="text-xs text-gray-500 text-center">Bấm vào ảnh trên để tải ứng đại diện mới.</p>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thiết lập mật khẩu</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1"
                                >
                                    {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showPasswords ? 'Ẩn' : 'Hiện'} mật khẩu
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu hiện tại</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition"
                                    placeholder="Bỏ trống nếu không đổi"
                                    value={pwForm.oldPassword}
                                    onChange={e => setPwForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu mới</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition"
                                    placeholder="Ít nhất 6 ký tự"
                                    value={pwForm.newPassword}
                                    onChange={e => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition"
                                    value={pwForm.confirm}
                                    onChange={e => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition" onClick={handleAttemptClose}>Hủy</button>
                            <button
                                className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                                onClick={handleSaveProfile}
                                disabled={pwLoading}
                            >
                                {pwLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
