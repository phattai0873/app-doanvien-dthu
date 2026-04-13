import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Wallet, CheckCircle2, XCircle, Filter, RotateCcw, Download, CreditCard, Pencil, History, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { feeApi, feeTypeApi, memberApi } from '../../services/api';
import { confirmDelete, confirmRestore, confirmForceDelete, confirmAction, confirmReason, confirmUnsavedChanges } from '../../utils/swal';
import ModalPortal from '../../components/ModalPortal';
import { useDirtyModal } from '../../hooks/useDirtyModal';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition";
const BTN_SECONDARY = "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition";

function FeeModal({ fee, onClose, onSave, members, types, branches, cells }) {
    const [targetType, setTargetType] = useState('MEMBER'); // 'MEMBER', 'CELL', 'BRANCH', 'ALL'
    const [form, setForm] = useState(fee || {
        unionMemberId: '', unionCellId: '', unionBranchId: '',
        period: new Date().getFullYear().toString(), amount: 24000,
        unionFeeTypeId: types?.[0]?.id || '', paymentMethod: 'CASH', status: 'SUCCESS', note: '',
        deadline: fee?.deadline || `${new Date().getFullYear()}-12-31`
    });
    const [file, setFile] = useState(null);

    const { handleAttemptClose } = useDirtyModal(form, onClose);

    const handleConfirm = () => {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
                formData.append(key, form[key]);
            }
        });
        formData.append('targetType', targetType);
        if (file) formData.append('evidence', file);

        onSave(formData);
    };

    return (
        <ModalPortal onAttemptClose={handleAttemptClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-black text-gray-700 uppercase text-xs tracking-widest">{fee ? 'Cập nhật bản ghi phí' : 'Tạo bản ghi phí mới'}</h3>
                    <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    {!fee && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hình thức ghi nhận</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto">
                                    <button className={`flex-1 py-1.5 px-3 text-[10px] font-extrabold rounded-md transition whitespace-nowrap ${targetType === 'MEMBER' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setTargetType('MEMBER')}>CÁ NHÂN</button>
                                    <button className={`flex-1 py-1.5 px-3 text-[10px] font-extrabold rounded-md transition whitespace-nowrap ${targetType === 'CELL' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setTargetType('CELL')}>CHI ĐOÀN</button>
                                    <button className={`flex-1 py-1.5 px-3 text-[10px] font-extrabold rounded-md transition whitespace-nowrap ${targetType === 'BRANCH' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setTargetType('BRANCH')}>KHOA (LCĐ)</button>
                                    <button className={`flex-1 py-1.5 px-3 text-[10px] font-extrabold rounded-md transition whitespace-nowrap ${targetType === 'ALL' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`} onClick={() => setTargetType('ALL')}>TOÀN TRƯỜNG</button>
                                </div>
                            </div>

                            {targetType === 'MEMBER' ? (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đoàn viên *</label>
                                    <select className={INPUT} value={form.unionMemberId} onChange={e => setForm({ ...form, unionMemberId: e.target.value })}>
                                        <option value="">-- Chọn đoàn viên --</option>
                                        {members.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.memberCode})</option>)}
                                    </select>
                                </div>
                            ) : targetType === 'CELL' ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chọn Liên chi đoàn (Để lọc) *</label>
                                        <select
                                            className={INPUT}
                                            value={form.unionBranchId || ''}
                                            onChange={e => {
                                                setForm({ ...form, unionBranchId: e.target.value, unionCellId: '' });
                                            }}
                                        >
                                            <option value="">-- Chọn liên chi đoàn --</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chọn Chi đoàn *</label>
                                        <select
                                            className={INPUT}
                                            value={form.unionCellId}
                                            onChange={e => setForm({ ...form, unionCellId: e.target.value })}
                                            disabled={!form.unionBranchId}
                                        >
                                            <option value="">{form.unionBranchId ? '-- Chọn chi đoàn --' : '-- Vui lòng chọn LCĐ trước --'}</option>
                                            {cells.filter(c => c.unionBranchId === form.unionBranchId).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : targetType === 'BRANCH' ? (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chọn Liên chi đoàn *</label>
                                    <select className={INPUT} value={form.unionBranchId} onChange={e => setForm({ ...form, unionBranchId: e.target.value })}>
                                        <option value="">-- Chọn liên chi đoàn --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg">
                                    <p className="text-[11px] font-bold text-primary-700 flex items-center gap-2">
                                        <CheckCircle2 size={14} />
                                        Hệ thống sẽ tự động ghi nhận cho tất cả đoàn viên đang hoạt động trong trường.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Loại phí</label>
                            <select className={INPUT} value={form.unionFeeTypeId} onChange={e => setForm({ ...form, unionFeeTypeId: e.target.value })}>
                                <option value="">-- Chọn loại phí --</option>
                                {types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Năm (Kỳ)</label>
                            <input className={INPUT} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số tiền (đ)</label>
                            <input type="number" className={INPUT} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phương thức</label>
                            <select className={INPUT} value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                                <option value="CASH">Tiền mặt</option>
                                <option value="BANK_TRANSFER">Chuyển khoản</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ảnh minh chứng</label>
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <div className="px-3 py-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-primary-400 transition flex items-center gap-2">
                                    <Download size={14} />
                                    <span>{file ? file.name : 'Tệp đính kèm (Ảnh, PDF, Word)'}</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                            </label>
                            {file && <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => setFile(null)}>✕</button>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời hạn nộp (Deadline) *</label>
                        <input type="date" className={INPUT} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú</label>
                        <textarea className={INPUT} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder={targetType !== 'MEMBER' ? 'Sẽ được áp dụng cho tất cả đoàn viên phát sinh bản ghi' : ''} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={handleConfirm}>
                        {targetType === 'MEMBER' ? 'Lưu dữ liệu' : (targetType === 'ALL' ? 'Ghi nhận toàn trường' : 'Ghi nhận hàng loạt')}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

function FeeTypeModal({ type, onClose, onSave }) {
    const [form, setForm] = useState(type || { name: '', description: '' });

    const { handleAttemptClose } = useDirtyModal(form, onClose);

    return (
        <ModalPortal onAttemptClose={handleAttemptClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-black text-gray-700 uppercase text-xs tracking-widest">{type ? 'Cập nhật loại phí' : 'Thêm loại phí mới'}</h3>
                    <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên loại phí</label>
                        <input className={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô tả</label>
                        <textarea className={INPUT} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Lưu dữ liệu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

const VIET_BANKS = [
    { code: 'MB', name: 'MB Bank', bin: '970422' },
    { code: 'VCB', name: 'Vietcombank', bin: '970436' },
    { code: 'ICB', name: 'VietinBank', bin: '970415' },
    { code: 'BIDV', name: 'BIDV', bin: '970418' },
    { code: 'VBA', name: 'Agribank', bin: '970405' },
    { code: 'TCB', name: 'Techcombank', bin: '970407' },
    { code: 'ACB', name: 'ACB', bin: '970416' },
    { code: 'VPB', name: 'VPBank', bin: '970432' },
    { code: 'STB', name: 'Sacombank', bin: '970403' },
    { code: 'HDB', name: 'HDBank', bin: '970437' },
    { code: 'TPB', name: 'TPBank', bin: '970423' },
    { code: 'VTB', name: 'Vietinbank', bin: '970415' },
    { code: 'VIB', name: 'VIB', bin: '970441' },
    { code: 'SHB', name: 'SHB', bin: '970443' },
    { code: 'MSB', name: 'MSB', bin: '970426' },
];

function BankSettingModal({ setting, onClose, onSave, isLoading }) {
    const [form, setForm] = useState(setting || { bankId: 'MB', bankName: 'MB Bank', accountNo: '', accountName: '' });

    const { handleAttemptClose } = useDirtyModal(form, onClose);

    const handleBankChange = (e) => {
        const bank = VIET_BANKS.find(b => b.code === e.target.value);
        if (bank) {
            setForm({ ...form, bankId: bank.code, bankName: bank.name });
        }
    };

    return (
        <ModalPortal onAttemptClose={handleAttemptClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-black text-gray-700 uppercase text-xs tracking-widest text-[#006a31]">Cấu hình ngân hàng nhận tiền</h3>
                    <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chọn Ngân hàng *</label>
                        <select className={INPUT} value={form.bankId} onChange={handleBankChange}>
                            <option value="">-- Chọn ngân hàng --</option>
                            {VIET_BANKS.map(b => (
                                <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số tài khoản trường *</label>
                        <input className={INPUT} value={form.accountNo} onChange={e => setForm({ ...form, accountNo: e.target.value })} placeholder="VD: 0383..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên chủ tài khoản *</label>
                        <input className={INPUT} value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value.toUpperCase() })} placeholder="VD: DOAN THANH NIEN DTHU" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} disabled={isLoading} onClick={() => onSave(form)}>
                        {isLoading ? 'Đang lưu...' : 'Cập nhật STK'}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

function CollectionModal({ onClose, onSave, types, branches, allCells }) {
    const [form, setForm] = useState({
        name: '', feeTypeId: types?.[0]?.id || '',
        periodType: 'MONTH', amountPerUnit: 24000,
        periodStart: new Date().toISOString().substring(0, 10),
        periodEnd: new Date().toISOString().substring(0, 10),
        deadline: new Date().toISOString().substring(0, 10),
        allowPartialPayment: true,
        scopes: [], // [{type: 'ALL' | 'BRANCH' | 'CELL', id: null | number}]
        documentUrl: ''
    });

    const [scopeInput, setScopeInput] = useState({ type: 'ALL', branchId: '', cellId: '' });

    const { handleAttemptClose } = useDirtyModal(form, onClose);

    const addScope = () => {
        let newScope = { type: scopeInput.type, id: null };
        if (scopeInput.type === 'BRANCH') newScope.id = scopeInput.branchId;
        if (scopeInput.type === 'CELL') newScope.id = scopeInput.cellId;

        if (scopeInput.type !== 'ALL' && !newScope.id) return toast.error('Vui lòng chọn đơn vị!');
        
        // Tránh trùng
        const isDuplicate = form.scopes.find(s => s.type === newScope.type && s.id === newScope.id);
        if (isDuplicate) return toast.error('Phạm vi này đã được thêm!');

        setForm({ ...form, scopes: [...form.scopes, newScope] });
    };

    const removeScope = (index) => {
        const newScopes = [...form.scopes];
        newScopes.splice(index, 1);
        setForm({ ...form, scopes: newScopes });
    };

    const getScopeName = (scope) => {
        if (scope.type === 'ALL') return 'Toàn trường';
        if (scope.type === 'BRANCH') return branches.find(b => b.id.toString() === scope.id.toString())?.name || 'Liên chi đoàn';
        if (scope.type === 'CELL') return allCells.find(c => c.id.toString() === scope.id.toString())?.name || 'Chi đoàn';
        return 'Không xác định';
    };

    return (
        <ModalPortal onAttemptClose={handleAttemptClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-black text-gray-700 uppercase text-xs tracking-widest">Tạo đợt thu phí mới</h3>
                    <button onClick={handleAttemptClose} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên đợt thu phí *</label>
                            <input className={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Đoàn phí năm học 2025-2026" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Loại phí *</label>
                            <select className={INPUT} value={form.feeTypeId} onChange={e => setForm({ ...form, feeTypeId: e.target.value })}>
                                {types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hình thức chu kỳ *</label>
                            <select className={INPUT} value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}>
                                <option value="MONTH">Theo tháng (1 Item)</option>
                                <option value="YEAR">Theo năm (Tự băm 12 tháng)</option>
                                <option value="CUSTOM">Tùy chỉnh</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bắt đầu *</label>
                            <input type="date" className={INPUT} value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kết thúc *</label>
                            <input type="date" className={INPUT} value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hạn chót đóng *</label>
                            <input type="date" className={INPUT} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số tiền mỗi kỳ (đ) *</label>
                            <input type="number" className={INPUT} value={form.amountPerUnit} onChange={e => setForm({ ...form, amountPerUnit: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input type="checkbox" id="partial" className="w-4 h-4 rounded text-primary-700" checked={form.allowPartialPayment} onChange={e => setForm({ ...form, allowPartialPayment: e.target.checked })} />
                            <label htmlFor="partial" className="text-xs font-bold text-gray-600">Cho phép nộp từng tháng</label>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                        <label className="block text-[10px] font-black text-primary-700 uppercase tracking-widest">Phạm vi áp dụng (Scopes)</label>
                        <div className="flex gap-2">
                            <select className={`${INPUT} flex-1`} value={scopeInput.type} onChange={e => setScopeInput({ ...scopeInput, type: e.target.value, branchId: '', cellId: '' })}>
                                <option value="ALL">Toàn trường</option>
                                <option value="BRANCH">Theo Liên chi đoàn</option>
                                <option value="CELL">Theo Chi đoàn</option>
                            </select>
                            
                            {scopeInput.type === 'BRANCH' && (
                                <select className={`${INPUT} flex-1`} value={scopeInput.branchId} onChange={e => setScopeInput({ ...scopeInput, branchId: e.target.value })}>
                                    <option value="">-- Chọn Liên chi --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            )}

                            {scopeInput.type === 'CELL' && (
                                <>
                                    <select className={`${INPUT} flex-1`} value={scopeInput.branchId} onChange={e => setScopeInput({ ...scopeInput, branchId: e.target.value })}>
                                        <option value="">-- Lọc LCĐ --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <select className={`${INPUT} flex-1`} value={scopeInput.cellId} onChange={e => setScopeInput({ ...scopeInput, cellId: e.target.value })}>
                                        <option value="">-- Chọn Chi đoàn --</option>
                                        {allCells.filter(c => !scopeInput.branchId || c.unionBranchId.toString() === scopeInput.branchId.toString()).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </>
                            )}

                            <button className="px-4 py-2 bg-primary-700 text-white rounded-lg text-xs font-bold" onClick={addScope}>Thêm</button>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[30px]">
                            {form.scopes.length === 0 && <span className="text-[10px] text-gray-400 italic mt-1">Chưa có phạm vi (Mặc định toàn trường)</span>}
                            {form.scopes.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white border border-primary-100 rounded-full text-xs font-bold text-primary-700 shadow-sm">
                                    <span>{getScopeName(s)}</span>
                                    <button onClick={() => removeScope(idx)} className="hover:text-red-500 text-gray-400">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button className={BTN_SECONDARY} onClick={onClose}>Hủy</button>
                    <button className={BTN_PRIMARY} onClick={() => onSave(form)}>Kích hoạt đợt thu</button>
                </div>
            </div>
        </ModalPortal>
    );
}

const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Lấy domain gốc (ví dụ: http://localhost:5000)
    let baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    baseUrl = baseUrl.replace(/\/$/, ''); // Xóa dấu / ở cuối nếu có

    // Chuẩn hóa đường dẫn: thay \ thành /
    let cleanPath = path.replace(/\\/g, '/');

    // Nếu đường dẫn chứa 'uploads/', chỉ lấy từ 'uploads/' trở đi
    const uploadIndex = cleanPath.indexOf('uploads/');
    if (uploadIndex !== -1) {
        cleanPath = cleanPath.substring(uploadIndex);
    } else {
        cleanPath = cleanPath.replace(/^\//, ''); // Xóa / ở đầu nếu không tìm thấy uploads
    }

    const finalUrl = `${baseUrl}/${cleanPath}`;
    return finalUrl;
};

function EvidenceModal({ imageUrl, onClose }) {
    const fileUrl = getFileUrl(imageUrl);
    const isPdf = imageUrl?.toLowerCase().endsWith('.pdf');
    const isWord = imageUrl?.toLowerCase().endsWith('.doc') || imageUrl?.toLowerCase().endsWith('.docx');

    return (
        <ModalPortal onAttemptClose={onClose}>
            <div className="bg-black/90 p-4 rounded-xl relative max-w-4xl w-full flex flex-col items-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-white/20 p-2 rounded-full">✕</button>
                <div className="w-full h-[80vh] flex items-center justify-center">
                    {isPdf ? (
                        <iframe src={fileUrl} className="w-full h-full border-0 rounded-lg bg-white" title="PDF Evidence" />
                    ) : isWord ? (
                        <div className="text-center bg-white p-10 rounded-2xl flex flex-col items-center gap-4">
                            <Download size={64} className="text-blue-600" />
                            <p className="text-gray-800 font-bold">Tài liệu Word không thể xem trực tiếp</p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                            >
                                Tải xuống để xem
                            </a>
                        </div>
                    ) : (
                        <img src={fileUrl} alt="Evidence" className="max-w-full max-h-full object-contain" />
                    )}
                </div>
                <p className="text-white text-xs mt-4 uppercase font-black tracking-widest">
                    {isPdf ? 'Minh chứng PDF' : isWord ? 'Minh chứng Word' : 'Minh chứng Hình ảnh (Bill)'}
                </p>
            </div>
        </ModalPortal>
    );
}

export default function FeesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState(new Date().getFullYear().toString());
    const [branchFilter, setBranchFilter] = useState('');
    const [cellFilter, setCellFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid', 'history', 'types', 'pending', 'collections'
    const [modal, setModal] = useState(null);
    const [collectionModal, setCollectionModal] = useState(false);
    const [typeModal, setTypeModal] = useState(null);
    const [bankModal, setBankModal] = useState(false);
    const [evidenceUrl, setEvidenceUrl] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const { data: feeTypesRes } = useQuery({ queryKey: ['fee-types'], queryFn: () => feeTypeApi.getAll() });
    const feeTypes = feeTypesRes?.data?.data || [];

    const { data: unpaidRes, isLoading: loadingUnpaid } = useQuery({
        queryKey: ['fees', 'unpaid', period, branchFilter, cellFilter, search, page, typeFilter],
        queryFn: () => feeApi.getUnpaid({ period, search, page, unionFeeTypeId: typeFilter || undefined, unionBranchId: branchFilter || undefined, unionCellId: cellFilter || undefined }),
        enabled: activeTab === 'unpaid'
    });

    const { data: historyRes, isLoading: loadingHistory } = useQuery({
        queryKey: ['fees', 'history', period, branchFilter, cellFilter, search, page, typeFilter, showTrash],
        queryFn: () => feeApi.getAll({ period, search, page, unionFeeTypeId: typeFilter || undefined, unionBranchId: branchFilter || undefined, unionCellId: cellFilter || undefined, onlyDeleted: showTrash }),
        enabled: activeTab === 'history'
    });

    const { data: pendingRes, isLoading: loadingPending } = useQuery({
        queryKey: ['fees', 'pending'],
        queryFn: () => feeApi.getPending(),
        enabled: activeTab === 'pending'
    });

    const { data: collectionsRes, isLoading: loadingCollections } = useQuery({
        queryKey: ['fees', 'collections', search, page, typeFilter],
        queryFn: () => feeApi.getCollections({ search, page, feeTypeId: typeFilter || undefined }),
        enabled: activeTab === 'collections'
    });

    const { data: bankSettingRes } = useQuery({
        queryKey: ['bank-setting'],
        queryFn: () => feeApi.getBankSetting()
    });
    const bankSetting = bankSettingRes?.data?.data || null;

    const { data: membersRes } = useQuery({ queryKey: ['members-all'], queryFn: () => memberApi.getAll({ limit: 1000 }) });
    const { data: branchesRes } = useQuery({ queryKey: ['union-branches'], queryFn: () => memberApi.getBranches() });
    const { data: cellsRes } = useQuery({
        queryKey: ['union-cells', branchFilter],
        queryFn: () => memberApi.getCells(branchFilter),
        enabled: !!branchFilter
    });

    const { data: allCellsRes } = useQuery({
        queryKey: ['union-cells-all'],
        queryFn: () => memberApi.getCells(''), // Lấy danh sách không lọc
    });

    const allMembers = membersRes?.data?.data?.data || membersRes?.data?.data || [];
    const branches = branchesRes?.data?.data || [];
    const cells = cellsRes?.data?.data || [];
    const allCells = allCellsRes?.data?.data || [];

    const [selectedIds, setSelectedIds] = useState([]);
    const pagination = activeTab === 'unpaid' ? (unpaidRes?.data?.pagination || {}) : (activeTab === 'collections' ? (collectionsRes?.data?.pagination || {}) : (historyRes?.data?.pagination || {}));
    const currentData = activeTab === 'unpaid' ? (unpaidRes?.data?.data || []) : (activeTab === 'history' ? (historyRes?.data?.data || []) : (activeTab === 'collections' ? (collectionsRes?.data?.data || []) : (pendingRes?.data?.data || [])));
    const isLoading = activeTab === 'unpaid' ? loadingUnpaid : (activeTab === 'history' ? loadingHistory : (activeTab === 'collections' ? loadingCollections : loadingPending));

    // Reset selection when tab changes
    useEffect(() => { setSelectedIds([]); }, [activeTab, page, period, branchFilter, cellFilter, typeFilter]);

    const toggleSelectAll = () => {
        if (selectedIds.length === currentData.length) setSelectedIds([]);
        else setSelectedIds(currentData.map(item => item.id));
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const approveMutation = useMutation({
        mutationFn: feeApi.approve,
        onSuccess: () => { qc.invalidateQueries(['fees']); toast.success('Đã phê duyệt thanh toán'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => feeApi.reject(id, reason),
        onSuccess: () => { qc.invalidateQueries(['fees']); toast.success('Đã từ chối'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const updateBankMutation = useMutation({
        mutationFn: feeApi.updateBankSetting,
        onSuccess: () => { qc.invalidateQueries(['bank-setting']); setBankModal(false); toast.success('Đã cập nhật STK trường'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const createCollectionMutation = useMutation({
        mutationFn: feeApi.createCollection,
        onSuccess: () => { qc.invalidateQueries(['fees', 'collections']); setCollectionModal(false); toast.success('Đã tạo đợt thu phí thành công'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi tạo đợt thu phí')
    });

    const createMutation = useMutation({
        mutationFn: feeApi.create,
        onSuccess: (res) => {
            qc.invalidateQueries(['fees']);
            setModal(null);
            toast.success(res?.data?.message || 'Đã ghi nhận');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => feeApi.update(id, data),
        onSuccess: (res) => {
            qc.invalidateQueries(['fees']);
            setModal(null);
            toast.success(res?.data?.message || 'Đã cập nhật');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const deleteMutation = useMutation({
        mutationFn: feeApi.delete,
        onSuccess: () => { qc.invalidateQueries(['fees']); toast.success('Đã chuyển bản ghi vào thùng rác!'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const restoreMutation = useMutation({
        mutationFn: feeApi.restore,
        onSuccess: () => { qc.invalidateQueries(['fees']); toast.success('Đã khôi phục bản ghi!'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const forceDeleteMutation = useMutation({
        mutationFn: feeApi.forceDelete,
        onSuccess: () => { qc.invalidateQueries(['fees']); toast.success('Đã xóa vĩnh viễn!'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const bulkApproveMutation = useMutation({
        mutationFn: feeApi.bulkApprove,
        onSuccess: (res) => {
            qc.invalidateQueries(['fees']);
            setSelectedIds([]);
            toast.success(`Đã phê duyệt ${res?.data?.data?.count || 0} giao dịch`);
        },
        onError: (err) => toast.error('Lỗi khi phê duyệt hàng loạt')
    });

    const bulkRejectMutation = useMutation({
        mutationFn: feeApi.bulkReject,
        onSuccess: (res) => {
            qc.invalidateQueries(['fees']);
            setSelectedIds([]);
            toast.success(`Đã từ chối ${res?.data?.data?.count || 0} giao dịch`);
        },
        onError: (err) => toast.error('Lỗi khi từ chối hàng loạt')
    });

    const createTypeMutation = useMutation({
        mutationFn: feeTypeApi.create,
        onSuccess: () => { qc.invalidateQueries(['fee-types']); setTypeModal(null); toast.success('Đã thêm'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const updateTypeMutation = useMutation({
        mutationFn: ({ id, data }) => feeTypeApi.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['fee-types']); setTypeModal(null); toast.success('Đã cập nhật'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const deleteTypeMutation = useMutation({
        mutationFn: feeTypeApi.delete,
        onSuccess: () => { qc.invalidateQueries(['fee-types']); toast.success('Đã xóa'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
    });

    const handleConfirmFee = async (member) => {
        const selectedType = feeTypes.find(t => t.id === typeFilter) || feeTypes[0];
        if (!selectedType) return toast.error('Vui lòng tạo loại phí trước!');
        const amount = 24000;
        const typeLabel = selectedType.name + ` năm ${period}`;

        const res = await confirmAction(
            'Xác nhận nộp phí?',
            `Bạn xác nhận đoàn viên ${member.fullName} đã nộp ${typeLabel}? (Số tiền mặc định 24,000đ)`
        );

        if (res.isConfirmed) {
            createMutation.mutate({ unionMemberId: member.id, period, amount, unionFeeTypeId: selectedType.id, paymentMethod: 'CASH', status: 'SUCCESS', note: `Nộp ${typeLabel}` });
        }
    };

    const handleSave = (data) => {
        if (modal?.id) updateMutation.mutate({ id: modal.id, data });
        else createMutation.mutate(data);
    };

    const handleSaveType = (data) => {
        if (typeModal?.id) updateTypeMutation.mutate({ id: typeModal.id, data });
        else createTypeMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'unpaid' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('unpaid'); setPage(1); }}>Chưa nộp phí</button>
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'pending' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('pending'); setPage(1); }}>
                            Chờ duyệt {(pendingRes?.data?.data?.length > 0) && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRes.data.data.length}</span>}
                        </button>
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'collections' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('collections'); setPage(1); }}>Đợt thu phí</button>
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'history' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('history'); setPage(1); }}>Lịch sử nộp phí</button>
                        <button className={`px-6 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'types' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('types'); setPage(1); }}>Loại phí</button>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'collections' && (
                            <button className={BTN_PRIMARY} onClick={() => setCollectionModal(true)}><Filter size={16} /> Tạo đợt thu phí</button>
                        )}
                        <button className={BTN_SECONDARY} onClick={() => setBankModal(true)}>
                            <CreditCard size={16} /> Cấu hình Ngân hàng
                        </button>
                        {activeTab === 'types' ? (
                            <button className={BTN_PRIMARY} onClick={() => setTypeModal('add')}><Wallet size={16} /> Thêm loại phí</button>
                        ) : (
                            <div className="flex gap-2">
                                {activeTab === 'history' && (
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
                                    <button className={BTN_PRIMARY} onClick={() => setModal('add')}><Wallet size={16} /> Tạo bản ghi mới</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {activeTab !== 'types' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input className={`${INPUT} pl-10`} placeholder="Tìm đoàn viên..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <input type="number" className={INPUT} placeholder="Năm" value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} />
                        <select className={INPUT} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                            <option value="">-- Tất cả loại phí --</option>
                            {feeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select className={INPUT} value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setCellFilter(''); setPage(1); }}>
                            <option value="">-- Liên chi đoàn --</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select className={INPUT} value={cellFilter} onChange={e => { setCellFilter(e.target.value); setPage(1); }} disabled={!branchFilter}>
                            <option value="">-- Chi đoàn --</option>
                            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {activeTab === 'types' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tên loại phí</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {feeTypes.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-500 max-w-lg">{item.description}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" onClick={() => setTypeModal(item)}><Pencil size={16} /></button>
                                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" onClick={async () => {
                                                const res = await confirmDelete('Loại phí này');
                                                if (res.isConfirmed) deleteTypeMutation.mutate(item.id);
                                            }}><XCircle size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'collections' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tên đợt thu phí</th>
                                <th className="px-6 py-4">Kỳ hạn / Loại</th>
                                <th className="px-6 py-4">Số kỳ (Item)</th>
                                <th className="px-6 py-4">Số tiền / kỳ</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {currentData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 flex flex-col">
                                        <span className="font-bold text-gray-800">{item.name}</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{item.UnionFeeType?.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">{new Date(item.periodStart).toLocaleDateString('vi-VN')} - {new Date(item.periodEnd).toLocaleDateString('vi-VN')}</span>
                                            <span className="text-[10px] font-bold text-primary-700">{item.periodType}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{item.Items?.length || 0} mục</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{Number(item.amountPerUnit).toLocaleString()}đ</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {item.isActive ? 'Đang kích hoạt' : 'Đã đóng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Xem chi tiết"><History size={16} /></button>
                                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Báo cáo"><Download size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                            <Wallet size={18} className="text-primary-700" />
                            {activeTab === 'unpaid' ? `Đoàn viên chưa nộp ${period}` : (activeTab === 'history' ? (showTrash ? `Thùng rác nộp phí ${period}` : `Lịch sử nộp phí ${period}`) : 'Giao dịch chờ phê duyệt (VietQR)')}
                        </h3>
                        {activeTab !== 'pending' && <button className="text-[10px] font-black text-primary-700 uppercase flex items-center gap-1 hover:underline"><Download size={14} /> Xuất Excel</button>}
                    </div>
                    <div className="overflow-x-auto relative min-h-[400px]">
                        {/* Bulk Action Bar */}
                        {selectedIds.length > 0 && (
                            <div className="absolute top-0 left-0 right-0 h-14 bg-primary-700 text-white flex items-center justify-between px-6 z-20 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black uppercase tracking-widest">Đã chọn {selectedIds.length} bản ghi</span>
                                    <button className="text-[10px] font-black uppercase hover:underline" onClick={() => setSelectedIds([])}>Hủy chọn</button>
                                </div>
                                <div className="flex gap-2">
                                    {activeTab === 'pending' && (
                                        <>
                                            <button
                                                className="px-4 py-1.5 bg-white text-primary-700 text-[10px] font-black uppercase rounded-lg hover:bg-gray-100 transition"
                                                onClick={async () => {
                                                    if ((await confirmAction('Phê duyệt hàng loạt?', `Bạn muốn phê duyệt ${selectedIds.length} giao dịch đã chọn?`, 'Phê duyệt ngay')).isConfirmed) {
                                                        bulkApproveMutation.mutate(selectedIds);
                                                    }
                                                }}
                                            >
                                                Phê duyệt nhanh
                                            </button>
                                            <button
                                                className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-700 transition"
                                                onClick={async () => {
                                                    const res = await confirmReason('Từ chối hàng loạt', 'Nhập lý do từ chối cho các bản ghi đã chọn...');
                                                    if (res.isConfirmed && res.value) {
                                                        bulkRejectMutation.mutate({ ids: selectedIds, reason: res.value });
                                                    }
                                                }}
                                            >
                                                Từ chối nhanh
                                            </button>
                                        </>
                                    )}
                                    {activeTab === 'unpaid' && (
                                        <button
                                            className="px-4 py-1.5 bg-white text-primary-700 text-[10px] font-black uppercase rounded-lg hover:bg-gray-100 transition"
                                            onClick={async () => {
                                                const selectedType = feeTypes.find(t => t.id === typeFilter) || feeTypes[0];
                                                if (!selectedType) return toast.error('Vui lòng chọn loại phí!');
                                                if ((await confirmAction('Ghi nhận nộp phí hàng loạt?', `Xác nhận ${selectedIds.length} đoàn viên đã chọn đã nộp ${selectedType.name}?`, 'Ghi nhận ngay')).isConfirmed) {
                                                    createMutation.mutate({ targetType: 'MEMBER_LIST', memberIds: selectedIds, period, amount: 24000, unionFeeTypeId: selectedType.id, paymentMethod: 'CASH', deadline: `${period}-12-31` });
                                                }
                                            }}
                                        >
                                            Xác nhận đã nộp (Tiền mặt)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="py-20 flex justify-center"><div className="spinner" /></div>
                        ) : currentData.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 italic">Không có dữ liệu phù hợp</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 w-10">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.length === currentData.length && currentData.length > 0} onChange={toggleSelectAll} />
                                        </th>
                                        <th className="px-6 py-4">Đoàn viên</th>
                                        <th className="px-6 py-4">Đơn vị</th>
                                        <th className="px-6 py-4">{activeTab === 'pending' ? 'Kỳ đóng / Loại phí' : 'Loại phí'}</th>
                                        <th className="px-6 py-4 text-center">Thời hạn</th>
                                        <th className="px-6 py-4">Số tiền</th>
                                        <th className="px-6 py-4 text-center">Trạng thái / Minh chứng</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {currentData.map(item => (
                                        <tr key={item.id} className={`hover:bg-gray-50/50 transition border-l-4 ${selectedIds.includes(item.id) ? 'bg-primary-50/50 border-l-primary-700' : 'border-l-transparent'}`}>
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">{item.fullName || item.UnionMember?.fullName}</span>
                                                    <span className="text-[11px] text-gray-400">{item.memberCode || item.UnionMember?.memberCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{item.UnionCell?.name || item.UnionMember?.UnionCell?.name}</td>
                                            <td className="px-6 py-4">
                                                {activeTab === 'pending' ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        Kỳ {item.period} - {item.UnionFeeType?.name}
                                                    </span>
                                                ) : activeTab === 'unpaid' ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100">
                                                        {feeTypes.find(t => t.id === typeFilter)?.name || 'Đoàn phí'} - {period}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        {item.UnionFeeType?.name || item.type}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-[11px] text-gray-500">
                                                {item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : `31/12/${item.period || period}`}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800">
                                                {activeTab === 'unpaid' ? '24,000đ' : `${Number(item.amount || 0).toLocaleString()}đ`}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {activeTab === 'unpaid' ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Chưa nộp</span>
                                                ) : activeTab === 'history' ? (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto w-fit ${item.deletedAt ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                        {item.deletedAt ? <><Trash2 size={12} /> Đã xóa mềm</> : <><CheckCircle2 size={12} /> Đã nộp</>}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-black uppercase mx-auto transition"
                                                        onClick={() => setEvidenceUrl(item.evidenceImageUrl)}
                                                    >
                                                        <Search size={12} /> Xem Bill
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {activeTab === 'unpaid' ? (
                                                    <button className="p-2 bg-primary-100 text-primary-700 hover:bg-primary-700 hover:text-white rounded-lg active:scale-95 shadow-sm" onClick={() => handleConfirmFee(item)}><CreditCard size={16} /></button>
                                                ) : activeTab === 'history' ? (
                                                    <div className="flex gap-2 justify-center">
                                                        {!showTrash ? (
                                                            <>
                                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" onClick={() => setModal(item)}><Pencil size={16} /></button>
                                                                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" onClick={async () => {
                                                                    const res = await confirmDelete('Bản ghi');
                                                                    if (res.isConfirmed) deleteMutation.mutate(item.id);
                                                                }}><XCircle size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                    onClick={async () => {
                                                                        const res = await confirmRestore(`bản ghi của ${item.UnionMember?.fullName}`);
                                                                        if (res.isConfirmed) restoreMutation.mutate(item.id);
                                                                    }}
                                                                    title="Khôi phục"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                                <button
                                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                                    onClick={async () => {
                                                                        const res = await confirmForceDelete(`bản ghi của ${item.UnionMember?.fullName}`);
                                                                        if (res.isConfirmed) forceDeleteMutation.mutate(item.id);
                                                                    }}
                                                                    title="Xóa vĩnh viễn"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition"
                                                            title="Phê duyệt"
                                                            onClick={async () => {
                                                                if ((await confirmAction('Phê duyệt Giao dịch?', `Phê duyệt giao dịch của ${item.UnionMember?.fullName}?`, 'Đồng ý')).isConfirmed) {
                                                                    approveMutation.mutate(item.id);
                                                                }
                                                            }}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button
                                                            className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                                                            title="Từ chối"
                                                            onClick={async () => {
                                                                const res = await confirmReason('Từ chối giao dịch', 'Nhập lý do từ chối (ví dụ: Minh chứng không hợp lệ)...');
                                                                if (res.isConfirmed && res.value) {
                                                                    rejectMutation.mutate({ id: item.id, reason: res.value });
                                                                }
                                                            }}
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
            {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trang {page} / {pagination.totalPages}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${p === page ? 'bg-primary-700 text-white' : 'hover:bg-gray-200 text-gray-600'}`} onClick={() => setPage(p)}>{p}</button>
                        ))}
                    </div>
                </div>
            )}

            {modal && <FeeModal fee={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} members={allMembers} types={feeTypes} branches={branches} cells={allCells} />}
            {typeModal && <FeeTypeModal type={typeModal === 'add' ? null : typeModal} onClose={() => setTypeModal(null)} onSave={handleSaveType} />}
            {bankModal && <BankSettingModal setting={bankSetting} onClose={() => setBankModal(false)} onSave={(data) => updateBankMutation.mutate(data)} isLoading={updateBankMutation.isPending} />}
            {collectionModal && <CollectionModal onClose={() => setCollectionModal(false)} onSave={createCollectionMutation.mutate} types={feeTypes} branches={branches} allCells={allCells} />}
            {evidenceUrl && <EvidenceModal imageUrl={evidenceUrl} onClose={() => setEvidenceUrl(null)} />}
        </div>
    );
}
