import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import logoDthu from '../assets/logodthu.png';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const username = form.username.trim();
        const password = form.password.trim();
        
        if (!username || !password) return toast.error('Vui lòng nhập đầy đủ thông tin');
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Đăng nhập thành công!');
            navigate('/admin');
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sidebar to-primary-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-transparent rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 overflow-hidden p-1">
                        <img src={logoDthu} alt="Logo DTHU" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Hệ thống Quản lý</h1>
                    <p className="text-gray-400 text-sm mt-1">Đoàn viên trực thuộc DTHU</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                            <User size={14} className="text-gray-400" /> Tên đăng nhập
                        </label>
                        <input
                            className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-4 focus:ring-primary-50 transition"
                            placeholder="Tên đăng nhập, Email hoặc SĐT..."
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                            <Lock size={14} className="text-gray-400" /> Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-4 focus:ring-primary-50 transition pr-12"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 transition"
                                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 shadow-lg shadow-primary-700/20 active:scale-[0.98]"
                    >
                        {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
                    </button>
                </form>
            </div>
        </div>
    );
}
