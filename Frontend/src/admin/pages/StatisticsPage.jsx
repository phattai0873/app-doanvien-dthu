import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Users, Building2, Calendar, Wallet, TrendingUp, TrendingDown, 
    AlertTriangle, CheckCircle, Info, Award, BarChart3, PieChart as PieChartIcon 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { statApi } from '../../services/api';

const COLORS = ['#006a31', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const KpiCard = ({ title, value, trend, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-800">{value}</h3>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{Math.abs(trend)}% so với tháng trước</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const InsightItem = ({ alert }) => {
    const Icon = alert.type === 'danger' ? AlertTriangle : (alert.type === 'warning' ? Info : CheckCircle);
    const borderClass = alert.type === 'danger' ? 'border-red-100 bg-red-50/50' : (alert.type === 'warning' ? 'border-amber-100 bg-amber-50/50' : 'border-green-100 bg-green-50/50');
    const iconClass = alert.type === 'danger' ? 'text-red-600' : (alert.type === 'warning' ? 'text-amber-600' : 'text-green-600');

    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border ${borderClass} animate-in fade-in slide-in-from-left duration-300`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm ${iconClass}`}>
                <Icon size={18} />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{alert.title}</h4>
                <p className="text-xs text-gray-600 mt-1 font-medium">{alert.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {alert.data?.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-gray-100 text-[10px] font-bold text-gray-500 rounded-full">
                            {item.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function StatisticsPage() {
    const [activeTab, setActiveTab] = useState('overview');

    const { data: dashboardRes, isLoading: loadingDash } = useQuery({
        queryKey: ['stats-dashboard'],
        queryFn: statApi.getDashboard
    });

    const { data: memberRes, isLoading: loadingMembers } = useQuery({
        queryKey: ['stats-members'],
        queryFn: statApi.getMembers
    });

    const { data: rankingRes, isLoading: loadingRankings } = useQuery({
        queryKey: ['stats-rankings'],
        queryFn: statApi.getRankings
    });

    if (loadingDash || loadingMembers || loadingRankings) {
        return <div className="p-20 flex justify-center"><div className="spinner" /></div>;
    }

    const { summary, alerts } = dashboardRes?.data?.data || {};
    const { gender, ethnicity, byBranch } = memberRes?.data?.data || {};
    const { topMembers, topCells } = rankingRes?.data?.data || {};

    return (
        <div className="space-y-6 pb-10">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'overview' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('overview')}>Tổng quan</button>
                    <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'members' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('members')}>Đoàn viên</button>
                    <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'rankings' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('rankings')}>Thi đua</button>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dữ liệu tính đến</p>
                    <p className="text-xs font-bold text-gray-700">{new Date().toLocaleString('vi-VN')}</p>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Tổng Đoàn viên" value={summary.totalMembers.toLocaleString()} trend={summary.memberGrowth} icon={Users} colorClass="bg-green-50 text-green-600" />
                        <KpiCard title="Đơn vị (Chi đoàn)" value={summary.totalUnits} icon={Building2} colorClass="bg-blue-50 text-blue-600" />
                        <KpiCard title="Hoạt động Mới" value={summary.activeActivities} icon={Calendar} colorClass="bg-amber-50 text-amber-600" />
                        <KpiCard title="Tổng Đoàn phí" value={`${(summary.totalRevenue / 1000000).toFixed(1)}M`} icon={Wallet} colorClass="bg-purple-50 text-purple-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Insights Panel */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-6">
                                <Award size={20} className="text-primary-700" />
                                <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Phát hiện thông minh (Insights)</h3>
                            </div>
                            <div className="space-y-4 flex-1 overflow-y-auto">
                                {alerts.length > 0 ? alerts.map((a, i) => <InsightItem key={i} alert={a} />) : (
                                    <div className="text-center py-10 text-gray-400 italic text-sm">Chưa có cảnh báo nào bất thường</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary-700" />
                                    <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Phân bố đoàn viên theo LCĐ (Khoa)</h3>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={byBranch}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                                        <ReTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
                                            cursor={{ fill: '#f9fafb' }}
                                        />
                                        <Bar dataKey="memberCount" name="Số đoàn viên" fill="#006a31" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                            <PieChartIcon size={18} className="text-primary-700" /> Cơ cấu Giới tính
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={gender} dataKey="count" nameKey="gender" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                        {gender.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.gender === 'male' ? '#3b82f6' : '#ec4899'} />
                                        ))}
                                    </Pie>
                                    <ReTooltip />
                                    <Legend formatter={(val) => val === 'male' ? 'Nam' : 'Nữ'} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary-700" /> Top Dân tộc
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={ethnicity}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="ethnicity" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
                                    <ReTooltip />
                                    <Bar dataKey="count" name="Số người" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rankings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2 text-[#006a31]">
                            <Award size={20} /> Top Đoàn viên Tích cực nhất
                        </h3>
                        <div className="space-y-4">
                            {topMembers.map((m, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : (i === 1 ? 'bg-gray-100 text-gray-400' : (i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'))}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{m.fullName}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{m.cellName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary-700">{m.socialWorkDays} ngày</p>
                                        <p className="text-[10px] text-gray-400 font-bold">Ngày CTXH</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2 text-blue-700">
                            <Building2 size={20} /> Thi đua giữa các Chi đoàn
                        </h3>
                        <div className="space-y-4">
                            {topCells.map((c, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-700">{c.name}</span>
                                        <span className="text-primary-700">{c.totalWorkDays} điểm</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-primary-600 rounded-full" 
                                            style={{ width: `${(c.totalWorkDays / topCells[0].totalWorkDays) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                        <span>Đoàn số: {c.memberCount}</span>
                                        <span>Trung bình: {Math.round(c.totalWorkDays / c.memberCount)} điểm/người</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
