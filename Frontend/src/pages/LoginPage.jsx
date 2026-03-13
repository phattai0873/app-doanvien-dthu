import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import logoDthu from '../assets/logodthu.png';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) return toast.error('Vui lòng nhập đầy đủ thông tin');
        setLoading(true);
        try {
            await login(form.username, form.password);
            toast.success('Đăng nhập thành công!');
            navigate('/admin');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
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
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Tên đăng nhập</label>
                        <input
                            className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-50"
                            placeholder="Nhập tên đăng nhập..."
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mật khẩu</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm outline-none transition focus:border-primary-700 focus:ring-4 focus:ring-primary-50"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
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
