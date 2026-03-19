import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle, Plus, User, Calendar, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalPortal from '../../components/ModalPortal';
import api, { feeApi, cellApi, memberApi } from '../../services/api';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

function CreateFeeModal({ cells, onClose, onSave }) {
    const [form, setForm] = useState({ unionMemberId: '', period: '', amount: '10000', paymentDate: new Date().toISOString().split('T')[0], note: '', unionCellId: '' });
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);

    const { data: membersRes, isLoading: loadingMembers } = useQuery({
        queryKey: ['members-search', memberSearch],
        queryFn: () => memberApi.getAll({ search: memberSearch, limit: 5 }),
        enabled: memberSearch.length > 2
    });
    const members = membersRes?.data?.data || [];

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSelectMember = (m) => {
        setSelectedMember(m);
        set('unionMemberId', m.id);
        set('unionCellId', m.unionCellId || '');
        setMemberSearch('');
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Thêm bản ghi nộp phí</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    {/* Tìm kiếm Đoàn viên */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tìm Đoàn viên *</label>
                        {selectedMember ? (
                            <div className="flex items-center justify-between bg-primary-50 p-2 rounded-lg border border-primary-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700"><User size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{selectedMember.fullName}</p>
                                        <p className="text-[10px] text-gray-500">{selectedMember.memberCode}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedMember(null)} className="text-xs text-red-500 hover:underline">Thay đổi</button>
                            </div>
                        ) : (
                            <>
                                <input
                                    className={INPUT}
                                    placeholder="Nhập tên hoặc mã đoàn viên..."
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                />
                                {memberSearch.length > 2 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                                        {loadingMembers ? (
                                            <div className="p-3 text-center text-xs text-gray-400 italic">Đang tìm...</div>
                                        ) : members.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-gray-400 italic">Không thấy kết quả</div>
                                        ) : (
                                            members.map(m => (
                                                <button
                                                    key={m.id}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-0 border-gray-100 transition"
                                                    onClick={() => handleSelectMember(m)}
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{m.fullName}</p>
                                                        <p className="text-[10px] text-gray-500">{m.memberCode} - {m.UnionCell?.name}</p>
                                                    </div>
                                                    <Plus size={14} className="text-primary-600" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Kỳ nộp *</label>
                            <input className={INPUT} placeholder="VD: Q1/2026" value={form.period} onChange={e => set('period', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Số tiền (VNĐ) *</label>
                            <input type="number" className={INPUT} value={form.amount} onChange={e => set('amount', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày nộp</label>
                        <input type="date" className={INPUT} value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
                        <textarea className={`${INPUT} h-20 resize-none`} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Nhập ghi chú nếu có..." />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button
                        className={BTN_PRIMARY}
                        onClick={() => onSave(form)}
                        disabled={!form.unionMemberId || !form.period || !form.amount}
                    >
                        Xác nhận nộp
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function FeesPage() {
    const [period, setPeriod] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState('paid');
    const [selectedCell, setSelectedCell] = useState('');
    const [modal, setModal] = useState(false);

    const qc = useQueryClient();

    const { data: cellsRes } = useQuery({ queryKey: ['cells'], queryFn: () => cellApi.getAll() });
    const cells = cellsRes?.data?.data || [];

    const paidQ = useQuery({ queryKey: ['fees', period, selectedCell, search, page], queryFn: () => feeApi.getAll({ period, unionCellId: selectedCell, search, page, limit: 10 }), enabled: tab === 'paid' });
    const unpaidQ = useQuery({ queryKey: ['unpaid', period, selectedCell, search, page], queryFn: () => feeApi.getUnpaid({ period, unionCellId: selectedCell, search, page, limit: 10 }), enabled: tab === 'unpaid' && !!period });
    const activeQ = tab === 'paid' ? paidQ : unpaidQ;
    const rows = activeQ.data?.data?.data || [];
    const pagination = activeQ.data?.data?.pagination || {};

    const createMutation = useMutation({
        mutationFn: feeApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['fees']);
            qc.invalidateQueries(['unpaid']);
            setModal(false);
            toast.success('Đã ghi nhận nộp phí!');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status, note }) => feeApi.updateStatus(id, { status, note }),
        onSuccess: () => {
            qc.invalidateQueries(['fees']);
            toast.success('Đã cập nhật trạng thái!');
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const handleSave = (form) => createMutation.mutate(form);
    const handleStatusUpdate = (id, status) => {
        const note = status === 'rejected' ? prompt('Lý do từ chối:') : '';
        if (status === 'rejected' && note === null) return;
        statusMutation.mutate({ id, status, note });
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap items-center">
                <select
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition"
                    style={{ width: 220 }}
                    value={selectedCell}
                    onChange={e => { setSelectedCell(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả Chi đoàn</option>
                    {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition" style={{ width: 150 }} placeholder="Kỳ: VD Q1/2026" value={period} onChange={e => setPeriod(e.target.value)} />
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-primary-700 transition" placeholder="Tìm đoàn viên..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${tab === 'paid' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setTab('paid')}>Đã nộp</button>
                    <button className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${tab === 'unpaid' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => setTab('unpaid')}>Chưa nộp</button>
                </div>
                <div className="flex-grow" />
                <button className={BTN_PRIMARY} onClick={() => setModal(true)}>
                    <Plus size={16} /> Ghi nhận nộp phí
                </button>
            </div>

            {tab === 'unpaid' && !period && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    Nhập kỳ (ví dụ: Q1/2026) để xem danh sách chưa nộp phí
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">{tab === 'paid' ? 'Lịch sử nộp đoàn phí' : `Chưa nộp phí kỳ ${period || '...'}`}</h2>
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-3 py-1 rounded-full">{pagination.total || 0} bản ghi</span>
                </div>
                <div className="overflow-x-auto">
                    {activeQ.isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : rows.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Không có dữ liệu</div>
                            : tab === 'paid' ? (
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3 text-left">Đoàn viên</th><th className="px-4 py-3 text-left">Mã ĐV</th><th className="px-4 py-3 text-left">Chi đoàn</th><th className="px-4 py-3 text-left">Kỳ</th><th className="px-4 py-3 text-left">Số tiền</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">Bằng chứng</th><th className="px-4 py-3 text-left">Thao tác</th><th className="px-4 py-3 text-left">Ngày nộp</th></tr></thead>
                                    <tbody>
                                        {rows.map(r => (
                                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-semibold">{r.UnionMember?.fullName || '—'}</td>
                                                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">{r.UnionMember?.memberCode}</span></td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{r.UnionCell?.name || '—'}</td>
                                                <td className="px-4 py-3"><span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">{r.period}</span></td>
                                                <td className="px-4 py-3 font-bold text-primary-700">{r.amount?.toLocaleString('vi-VN')}đ</td>
                                                <td className="px-4 py-3">
                                                    {r.status === 'paid' ? <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded bg-green-100 text-green-700">Đã nộp</span>
                                                        : r.status === 'pending' ? <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded bg-orange-100 text-orange-700">Chờ duyệt</span>
                                                            : <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded bg-red-100 text-red-700">Từ chối</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    {r.evidenceImage ? (
                                                        <a href={`http://localhost:5000${r.evidenceImage}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs flex items-center gap-1">
                                                            <CreditCard size={12} /> Xem ảnh
                                                        </a>
                                                    ) : <span className="text-gray-300 text-xs italic">Không có</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {r.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleStatusUpdate(r.id, 'paid')}
                                                                className="text-[10px] font-bold text-green-600 hover:underline"
                                                            >
                                                                Duyệt
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusUpdate(r.id, 'rejected')}
                                                                className="text-[10px] font-bold text-red-600 hover:underline"
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('vi-VN') : '—'}</td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{r.note || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-3 text-left">Họ tên</th><th className="px-4 py-3 text-left">Mã ĐV</th><th className="px-4 py-3 text-left">Chi đoàn</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">SĐT</th></tr></thead>
                                    <tbody>
                                        {rows.map(r => (
                                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-semibold">{r.fullName}</td>
                                                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">{r.memberCode}</span></td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{r.UnionCell?.name || '—'}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{r.email || '—'}</td>
                                                <td className="px-4 py-3">{r.phoneNumber || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
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
            {modal && <CreateFeeModal cells={cells} onClose={() => setModal(false)} onSave={handleSave} />}
        </div>
    );
}
