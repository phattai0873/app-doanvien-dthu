import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { branchApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

function BranchModal({ branch, onClose, onSave }) {
    const [form, setForm] = useState(branch || { code: '', name: '', partyLevel: 'Cấp Khoa', officeAddress: '', phoneNumber: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{branch ? 'Cập nhật Liên chi đoàn' : 'Thêm Liên chi đoàn mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mã đơn vị *</label>
                        <input className={INPUT} value={form.code} onChange={e => set('code', e.target.value)} placeholder="VD: LCD-CNTT" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Liên chi đoàn *</label>
                        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Liên chi đoàn Khoa CNTT" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Cấp quản lý</label>
                        <input className={INPUT} value={form.partyLevel} onChange={e => set('partyLevel', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Văn phòng / Địa chỉ</label>
                        <input className={INPUT} value={form.officeAddress} onChange={e => set('officeAddress', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại liên hệ</label>
                        <input className={INPUT} value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
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

export default function BranchesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const { data: res, isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchApi.getAll(),
    });

    const branches = res?.data?.data || [];
    const filtered = branches.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        b.code.toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: branchApi.create,
        onSuccess: () => { qc.invalidateQueries(['branches']); setModal(null); toast.success('Đã thêm Liên chi đoàn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => branchApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['branches']); setModal(null); toast.success('Đã cập nhật!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    });

    const deleteMutation = useMutation({
        mutationFn: branchApi.delete,
        onSuccess: () => { qc.invalidateQueries(['branches']); toast.success('Đã xóa!'); },
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
                        placeholder="Tìm kiếm Liên chi đoàn..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <button className={BTN_PRIMARY} onClick={() => setModal('add')}>
                    <Plus size={16} /> Thêm Liên chi đoàn
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
                                    <th className="px-6 py-4">Mã LCĐ</th>
                                    <th className="px-6 py-4">Tên Liên chi đoàn</th>
                                    <th className="px-6 py-4">Bí thư</th>
                                    <th className="px-6 py-4">Địa chỉ / VP</th>
                                    <th className="px-6 py-4">SĐT</th>
                                    <th className="px-6 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono font-bold">
                                                {b.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="font-bold text-gray-800">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {b.SecretaryOfBranch ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">BT</div>
                                                    <span className="text-gray-700 font-medium">{b.SecretaryOfBranch.fullName}</span>
                                                </div>
                                            ) : <span className="text-gray-400 italic text-xs">Chưa phân công</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{b.officeAddress || '—'}</td>
                                        <td className="px-6 py-4 text-gray-500">{b.phoneNumber || '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className={`${BTN_ICON} bg-gray-100 hover:bg-gray-200 text-gray-600`} onClick={() => setModal(b)}>
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600`}
                                                    onClick={async () => {
                                                        const res = await confirmDelete(b.name);
                                                        if (res.isConfirmed) deleteMutation.mutate(b.id);
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

            {modal && <BranchModal branch={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
}
