import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, RotateCcw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { bannerApi } from '../../services/api';
import { confirmDelete, confirmAction, confirmRestore, confirmForceDelete } from '../../utils/swal';

const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function BannersPage() {
    const qc = useQueryClient();
    const [uploadingSlot, setUploadingSlot] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['banners', showTrash],
        queryFn: () => bannerApi.getAll({ onlyDeleted: showTrash })
    });

    const banners = data?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: bannerApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['banners']);
            toast.success('Đã cập nhật banner!');
            setUploadingSlot(null);
        },
        onError: (e) => {
            toast.error(e.response?.data?.message || 'Lỗi khi tải lên!');
            setUploadingSlot(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: bannerApi.delete,
        onSuccess: () => { qc.invalidateQueries(['banners']); toast.success('Đã chuyển banner vào thùng rác!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const restoreMutation = useMutation({
        mutationFn: bannerApi.restore,
        onSuccess: () => { qc.invalidateQueries(['banners']); toast.success('Đã khôi phục banner!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const forceDeleteMutation = useMutation({
        mutationFn: bannerApi.forceDelete,
        onSuccess: () => { qc.invalidateQueries(['banners']); toast.success('Đã xóa vĩnh viễn!'); },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
    });

    const handleFileUpload = async (e, order) => {
        const file = e.target.files[0];
        if (!file) return;

        // Nếu slot đã có ảnh, có thể xóa cũ hoặc ghi đè (tùy backend ntn)
        // Ở đây ta cứ gửi order lên, backend nên xử lý update nếu trung order
        // Hoặc đơn giản là xóa cái cũ cùng order nếu có
        const existing = banners.find(b => b.order === order);
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', `Banner ${order}`);
        formData.append('order', order);

        setUploadingSlot(order);
        
        if (existing) {
            // Xóa cái cũ trước để đảm bảo chỉ có 1 ảnh cho 1 slot
            await bannerApi.delete(existing.id);
        }
        
        createMutation.mutate(formData);
    };

    const BannerSlot = ({ order }) => {
        const banner = banners.find(b => b.order === order);
        const isUploading = uploadingSlot === order;

        return (
            <div className={`relative bg-white rounded-xl border-2 ${banner ? 'border-gray-200' : 'border-dashed border-gray-300'} overflow-hidden shadow-sm transition-all hover:shadow-md`}>
                <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center relative">
                    {banner ? (
                        <img 
                            src={`${BASE_URL}${banner.imageUrl}`} 
                            alt={`Slot ${order}`} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <ImageIcon size={32} className="mb-2 opacity-30" />
                            <span className="text-sm font-medium">Slot {order} (Trống)</span>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    <label className="absolute inset-0 cursor-pointer group">
                        <div className="absolute inset-0 bg-primary-700/0 group-hover:bg-primary-700/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Plus size={24} className="text-white" />
                            <span className="ml-2 text-white font-bold">Thay ảnh</span>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, order)} 
                            disabled={!!uploadingSlot} 
                        />
                    </label>
                </div>
                
                <div className="p-3 flex items-center justify-between bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Vị trí {order}
                    </span>
                    {banner && (
                        <button 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            onClick={async () => {
                                const res = await confirmDelete(`banner ở vị trí ${order}`);
                                if (res.isConfirmed) deleteMutation.mutate(banner.id);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-primary-700">Quản lý Banner (3 Vị trí)</h1>
                <p className="text-sm text-gray-500">Hệ thống Carousel trên Mobile hỗ trợ hiển thị tối đa 3 banner. Vui lòng chọn hình ảnh cho từng vị trí bên dưới.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[16/9] bg-gray-200 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BannerSlot order={1} />
                    <BannerSlot order={2} />
                    <BannerSlot order={3} />
                </div>
            )}
            
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex gap-3">
                <ImageIcon className="text-primary-600 flex-shrink-0" size={20} />
                <p className="text-xs text-primary-800 leading-relaxed">
                    <strong>Mẹo:</strong> Sử dụng hình ảnh có tỷ lệ <strong>16:9</strong> (ví dụ: 1280x720px) để hiển thị đẹp nhất trên tất cả các thiết bị. Nhấn trực tiếp vào ô để thay đổi hình ảnh.
                </p>
            </div>

            {/* Banner Management List */}
            <div className="mt-10 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-gray-700">{showTrash ? 'Thùng rác Banner' : 'Danh sách dữ liệu Banner trong hệ thống'}</h2>
                        <p className="text-xs text-gray-500 mt-1">Dưới đây là tất cả banner hiện có trong database. Bạn có thể xóa các banner dư thừa nếu thấy Mobile bị lặp lại.</p>
                    </div>
                    <button 
                        onClick={() => setShowTrash(!showTrash)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border-2 
                            ${showTrash 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <History size={16} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Ảnh</th>
                                <th className="px-4 py-3">Tiêu đề / Vị trí</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {banners.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">Chưa có banner nào</td>
                                </tr>
                            ) : (
                                banners.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-4 py-3">
                                            <img 
                                                src={`${BASE_URL}${b.imageUrl}`} 
                                                className="w-20 h-12 object-cover rounded border border-gray-200"
                                                alt="" 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{b.title}</div>
                                            <div className="text-xs text-gray-500">Vị trí: {b.order}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {b.isActive ? 'Đang bật' : 'Đang tắt'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {!showTrash ? (
                                                    <button 
                                                        onClick={async () => {
                                                            const res = await confirmDelete(`banner "${b.title}"`);
                                                            if (res.isConfirmed) deleteMutation.mutate(b.id);
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={async () => {
                                                                const res = await confirmRestore(`banner "${b.title}"`);
                                                                if (res.isConfirmed) restoreMutation.mutate(b.id);
                                                            }}
                                                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition"
                                                            title="Khôi phục"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                const res = await confirmForceDelete(`banner "${b.title}"`);
                                                                if (res.isConfirmed) forceDeleteMutation.mutate(b.id);
                                                            }}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                            title="Xóa vĩnh viễn"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
