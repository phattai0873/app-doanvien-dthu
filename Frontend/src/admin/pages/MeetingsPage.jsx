import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Pencil, Trash2, Users, QrCode, RotateCw, Download, Copy, MapPin, History, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingApi, cellApi, locationApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const STATUS_CONFIG = {
    'DRAFT': { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-600' },
    'SCHEDULED': { label: 'Đã lên lịch', cls: 'bg-yellow-100 text-yellow-700' },
    'IN_PROGRESS': { label: 'Đang diễn ra', cls: 'bg-blue-100 text-blue-700' },
    'COMPLETED': { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
    'CANCELLED': { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
};

const MEETING_LEVELS = [
    { value: 'SCHOOL', label: 'Cấp Trường' },
    { value: 'BRANCH', label: 'Cấp Khoa' },
    { value: 'CELL', label: 'Cấp Lớp' },
];

function MeetingModal({ meeting, cells, locations, onClose, onSave }) {
    const [form, setForm] = useState(meeting || {
        title: '', content: '', meetingTime: '', locationId: '', 
        level: 'CELL', type: 'ROUTINE', semester: 1, academicYear: '2024-2025',
        organizerCellId: '', organizerBranchId: ''
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                    <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">
                        {meeting ? 'Cập nhật Buổi họp' : 'Lên lịch họp mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tiêu đề cuộc họp *</label>
                        <input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Sinh hoạt định kỳ tháng 3" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cấp độ</label>
                            <select className={INPUT} value={form.level} onChange={e => set('level', e.target.value)}>
                                {MEETING_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Loại hình</label>
                            <select className={INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                                <option value="ROUTINE">Định kỳ</option>
                                <option value="THEMATIC">Chuyên đề</option>
                                <option value="CONGRESS">Đại hội</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Học kỳ</label>
                            <select className={INPUT} value={form.semester} onChange={e => set('semester', parseInt(e.target.value))}>
                                <option value={1}>Học kỳ 1</option>
                                <option value={2}>Học kỳ 2</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Năm học</label>
                            <input className={INPUT} value={form.academicYear} onChange={e => set('academicYear', e.target.value)} placeholder="2024-2025" />
                        </div>
                    </div>

                    {form.level === 'CELL' && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Chi đoàn tổ chức</label>
                            <select className={INPUT} value={form.organizerCellId || ''} onChange={e => set('organizerCellId', e.target.value)}>
                                <option value="">-- Chọn chi đoàn --</option>
                                {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Thời gian bắt đầu *</label>
                            <input type="datetime-local" className={INPUT} value={form.meetingTime?.slice(0, 16) || ''} onChange={e => set('meetingTime', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Thời gian hiệu lực QR (phút)</label>
                            <input type="number" className={INPUT} value={form.checkinTTL || 15} onChange={e => set('checkinTTL', parseInt(e.target.value))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Địa điểm *</label>
                        <select className={INPUT} value={form.locationId || ''} onChange={e => set('locationId', e.target.value)}>
                            <option value="">-- Chọn địa điểm --</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nội dung tóm tắt</label>
                        <textarea className={INPUT} rows={3} value={form.content || ''} onChange={e => set('content', e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Đóng</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu lịch họp</button>
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
            a.download = `meeting-qr-${code}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            toast.error('Không thể tải QR. Thử lại sau.');
        }
    };

    return (
        <ModalPortal onAttemptClose={onClose}>
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Mã xác thực</p>
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

export default function MeetingsPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    const [showQR, setShowQR] = useState(null);
    const [levelFilter, setLevelFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [showTrash, setShowTrash] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['meetings', search, page, levelFilter, typeFilter, semesterFilter, showTrash],
        queryFn: () => meetingApi.getAll({ 
            search, page, limit: 10, 
            level: levelFilter || undefined, 
            type: typeFilter || undefined,
            semester: semesterFilter || undefined,
            onlyDeleted: showTrash
        }),
        keepPreviousData: true,
    });
    const { data: cellsData } = useQuery({ queryKey: ['cells-all'], queryFn: () => cellApi.getAll({}) });
    const { data: locationsData } = useQuery({ queryKey: ['locations-all'], queryFn: () => locationApi.getAll() });

    const meetings = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};
    const cells = cellsData?.data?.data || [];
    const locations = locationsData?.data?.data || [];

    const createMutation = useMutation({ mutationFn: meetingApi.create, onSuccess: () => { qc.invalidateQueries(['meetings']); setModal(null); toast.success('Đã tạo lịch họp thành công!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => meetingApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['meetings']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: meetingApi.delete, onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã chuyển lịch họp vào thùng rác!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const restoreMutation = useMutation({ mutationFn: meetingApi.restore, onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã khôi phục lịch họp!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const forceDeleteMutation = useMutation({ mutationFn: meetingApi.forceDelete, onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã xóa vĩnh viễn!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const statusMutation = useMutation({ mutationFn: ({ id, status }) => meetingApi.updateStatus(id, status), onSuccess: () => { qc.invalidateQueries(['meetings']); toast.success('Đã cập nhật trạng thái!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const refreshCodeMutation = useMutation({ 
        mutationFn: (id) => meetingApi.refreshCode(id, { checkinTTL: 15 }), 
        onSuccess: (res) => { 
            qc.invalidateQueries(['meetings']); 
            setShowQR(prev => ({ ...prev, code: res.data.data.checkinCode, expiresAt: res.data.data.checkinCodeExpiresAt }));
            toast.success('Đã làm mới mã điểm danh (15 phút)!'); 
        }, 
        onError: e => toast.error(e.response?.data?.message || 'Lỗi!') 
    });

    const handleSave = (form) => {
        const payload = { ...form };
        if (payload.id) updateMutation.mutate({ id: payload.id, data: payload });
        else {
            payload.status = 'SCHEDULED'; // Mặc định tạo xong là lên lịch
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 flex-wrap bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition shadow-sm" placeholder="Tìm kiếm phiên họp..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white shadow-sm" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}>
                    <option value="">Cấp độ</option>
                    {MEETING_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white shadow-sm" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                    <option value="">Loại hình</option>
                    <option value="ROUTINE">Định kỳ</option>
                    <option value="THEMATIC">Chuyên đề</option>
                    <option value="CONGRESS">Đại hội</option>
                </select>
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition font-medium bg-white shadow-sm" value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setPage(1); }}>
                    <option value="">Học kỳ</option>
                    <option value="1">HK 1</option>
                    <option value="2">HK 2</option>
                </select>
                <div className="flex-1"></div>
                <Link to="/admin/locations" className={BTN_SECONDARY}>
                    <MapPin size={16} />
                    Quản lý địa điểm
                </Link>
                {hasPermission('meeting:delete') && (
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
                    <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Plus size={16} /> Lên lịch họp mới</button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{showTrash ? 'Thùng rác Cuộc họp' : 'Danh sách họp & Sinh hoạt'}</h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest">{pagination.total || 0} bản ghi</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                        : meetings.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm font-medium italic italic underline">Chưa có dữ liệu phiên họp nào</div>
                            : <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Tổ chức</th>
                                        <th className="px-6 py-4">Thông tin phiên họp</th>
                                        <th className="px-6 py-4">Thời gian & Địa điểm</th>
                                        <th className="px-6 py-4 text-center">Mã Check-in</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {meetings.map(m => {
                                        const st = STATUS_CONFIG[m.status] || { label: m.status, cls: 'bg-gray-100 text-gray-600' };
                                        return (
                                            <tr key={m.id} className="hover:bg-gray-50/50 transition border-l-4 border-l-transparent hover:border-l-primary-700">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.level}</span>
                                                        <span className="font-bold text-gray-700 uppercase tracking-tight text-[11px] leading-tight">
                                                            {m.OrganizerCell?.name || m.OrganizerBranch?.name || 'Đoàn trường'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 text-[13px] leading-tight mb-0.5">{m.title}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">
                                                            {m.type} • HK{m.semester} • {m.academicYear}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-gray-700">{m.meetingTime ? new Date(m.meetingTime).toLocaleString('vi-VN') : '—'}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase italic truncate max-w-[150px]">{m.Location?.name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded text-xs border border-primary-100">
                                                        {m.checkinCode || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <select
                                                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-0 outline-none cursor-pointer shadow-xs ${st.cls}`}
                                                        value={m.status || 'DRAFT'}
                                                        onChange={e => statusMutation.mutate({ id: m.id, status: e.target.value })}
                                                    >
                                                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 justify-center">
                                                        {!showTrash ? (
                                                            <>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm`}
                                                                    title="Danh sách điểm danh"
                                                                    onClick={() => navigate(`${m.id}/attendance`)}
                                                                >
                                                                    <Users size={15} />
                                                                </button>
                                                                {m.checkinCode && (
                                                                    <button 
                                                                        className={`${BTN_ICON} bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 shadow-sm`}
                                                                        title="Hiển thị QR Check-in"
                                                                        onClick={() => setShowQR({ id: m.id, title: m.title, code: m.checkinCode, expiresAt: m.checkinCodeExpiresAt })}
                                                                    >
                                                                        <QrCode size={15} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`}
                                                                    onClick={() => setModal(m)}
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmDelete(m.title);
                                                                        if (result.isConfirmed) deleteMutation.mutate(m.id);
                                                                    }}
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmRestore(m.title);
                                                                        if (result.isConfirmed) restoreMutation.mutate(m.id);
                                                                    }}
                                                                    title="Khôi phục"
                                                                >
                                                                    <RotateCcw size={15} />
                                                                </button>
                                                                <button 
                                                                    className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 shadow-sm`}
                                                                    onClick={async () => {
                                                                        const result = await confirmForceDelete(m.title);
                                                                        if (result.isConfirmed) forceDeleteMutation.mutate(m.id);
                                                                    }}
                                                                    title="Xóa vĩnh viễn"
                                                                >
                                                                    <Trash2 size={15} />
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
                    <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50/30 border-t border-gray-100">
                        <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40 transition shadow-sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-[11px] font-black ${p === page ? 'bg-primary-700 text-white border-primary-700 shadow-md shadow-primary-200' : 'border-gray-200 bg-white hover:border-primary-700'}`}>{p}</button>
                        ))}
                        <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40 transition shadow-sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
                    </div>
                )}
            </div>
            {modal && <MeetingModal meeting={modal === 'add' ? null : modal} cells={cells} locations={locations} onClose={() => setModal(null)} onSave={handleSave} />}
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
