import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Users, Building2, Network,
    Calendar, Newspaper, BookOpen, Wallet, LogOut, Shield,
    CalendarClock, FileText, Bell, UserCog, Image as ImageIcon, KeyRound, Plus, MousePointer2, MapPin
} from 'lucide-react';
import { authApi } from '../../services/api';
import ModalPortal from '../../components/ModalPortal';
import logoDthu from '../../assets/logodthu.png';

const NAV = [
    { label: 'Tổng quan', icon: LayoutDashboard, to: '/admin' },
    { section: 'Tổ chức' },
    { label: 'Đoàn viên', icon: Users, to: '/admin/members' },
    { label: 'Liên chi đoàn', icon: Building2, to: '/admin/branches' },
    { label: 'Chi đoàn', icon: Network, to: '/admin/cells' },
    { section: 'Nghiệp vụ' },
    { label: 'Hoạt động', icon: Calendar, to: '/admin/activities' },
    { label: 'Sinh hoạt', icon: CalendarClock, to: '/admin/meetings' },
    { label: 'Tin tức', icon: Newspaper, to: '/admin/news' },
    { label: 'Thi & Khảo sát', icon: BookOpen, to: '/admin/quiz' },
    { label: 'Văn bản', icon: FileText, to: '/admin/documents' },
    { label: 'Thông báo', icon: Bell, to: '/admin/notifications' },
    { section: 'Hệ thống' },
    { label: 'Tài khoản', icon: UserCog, to: '/admin/users' },
    { label: 'Banner Trang chủ', icon: ImageIcon, to: '/admin/banners' },
    { label: 'Trang Landing Page', icon: MousePointer2, to: '/admin/landing' },
];

const PAGE_TITLES = {
    '/admin': 'Tổng quan',
    '/admin/members': 'Quản lý Đoàn viên',
    '/admin/branches': 'Quản lý Liên chi đoàn',
    '/admin/cells': 'Quản lý Chi đoàn',
    '/admin/activities': 'Quản lý Hoạt động',
    '/admin/meetings': 'Sinh hoạt Chi đoàn',
    '/admin/news': 'Quản lý Tin tức',
    '/admin/quiz': 'Thi & Khảo sát',
    '/admin/documents': 'Kho Văn bản',
    '/admin/notifications': 'Quản lý Thông báo',
    '/admin/users': 'Quản lý Tài khoản',
    '/admin/banners': 'Quản lý Banner',
    '/admin/landing': 'Quản lý Trang Landing',
    '/admin/locations': 'Quản lý Địa điểm',
};

export default function AdminLayout() {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

    const handleLogout = async () => {
        await logout();
        toast.success('Đã đăng xuất');
        navigate('/login');
    };

    const [pwModal, setPwModal] = useState(false);
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
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
                if(setUser) setUser(res.data.data);
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
                if (pwForm.newPassword.length < 6) {
                    toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
                    setPwLoading(false);
                    return;
                }
                await authApi.changeMyPassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
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
                    {NAV.map((item, i) => {
                        // Quyền Super Admin xem tất cả
                        const isSuperAdmin = user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
                        
                        // Nếu không phải Super Admin, ẩn các mục quản lý Liên chi đoàn và hệ thống
                        if (!isSuperAdmin) {
                            if (item.to === '/admin/branches') return null;
                            if (item.to === '/admin/users' || item.to === '/admin/banners' || item.section === 'Hệ thống') return null;
                        }

                        if (item.section) return (
                            <p key={i} className="text-[10px] font-bold uppercase tracking-[0.2em] text-white px-6 pt-6 pb-2">
                                {item.section}
                            </p>
                        );
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
                            <p className="text-white text-[10px] uppercase font-bold">Quản trị viên</p>
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
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <Shield size={14} className="text-primary-700" />
                        Trường Đại học Đồng Tháp
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>

            {/* Change Profile Modal */}
            {pwModal && (
                <ModalPortal onClose={() => setPwModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Cập nhật hồ sơ</h3>
                            <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
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

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu hiện tại</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700" 
                                    placeholder="Bỏ trống nếu không đổi"
                                    value={pwForm.oldPassword} 
                                    onChange={e => setPwForm(prev => ({ ...prev, oldPassword: e.target.value }))} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700" 
                                    placeholder="Ít nhất 6 ký tự"
                                    value={pwForm.newPassword} 
                                    onChange={e => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700" 
                                    value={pwForm.confirm} 
                                    onChange={e => setPwForm(prev => ({ ...prev, confirm: e.target.value }))} 
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition" onClick={() => setPwModal(false)}>Hủy</button>
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
