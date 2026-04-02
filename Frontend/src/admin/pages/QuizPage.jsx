import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Search, BookOpen, Users, Plus, Eye, RotateCcw, History } from 'lucide-react';
import { quizApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';

const BTN_PRIMARY = "flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-50";
const BTN_ICON = "p-2 rounded-lg transition shadow-sm border";

const getStatusLabel = (status) => {
    switch (status) {
        case 'UPCOMING': return { label: 'Sắp diễn ra', cls: 'bg-blue-100 text-blue-700' };
        case 'ONGOING': return { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' };
        case 'FINISHED': return { label: 'Đã kết thúc', cls: 'bg-gray-200 text-gray-700' };
        case 'DRAFT': return { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-600' };
        default: return { label: status, cls: 'bg-gray-100 text-gray-600' };
    }
};

export default function QuizPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [levelFilter, setLevelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedExam, setSelectedExam] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const examsQ = useQuery({ 
        queryKey: ['quiz', search, page, levelFilter, statusFilter, showTrash], 
        queryFn: () => quizApi.getAll({ 
            search, page, limit: 10, 
            level: levelFilter || undefined,
            status: statusFilter || undefined,
            onlyDeleted: showTrash
        }), 
        keepPreviousData: true 
    });
    const attemptsQ = useQuery({ queryKey: ['attempts', selectedExam?.id], queryFn: () => quizApi.getAttempts(selectedExam.id, { limit: 50 }), enabled: !!selectedExam });


    const exams = examsQ.data?.data?.data || [];
    const pagination = examsQ.data?.data?.pagination || {};
    const attempts = attemptsQ.data?.data?.data || [];
    const qc = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: quizApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['quiz']);
            toast.success('Đã chuyển kỳ thi vào thùng rác!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
    });

    const restoreMutation = useMutation({
        mutationFn: quizApi.restore,
        onSuccess: () => {
            qc.invalidateQueries(['quiz']);
            toast.success('Đã khôi phục kỳ thi!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
    });

    const forceDeleteMutation = useMutation({
        mutationFn: quizApi.forceDelete,
        onSuccess: () => {
            qc.invalidateQueries(['quiz']);
            toast.success('Đã xóa vĩnh viễn!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
    });

    const handleDelete = async (id, title) => {
        const result = await confirmDelete(title);
        if (result.isConfirmed) deleteMutation.mutate(id);
    };

    const handleRestore = async (id, title) => {
        const result = await confirmRestore(title);
        if (result.isConfirmed) restoreMutation.mutate(id);
    };

    const handleForceDelete = async (id, title) => {
        const result = await confirmForceDelete(title);
        if (result.isConfirmed) forceDeleteMutation.mutate(id);
    };

    return (
        <div className={`grid gap-5 ${selectedExam ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Danh sách kỳ thi */}
            <div className="space-y-4">
                <div className="flex gap-3 justify-between">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input className="pl-9 pr-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm w-64 outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition" placeholder="Tìm kỳ thi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <select className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition font-medium text-gray-700" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}>
                            <option value="">Tất cả cấp độ</option>
                            <option value="SCHOOL">Cấp Trường</option>
                            <option value="BRANCH">Cấp Khoa</option>
                            <option value="CELL">Cấp Lớp</option>
                        </select>
                        <select className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition font-medium text-gray-700" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="ONGOING">Đang diễn ra</option>
                            <option value="UPCOMING">Sắp diễn ra</option>
                            <option value="FINISHED">Đã kết thúc</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setShowTrash(!showTrash); setPage(1); }}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border-2 
                                ${showTrash 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <History size={16} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                        </button>
                        {!showTrash && (
                            <button className={BTN_PRIMARY} onClick={() => navigate('/admin/quiz/create')}>
                                <Plus size={16} /> Tạo kỳ thi
                            </button>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-800">{showTrash ? 'Thùng rác Kỳ thi / Khảo sát' : 'Danh sách Kỳ thi / Khảo sát'}</h2>
                        <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} kỳ thi</span>
                    </div>
                    <div className="overflow-x-auto">
                        {examsQ.isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                            : exams.length === 0 ? <div className="flex flex-col items-center py-12 gap-2 text-gray-400 text-sm"><BookOpen size={36} /><p>Chưa có kỳ thi nào</p></div>
                                : <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3 text-left">Tên kỳ thi</th><th className="px-4 py-3 text-left">Cấp độ</th><th className="px-4 py-3 text-left">Lịch thi</th><th className="px-4 py-3 text-center">Trạng thái</th><th className="px-4 py-3 text-left">Hành động</th></tr></thead>
                                    <tbody>
                                        {exams.map(e => (
                                            <tr key={e.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedExam?.id === e.id ? 'bg-primary-50' : ''}`}>
                                                <td className="px-4 py-3 font-semibold flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded shadow-sm overflow-hidden bg-gray-100 shrink-0">
                                                        {e.thumbnail ? <img src={`http://localhost:5000${e.thumbnail}`} className="w-full h-full object-cover" alt="" /> : <BookOpen className="w-full h-full p-2 text-gray-300" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{e.title}</span>
                                                        <span className="text-[10px] text-gray-400 font-normal line-clamp-1">{e.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[10px] font-bold">
                                                    <span className={`px-2 py-0.5 rounded-full ${e.level === 'SCHOOL' ? 'bg-purple-100 text-purple-700' : e.level === 'BRANCH' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {e.level === 'SCHOOL' ? 'Trường' : e.level === 'BRANCH' ? 'Khoa' : 'Lớp'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col text-[11px] text-gray-500 font-medium">
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <span className="font-black">BĐ:</span> 
                                                            {e.startDate ? (() => {
                                                                const d = new Date(e.startDate);
                                                                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                                            })() : '—'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-red-600">
                                                            <span className="font-black">KT:</span>
                                                            {e.endDate ? (() => {
                                                                const d = new Date(e.endDate);
                                                                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                                            })() : '—'}
                                                        </span>
                                                        <span className="text-gray-400 mt-1 italic font-normal">{e.timeLimit} phút • Đạt: {e.satisfactoryScore}đ</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {(() => {
                                                        const st = getStatusLabel(e.computedStatus);
                                                        return <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {!showTrash ? (
                                                            <>
                                                                <button title="Xem kết quả" className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100`} onClick={() => setSelectedExam(selectedExam?.id === e.id ? null : e)}>
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button title="Sửa" className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border-gray-100`} onClick={() => navigate(`/admin/quiz/edit/${e.id}`)}>
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button title="Xóa" className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border-red-100`} onClick={() => handleDelete(e.id, e.title)}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button title="Khôi phục" className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 border-green-100 shadow-sm`} onClick={() => handleRestore(e.id, e.title)}>
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                                <button title="Xóa vĩnh viễn" className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100 shadow-sm`} onClick={() => handleForceDelete(e.id, e.title)}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50/30 border-t border-gray-100">
                            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40 transition" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-[11px] font-black ${p === page ? 'bg-primary-700 text-white border-primary-700 shadow-md shadow-primary-200' : 'border-gray-200 bg-white hover:border-primary-700'}`}>{p}</button>
                            ))}
                            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40 transition" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Kết quả làm bài */}
            {selectedExam && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-800 truncate">Kết quả: {selectedExam.title}</h2>
                        <button className="text-gray-400 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100" onClick={() => setSelectedExam(null)}>✕ Đóng</button>
                    </div>
                    <div className="overflow-x-auto">
                        {attemptsQ.isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                            : attempts.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Chưa có ai làm bài</div>
                                : <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Đoàn viên</th><th className="px-4 py-3 text-left">Điểm</th><th className="px-4 py-3 text-left">Đúng</th><th className="px-4 py-3 text-left">Kết quả</th></tr></thead>
                                    <tbody>
                                        {attempts.map((a, i) => (
                                            <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold">{a.UnionMember?.fullName || '—'}</td>
                                                <td className="px-4 py-3 font-bold text-primary-700">{a.score}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{a.correctAnswersCount} câu</td>
                                                <td className="px-4 py-3">
                                                    {a.score >= selectedExam.satisfactoryScore
                                                        ? <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Đạt</span>
                                                        : <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">Không đạt</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}
                    </div>
                </div>
            )}
        </div>
    );
}
