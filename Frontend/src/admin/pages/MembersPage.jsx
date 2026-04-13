import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle, Eye, FilterX, UserPlus, Shield, History, UserCheck, Camera, Building2, BookOpen, RotateCcw, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { memberApi, positionApi } from '../../services/api';
import { confirmDelete, confirmAction, confirmRestore, confirmForceDelete, confirmUnsavedChanges } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';
import { useDirtyModal } from '../../hooks/useDirtyModal';
import { commandBus } from '../../utils/commandBus';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const SELECT = "w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition bg-white";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";
const BTN_ICON = "p-2 rounded-lg text-base transition";

const ACTIVITY_STATUS = [
    { value: 'active', label: 'Đang sinh hoạt', color: 'bg-green-100 text-green-700' },
    { value: 'transferred', label: 'Đã điều chuyển', color: 'bg-blue-100 text-blue-700' },
    { value: 'graduated', label: 'Đã tốt nghiệp', color: 'bg-gray-100 text-gray-700' },
    { value: 'paused', label: 'Tạm dừng sinh hoạt', color: 'bg-orange-100 text-orange-700' },
];

const ROLES_IN_UNION = [
    { value: 'member', label: 'Đoàn viên' },
    { value: 'vice_secretary', label: 'Phó Bí thư' },
    { value: 'secretary', label: 'Bí thư' },
    { value: 'commissioner', label: 'Ủy viên' },
];

