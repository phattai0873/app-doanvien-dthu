import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, CheckCircle2, XCircle, ChevronLeft, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityApi } from '../../services/api';
import * as XLSX from 'xlsx';

const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

export default function ActivityParticipantsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');

    const { data: res, isLoading, refetch } = useQuery({ 
        queryKey: ['activity-participants', id], 
        queryFn: () => activityApi.getById(id) 
    });

    const updateStatus = useMutation({
        mutationFn: ({ memberId, data }) => activityApi.updateParticipant(id, memberId, data),
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái!');
            refetch();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const doc = res?.data?.data;
    const participants = doc?.ActivityParticipants || [];

    const handleExportExcel = () => {
        if (participants.length === 0) return toast.error('Không có dữ liệu để xuất!');

        const data = participants.map(p => ({
            'Họ và Tên': p.UnionMember?.fullName,
            'Số điện thoại': p.UnionMember?.phoneNumber || '—',
            'Chi Đoàn': p.UnionMember?.UnionCell?.name || '—',
            'Ghi chú': p.remarks || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach tham gia");
        
        // Auto-size columns
        const colWidths = Object.keys(data[0]).map(key => ({
            wch: Math.max(key.length, ...data.map(row => (row[key] || '').toString().length)) + 2
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `Danh_sach_tham_gia_${doc?.title || 'hoat_dong'}.xlsx`);
    };

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = p.UnionMember?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.UnionMember?.memberCode?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filterStatus === 'attended') return ['PRESENT', 'LATE'].includes(p.attendanceStatus);
        if (filterStatus === 'absent') return ['ABSENT_REASON', 'ABSENT_NO_REASON', null, undefined].includes(p.attendanceStatus);
        
        return true;
    });

    const ATTENDANCE_COLORS = {
        PRESENT: 'bg-green-100 text-green-700',
        ABSENT_REASON: 'bg-amber-100 text-amber-700',
        ABSENT_NO_REASON: 'bg-red-100 text-red-700',
        LATE: 'bg-blue-100 text-blue-700',
    };

    const ATTENDANCE_LABELS = {
        PRESENT: 'Có mặt',
        ABSENT_REASON: 'Vắng (có lý do)',
        ABSENT_NO_REASON: 'Vắng (không lý do)',
        LATE: 'Muộn',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Danh sách tham gia hoạt động</h2>
                        <p className="text-xs text-primary-700 font-bold uppercase tracking-widest leading-none mt-1">{doc?.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportExcel} className={BTN_SECONDARY}>
                        <Download size={16} />
                        Xuất Excel
                    </button>
                    <select 
                        className="px-3 py-2 bg-white border-2 border-gray-100 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition font-bold text-gray-600"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="attended">Đã điểm danh</option>
                        <option value="absent">Vắng mặt</option>
                    </select>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            className="pl-9 pr-4 py-2 bg-white border-2 border-gray-100 rounded-lg text-sm w-64 outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition" 
                            placeholder="Tìm kiếm đoàn viên..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{filteredParticipants.length} đoàn viên</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex justify-center py-20"><div className="spinner" /></div>
                        : participants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                                <Users size={64} className="mb-4 opacity-10" />
                                <p className="font-bold uppercase tracking-widest text-xs">Chưa có đoàn viên nào đăng ký hoạt động này</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Họ và tên</th>
                                        <th className="px-6 py-4">Chi đoàn</th>
                                        <th className="px-6 py-4 text-center">Trạng thái điểm danh</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredParticipants.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition border-l-4 border-l-transparent hover:border-l-primary-700">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-800 block leading-tight">{p.UnionMember?.fullName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">{p.UnionMember?.UnionCell?.name || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.attendanceStatus ? (
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shadow-xs ${ATTENDANCE_COLORS[p.attendanceStatus]}`}>
                                                        {ATTENDANCE_LABELS[p.attendanceStatus]}
                                                    </span>
                                                ) : <span className="text-gray-300 font-bold text-xs">Chưa điểm danh</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex gap-1.5 justify-center">
                                                    {/* Removed Approve/Reject buttons as per user request */}
                                                    <button 
                                                        onClick={() => {
                                                            const status = p.attendanceStatus === 'PRESENT' ? 'ABSENT_NO_REASON' : 'PRESENT';
                                                            updateStatus.mutate({ memberId: p.memberId, data: { attendanceStatus: status } });
                                                        }}
                                                        className={`p-2 rounded-lg border transition shadow-sm ${p.attendanceStatus === 'PRESENT' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-primary-50 text-primary-600 border-primary-100'}`}
                                                        title={p.attendanceStatus === 'PRESENT' ? 'Huỷ điểm danh' : 'Điểm danh nhanh'}
                                                    >
                                                        <CheckCircle2 size={18} fill={p.attendanceStatus === 'PRESENT' ? 'currentColor' : 'none'} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                </div>
            </div>
        </div>
    );
}
