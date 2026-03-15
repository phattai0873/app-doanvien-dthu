import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, CheckCircle2, ChevronLeft, Search, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingApi } from '../../services/api';
import * as XLSX from 'xlsx';

export default function MeetingAttendancePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');

    const { data: meetingRes } = useQuery({ queryKey: ['meeting', id], queryFn: () => meetingApi.getById(id) });
    const meeting = meetingRes?.data?.data;

    const { data: attendanceData, isLoading, refetch } = useQuery({
        queryKey: ['attendance', id],
        queryFn: () => meetingApi.getAttendance(id)
    });

    const list = attendanceData?.data?.data || [];
    
    const handleExportExcel = () => {
        if (list.length === 0) return toast.error('Không có dữ liệu để xuất!');

        const data = list.map(att => ({
            'Họ và Tên': att.UnionMember?.fullName,
            'Số điện thoại': att.UnionMember?.phoneNumber || '—',
            'Chi Đoàn': att.UnionMember?.UnionCell?.name || '—',
            'Ghi chú': att.remarks || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach diem danh");
        
        // Auto-size columns
        if (data.length > 0) {
            const colWidths = Object.keys(data[0]).map(key => ({
                wch: Math.max(key.length, ...data.map(row => (row[key] || '').toString().length)) + 2
            }));
            worksheet['!cols'] = colWidths;
        }

        XLSX.writeFile(workbook, `Diem_danh_${meeting?.title || 'buoi_hop'}.xlsx`);
    };

    const filteredList = list.filter(att => {
        const matchesSearch = att.UnionMember?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.UnionMember?.memberCode?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'attended') return ['PRESENT', 'LATE'].includes(att.status);
        if (filterStatus === 'absent') return ['ABSENT_REASON', 'ABSENT_NO_REASON'].includes(att.status);

        return true;
    });

    const getStatusCls = (s) => {
        switch (s) {
            case 'PRESENT': return 'bg-green-100 text-green-700';
            case 'LATE': return 'bg-yellow-100 text-yellow-700';
            case 'ABSENT_REASON': return 'bg-blue-100 text-blue-700';
            default: return 'bg-red-100 text-red-700';
        }
    };

    const getStatusLabel = (s) => {
        switch (s) {
            case 'PRESENT': return 'Có mặt';
            case 'LATE': return 'Muộn';
            case 'ABSENT_REASON': return 'Phép';
            case 'ABSENT_NO_REASON': return 'Vắng';
            default: return s;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Danh sách điểm danh sinh hoạt</h2>
                        <p className="text-xs text-primary-700 font-bold uppercase tracking-widest leading-none mt-1">{meeting?.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
                        <Download size={16} />
                        Xuất Excel
                    </button>
                    <select 
                        className="px-3 py-2 border-2 border-gray-100 rounded-lg text-sm outline-none focus:border-primary-700 transition font-bold text-gray-600 bg-white"
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
                            className="pl-9 pr-4 py-2 border-2 border-gray-100 rounded-lg text-sm w-64 outline-none focus:border-primary-700 transition font-medium" 
                            placeholder="Tìm kiếm đoàn viên..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-xs bg-gray-50 text-gray-500 font-black px-4 py-2 border border-gray-100 rounded-full uppercase tracking-widest">{filteredList.length} thành viên</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex justify-center py-20"><div className="spinner" /></div>
                        : list.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                                <Clock size={64} className="mb-4 opacity-10" />
                                <p className="font-bold uppercase tracking-widest text-xs text-center px-10">Chưa có danh sách điểm danh<br/><span className="text-[10px] font-medium tracking-normal opacity-60">(Buổi họp phải ở trạng thái Đang diễn ra và có người tham gia)</span></p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Đoàn viên</th>
                                        <th className="px-6 py-4">Chi đoàn</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4">Thời gian điểm danh</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredList.map(att => (
                                        <tr key={att.id} className="hover:bg-gray-50/50 transition border-l-4 border-l-transparent hover:border-l-primary-700">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="font-bold text-gray-800 block leading-tight">{att.UnionMember?.fullName}</span>
                                                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{att.UnionMember?.memberCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{att.UnionMember?.UnionCell?.name || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xs ${getStatusCls(att.status)}`}>
                                                    {getStatusLabel(att.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {att.attendanceTime ? new Date(att.attendanceTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {/* Actions like changing status manually could be added here */}
                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition" title="Chỉnh sửa (Sắp hỗ trợ)">
                                                    <Users size={16} />
                                                </button>
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
