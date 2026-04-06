import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Pencil, Trash2, Star, QrCode, RotateCw, Download, Copy, Users, CheckCircle2, XCircle, RotateCcw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const ACTIVITY_STATUS = [
    { value: 'DRAFT', label: 'Bản nháp', color: 'bg-gray-100 text-gray-600' },
    { value: 'PENDING_APPROVAL', label: 'Chờ duyệt', color: 'bg-orange-100 text-orange-700' },
    { value: 'APPROVED', label: 'Sắp diễn ra', color: 'bg-green-100 text-green-700' },
    { value: 'REJECTED', label: 'Từ chối', color: 'bg-red-100 text-red-700' },
    { value: 'IN_PROGRESS', label: 'Đang diễn ra', color: 'bg-blue-100 text-blue-700' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-purple-100 text-purple-700' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-gray-500 text-white' },
];

const ACTIVITY_LEVELS = [
    { value: 'SCHOOL', label: 'Cấp Trường' },
    { value: 'BRANCH', label: 'Cấp Khoa' },
    { value: 'CELL', label: 'Cấp Lớp' },
];

function ActivityModal({ activity, onClose, onSave }) {
    const [form, setForm] = useState(activity || { 
        title: '', description: '', location: '', startDate: '', endDate: '', 
        type: 'Hoạt động', level: 'BRANCH', status: 'DRAFT', category: 'OTHER',
        point: 0, maxParticipants: ''
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 uppercase tracking-tight">{activity ? 'Cập nhật Hoạt động' : 'Thêm Hoạt động mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tên hoạt động *</label>
                        <input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Hiến máu nhân đạo 2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cấp độ tổ chức</label>
                            <select className={INPUT} value={form.level} onChange={e => set('level', e.target.value)}>
                                {ACTIVITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Phân mục</label>
                            <select className={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
                                <option value="VOLUNTARY">Tình nguyện</option>
                                <option value="ACADEMIC">Học thuật</option>
                                <option value="SPORTS">Thể thao</option>
                                <option value="CULTURE">Văn hóa</option>
                                <option value="POLITICAL">Chính trị</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ngày bắt đầu</label>
                            <input type="datetime-local" className={INPUT} value={form.startDate?.slice(0, 16) || ''} onChange={e => set('startDate', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ngày kết thúc</label>
                            <input type="datetime-local" className={INPUT} value={form.endDate?.slice(0, 16) || ''} onChange={e => set('endDate', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Số lượng tối đa</label>
                            <input type="number" className={INPUT} value={form.maxParticipants || ''} onChange={e => set('maxParticipants', e.target.value)} placeholder="Không giới hạn" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Hiệu lực QR (phút)</label>
                            <input type="number" className={INPUT} value={form.checkinTTL || 15} onChange={e => set('checkinTTL', parseInt(e.target.value))} />
                        </div>
                    </div>
                    <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Địa điểm</label><input className={INPUT} value={form.location || ''} onChange={e => set('location', e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Mô tả chi tiết</label><textarea className={INPUT} rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Gửi phê duyệt</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function QRModal({ title, code, expiresAt, onRefresh, onClose }) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${code}`;
    const [timeLeft, setTimeLeft] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    React.useEffect(() => {
        if (!expiresAt) return;
        const timer = setInterval(() => {
            const diff = new Date(expiresAt) - new Date();
            if (diff <= 0) {
                setTimeLeft('Đã hết hạn');
                clearInterval(timer);
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-qr-${code}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            toast.error('Không thể tải QR. Thử lại sau.');
        }
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
                <div className="w-full flex justify-between items-start mb-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest text-left pr-4">Mã điểm danh: {title}</h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition">✕</button>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6 relative group">
                    <img src={qrUrl} alt="QR Code" className={`w-48 h-48 mix-blend-multiply transition ${refreshing ? 'opacity-30 blur-sm' : ''}`} />
                    {refreshing && <div className="absolute inset-0 flex items-center justify-center"><RotateCw className="animate-spin text-primary-700" size={32} /></div>}
                    
                    {!refreshing && (
                        <button 
                            onClick={handleDownload}
                            className="absolute -bottom-3 -right-3 bg-white w-10 h-10 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-primary-700 hover:bg-primary-50 transition"
                            title="Tải về bộ mã QR"
                        >
                            <Download size={18} />
                        </button>
                    )}
                </div>

                <div className="text-center mb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Mã xác thực hoạt động</p>
                    <div className="flex items-center justify-center gap-3">
                        <p className="text-4xl font-black text-primary-700 tracking-[0.2em]">{code}</p>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(code);
                                toast.success('Đã sao chép mã!');
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary-700 transition"
                            title="Sao chép mã"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                    {expiresAt && (
                        <div className="mt-3 flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${timeLeft === 'Đã hết hạn' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                Hết hạn sau: {timeLeft}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400">
                                Hiệu lực đến: {new Date(expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(expiresAt).toLocaleDateString('vi-VN')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl transition disabled:opacity-50"
                    >
                        <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Làm mới mã (15 phút)
                    </button>
                    <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">Đóng</button>
                </div>
            </div>
        </ModalPortal>
    );
}

export default function ActivitiesPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [cellFilter, setCellFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    const [showQR, setShowQR] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data, isLoading } = useQuery({ 
        queryKey: ['activities', search, page, levelFilter, branchFilter, cellFilter, statusFilter, showTrash], 
        queryFn: () => activityApi.getAll({ 
            search, page, limit: 10, 
            level: levelFilter || undefined, 
            status: statusFilter || undefined,
            unionBranchId: branchFilter || undefined,
            unionCellId: cellFilter || undefined,
            onlyDeleted: showTrash
        }), 
        keepPreviousData: true 
    });
    
    const { data: branchesRes } = useQuery({ queryKey: ['union-branches'], queryFn: () => activityApi.getBranches() });
    const { data: cellsRes } = useQuery({ 
        queryKey: ['union-cells', branchFilter], 
        queryFn: () => activityApi.getCells(branchFilter),
        enabled: !!branchFilter 
    });
    const branches = branchesRes?.data?.data || [];
    const cells = cellsRes?.data?.data || [];
    
    const activities = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: activityApi.create, onSuccess: () => { qc.invalidateQueries(['activities']); setModal(null); toast.success('Đã gửi yêu cầu phê duyệt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => activityApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['activities']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: activityApi.delete, onSuccess: () => { qc.invalidateQueries(['activities']); toast.success('Đã chuyển hoạt động vào thùng rác!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const restoreMutation = useMutation({ mutationFn: activityApi.restore, onSuccess: () => { qc.invalidateQueries(['activities']); toast.success('Đã khôi phục hoạt động!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const forceDeleteMutation = useMutation({ mutationFn: activityApi.forceDelete, onSuccess: () => { qc.invalidateQueries(['activities']); toast.success('Đã xóa vĩnh viễn!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const approveMutation = useMutation({ 
        mutationFn: activityApi.approve, 
        onSuccess: () => { qc.invalidateQueries(['activities']); toast.success('Đã phê duyệt hoạt động!'); }, 
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!') 
    });
    const refreshCodeMutation = useMutation({ 
        mutationFn: (id) => activityApi.refreshCode(id, { checkinTTL: 15 }), 
        onSuccess: (res) => { 
            qc.invalidateQueries(['activities']); 
            setShowQR(prev => ({ ...prev, code: res.data.data.checkinCode, expiresAt: res.data.data.checkinCodeExpiresAt }));
            toast.success('Đã làm mới mã điểm danh (15 phút)!'); 
        }, 
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!') 
    });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate({ ...form, status: 'PENDING_APPROVAL' });

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition" placeholder="Tìm kiếm hoạt động..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}>
                    <option value="">Tất cả cấp độ</option>
                    {ACTIVITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setCellFilter(''); setPage(1); }}>
                    <option value="">Liên chi đoàn (Khoa)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {branchFilter && (
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white" value={cellFilter} onChange={e => { setCellFilter(e.target.value); setPage(1); }}>
                        <option value="">Chi đoàn (Lớp)</option>
                        {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Tất cả trạng thái</option>
                    {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                
                {hasPermission('activity:delete') && (
                    <button 
                        onClick={() => { setShowTrash(!showTrash); setPage(1); }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border-2 
                            ${showTrash 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <History size={16} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                    </button>
                )}

                {!showTrash && (
                    <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Tạo hoạt động mới</button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{showTrash ? 'Thùng rác Hoạt động' : 'Hệ thống Quản lý Hoạt động'}</h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm shadow-primary-200">{pagination.total || 0} mục</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : activities.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm font-medium italic">Không tìm thấy hoạt động nào phù hợp</div>
                            : <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 w-40">Cấp độ / Phân loại</th>
                                        <th className="px-6 py-4">Tên hoạt động & Thời gian</th>
                                        <th className="px-6 py-4">Đơn vị tổ chức</th>
                                        <th className="px-6 py-4 text-center">Mã QR</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activities.map(a => {
                                        const statusObj = ACTIVITY_STATUS.find(s => s.value === a.status) || ACTIVITY_STATUS[0];
                                        const levelObj = ACTIVITY_LEVELS.find(l => l.value === a.level) || ACTIVITY_LEVELS[1];
                                        return (
                                            <tr key={a.id} className="hover:bg-gray-50/50 transition border-l-4 border-l-transparent hover:border-l-primary-700">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 py-0.5 border border-gray-200 rounded w-fit">{levelObj.label}</span>
                                                        <span className="text-[10px] font-black text-primary-700 uppercase tracking-tight">{a.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 text-sm leading-tight mb-1">{a.title}</span>
                                                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-1 italic">{a.description || 'Chưa có mô tả'}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                            <span>Ngày: {a.startDate ? new Date(a.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                                                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                            <span className="truncate max-w-[120px]">{a.location || '—'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-gray-700 uppercase">{a.OrganizerBranch?.name || a.OrganizerCell?.name || 'Đoàn trường'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded text-xs border border-primary-100">
                                                        {a.checkinCode || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <select
                                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-0 outline-none cursor-pointer shadow-xs ${statusObj.color}`}
                                                        value={a.status}
                                                        onChange={e => updateMutation.mutate({ id: a.id, data: { status: e.target.value } })}
                                                    >
                                                        {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 justify-center">
                                                        {!showTrash ? (
                                                            <>
                                                                {a.status === 'PENDING_APPROVAL' && (
                                                                    <button 
                                                                        className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 shadow-sm`}
                                                                        title="Phê duyệt hoạt động"
                                                                        onClick={() => approveMutation.mutate(a.id)}
                                                                    >
                                                                        <Star size={16} fill="currentColor" />
                                                                    </button>
                                                                )}
                                                                {a.checkinCode && (
                                                                    <button 
                                                                        className={`${BTN_ICON} bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 shadow-sm`}
                                                                        title="Hiển thị QR Check-in"
                                                                        onClick={() => setShowQR({ id: a.id, title: a.title, code: a.checkinCode, expiresAt: a.checkinCodeExpiresAt })}
                                                                    >
                                                                        <QrCode size={16} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm`}
                                                                    title="Danh sách tham gia"
                                                                    onClick={() => navigate(`${a.id}/participants`)}
                                                                >
                                                                    <Users size={16} />
                                                                </button>
                                                                <button className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`} onClick={() => setModal(a)}><Pencil size={16} /></button>
                                                                <button className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`} onClick={async () => {
                                                                    const result = await confirmDelete(a.title);
                                                                    if (result.isConfirmed) deleteMutation.mutate(a.id);
                                                                }}><Trash2 size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 shadow-sm`}
                                                                    title="Khôi phục"
                                                                    onClick={async () => {
                                                                        const result = await confirmRestore(a.title);
                                                                        if (result.isConfirmed) restoreMutation.mutate(a.id);
                                                                    }}
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 shadow-sm`}
                                                                    title="Xóa vĩnh viễn"
                                                                    onClick={async () => {
                                                                        const result = await confirmForceDelete(a.title);
                                                                        if (result.isConfirmed) forceDeleteMutation.mutate(a.id);
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
            {modal && <ActivityModal activity={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {showQR && (
                <QRModal 
                    title={showQR.title} 
                    code={showQR.code} 
                    expiresAt={showQR.expiresAt}
                    onRefresh={() => refreshCodeMutation.mutateAsync(showQR.id)}
                    onClose={() => setShowQR(null)} 
                />
            )}
        </div>
    );
}
