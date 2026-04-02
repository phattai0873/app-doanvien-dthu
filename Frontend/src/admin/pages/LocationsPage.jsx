import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { locationApi } from '../../services/api';
import { confirmDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

function LocationModal({ location, onClose, onSave }) {
    const [form, setForm] = useState(location || { name: '', address: '', description: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800">{location ? 'Cập nhật địa điểm' : 'Thêm địa điểm mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên địa điểm *</label>
                        <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Hội trường A, Phòng họp khoa..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ/Vị trí</label>
                        <input className={INPUT} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="VD: Tòa nhà C1..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                        <textarea className={INPUT} rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu địa điểm</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function LocationsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const { data: locData, isLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: () => locationApi.getAll()
    });

    const list = locData?.data?.data || [];
    const filtered = list.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    const saveMutation = useMutation({
        mutationFn: (data) => data.id ? locationApi.update(data.id, data) : locationApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries(['locations']);
            toast.success('Đã lưu địa điểm');
            setModal(null);
        },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const deleteMutation = useMutation({
        mutationFn: locationApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['locations']);
            toast.success('Đã xóa địa điểm');
        },
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const handleDelete = async (id) => {
        if (await confirmDelete('Bạn có chắc muốn xóa địa điểm này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-800">Địa điểm sinh hoạt</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Quản lý danh mục nơi tổ chức cuộc họp/hoạt động</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition" size={18} />
                        <input
                            className="pl-10 pr-4 py-2 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-xl text-sm outline-none transition w-64"
                            placeholder="Tìm kiếm địa điểm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className={BTN_PRIMARY} onClick={() => setModal({})}>
                        <Plus size={18} />
                        Thêm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div></div>
                ) : filtered.length > 0 ? (
                    filtered.map(loc => (
                        <div key={loc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-primary-600">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => setModal(loc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Chỉnh sửa">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">{loc.name}</h3>
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                {loc.address || 'Chưa cập nhật địa chỉ'}
                            </p>
                            {loc.description && (
                                <p className="text-[11px] text-gray-400 italic line-clamp-2">
                                    {loc.description}
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">Không tìm thấy địa điểm nào</p>
                    </div>
                )}
            </div>

            {modal && (
                <LocationModal
                    location={modal.id ? modal : null}
                    onClose={() => setModal(null)}
                    onSave={saveMutation.mutate}
                />
            )}
        </div>
    );
}
