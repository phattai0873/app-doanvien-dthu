import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ArrowRight, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizApi } from '../../services/api';

const INPUT = "w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm outline-none hover:border-primary-400 hover:bg-primary-50 focus:border-primary-700 focus:ring-2 focus:ring-primary-50 transition";
const BTN_PRIMARY = "flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-sm";

export default function CreateQuizPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', timeLimit: 15, satisfactoryScore: 50, level: 'SCHOOL',
        startDate: '', endDate: '', status: 'UPCOMING',
        questions: [{ content: '', score: 10, options: [{ content: '', isCorrect: true }, { content: '', isCorrect: false }] }]
    });

    const createMutation = useMutation({
        mutationFn: quizApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['quiz']);
            toast.success('Đã tạo kỳ thi thành công!');
            navigate('/admin/quiz');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
    });

    const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const updateQ = (qIdx, k, v) => setForm(f => {
        const qs = [...f.questions]; qs[qIdx][k] = v; return { ...f, questions: qs };
    });

    const updateOpt = (qIdx, oIdx, k, v) => setForm(f => {
        const qs = [...f.questions];
        if (k === 'isCorrect') qs[qIdx].options.forEach(o => o.isCorrect = false); // Single correct answer
        qs[qIdx].options[oIdx][k] = v;
        return { ...f, questions: qs };
    });

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleSave = () => {
        if (!form.title) return toast.error('Vui lòng nhập tên kỳ thi');
        if (form.questions.length === 0) return toast.error('Phải có ít nhất 1 câu hỏi');

        const finalForm = new FormData();
        finalForm.append('title', form.title);
        finalForm.append('description', form.description);
        finalForm.append('timeLimit', form.timeLimit);
        finalForm.append('satisfactoryScore', form.satisfactoryScore);
        finalForm.append('level', form.level);
        if (form.startDate) finalForm.append('startDate', form.startDate);
        if (form.endDate) finalForm.append('endDate', form.endDate);
        finalForm.append('status', form.status);
        finalForm.append('questions', JSON.stringify(form.questions));
        if (file) {
            finalForm.append('thumbnail', file);
        }

        createMutation.mutate(finalForm);
    };

    return (
        <div className="max-w-10xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/quiz')} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">Tạo Kỳ thi / Khảo sát mới</h1>
                    <p className="text-sm text-gray-500 font-medium">Thiết lập thông tin và câu hỏi cho bài kiểm tra</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${step === 1 ? 'border-primary-700 text-primary-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={() => setStep(1)}>
                        1. Thông tin chung
                    </button>
                    <button className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${step === 2 ? 'border-primary-700 text-primary-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={() => setStep(2)}>
                        2. Nội dung câu hỏi ({form.questions.length})
                    </button>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-1 space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700">Ảnh bìa (Thumbnail)</label>
                                    <label className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 cursor-pointer overflow-hidden relative group hover:border-primary-500 hover:bg-primary-50 transition">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        {preview ? (
                                            <img src={preview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <ImageIcon size={32} className="text-gray-400 mb-2 group-hover:text-primary-500 transition" />
                                                <span className="text-sm font-semibold text-gray-500 group-hover:text-primary-600 transition">Tải ảnh lên</span>
                                                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP</span>
                                            </>
                                        )}
                                        {preview && (
                                            <div className="absolute inset-0 bg-black/50 items-center justify-center flex opacity-0 group-hover:opacity-100 transition">
                                                <span className="text-white text-sm font-bold">Thay Đổi Bìa</span>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="col-span-2 space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên kỳ thi *</label>
                                        <input className={INPUT} value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="VD: Kiểm tra kiến thức Đoàn TNCS Hồ Chí Minh - Kỳ 1..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả ngắn</label>
                                        <textarea className={INPUT} rows={4} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Viết mô tả hoặc hướng dẫn làm bài..." />
                                    </div>
                                    <div className="grid grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phạm vi hiển thị *</label>
                                            <select className={INPUT} value={form.level} onChange={e => updateForm('level', e.target.value)}>
                                                <option value="SCHOOL">Cấp Trường</option>
                                                <option value="BRANCH">Cấp Khoa</option>
                                                <option value="CELL">Cấp Lớp</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Điểm đạt *</label>
                                            <input type="number" className={INPUT} value={form.satisfactoryScore} onChange={e => updateForm('satisfactoryScore', Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời gian (phút) *</label>
                                            <input type="number" className={INPUT} value={form.timeLimit} onChange={e => updateForm('timeLimit', Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày bắt đầu *</label>
                                            <input type="datetime-local" className={INPUT} value={form.startDate} onChange={e => updateForm('startDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày kết thúc *</label>
                                            <input type="datetime-local" className={INPUT} value={form.endDate} onChange={e => updateForm('endDate', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái kỳ thi *</label>
                                        <select className={INPUT} value={form.status} onChange={e => updateForm('status', e.target.value)}>
                                            <option value="DRAFT">Bản nháp (Chưa cho phép thi)</option>
                                            <option value="UPCOMING">Đã xuất bản (Tự động theo lịch)</option>
                                            <option value="FINISHED">Đóng kỳ thi (Kết thúc sớm)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <button 
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
                                    onClick={handleSave}
                                    disabled={createMutation.isLoading}
                                >
                                    {createMutation.isLoading ? 'Đang lưu...' : 'Lưu bản nháp'}
                                </button>
                                <button className={BTN_PRIMARY} onClick={() => setStep(2)}>Tiếp tục: Cập nhật Câu hỏi <ArrowRight size={16} /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {form.questions.map((q, qIdx) => (
                                <div key={qIdx} className="p-6 border border-gray-200 rounded-xl space-y-4 bg-gray-50/30">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <p className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md text-sm">Câu {qIdx + 1}</p>
                                        <button className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-red-50 transition" onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qIdx) }))}>
                                            <Trash2 size={16} /> Xóa câu hỏi
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 tracking-wider">Nội dung câu hỏi</label>
                                            <input className={INPUT} value={q.content} onChange={e => updateQ(qIdx, 'content', e.target.value)} placeholder="Bạn muốn hỏi gì..." />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 tracking-wider">Điểm</label>
                                            <input type="number" className={INPUT} value={q.score} onChange={e => updateQ(qIdx, 'score', Number(e.target.value))} placeholder="VD: 10" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách Đáp án (Chọn đáp án đúng)</label>
                                        <div className="space-y-2">
                                            {q.options.map((o, oIdx) => (
                                                <div key={oIdx} className={`flex gap-3 items-center p-2 rounded-lg border transition ${o.isCorrect ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'}`}>
                                                    <input type="radio" name={`q_${qIdx}_correct`} checked={o.isCorrect} onChange={() => updateOpt(qIdx, oIdx, 'isCorrect', true)} className="w-5 h-5 ml-2 text-primary-600 cursor-pointer" />
                                                    <input className="flex-1 px-3 py-2 text-sm outline-none bg-transparent" value={o.content} onChange={e => updateOpt(qIdx, oIdx, 'content', e.target.value)} placeholder={`Nhập đáp án ${oIdx + 1}...`} />
                                                    <button className="text-gray-400 hover:text-red-500 p-2" onClick={() => setForm(f => { const qs = [...f.questions]; qs[qIdx].options = qs[qIdx].options.filter((_, i) => i !== oIdx); return { ...f, questions: qs } })}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="text-primary-700 text-sm font-semibold hover:bg-primary-50 px-3 py-1.5 rounded-md transition inline-flex items-center gap-1.5 mt-2" onClick={() => setForm(f => { const qs = [...f.questions]; qs[qIdx].options.push({ content: '', isCorrect: false }); return { ...f, questions: qs } })}>
                                            + Thêm lựa chọn
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button className="w-full py-4 border-2 border-dashed border-primary-200 text-primary-700 bg-primary-50/50 text-sm font-bold rounded-xl hover:bg-primary-50 transition flex items-center justify-center gap-2" onClick={() => setForm(f => ({ ...f, questions: [...f.questions, { content: '', score: 10, options: [{ content: '', isCorrect: true }, { content: '', isCorrect: false }] }] }))}>
                                + THÊM CÂU HỎI MỚI
                            </button>

                            <div className="pt-6 flex justify-between border-t border-gray-100">
                                <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition" onClick={() => setStep(1)}>Quay lại thông tin chung</button>
                                <button className={BTN_PRIMARY} onClick={handleSave} disabled={createMutation.isLoading}>
                                    {createMutation.isLoading ? 'Đang lưu...' : 'Lưu và Phát hành Kỳ thi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
