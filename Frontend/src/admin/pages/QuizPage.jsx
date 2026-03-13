import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../../services/api';

const BTN_PRIMARY = "flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-50";

export default function QuizPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedExam, setSelectedExam] = useState(null);

    const examsQ = useQuery({ queryKey: ['quiz', search, page], queryFn: () => quizApi.getAll({ search, page, limit: 10 }), keepPreviousData: true });
    const attemptsQ = useQuery({ queryKey: ['attempts', selectedExam?.id], queryFn: () => quizApi.getAttempts(selectedExam.id, { limit: 50 }), enabled: !!selectedExam });


    const exams = examsQ.data?.data?.data || [];
    const pagination = examsQ.data?.data?.pagination || {};
    const attempts = attemptsQ.data?.data?.data || [];

    return (
        <div className={`grid gap-5 ${selectedExam ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Danh sách kỳ thi */}
            <div className="space-y-4">
                <div className="flex gap-3 justify-between">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" placeholder="Tìm kỳ thi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <button className={BTN_PRIMARY} onClick={() => navigate('/admin/quiz/create')}>
                        <Plus size={16} /> Tạo kỳ thi
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-800">Danh sách Kỳ thi / Khảo sát</h2>
                        <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} kỳ thi</span>
                    </div>
                    <div className="overflow-x-auto">
                        {examsQ.isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                            : exams.length === 0 ? <div className="flex flex-col items-center py-12 gap-2 text-gray-400 text-sm"><BookOpen size={36} /><p>Chưa có kỳ thi nào</p></div>
                                : <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3 text-left">Tên kỳ thi</th><th className="px-4 py-3 text-left">Thời gian</th><th className="px-4 py-3 text-left">Điểm đạt</th><th className="px-4 py-3 text-left">Kết quả</th></tr></thead>
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
                                                <td className="px-4 py-3 text-gray-500 text-xs">{e.timeLimit ? `${e.timeLimit} phút` : '—'}</td>
                                                <td className="px-4 py-3"><span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{e.satisfactoryScore || 0} điểm</span></td>
                                                <td className="px-4 py-3">
                                                    <button className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition" onClick={() => setSelectedExam(selectedExam?.id === e.id ? null : e)}>
                                                        <Users size={13} /> Xem kết quả
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>}
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 px-5 py-4">
                            <button className="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white'}`}>{p}</button>
                            ))}
                            <button className="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
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
