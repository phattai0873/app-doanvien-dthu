import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Newspaper, BookOpen } from 'lucide-react';
import { memberApi, activityApi, newsApi, quizApi } from '../../services/api';

function StatCard({ title, icon: Icon, colorClasses, query }) {
    const { data, isLoading } = query;
    const count = data?.data?.pagination?.total ?? '—';
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all">
            <div className={`w-13 h-13 rounded-xl flex items-center justify-center p-3 ${colorClasses}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{isLoading ? '...' : count}</h3>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const membersQ = useQuery({ queryKey: ['members-count'], queryFn: () => memberApi.getAll({ limit: 1 }) });
    const activitiesQ = useQuery({ queryKey: ['activities-count'], queryFn: () => activityApi.getAll({ limit: 1 }) });
    const newsQ = useQuery({ queryKey: ['news-count'], queryFn: () => newsApi.getAll({ limit: 1 }) });
    const quizQ = useQuery({ queryKey: ['quiz-count'], queryFn: () => quizApi.getAll({ limit: 1 }) });

    const quickLinks = [
        { label: 'Quản lý hồ sơ Đoàn viên', desc: 'Thêm, sửa, xóa thông tin đoàn viên', icon: '👤' },
        { label: 'Điểm danh Hoạt động', desc: 'Ghi nhận điểm rèn luyện tham gia', icon: '✅' },
        { label: 'Phân công Chức vụ', desc: 'Quản lý vai trò trong chi bộ', icon: '🏛️' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard title="Tổng đoàn viên" icon={Users} colorClasses="bg-primary-50 text-primary-700" query={membersQ} />
                <StatCard title="Hoạt động" icon={Calendar} colorClasses="bg-indigo-50 text-indigo-700" query={activitiesQ} />
                <StatCard title="Bài tin tức" icon={Newspaper} colorClasses="bg-green-50 text-green-700" query={newsQ} />
                <StatCard title="Kỳ thi / Khảo sát" icon={BookOpen} colorClasses="bg-orange-50 text-orange-700" query={quizQ} />
            </div>

            {/* Welcome card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-800">Chào mừng đến hệ thống Admin</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">
                        Hệ thống quản lý Đoàn viên - Trường ĐHKT ĐTHU. Sử dụng menu bên trái để điều hướng đến các chức năng quản lý.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {quickLinks.map(item => (
                            <div key={item.label} className="bg-gray-50 rounded-lg p-4 hover:bg-primary-50 transition cursor-default">
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <p className="font-semibold text-sm text-gray-800">{item.label}</p>
                                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
