import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Users, 
    Calendar, 
    Newspaper, 
    TrendingUp, 
    AlertTriangle, 
    ShieldCheck, 
    ArrowRight,
    Building2,
    DollarSign,
    Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip 
} from 'recharts';
import { statApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function Badge({ type, children }) {
    const styles = {
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-rose-100 text-rose-700',
        success: 'bg-emerald-100 text-emerald-700',
        info: 'bg-primary-100 text-primary-700'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[type] || styles.info}`}>
            {children}
        </span>
    );
}

function StatCard({ title, value, icon: Icon, trend, colorClass, delay = 0 }) {
    return (
        <div 
            className="group relative bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-125 ${colorClass}`} />
            
            <div className="relative flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass.replace('text-', 'bg-').split(' ')[0].replace('700', '50')} ${colorClass.split(' ')[1]}`}>
                    <Icon size={24} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                        <TrendingUp size={14} className={`ml-1 ${trend < 0 && 'rotate-180'}`} />
                    </div>
                )}
            </div>
            
            <div className="relative">
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
            </div>
        </div>
    );
}

function InsightCard({ alert }) {
    const icons = {
        warning: <AlertTriangle className="text-amber-500 shrink-0" size={20} />,
        danger: <Target className="text-rose-500 shrink-0" size={20} />,
        success: <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
    };

    return (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-primary-100 transition-all group">
            <div className="mt-1">{icons[alert.type] || icons.warning}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{alert.title}</h4>
                    <Badge type={alert.type}>{alert.type === 'danger' ? 'Khẩn cấp' : 'Chú ý'}</Badge>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{alert.message}</p>
                <button className="text-[11px] font-semibold text-primary-600 flex items-center group-hover:translate-x-1 transition-transform">
                    Xem chi tiết <ArrowRight size={12} className="ml-1" />
                </button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: dashboardData, isLoading } = useQuery({ 
        queryKey: ['dashboard-stats'], 
        queryFn: () => statApi.getDashboard() 
    });

    const stats = dashboardData?.data?.summary || {};
    const alerts = dashboardData?.data?.alerts || [];

    // Trình diễn biểu đồ (Dữ liệu mẫu dựa trên số liệu thực)
    const chartData = [
        { name: 'T1', value: Math.max(0, stats.totalMembers - (stats.newMembersThisMonth || 0) - 40) },
        { name: 'T2', value: Math.max(0, stats.totalMembers - (stats.newMembersThisMonth || 0) - 25) },
        { name: 'T3', value: stats.totalMembers - (stats.newMembersThisMonth || 0) },
        { name: 'T4', value: stats.totalMembers }
    ];

    const quickActions = [
        { title: 'Duyệt Đoàn viên', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', link: '/admin/members?status=inactive', desc: 'Kiểm tra đơn gia nhập' },
        { title: 'Quản lý Phí', icon: DollarSign, color: 'bg-amber-50 text-amber-600', link: '/admin/fees', desc: 'Theo dõi tiền đoàn phí' },
        { title: 'Thông báo mới', icon: Newspaper, color: 'bg-indigo-50 text-indigo-600', link: '/admin/notifications', desc: 'Gửi tin cho toàn chi đoàn' },
        { title: 'Cài đặt hệ điều hành', icon: Target, color: 'bg-rose-50 text-rose-600', link: '/admin/settings', desc: 'Thông tin trường/đoàn' },
    ];

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Superior Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-indigo-700 p-8 text-white shadow-lg shadow-primary-200">
                <div className="absolute top-0 right-0 w-96 h-96 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-2">Chào mừng trở lại, {user?.username}! 👋</h1>
                        <p className="text-primary-100 max-w-lg opacity-90 leading-relaxed">
                            Báo cáo tổng quan hệ thống Đoàn thanh niên ngày {new Date().toLocaleDateString('vi-VN')}. 
                            Cơ sở dữ liệu đang vận hành với <span className="font-bold underline tracking-wide">{(stats.totalMembers || 0).toLocaleString()}</span> đoàn viên và <span className="font-bold underline tracking-wide">{(stats.totalUnits || 0).toLocaleString()}</span> chi đoàn.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => navigate('/admin/members/create')}
                            className="px-6 py-3 bg-white text-primary-600 font-bold rounded-xl shadow-sm hover:scale-105 transition-all text-sm active:scale-95"
                        >
                            + Thêm Đoàn viên
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Tổng Đoàn viên" 
                    value={(stats.totalMembers || 0).toLocaleString()} 
                    trend={stats.memberGrowth} 
                    icon={Users} 
                    colorClass="bg-primary-700 text-primary-700" 
                />
                <StatCard 
                    title="Liên chi đoàn" 
                    value={(stats.totalBranches || 0).toLocaleString()} 
                    icon={Building2} 
                    colorClass="bg-indigo-700 text-indigo-700" 
                    delay={100}
                />
                <StatCard 
                    title="Hoạt động năng nổ" 
                    value={(stats.activeActivities || 0).toLocaleString()} 
                    icon={Calendar} 
                    colorClass="bg-emerald-700 text-emerald-700" 
                    delay={200}
                />
                <StatCard 
                    title="Quỹ đoàn (Năm nay)" 
                    value={`${(stats.totalRevenue || 0).toLocaleString()}đ`} 
                    icon={DollarSign} 
                    colorClass="bg-amber-700 text-amber-700" 
                    delay={300}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Insights & Alerts */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Growth Chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Tăng trưởng Đoàn viên</h3>
                                <p className="text-xs text-gray-400">Thống kê 4 quý gần nhất</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge type="success">Tài khoản Active</Badge>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#2563eb" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorValue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map(action => (
                            <Link 
                                to={action.link} 
                                key={action.title} 
                                className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all text-center group"
                            >
                                <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${action.color}`}>
                                    <action.icon size={22} />
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 mb-1">{action.title}</h4>
                                <p className="text-[10px] text-gray-400">{action.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar: Smart Alerts */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center italic font-serif">i</div>
                            <h3 className="text-base font-bold text-gray-800">Cảnh báo thông minh</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {alerts.length > 0 ? (
                                alerts.map((alert, idx) => (
                                    <InsightCard key={idx} alert={alert} />
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <ShieldCheck size={48} className="mx-auto text-gray-100 mb-3" />
                                    <p className="text-sm text-gray-400">Hệ thống trong tình trạng an toàn. Không có cảnh báo mới.</p>
                                </div>
                            )}
                        </div>

                        {/* Promotion Card */}
                        <div className="mt-8 p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Badge type="info">Enterprise</Badge>
                                <Target size={20} className="text-gray-500" />
                            </div>
                            <h5 className="text-sm font-bold mb-2">Báo cáo dữ liệu mẫu</h5>
                            <p className="text-xs text-gray-400 leading-relaxed">Xuất báo cáo PDF chi tiết về tình hình đoàn viên hàng tháng.</p>
                            <button className="mt-4 w-full py-2 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors">
                                Xuất báo cáo (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
