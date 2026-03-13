import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, Network } from 'lucide-react';
import toast from 'react-hot-toast';
import { cellApi, branchApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

function CellModal({ cell, branches, onClose, onSave }) {
    const [form, setForm] = useState(cell || { code: '', name: '', unionBranchId: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{cell ? 'Cập nhật Chi đoàn' : 'Thêm Chi đoàn mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Liên chi đoàn (Khoa) *</label>
                        <select className={INPUT} value={form.unionBranchId} onChange={e => set('unionBranchId', e.target.value)}>
                            <option value="">-- Chọn Liên chi đoàn --</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mã Chi đoàn *</label>
                        <input className={INPUT} value={form.code} onChange={e => set('code', e.target.value)} placeholder="VD: CD-CNTT2024" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Chi đoàn *</label>
                        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Chi đoàn CNTT 20A" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu dữ liệu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function CellsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const { data: cellRes, isLoading } = useQuery({
        queryKey: ['cells'],
        queryFn: () => cellApi.getAll(),
    });

    const { data: branchRes } = useQuery({
        queryKey: ['branches-all'],
        queryFn: branchApi.getAll,
    });

    const cells = cellRes?.data?.data || [];
    const branches = branchRes?.data?.data || [];

    const filtered = cells.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.UnionBranch?.name.toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: cellApi.create,
        onSuccess: () => { qc.invalidateQueries(['cells']); setModal(null); toast.success('Đã thêm Chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => cellApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['cells']); setModal(null); toast.success('Đã cập nhật!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const deleteMutation = useMutation({
        mutationFn: cellApi.delete,
        onSuccess: () => { qc.invalidateQueries(['cells']); toast.success('Đã xóa!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const handleSave = (form) => {
        if (modal?.id) updateMutation.mutate({ id: modal.id, data: form });
        else createMutation.mutate(form);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap items-center justify-between">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-72 outline-none focus:border-primary-700 transition" 
                        placeholder="Tìm kiếm Chi đoàn..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}>
                    <Plus size={16} /> Thêm Chi đoàn
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm italic">Không tìm thấy dữ liệu</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Mã Chi đoàn</th>
                                    <th className="px-6 py-4">Tên Chi đoàn</th>
                                    <th className="px-6 py-4">Bí thư</th>
                                    <th className="px-6 py-4">Thuộc Liên chi đoàn</th>
                                    <th className="px-6 py-4 text-center">Đoàn viên</th>
                                    <th className="px-6 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono font-bold">
                                                {c.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
                                                    <Network size={16} />
                                                </div>
                                                <span className="font-bold text-gray-800">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.SecretaryOfCell ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">BT</div>
                                                    <span className="text-gray-700 font-medium">{c.SecretaryOfCell.fullName}</span>
                                                </div>
                                            ) : <span className="text-gray-400 italic text-xs">Chưa phân công</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-semibold">{c.UnionBranch?.name || '—'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block bg-primary-50 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                                                {c.memberCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(c)}>
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`}
                                                    onClick={async () => {
                                                        const res = await confirmDelete(c.name);
                                                        if (res.isConfirmed) deleteMutation.mutate(c.id);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
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

            {modal && <CellModal cell={modal === 'add' ? null : modal} branches={branches} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
