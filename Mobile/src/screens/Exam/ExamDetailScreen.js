import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';

const { width } = Dimensions.get('window');

export const ExamDetailScreen = ({ route, goBack }) => {
    const { id } = route?.params || {};
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    // answers: { [questionId]: optionId (string) }
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);

    // ─── Đồng hồ đếm ngược ───────────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(0); // giây
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [res, userData] = await Promise.all([
                    examService.getExamDetail(id),
                    authService.getCurrentUser()
                ]);
                const examData = res.data || res;
                setExam(examData);
                // Khởi tạo thời gian làm bài (giây)
                setTimeLeft((examData.timeLimit || 0) * 60);
                setUser(userData.data || userData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    // Bắt đồng hồ khi bắt đầu làm bài
    useEffect(() => {
        if (!started) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Hết giờ → tự động nộp bài
                    submitAnswers(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started]);

    // Format mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isTimeLow = timeLeft <= 60 && timeLeft > 0; // dưới 1 phút

    // ─── Lấy danh sách câu hỏi thực từ exam ──────────────────────────────────
    const questions = exam?.QuizQuestions || [];

    const handleStart = () => {
        if (user?.UnionMember?.status !== 'approved') {
            Alert.alert(
                'Chưa được phép',
                'Hồ sơ Đoàn viên của bạn đang chờ phê duyệt. Bạn chỉ có thể tham gia thi/kiểm tra sau khi hồ sơ đã chính thức được xác nhận.'
            );
            return;
        }
        if (!questions || questions.length === 0) {
            Alert.alert('Thông báo', 'Kỳ thi này chưa có câu hỏi.');
            return;
        }
        setStarted(true);
    };

    const selectOption = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    // ─── Nộp bài ─────────────────────────────────────────────────────────────
    // Chuyển answers map { questionId -> optionId } thành format API yêu cầu:
    // [{ questionId, optionIds: [optionId] }]
    const buildPayload = () => {
        return Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionIds: [optionId]
        }));
    };

    const submitAnswers = useCallback(async (isAutoSubmit = false) => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        try {
            const memberId = user?.UnionMember?.id;
            const payload = buildPayload();
            const result = await examService.submitAttempt(id, { memberId, answers: payload });
            const data = result.data || result;
            Alert.alert(
                isAutoSubmit ? '⏰ Hết giờ – Đã nộp bài' : '✅ Nộp bài thành công',
                `Điểm của bạn: ${data.score ?? '—'}\n${data.isPassed ? '🎉 Đạt yêu cầu' : '❌ Chưa đạt yêu cầu'}`,
                [{ text: 'Về danh sách', onPress: () => goBack && goBack() }]
            );
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Gửi bài thi thất bại';
            Alert.alert('Lỗi', msg);
            setSubmitting(false);
        }
    }, [answers, id, user, goBack]);

    const handleSubmit = () => {
        Alert.alert(
            'Nộp bài',
            'Đồng chí chắc chắn muốn nộp bài thi này?',
            [
                { text: 'Kiểm tra lại', style: 'cancel' },
                { text: 'Nộp bài', onPress: () => submitAnswers(false) }
            ]
        );
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // ─── Màn hình giới thiệu (chưa bắt đầu) ──────────────────────────────────
    if (!started) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.introContent}>
                    <View style={styles.introIcon}>
                        {exam.thumbnail ? (
                            <Image 
                                source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${exam.thumbnail}` }} 
                                style={styles.thumbnailImage}
                                onError={(e) => console.log(`[ExamDetail] Image Load Error: ${e.nativeEvent.error}`)}
                            />
                        ) : (
                            <Icon name="Award" size={80} color={COLORS.primary} />
                        )}
                    </View>
                    <Text style={styles.introTitle}>{exam.title}</Text>
                    <Text style={styles.introDesc}>{exam.description}</Text>

                    <View style={styles.rulesCard}>
                        <Text style={styles.rulesTitle}>QUY ĐỊNH PHÒNG THI</Text>
                        <View style={styles.ruleItem}>
                            <Icon name="Time" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Thời gian làm bài: {exam.timeLimit} phút</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <Icon name="Calendar" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Bắt đầu: {exam.startDate ? new Date(exam.startDate).toLocaleString('vi-VN') : '—'}</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <Icon name="Calendar" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Kết thúc: {exam.endDate ? new Date(exam.endDate).toLocaleString('vi-VN') : '—'}</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <Icon name="CheckCircle" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Số lượng câu hỏi: {questions.length} câu</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <Icon name="Shield" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Không sử dụng tài liệu, trình duyệt ngoài</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                        <Text style={styles.startBtnText}>BẮT ĐẦU LÀM BÀI</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // ─── Màn hình làm bài ────────────────────────────────────────────────────
    const q = questions[currentQuestion];

    if (!q) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy câu hỏi.</Text>
            </View>
        );
    }

    const options = q.QuizOptions || [];

    return (
        <View style={styles.container}>
            {/* Header: tiến độ + đồng hồ */}
            <View style={styles.quizHeader}>
                <View>
                    <Text style={styles.qCount}>Câu hỏi {currentQuestion + 1}/{questions.length}</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
                    </View>
                </View>
                <View style={[styles.timerBadge, isTimeLow && styles.timerBadgeLow]}>
                    <Icon name="Time" size={16} color={isTimeLow ? '#FFF' : '#EF4444'} />
                    <Text style={[styles.timerText, isTimeLow && styles.timerTextLow]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.quizContent}>
                <Text style={styles.questionText}>{q.content}</Text>

                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionCard, answers[q.id] === opt.id && styles.optionSelected]}
                        onPress={() => selectOption(q.id, opt.id)}
                    >
                        <View style={[styles.optionCircle, answers[q.id] === opt.id && styles.circleSelected]}>
                            {answers[q.id] === opt.id && <View style={styles.circleInner} />}
                        </View>
                        <Text style={[styles.optionText, answers[q.id] === opt.id && styles.textSelected]}>{opt.content}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.quizFooter}>
                <TouchableOpacity
                    style={[styles.navBtn, currentQuestion === 0 && styles.disabledBtn]}
                    disabled={currentQuestion === 0}
                    onPress={() => setCurrentQuestion(curr => curr - 1)}
                >
                    <Text style={styles.navBtnText}>Quay lại</Text>
                </TouchableOpacity>

                {currentQuestion < questions.length - 1 ? (
                    <TouchableOpacity
                        style={styles.navBtnPrimary}
                        onPress={() => setCurrentQuestion(curr => curr + 1)}
                    >
                        <Text style={styles.navBtnTextPrimary}>Tiếp theo</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color="#FFF" />
                            : <Text style={styles.submitBtnText}>NỘP BÀI</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    introContent: { padding: 24, paddingBottom: 50, alignItems: 'center' },
    introIcon: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden' },
    thumbnailImage: { width: '100%', height: '100%', borderRadius: 20 },
    introTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    introDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 22 },
    rulesCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', marginTop: 32, borderWidth: 1, borderColor: '#F3F4F6' },
    rulesTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 16, letterSpacing: 1 },
    ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    ruleText: { fontSize: 14, color: '#4B5563', marginLeft: 12 },
    startBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16, borderRadius: 12, marginTop: 40, alignItems: 'center' },
    startBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

    // Quiz UI
    quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    qCount: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold' },
    progressBarBg: { width: 120, height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    timerBadgeLow: { backgroundColor: '#EF4444' },
    timerText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
    timerTextLow: { color: '#FFF' },
    quizContent: { padding: 20 },
    questionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', lineHeight: 26, marginBottom: 24 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
    optionSelected: { borderColor: COLORS.primary, backgroundColor: '#FEF2F2' },
    optionCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    circleSelected: { borderColor: COLORS.primary },
    circleInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
    optionText: { flex: 1, marginLeft: 16, fontSize: 15, color: '#4B5563' },
    textSelected: { color: COLORS.primary, fontWeight: '500' },
    quizFooter: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
    navBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    navBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
    navBtnText: { color: '#6B7280', fontWeight: 'bold' },
    navBtnTextPrimary: { color: '#FFF', fontWeight: 'bold' },
    submitBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    submitBtnText: { color: '#FFF', fontWeight: 'bold' },
    disabledBtn: { opacity: 0.5 }
});