function MemberModal({ member, onClose, onSave }) {
    const [form, setForm] = useState(member ? {
        ...member,
        email: member.User?.email || member.email || '',
        phoneNumber: member.User?.phoneNumber || member.phoneNumber || '',
        identityNumber: member.identityNumberFull || member.identityNumber || ''
    } : { 
        memberCode: '', fullName: '', dateOfBirth: '', gender: 'male', 
        email: '', phoneNumber: '', identityNumber: '', permanentAddress: '', hometown: '', 
        joinedDate: '', activityStatus: 'active', roleInUnion: 'member',
        ethnicity: 'Kinh', religion: 'Không', professionalLevel: '', itLevel: '', languageLevel: '',
        memberType: 'STUDENT', isHonoraryMember: false
    });
    
    const { handleAttemptClose } = useDirtyModal(form, onClose);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <ModalPortal onAttemptClose={handleAttemptClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{member ? 'Cập nhật Đoàn viên' : 'Thêm Đoàn viên mới'}</h3>
                    <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mã đoàn viên *</label><input className={INPUT} value={form.memberCode || ''} onChange={e => set('memberCode', e.target.value)} placeholder="DV001" /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Giới tính</label>
                            <select className={SELECT} value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="male">Nam</option><option value="female">Nữ</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Họ và tên *</label><input className={INPUT} value={form.fullName || ''} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" /></div>
                    
                    <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                        <label className="block text-xs font-bold text-amber-700 mb-1 uppercase tracking-tighter">Số định danh (CCCD)</label>
                        <input className={INPUT} value={form.identityNumber || ''} onChange={e => set('identityNumber', e.target.value)} placeholder="12 chữ số" />
                        <p className="text-[10px] text-amber-600 mt-1 font-medium italic">Thông tin này sẽ được mã hóa an toàn trong hệ thống.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ Đoàn</label>
                            <select className={SELECT} value={form.roleInUnion} onChange={e => set('roleInUnion', e.target.value)}>
                                {ROLES_IN_UNION.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái sinh hoạt</label>
                            <select className={SELECT} value={form.activityStatus} onChange={e => set('activityStatus', e.target.value)}>
                                {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày sinh</label><input type="date" className={INPUT} value={form.dateOfBirth?.slice(0, 10) || ''} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngày gia nhập</label><input type="date" className={INPUT} value={form.joinedDate?.slice(0, 10) || ''} onChange={e => set('joinedDate', e.target.value)} /></div>
                    </div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input className={INPUT} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@dthu.edu.vn" /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label><input className={INPUT} value={form.phoneNumber || ''} onChange={e => set('phoneNumber', e.target.value)} /></div>
                    
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Dân tộc</label>
                            <input className={INPUT} value={form.ethnicity || ''} onChange={e => set('ethnicity', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tôn giáo</label>
                            <input className={INPUT} value={form.religion || ''} onChange={e => set('religion', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Trình độ & Chuyên môn</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chuyên môn</label><input className={INPUT} value={form.professionalLevel || ''} onChange={e => set('professionalLevel', e.target.value)} /></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ngoại ngữ</label><input className={INPUT} value={form.languageLevel || ''} onChange={e => set('languageLevel', e.target.value)} /></div>
                        </div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tin học</label><input className={INPUT} value={form.itLevel || ''} onChange={e => set('itLevel', e.target.value)} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phân loại</label>
                            <select className={SELECT} value={form.memberType} onChange={e => set('memberType', e.target.value)}>
                                <option value="STUDENT">Sinh viên</option>
                                <option value="STAFF">Cán bộ</option>
                                <option value="TEACHER">Giảng viên</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-700" checked={form.isHonoraryMember} onChange={e => set('isHonoraryMember', e.target.checked)} />
                                <span className="text-xs font-semibold text-gray-700">Đoàn viên danh dự</span>
                            </label>
                        </div>
                    </div>

                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tổng Ngày CTXH</label><input type="number" className={INPUT} value={form.socialWorkDays || 0} onChange={e => set('socialWorkDays', parseInt(e.target.value))} /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quê quán</label><input className={INPUT} value={form.hometown || ''} onChange={e => set('hometown', e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Thường trú</label><input className={INPUT} value={form.permanentAddress || ''} onChange={e => set('permanentAddress', e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button className={BTN_SECONDARY} onClick={handleAttemptClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function ImportExcelModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Config, 2: Preview, 3: Result
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('AUTO'); // AUTO, FORCE, VALIDATE
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedCellId, setSelectedCellId] = useState('');
    const [strictMode, setStrictMode] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, ERROR, WARNING

    // Fetch units
    const { data: branchRes } = useQuery({ queryKey: ['branches-import'], queryFn: () => memberApi.getBranches() });
    const branches = branchRes?.data?.data || [];
    const { data: cellsRes } = useQuery({ 
        queryKey: ['cells-import', selectedBranchId], 
        queryFn: () => memberApi.getCells(selectedBranchId),
        enabled: !!selectedBranchId 
    });
    const cells = cellsRes?.data?.data || [];

    const handleGeneratePreview = async () => {
        if (!file) return toast.error('Vui lòng chọn file!');
        if ((mode === 'FORCE' || mode === 'VALIDATE') && !selectedCellId) {
            return toast.error('Vui lòng chọn Chi đoàn cho chế độ này!');
        }

        setLoading(true);
        try {
            const { data } = await memberApi.importPreview(file, mode, selectedCellId);
            setPreviewContent(data);
            setStep(2);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Lỗi khi xử lý file!');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        setLoading(true);
        try {
            const { data } = await memberApi.importConfirm({
                previewId: previewContent.previewId,
                strictMode
            });
            setImportResult(data);
            setStep(3);
            if (data.success > 0) {
                toast.success(`Đã nhập thành công ${data.success} hồ sơ!`);
                onSuccess();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Lỗi khi nhập dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    const filteredRows = previewContent?.rows?.filter(r => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    }) || [];

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${step === 2 ? 'w-full max-w-5xl' : 'w-full max-w-lg'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700">
                            <FileUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Nhập dữ liệu Đoàn viên</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Bước {step}/3: {step === 1 ? 'Cấu hình' : step === 2 ? 'Xem trước dữ liệu' : 'Hoàn tất'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">✕</button>
                </div>

                <div className="p-6">
                    {/* STEP 1: CONFIG */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-primary-700 uppercase tracking-widest">1. Chế độ nhập (Import Mode)</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'AUTO', label: 'Tự động', desc: 'Theo mã lớp trong file', color: 'primary' },
                                        { id: 'FORCE', label: 'Gán cứng', desc: 'Ép vào 1 lớp chọn sẵn', color: 'orange' },
                                        { id: 'VALIDATE', label: 'Xác thực', desc: 'Check khớp file vs lớp', color: 'green' }
                                    ].map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => setMode(m.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition ${mode === m.id ? 'border-primary-600 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                        >
                                            <p className={`text-xs font-bold ${mode === m.id ? 'text-primary-700' : 'text-gray-700'}`}>{m.label}</p>
                                            <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{m.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(mode === 'FORCE' || mode === 'VALIDATE') && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in zoom-in-95">
                                    <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest">2. Chọn đơn vị đích</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select className={SELECT} value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}>
                                            <option value="">-- Liên chi đoàn --</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <select className={SELECT} value={selectedCellId} onChange={e => setSelectedCellId(e.target.value)} disabled={!selectedBranchId}>
                                            <option value="">-- Chi đoàn --</option>
                                            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest">3. Chọn tệp dữ liệu</h4>
                                <div 
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary-400 transition cursor-pointer bg-gray-50/50"
                                    onClick={() => document.getElementById('excel-upload').click()}
                                >
                                    <input id="excel-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={e => setFile(e.target.files[0])} />
                                    <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileUp size={24} className={file ? 'text-green-600' : 'text-primary-700'} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">{file ? file.name : 'Nhấn để chọn file Excel'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx, .xls phát sinh từ mẫu chuẩn</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex gap-3">
                                {[
                                    { k: 'total', label: 'Tổng số', color: 'bg-gray-100 text-gray-700' },
                                    { k: 'valid', label: 'Hợp lệ', color: 'bg-green-100 text-green-700' },
                                    { k: 'error', label: 'Lỗi', color: 'bg-red-100 text-red-700' },
                                    { k: 'warning', label: 'Cảnh báo', color: 'bg-amber-100 text-amber-700' }
                                ].map(s => (
                                    <div key={s.k} className={`flex-1 p-3 rounded-2xl border border-white/50 shadow-sm ${s.color}`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{s.label}</p>
                                        <p className="text-2xl font-black">{previewContent?.summary[s.k]}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {['ALL', 'ERROR', 'WARNING'].map(f => (
                                        <button 
                                            key={f} 
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition ${filter === f ? 'bg-primary-700 text-white shadow-lg shadow-primary-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            {f === 'ALL' ? 'Toàn bộ' : f === 'ERROR' ? 'Chỉ lỗi' : 'Chỉ cảnh báo'}
                                        </button>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-rose-50 rounded-lg border border-rose-100">
                                    <input type="checkbox" className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" checked={strictMode} onChange={e => setStrictMode(e.target.checked)} />
                                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-tighter">StrictMode (Dừng nếu có lỗi)</span>
                                </label>
                            </div>

                            <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto bg-gray-50/30">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-white sticky top-0 border-b border-gray-100 z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-wider">Dòng</th>
                                            <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-wider">Họ tên</th>
                                            <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-wider">Chi đoàn đích</th>
                                            <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white transition group">
                                                <td className="px-4 py-3 font-bold text-gray-400">{row.index}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-gray-800">{row.data.fullName}</p>
                                                    <p className="text-[10px] text-gray-400">{row.data.memberCode}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-gray-700">{row.targetCellName || '—'}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm
                                                        ${row.status === 'VALID' ? 'bg-green-100 text-green-700' : row.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {row.status}
                                                    </div>
                                                    {row.message.length > 0 && <p className="text-[9px] text-gray-500 italic mt-1 font-medium">{row.message[0]}</p>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULT */}
                    {step === 3 && (
                        <div className="space-y-6 py-4 animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-black text-gray-800">Hoàn tất nhập dữ liệu!</h4>
                                <p className="text-sm text-gray-500 mt-1">Dữ liệu đã được xử lý theo lô 100 dòng một cách an toàn.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center shadow-sm">
                                    <p className="text-[10px] font-black text-green-600 uppercase mb-1">Thành công</p>
                                    <p className="text-3xl font-black text-green-700">{importResult?.success}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center shadow-sm">
                                    <p className="text-[10px] font-black text-red-600 uppercase mb-1">Bị bỏ qua</p>
                                    <p className="text-3xl font-black text-red-700">{importResult?.skipped}</p>
                                </div>
                            </div>

                            {importResult?.errors?.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Chi tiết sự cố:</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {importResult.errors.map((err, i) => (
                                            <p key={i} className="text-[10px] text-red-600 font-bold leading-tight">• {err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    {step === 1 && (
                        <>
                            <button className={BTN_SECONDARY} onClick={onClose}>Hủy bỏ</button>
                            <button className={BTN_PRIMARY} onClick={handleGeneratePreview} disabled={loading || !file}>
                                {loading ? 'Đang xử lý...' : 'Xem trước dữ liệu'}
                            </button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <button className={BTN_SECONDARY} onClick={() => setStep(1)} disabled={loading}>Quay lại</button>
                            <button 
                                className={`flex items-center gap-2 px-6 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-primary-100
                                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleConfirmImport}
                                disabled={loading || (strictMode && previewContent?.summary.error > 0)}
                            >
                                {loading ? 'Đang nhập...' : 'Xác nhận nhập'}
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <button className="w-full px-6 py-3 bg-gray-800 hover:bg-black text-white text-sm font-bold rounded-xl transition" onClick={onClose}>
                            Đóng cửa sổ
                        </button>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
}

function AppointmentModal({ member, positions, branches, onClose, onAssign }) {
    const activePos = member.UnionPositions?.[0];
    
    const [form, setForm] = useState({ 
        positionId: activePos?.id || '', 
        branchId: activePos?.UnionMemberPosition?.unionBranchId || member.UnionCell?.unionBranchId || '', 
        cellId: activePos?.UnionMemberPosition?.unionCellId || member.unionCellId || '', 
        assignedDate: new Date().toISOString().split('T')[0],
        moveMember: false
    });
    
    // Khi chọn chức danh, tự động gợi ý đơn vị hiện tại
    const handlePositionChange = (posId) => {
        const pos = positions.find(p => p.id === posId);
        setForm(f => ({ 
            ...f, 
            positionId: posId,
            branchId: pos?.scopeLevel === 'BRANCH' ? (member.UnionCell?.unionBranchId || '') : '',
            cellId: pos?.scopeLevel === 'CELL' ? (member.unionCellId || '') : '',
            // Reset đơn vị nếu chọn chức danh cấp Trường
        }));
    };

    const selectedPos = positions.find(p => p.id === form.positionId);
    
    // Lấy danh sách chi đoàn của branch đang chọn (nếu có)
    const { data: cellsRes } = useQuery({ 
        queryKey: ['cells-for-appoint', form.branchId], 
        queryFn: () => memberApi.getCells(form.branchId),
        enabled: !!form.branchId && selectedPos?.scopeLevel === 'CELL'
    });
    const cells = cellsRes?.data?.data || [];

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-primary-700" />
                        <h3 className="font-bold text-gray-800">Quyết định Bổ nhiệm</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    {/* Header: Thành viên */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-primary-700 border border-primary-100 shadow-sm">
                            {member.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Đoàn viên được bổ nhiệm</p>
                            <p className="text-sm font-bold text-gray-800">{member.fullName}</p>
                        </div>
                    </div>

                    {/* 1. Chọn Chức vụ */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ bổ nhiệm *</label>
                        <select 
                            className={SELECT} 
                            value={form.positionId || ''} 
                            onChange={e => handlePositionChange(e.target.value)}
                        >
                            <option value="">-- Chọn chức danh --</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Cấp {p.scopeLevel === 'CELL' ? 'Lớp' : p.scopeLevel === 'BRANCH' ? 'Khoa' : 'Trường'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Chọn Phạm vi (Nếu cấp Khoa) */}
                    {selectedPos?.scopeLevel === 'BRANCH' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn vị quản lý (Liên chi đoàn) *</label>
                            <select 
                                className={SELECT} 
                                value={form.branchId || ''} 
                                onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                            >
                                <option value="">-- Chọn Liên chi đoàn --</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* 3. Chọn Phạm vi (Nếu cấp Chi đoàn) */}
                    {selectedPos?.scopeLevel === 'CELL' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Thuộc Liên chi đoàn *</label>
                                <select 
                                    className={SELECT} 
                                    value={form.branchId || ''} 
                                    onChange={e => setForm(f => ({ ...f, branchId: e.target.value, cellId: '' }))}
                                >
                                    <option value="">-- Chọn Liên chi đoàn --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            {form.branchId && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phạm vi quản lý (Chi đoàn) *</label>
                                    <select 
                                        className={SELECT} 
                                        value={form.cellId || ''} 
                                        onChange={e => setForm(f => ({ ...f, cellId: e.target.value }))}
                                    >
                                        <option value="">-- Chọn Chi đoàn --</option>
                                        {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Cấu hình Option: Chuyển Đoàn viên */}
                    {(form.cellId && form.cellId !== member.unionCellId) || (form.branchId && form.branchId !== member.UnionCell?.unionBranchId && selectedPos?.scopeLevel === 'BRANCH') ? (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    checked={form.moveMember}
                                    onChange={e => setForm(f => ({ ...f, moveMember: e.target.checked }))}
                                />
                                <div>
                                    <p className="text-xs font-bold text-amber-900 group-hover:text-amber-700 transition">Đồng thời chuyển sinh hoạt Đoàn</p>
                                    <p className="text-[10px] text-amber-600 italic">Cập nhật hồ sơ gốc của {member.fullName} sang đơn vị mới này.</p>
                                </div>
                            </label>
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu nhiệm kỳ</label>
                        <input type="date" className={INPUT} value={form.assignedDate || ''} onChange={e => setForm(f => ({ ...f, assignedDate: e.target.value }))} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy bỏ</button>
                    <button 
                        className={BTN_PRIMARY} 
                        disabled={!form.positionId || (selectedPos?.scopeLevel === 'BRANCH' && !form.branchId) || (selectedPos?.scopeLevel === 'CELL' && !form.cellId)} 
                        onClick={() => onAssign(form)}
                    >
                        Xác nhận Bổ nhiệm
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

function MemberDetailModal({ member, onClose, onApprove, onReject }) {
    const [activeTab, setActiveTab] = useState('INFO');
    if (!member) return null;

    const isPending = member.status === 'pending';
    const statusInfo = ACTIVITY_STATUS.find(s => s.value === member.activityStatus) || ACTIVITY_STATUS[0];
    const roleInfo = ROLES_IN_UNION.find(r => r.value === member.roleInUnion) || ROLES_IN_UNION[0];
    const [showFullCCCD, setShowFullCCCD] = useState(false);

    const TABS = [
        { id: 'INFO', label: 'Thông tin' },
        { id: 'EVAL', label: 'Đánh giá' },
        { id: 'REWARD', label: 'Khen thưởng/Kỷ luật' },
        { id: 'LOGS', label: 'Lịch sử' }
    ];

    const toggleCCCD = () => {
        if (!member.identityNumberFull) {
            toast.error('Bạn không có quyền xem CCCD đầy đủ');
            return;
        }
        if (!showFullCCCD) {
            confirmAction('Xem thông tin nhạy cảm', 'Hành động này sẽ được ghi nhật ký hệ thống. Bạn có chắc chắn muốn xem?', 'Tiếp tục')
                .then(res => { if (res.isConfirmed) setShowFullCCCD(true); });
        } else {
            setShowFullCCCD(false);
        }
    };

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-200">
                            {member.fullName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 leading-tight">{member.fullName}</h3>
                            <p className="text-[10px] font-black text-primary-700 uppercase tracking-tighter">{member.memberCode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 bg-gray-50/30 px-6">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition relative
                                ${activeTab === tab.id ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === 'INFO' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-2">Đơn vị & Chức vụ</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-primary-700" />
                                            <p className="text-sm font-bold text-gray-800">{roleInfo.label}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-orange-600" />
                                            <p className="text-xs font-semibold text-gray-600">{member.UnionCell?.name || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex flex-col justify-center">
                                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Công tác xã hội</label>
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-primary-700" />
                                        <p className="text-xl font-black text-primary-700 uppercase">{member.socialWorkDays || 0} Ngày</p>
                                    </div>
                                </div>

                                <div><label className="info-label">Ngày sinh</label><p className="info-val">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</p></div>
                                <div><label className="info-label">Giới tính</label><p className="info-val">{member.gender === 'female' ? 'Nữ' : 'Nam'}</p></div>
                                <div><label className="info-label">Dân tộc</label><p className="info-val">{member.ethnicity || '—'}</p></div>
                                <div><label className="info-label">Tôn giáo</label><p className="info-val">{member.religion || '—'}</p></div>
                                
                                <div className="col-span-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between">
                                    <div>
                                        <label className="info-label">Số định danh (CCCD)</label>
                                        <p className="text-sm font-mono font-bold text-gray-700 tracking-wider">
                                            {showFullCCCD ? member.identityNumberFull : member.identityNumberMasked}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={toggleCCCD}
                                        className="p-2 hover:bg-amber-100 rounded-lg text-amber-600 transition"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>

                                <div className="col-span-2 border-t border-gray-100 pt-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Học vấn & Chuyên môn</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="info-label">Trình độ chuyên môn</label><p className="info-val">{member.professionalLevel || '—'}</p></div>
                                        <div><label className="info-label">Trình độ văn hóa</label><p className="info-val">{member.educationLevel || '—'}</p></div>
                                        <div><label className="info-label">Ngoại ngữ</label><p className="info-val">{member.languageLevel || '—'}</p></div>
                                        <div><label className="info-label">Tin học</label><p className="info-val">{member.itLevel || '—'}</p></div>
                                    </div>
                                </div>

                                <div className="col-span-2 border-t border-gray-100 pt-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Liên hệ & Thường trú</h4>
                                    <div className="space-y-3">
                                        <div><label className="info-label">Quê quán</label><p className="info-val">{member.hometown || '—'}</p></div>
                                        <div><label className="info-label">Địa chỉ thường trú</label><p className="info-val">{member.permanentAddress || '—'}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'EVAL' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="text-sm font-bold text-gray-800">Kết quả Đánh giá & Rèn luyện</h4>
                            {member.Evaluations?.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 italic text-sm">Chưa có dữ liệu đánh giá</p>
                            ) : (
                                <div className="grid gap-3">
                                    {member.Evaluations.map(e => (
                                        <div key={e.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black text-primary-700 tracking-tighter">NĂM {e.year}</p>
                                                <p className={`text-sm font-bold mt-1 ${
                                                    e.classification === 'EXCELLENT' ? 'text-green-600' :
                                                    e.classification === 'GOOD' ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                    {e.classification === 'EXCELLENT' ? 'Xuất sắc' : 
                                                     e.classification === 'GOOD' ? 'Khá' : 
                                                     e.classification === 'AVERAGE' ? 'Trung bình' : 'Yếu'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Điểm rèn luyện</p>
                                                <p className="text-lg font-black text-gray-800">{e.trainingScore}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'REWARD' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4">Khen thưởng</h4>
                                {member.Rewards?.length === 0 ? (
                                    <p className="p-4 bg-gray-50 rounded-xl text-gray-400 italic text-xs">Chưa có khen thưởng</p>
                                ) : (
                                    <div className="space-y-3">
                                        {member.Rewards.map(r => (
                                            <div key={r.id} className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                                <p className="text-xs font-bold text-green-800">{r.title}</p>
                                                <p className="text-[10px] text-green-600 mt-1">{r.content}</p>
                                                <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Ngày cấp: {new Date(r.issuedDate).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4">Kỷ luật</h4>
                                {member.Disciplines?.length === 0 ? (
                                    <p className="p-4 bg-gray-50 rounded-xl text-gray-400 italic text-xs">Chưa có kỷ luật</p>
                                ) : (
                                    <div className="space-y-3">
                                        {member.Disciplines.map(d => (
                                            <div key={d.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                                <p className="text-xs font-bold text-red-800">{d.title}</p>
                                                <p className="text-[10px] text-red-600 mt-1">{d.content}</p>
                                                <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Ngày áp dụng: {new Date(d.issuedDate).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'LOGS' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <History size={16} /> Lịch sử hoạt động
                            </h4>
                            <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-4">
                                {member.UnionMemberHistories?.map(h => (
                                    <div key={h.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-primary-500" />
                                        <p className="text-[10px] text-gray-400 font-bold">{new Date(h.createdAt).toLocaleDateString('vi-VN')} {new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {h.type === 'transfer' ? 'Chuyển chi đoàn' : 
                                             h.type === 'role_change' ? 'Thay đổi chức vụ' : 
                                             h.type === 'status_change' ? 'Thay đổi trạng thái' : h.type}
                                        </p>
                                        <p className="text-[11px] text-gray-500 italic mt-0.5">{h.note || 'Không có ghi chú'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button className={BTN_SECONDARY} onClick={onClose}>Thoát bộ hồ sơ</button>
                    {isPending && (
                        <>
                            <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-lg transition" onClick={() => onReject(member)}>Từ chối</button>
                            <button className={BTN_PRIMARY} onClick={() => onApprove(member)}>Duyệt vào tổ chức</button>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                .info-label { @apply text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5; }
                .info-val { @apply text-sm text-gray-700 font-medium; }
            `}</style>
        </ModalPortal>
    );
}

function UpdateRequestModal({ request, onClose, onApprove, onReject }) {
    if (!request) return null;
    const { oldData, newData, UnionMember: member } = request;

    // Các trường cần so sánh
    const FIELDS = [
        { key: 'fullName', label: 'Họ và tên' },
        { key: 'dateOfBirth', label: 'Ngày sinh', isDate: true },
        { key: 'gender', label: 'Giới tính', isGender: true },
        { key: 'identityNumber', label: 'Số CCCD/CMND' },
        { key: 'permanentAddress', label: 'Thường trú' },
        { key: 'hometown', label: 'Quê quán' },
        { key: 'ethnicity', label: 'Dân tộc' },
        { key: 'religion', label: 'Tôn giáo' },
        { key: 'professionalLevel', label: 'Trình độ chuyên môn' },
        { key: 'itLevel', label: 'Tin học' },
        { key: 'languageLevel', label: 'Ngoại ngữ' },
        { key: 'occupation', label: 'Lớp/Nghề nghiệp' },
    ];

    const formatVal = (key, val, config) => {
        if (!val) return '—';
        if (config.isDate) return new Date(val).toLocaleDateString('vi-VN');
        if (config.isGender) return val === 'female' ? 'Nữ' : 'Nam';
        return val;
    };

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <RotateCcw size={18} className="text-orange-600" />
                        <h3 className="font-bold text-gray-800">Yêu cầu cập nhật hồ sơ</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6">
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-blue-700 border border-blue-200 shadow-sm text-lg">
                            {member?.fullName?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{member?.fullName}</p>
                            <p className="text-[11px] font-black text-blue-700 uppercase tracking-tighter">{member?.memberCode}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-gray-200 rounded-xl">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left font-bold text-gray-600">Thông tin</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-500">Giá trị cũ</th>
                                    <th className="px-4 py-3 text-left font-bold text-orange-600">Giá trị mới</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {FIELDS.map(f => {
                                    const isChanged = oldData[f.key] !== newData[f.key];
                                    if (!isChanged && !newData[f.key]) return null;
                                    return (
                                        <tr key={f.key} className={isChanged ? 'bg-orange-50/30' : ''}>
                                            <td className="px-4 py-3 font-semibold text-gray-700">{f.label}</td>
                                            <td className="px-4 py-3 text-gray-500">{formatVal(f.key, oldData[f.key], f)}</td>
                                            <td className="px-4 py-3 font-bold text-orange-700">
                                                {formatVal(f.key, newData[f.key], f)}
                                                {isChanged && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase">Đổi</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy bỏ</button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm font-medium rounded-lg transition" onClick={() => onReject(request.id)}>Từ chối</button>
                    <button className={BTN_PRIMARY} onClick={() => onApprove(request.id)}>Chấp nhận thay đổi</button>
                </div>
            </div>
        </ModalPortal>
    );
}

function Pagination({ pagination, page, setPage }) {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-end gap-2 px-5 py-4">
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>‹</button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition ${p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 bg-white hover:border-primary-700 hover:text-primary-700'}`}>{p}</button>
            ))}
            <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-center hover:border-primary-700 hover:text-primary-700 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>›</button>
            <span className="text-xs text-gray-500 ml-1">Tổng: {pagination.total}</span>
        </div>
    );
}

export default function MembersPage() {
    const { hasPermission } = useAuth();
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const unionCellId = searchParams.get('unionCellId') || '';
    
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [activityStatusFilter, setActivityStatusFilter] = useState('');
    const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [cellFilter, setCellFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [appointmentModal, setAppointmentModal] = useState(null);
    const [importModal, setImportModal] = useState(false);
    const [updateReqModal, setUpdateReqModal] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'REQUESTS'
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const createSub = commandBus.on('CREATE_MEMBER', () => {
            setModal('add');
        });
        const trashSub = commandBus.on('OPEN_TRASH', () => {
            setShowTrash(true);
            setPage(1);
        });
        return () => {
            createSub();
            trashSub();
        };
    }, []);

    const { data: posRes } = useQuery({ queryKey: ['positions'], queryFn: positionApi.getAll });
    const positions = posRes?.data?.data || [];

    const { data: branchRes } = useQuery({ queryKey: ['branches-all'], queryFn: () => memberApi.getBranches() });
    const branchesAll = branchRes?.data?.data || [];

    const { data: cellsRes } = useQuery({ 
        queryKey: ['cells-by-branch', branchFilter], 
        queryFn: () => memberApi.getCells(branchFilter),
        enabled: !!branchFilter 
    });
    const cellsByBranch = cellsRes?.data?.data || [];

    const { data, isLoading } = useQuery({
        queryKey: ['members', search, page, unionCellId, roleFilter, activityStatusFilter, approvalStatusFilter, branchFilter, cellFilter, showTrash, viewMode],
        queryFn: () => {
            if (viewMode === 'REQUESTS') return memberApi.getUpdateRequests({ page, limit: 10 });
            return memberApi.getAll({ 
                search, page, limit: 10, 
                unionCellId: cellFilter || unionCellId || undefined,
                roleInUnion: roleFilter || undefined,
                activityStatus: activityStatusFilter || undefined,
                status: approvalStatusFilter || undefined,
                unionBranchId: branchFilter || undefined,
                onlyDeleted: showTrash
            });
        },
        keepPreviousData: true,
    });

    const members = data?.data?.data || [];
    const pagination = data?.data?.pagination || {};

    const createMutation = useMutation({ mutationFn: memberApi.create, onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã thêm đoàn viên!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const updateMutation = useMutation({ mutationFn: ({ id, data }) => memberApi.update(id, data), onSuccess: () => { qc.invalidateQueries(['members']); setModal(null); toast.success('Đã cập nhật!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const deleteMutation = useMutation({ mutationFn: memberApi.delete, onSuccess: () => { qc.invalidateQueries(['members']); toast.success('Đã chuyển đoàn viên vào thùng rác!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const restoreMutation = useMutation({ mutationFn: memberApi.restore, onSuccess: () => { qc.invalidateQueries(['members']); toast.success('Đã khôi phục đoàn viên!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const forceDeleteMutation = useMutation({ mutationFn: memberApi.forceDelete, onSuccess: () => { qc.invalidateQueries(['members']); toast.success('Đã xóa vĩnh viễn!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const approveMutation = useMutation({ mutationFn: memberApi.approve, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã duyệt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const rejectMutation = useMutation({ mutationFn: memberApi.reject, onSuccess: () => { qc.invalidateQueries(['members']); setDetailModal(null); toast.success('Đã từ chối!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const appointMutation = useMutation({ mutationFn: ({ id, data }) => memberApi.assignPosition(id, data), onSuccess: () => { qc.invalidateQueries(['members']); setAppointmentModal(null); toast.success('Bổ nhiệm thành công! Tài khoản đã được đồng bộ quyền Admin.'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const approveUpdateMutation = useMutation({ mutationFn: memberApi.approveUpdate, onSuccess: () => { qc.invalidateQueries(['members']); setUpdateReqModal(null); toast.success('Đã chấp nhận thay đổi hồ sơ!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const rejectUpdateMutation = useMutation({ mutationFn: memberApi.rejectUpdate, onSuccess: () => { qc.invalidateQueries(['members']); setUpdateReqModal(null); toast.success('Đã từ chối thay đổi!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const bulkDeleteMutation = useMutation({ mutationFn: memberApi.bulkDelete, onSuccess: (res) => { qc.invalidateQueries(['members']); setSelectedIds([]); toast.success(res.data.message || 'Đã xóa hàng loạt!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const bulkRestoreMutation = useMutation({ mutationFn: memberApi.bulkRestore, onSuccess: (res) => { qc.invalidateQueries(['members']); setSelectedIds([]); toast.success(res.data.message || 'Đã khôi phục!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });
    const bulkForceDeleteMutation = useMutation({ mutationFn: memberApi.bulkForceDelete, onSuccess: (res) => { qc.invalidateQueries(['members']); setSelectedIds([]); toast.success(res.data.message || 'Đã xóa vĩnh viễn!'); }, onError: e => toast.error(e.response?.data?.message || 'Lỗi!') });

    const handleSave = (form) => modal?.id ? updateMutation.mutate({ id: modal.id, data: form }) : createMutation.mutate(form);
    
    const handleApprove = async (m) => {
        const result = await confirmAction('Duyệt đoàn viên', `Xác nhận duyệt thông tin đoàn viên "${m.fullName}"?`, 'Duyệt');
        if (result.isConfirmed) approveMutation.mutate(m.id);
    };
    
    const handleReject = async (m) => {
        const result = await confirmAction('Từ chối', `Từ chối thông tin đoàn viên "${m.fullName}"?`, 'Từ chối');
        if (result.isConfirmed) rejectMutation.mutate(m.id);
    };

    const handleAppoint = (form) => {
        appointMutation.mutate({ id: appointmentModal.id, data: form });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === members.length) setSelectedIds([]);
        else setSelectedIds(members.map(m => m.id));
    };

    const handleBulkDelete = async () => {
        const result = await confirmAction('Xóa hàng loạt', `Bạn có chắc chắn muốn xóa ${selectedIds.length} đoàn viên đã chọn?`, 'Xóa ngay', 'error');
        if (result.isConfirmed) bulkDeleteMutation.mutate(selectedIds);
    };

    const handleBulkRestore = async () => {
        const result = await confirmAction('Khôi phục hàng loạt', `Bạn có chắc chắn muốn khôi phục ${selectedIds.length} đoàn viên đã chọn?`, 'Khôi phục');
        if (result.isConfirmed) bulkRestoreMutation.mutate(selectedIds);
    };

    const handleBulkForceDelete = async () => {
        const result = await confirmAction('Xóa vĩnh viễn hàng loạt', `Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} đoàn viên?`, 'Xóa vĩnh viễn', 'error');
        if (result.isConfirmed) bulkForceDeleteMutation.mutate(selectedIds);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3 flex-wrap items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm w-full outline-none focus:border-primary-700 transition font-medium" placeholder="Tìm theo tên, mã, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                
                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setCellFilter(''); setPage(1); }}>
                    <option value="">Liên chi đoàn</option>
                    {branchesAll.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                
                {branchFilter && (
                    <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={cellFilter} onChange={e => { setCellFilter(e.target.value); setPage(1); }}>
                        <option value="">Chi đoàn</option>
                        {cellsByBranch.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                    <option value="">Chức vụ</option>
                    {ROLES_IN_UNION.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={activityStatusFilter} onChange={e => { setActivityStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Trạng thái SH</option>
                    {ACTIVITY_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <select className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary-700 transition bg-white font-medium" value={approvalStatusFilter} onChange={e => { setApprovalStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Hồ sơ</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                </select>

                {unionCellId && (
                    <button 
                        className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 text-[11px] font-black uppercase rounded-lg border border-orange-100 hover:bg-orange-100 transition tracking-tighter"
                        onClick={() => setSearchParams({})}
                    >
                        <FilterX size={14} /> Xóa lọc Chi đoàn
                    </button>
                )}

                {hasPermission('member:delete') && (
                    <button 
                        onClick={() => { setShowTrash(!showTrash); setPage(1); setSelectedIds([]); }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border-2 
                            ${showTrash 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <History size={16} /> {showTrash ? 'Quay lại' : 'Thùng rác'}
                    </button>
                )}

                {!showTrash && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'LIST' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => { setViewMode('LIST'); setPage(1); }}
                        >
                            Danh sách
                        </button>
                        <button 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'REQUESTS' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => { setViewMode('REQUESTS'); setPage(1); }}
                        >
                            Yêu cầu cập nhật
                        </button>
                    </div>
                )}

                {!showTrash && viewMode === 'LIST' && (
                    <div className="flex gap-2">
                        <button className={BTN_SECONDARY} onClick={() => setImportModal(true)}>
                            <FileUp size={16} /> Nhập Excel
                        </button>
                        <button className={BTN_PRIMARY} onClick={() => setModal('add')}>
                            <Plus size={16} /> Thêm đoàn viên
                        </button>
                    </div>
                )}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                        <Shield size={16} className="text-primary-700" />
                        {showTrash ? 'Thùng rác Đoàn viên' : (viewMode === 'REQUESTS' ? 'Yêu cầu cập nhật hồ sơ' : 'Danh sách Đoàn viên')}
                    </h2>
                    <span className="text-[10px] bg-primary-700 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none flex items-center justify-center min-w-[40px] shadow-sm shadow-primary-200">{pagination.total || 0}</span>
                </div>

                {/* Bulk Action Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-primary-50 border-b border-primary-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-primary-800">Đã chọn <span className="text-lg font-black">{selectedIds.length}</span> mục</p>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600" onClick={() => setSelectedIds([])}>Bỏ chọn</button>
                        </div>
                        <div className="flex gap-2">
                            {showTrash ? (
                                <>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm transition" onClick={handleBulkRestore}>
                                        <RotateCcw size={14} /> Khôi phục đã chọn
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm transition" onClick={handleBulkForceDelete}>
                                        <Trash2 size={14} /> Xóa vĩnh viễn đã chọn
                                    </button>
                                </>
                            ) : (
                                viewMode === 'LIST' && (
                                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm transition" onClick={handleBulkDelete}>
                                        <Trash2 size={14} /> Xóa các mục đã chọn
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm font-medium italic">Chưa có đoàn viên nào trong danh sách</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                {viewMode === 'REQUESTS' ? (
                                    <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                        <th className="px-6 py-4 text-left">Đoàn viên</th>
                                        <th className="px-6 py-4 text-left">Ngày yêu cầu</th>
                                        <th className="px-6 py-4 text-left">Trạng thái</th>
                                        <th className="px-6 py-4 text-left">Thao tác</th>
                                    </tr>
                                ) : (
                                    <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                        <th className="px-6 py-4 text-left w-10">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-700" checked={selectedIds.length === members.length && members.length > 0} onChange={toggleSelectAll} />
                                        </th>
                                        <th className="px-6 py-4 text-left">Hồ sơ</th>
                                        <th className="px-6 py-4 text-left">Thông tin</th>
                                        <th className="px-6 py-4 text-left">Số định danh / Đơn vị</th>
                                        <th className="px-6 py-4 text-left">Chức vụ / Trạng thái</th>
                                        <th className="px-6 py-4 text-left">Thao tác</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.map(m => {
                                    if (viewMode === 'REQUESTS') {
                                        return (
                                            <tr key={m.id} className="hover:bg-gray-50/50 transition border-b border-gray-100 last:border-0">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center font-bold text-primary-700 text-xs shadow-sm">
                                                            {m.UnionMember?.fullName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-xs">{m.UnionMember?.fullName}</p>
                                                            <p className="font-mono text-[9px] font-black text-gray-400 uppercase">{m.UnionMember?.memberCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                                                    {new Date(m.createdAt).toLocaleDateString('vi-VN')} {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700">
                                                        Chờ duyệt
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button 
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-[10px] font-black uppercase rounded shadow-md shadow-primary-200 transition"
                                                        onClick={() => setUpdateReqModal(m)}
                                                    >
                                                        <CheckCircle size={14} /> Xem & Duyệt
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const statusObj = ACTIVITY_STATUS.find(s => s.value === (m.activityStatus || 'active')) || ACTIVITY_STATUS[0];
                                    const roleObj = ROLES_IN_UNION.find(r => r.value === (m.roleInUnion || 'member')) || ROLES_IN_UNION[0];
                                    return (
                                        <tr key={m.id} className={`hover:bg-gray-50/50 transition ${selectedIds.includes(m.id) ? 'bg-primary-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-700" checked={selectedIds.includes(m.id)} onChange={() => toggleSelection(m.id)} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-mono text-[10px] font-black text-primary-700 uppercase tracking-tight">{m.memberCode}</p>
                                                    <p className="font-bold text-gray-800">{m.fullName}</p>
                                                    <p className="text-[10px] font-bold text-primary-700 mt-0.5 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 w-fit">Ngày CTXH: {m.socialWorkDays || 0}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-xs text-gray-600 font-medium">{m.User?.email || m.email || '—'}</p>
                                                    <p className="text-xs text-gray-400">{m.User?.phoneNumber || m.phoneNumber || '—'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{m.gender === 'female' ? 'Nữ' : 'Nam'}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Shield size={12} className="text-primary-700 opacity-50" />
                                                        <span className="text-[11px] font-bold text-gray-700">{roleObj.label}</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit shadow-xs ${statusObj.color}`}>
                                                        {statusObj.label}
                                                    </span>
                                                    {m.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">Chờ duyệt hồ sơ</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 p-1 px-2 bg-amber-50 rounded border border-amber-100 w-fit">
                                                        <span className="text-[10px] font-mono font-bold text-amber-700 tracking-wider">
                                                            {m.identityNumberMasked || '—'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-700 mt-1">{m.UnionCell?.name || '—'}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{m.UnionCell?.UnionBranch?.name || '—'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap min-w-[120px]">
                                                    {!showTrash ? (
                                                        <>
                                                            {m.status === 'pending' ? (
                                                                <button title="Xét duyệt hồ sơ" className={`${BTN_ICON} bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 shadow-sm`} onClick={() => setDetailModal(m)}>
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button title="Xem chi tiết" className={`${BTN_ICON} bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm`} onClick={() => setDetailModal(m)}>
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    <button title="Bổ nhiệm chức vụ" className={`${BTN_ICON} bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100 shadow-sm`} onClick={() => setAppointmentModal(m)}>
                                                                        <UserPlus size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button title="Sửa" className={`${BTN_ICON} bg-gray-50 hover:bg-gray-200/50 text-gray-600 border border-gray-100 shadow-sm`} onClick={() => setModal(m)}><Pencil size={16} /></button>
                                                            <button title="Xóa" className={`${BTN_ICON} bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-sm`} onClick={async () => {
                                                                const result = await confirmDelete(m.fullName);
                                                                if (result.isConfirmed) deleteMutation.mutate(m.id);
                                                            }}><Trash2 size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button title="Khôi phục" className={`${BTN_ICON} bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 shadow-sm`} onClick={async () => {
                                                                const result = await confirmRestore(m.fullName);
                                                                if (result.isConfirmed) restoreMutation.mutate(m.id);
                                                            }}><RotateCcw size={16} /></button>
                                                            <button title="Xóa vĩnh viễn" className={`${BTN_ICON} bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 shadow-sm`} onClick={async () => {
                                                                const result = await confirmForceDelete(m.fullName);
                                                                if (result.isConfirmed) forceDeleteMutation.mutate(m.id);
                                                            }}><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <Pagination pagination={pagination} page={page} setPage={setPage} />
            </div>

            {modal && <MemberModal member={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {detailModal && <MemberDetailModal member={detailModal} onClose={() => setDetailModal(null)} onApprove={handleApprove} onReject={handleReject} />}
            {appointmentModal && <AppointmentModal member={appointmentModal} positions={positions} branches={branchesAll} onClose={() => setAppointmentModal(null)} onAssign={handleAppoint} />}
            {updateReqModal && <UpdateRequestModal request={updateReqModal} onClose={() => setUpdateReqModal(null)} onApprove={(id) => approveUpdateMutation.mutate(id)} onReject={(id) => rejectUpdateMutation.mutate(id)} />}
            
            {importModal && (
                <ImportExcelModal 
                    onClose={() => setImportModal(false)}
                    onSuccess={() => { qc.invalidateQueries(['members']); setImportModal(false); }}
                />
            )}
        </div>
    );
}
