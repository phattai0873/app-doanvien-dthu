import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';
import { ConfirmModal } from '../../components/ConfirmModal';

const { width } = Dimensions.get('window');

export const ExamDetailScreen = ({ route, goBack }) => {
    const { id } = route?.params || {};
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    
    // View States: 'intro' | 'quiz' | 'result'
    const [currentView, setCurrentView] = useState('intro');
    const [isReviewMode, setIsReviewMode] = useState(false);
    
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(null);
    const [resultData, setResultData] = useState(null);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
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

    useEffect(() => {
        if (currentView !== 'quiz' || isReviewMode) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    submitAnswers(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [currentView, isReviewMode]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isTimeLow = timeLeft <= 60 && timeLeft > 0;
    const questions = exam?.QuizQuestions || [];

    const handleStart = () => {
        if (user?.UnionMember?.status !== 'approved') {
            setShowSubmitModal({
                title: 'Chưa được phép',
                message: 'Hồ sơ Đoàn viên của bạn đang chờ phê duyệt. Bạn chỉ có thể tham gia thi sau khi hồ sơ đã được xác nhận.',
                type: 'danger'
            });
            return;
        }
        if (!questions || questions.length === 0) {
            setShowSubmitModal({
                title: 'Thông báo',
                message: 'Kỳ thi này hiện chưa cập nhật câu hỏi. Vui lòng quay lại sau.',
                type: 'info'
            });
            return;
        }
        setCurrentView('quiz');
    };

    const selectOption = (questionId, optionId) => {
        if (isReviewMode) return;
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const buildPayload = () => {
        return Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionIds: [optionId]
        }));
    };

    const submitAnswers = useCallback(async (isAutoSubmit = false) => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        setShowSubmitModal(null);
        try {
            const memberId = user?.UnionMember?.id;
            const payload = buildPayload();
            const result = await examService.submitAttempt(id, { memberId, answers: payload });
            const data = result.data || result;
            
            setResultData(data);
            setCurrentView('result');
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Gửi bài thi thất bại';
            setShowSubmitModal({
                title: 'Lỗi nộp bài',
                message: msg,
                type: 'danger'
            });
        } finally {
            setSubmitting(false);
        }
    }, [answers, id, user]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải đề thi...</Text>
            </View>
        );
    }

    // ─── RENDERING VIEWS ──────────────────────────────────────────────────

    const renderIntro = () => (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.introScroll}>
            <View style={styles.introHeader}>
                <View style={styles.introImageContainer}>
                    {exam.thumbnail ? (
                        <Image 
                            source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${exam.thumbnail}` }} 
                            style={styles.introThumbnail}
                        />
                    ) : (
                        <View style={styles.introIconBg}>
                            <Icon name="Trophy" size={80} color={COLORS.primary} />
                        </View>
                    )}
                </View>
                <Text style={styles.introTitle}>{exam.title}</Text>
                <Text style={styles.introSubtitle}>Cuộc thi trực tuyến cấp Trường</Text>
            </View>

            <View style={styles.examCard}>
                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>MÔ TẢ</Text>
                    <Text style={styles.sectionValue}>{exam.description || 'Tham gia kiểm tra kiến thức để rèn luyện và đạt kết quả tốt nhất.'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.rulesGrid}>
                    <View style={styles.ruleBox}>
                        <Icon name="Clock" size={20} color={COLORS.primary} />
                        <Text style={styles.ruleLabel}>Thời gian</Text>
                        <Text style={styles.ruleValue}>{exam.timeLimit} phút</Text>
                    </View>
                    <View style={styles.ruleBox}>
                        <Icon name="Layers" size={20} color={COLORS.primary} />
                        <Text style={styles.ruleLabel}>Câu hỏi</Text>
                        <Text style={styles.ruleValue}>{questions.length} câu</Text>
                    </View>
                    <View style={styles.ruleBox}>
                        <Icon name="Award" size={20} color={COLORS.warning} />
                        <Text style={styles.ruleLabel}>Điểm đạt</Text>
                        <Text style={styles.ruleValue}>{exam.satisfactoryScore}</Text>
                    </View>
                </View>

                <View style={styles.infoList}>
                    <View style={styles.infoRow}>
                        <Icon name="Calendar" size={16} color={COLORS.gray400} />
                        <Text style={styles.infoText}>Bắt đầu: {new Date(exam.startDate).toLocaleString('vi-VN')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="Calendar" size={16} color={COLORS.gray400} />
                        <Text style={styles.infoText}>Kết thúc: {new Date(exam.endDate).toLocaleString('vi-VN')}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={handleStart} activeOpacity={0.8}>
                <Text style={styles.mainBtnText}>BẮT ĐẦU LÀM BÀI</Text>
                <Icon name="ChevronRight" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtnTextOnly} onPress={goBack}>
                <Text style={styles.backLink}>Quay lại danh sách</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderQuiz = () => {
        const q = questions[currentQuestion];
        const options = q?.QuizOptions || [];
        const progress = ((currentQuestion + 1) / questions.length) * 100;

        return (
            <SafeAreaView style={styles.flex1}>
                {/* Custom Header */}
                <View style={styles.quizHeader}>
                    <TouchableOpacity onPress={() => goBack && goBack()} style={styles.iconBtn}>
                        <Icon name="ArrowLeft" size={24} color={COLORS.gray900} />
                    </TouchableOpacity>
                    
                    <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Câu {currentQuestion + 1} / {questions.length}</Text>
                        <View style={styles.barContainer}>
                            <View style={[styles.barFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <View style={[styles.timerBadge, isTimeLow && styles.timerBadgeLow]}>
                        <Icon name="Clock" size={14} color={isTimeLow ? '#FFF' : COLORS.error} />
                        <Text style={[styles.timerText, isTimeLow && styles.timerTextLow]}>{formatTime(timeLeft)}</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.quizScroll}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>{q?.content}</Text>
                    </View>

                    <View style={styles.optionsList}>
                        {options.map((opt, index) => {
                            const isSelected = answers[q.id] === opt.id;
                            const label = String.fromCharCode(65 + index); // A, B, C, D
                            
                            // Review mode highlighting
                            const isCorrect = isReviewMode && opt.isCorrect;
                            const isWrongSelection = isReviewMode && isSelected && !opt.isCorrect;

                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.optionCard, 
                                        isSelected && styles.optionSelected,
                                        isCorrect && styles.optionCorrect,
                                        isWrongSelection && styles.optionWrong
                                    ]}
                                    onPress={() => selectOption(q.id, opt.id)}
                                    activeOpacity={isReviewMode ? 1 : 0.7}
                                    disabled={isReviewMode}
                                >
                                    <View style={[
                                        styles.optionIndicator, 
                                        isSelected && styles.indicatorActive,
                                        isCorrect && styles.indicatorCorrect,
                                        isWrongSelection && styles.indicatorWrong
                                    ]}>
                                        {isSelected && !isReviewMode ? (
                                            <Icon name="CheckCircle" size={14} color="#FFF" />
                                        ) : isCorrect ? (
                                            <Icon name="CheckCircle" size={14} color="#FFF" />
                                        ) : isWrongSelection ? (
                                            <Icon name="X" size={14} color="#FFF" />
                                        ) : (
                                            <Text style={styles.indicatorLabel}>{label}</Text>
                                        )}
                                    </View>
                                    <View style={styles.flex1}>
                                        <Text style={[
                                            styles.optionText, 
                                            isSelected && styles.optionTextSelected,
                                            isCorrect && styles.textCorrect,
                                            isWrongSelection && styles.textWrong
                                        ]}>
                                            {opt.content}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
                            style={styles.nextBtn}
                            onPress={() => setCurrentQuestion(curr => curr + 1)}
                        >
                            <Text style={styles.nextBtnText}>Câu tiếp theo</Text>
                            <Icon name="ChevronRight" size={18} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        isReviewMode ? (
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={() => setCurrentView('result')}
                            >
                                <Text style={styles.submitBtnText}>XEM KẾT QUẢ</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={() => setShowSubmitModal({
                                    title: 'Nộp bài thi',
                                    message: 'Đồng chí chắc chắn muốn kết thúc bài thi và nộp kết quả ngay bây giờ?',
                                    onConfirm: () => submitAnswers(false)
                                })}
                            >
                                <Text style={styles.submitBtnText}>NỘP BÀI</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </SafeAreaView>
        );
    };

    const renderResult = () => (
        <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
                <View style={styles.trophyContainer}>
                    <Icon name="Trophy" size={100} color={COLORS.warning} />
                </View>
                <Text style={styles.resultTitle}>Chúc mừng!</Text>
                <Text style={styles.resultDesc}>Đồng chí đã hoàn thành bài thi.</Text>
            </View>

            <View style={styles.scoreBoard}>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{resultData?.score ?? 0}</Text>
                    <Text style={styles.scoreLabel}>Tổng điểm</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreValue, { color: COLORS.success }]}>{resultData?.isPassed ? 'Đạt' : 'Chưa'}</Text>
                    <Text style={styles.scoreLabel}>Kết quả</Text>
                </View>
            </View>

            <View style={styles.statsList}>
                <View style={styles.statLine}>
                    <Text style={styles.statLabelText}>Thời gian hoàn thành:</Text>
                    <Text style={styles.statValueText}>{formatTime(timeLeft)} còn lại</Text>
                </View>
            </View>

            <View style={styles.resultActions}>
                <TouchableOpacity style={styles.primaryResultBtn} onPress={goBack}>
                    <Text style={styles.primaryResultBtnText}>Quay về danh sách</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryResultBtn} onPress={() => {
                    setIsReviewMode(true);
                    setCurrentView('quiz');
                    setCurrentQuestion(0);
                }}>
                    <Text style={styles.secondaryResultBtnText}>Xem lại bài làm</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {currentView === 'intro' && renderIntro()}
            {currentView === 'quiz' && renderQuiz()}
            {currentView === 'result' && renderResult()}

            {submitting && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={styles.overlayText}>Đang nộp bài...</Text>
                </View>
            )}

            <ConfirmModal
                visible={!!showSubmitModal}
                title={showSubmitModal?.title || 'Xác nhận'}
                message={showSubmitModal?.message || ''}
                type={showSubmitModal?.type || 'warning'}
                onConfirm={showSubmitModal?.onConfirm || (() => setShowSubmitModal(null))}
                onCancel={() => setShowSubmitModal(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    flex1: { flex: 1 },
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.gray500, fontWeight: '600' },

    // Intro Styles
    introScroll: { padding: 24, paddingBottom: 60 },
    introHeader: { alignItems: 'center', marginBottom: 32 },
    introImageContainer: { width: 140, height: 140, borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF', elevation: 10, shadowOpacity: 0.1, shadowRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    introThumbnail: { width: '100%', height: '100%', borderRadius: 32 },
    introIconBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },
    introTitle: { fontSize: 24, fontWeight: '900', color: COLORS.gray900, textAlign: 'center' },
    introSubtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },

    examCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 4, shadowOpacity: 0.05, shadowRadius: 10 },
    cardSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1, marginBottom: 8 },
    sectionValue: { fontSize: 15, color: COLORS.gray600, lineHeight: 22 },
    divider: { height: 1, backgroundColor: COLORS.gray100, marginBottom: 24 },

    rulesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    ruleBox: { flex: 1, alignItems: 'center', padding: 12 },
    ruleLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 8, fontWeight: '600' },
    ruleValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray900, marginTop: 2 },

    infoList: { gap: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },

    mainBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, marginTop: 40, gap: 10, elevation: 8, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12 },
    mainBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    backBtnTextOnly: { marginTop: 24, alignItems: 'center' },
    backLink: { color: COLORS.gray500, fontWeight: '700', textDecorationLine: 'underline' },

    // Quiz Styles
    quizHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12, paddingTop: Platform.OS === 'ios' ? 0 : 10 },
    progressSection: { flex: 1 },
    progressText: { fontSize: 12, fontWeight: '800', color: COLORS.gray500, marginBottom: 6 },
    barContainer: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: COLORS.primary },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.error + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    timerBadgeLow: { backgroundColor: COLORS.error },
    timerText: { fontSize: 14, fontWeight: '800', color: COLORS.error },
    timerTextLow: { color: '#FFF' },

    quizScroll: { padding: 20 },
    questionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 24, elevation: 4, shadowOpacity: 0.05 },
    questionText: { fontSize: 19, fontWeight: '800', color: COLORS.gray900, lineHeight: 28 },
    optionsList: { gap: 16 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowOpacity: 0.05 },
    optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08', elevation: 0 },
    optionIndicator: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    indicatorActive: { backgroundColor: COLORS.primary },
    indicatorLabel: { fontSize: 15, fontWeight: '800', color: COLORS.gray500 },
    optionText: { flex: 1, fontSize: 16, color: COLORS.gray700, fontWeight: '500' },
    optionTextSelected: { color: COLORS.primary, fontWeight: '700' },

    optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.success + '08' },
    optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.error + '08' },
    indicatorCorrect: { backgroundColor: COLORS.success },
    indicatorWrong: { backgroundColor: COLORS.error },
    textCorrect: { color: COLORS.success, fontWeight: '700' },
    textWrong: { color: COLORS.error, fontWeight: '700' },

    quizFooter: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12 },
    navBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
    navBtnText: { color: COLORS.gray600, fontWeight: '800' },
    nextBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gray900, borderRadius: 14, gap: 8 },
    nextBtnText: { color: '#FFF', fontWeight: '800' },
    submitBtn: { flex: 1.5, backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    submitBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
    disabledBtn: { opacity: 0.5 },

    // Result Styles
    resultContainer: { flex: 1, backgroundColor: '#FFF', padding: 30, justifyContent: 'center' },
    resultHeader: { alignItems: 'center', marginBottom: 40 },
    trophyContainer: { marginBottom: 24 },
    resultTitle: { fontSize: 32, fontWeight: '900', color: COLORS.gray900 },
    resultDesc: { fontSize: 16, color: COLORS.gray500, marginTop: 10 },
    scoreBoard: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 24, padding: 30, marginBottom: 30, alignItems: 'center' },
    scoreItem: { flex: 1, alignItems: 'center' },
    scoreValue: { fontSize: 40, fontWeight: '900', color: COLORS.primary },
    scoreLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray400, marginTop: 4 },
    scoreDivider: { width: 1, height: 40, backgroundColor: COLORS.gray200 },
    statsList: { marginBottom: 40 },
    statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statLabelText: { fontSize: 15, color: COLORS.gray600, fontWeight: '500' },
    statValueText: { fontSize: 15, color: COLORS.gray900, fontWeight: '800' },
    resultActions: { gap: 16 },
    primaryResultBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
    primaryResultBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    secondaryResultBtn: { paddingVertical: 18, borderRadius: 16, borderWidth: 2, borderColor: COLORS.gray200, alignItems: 'center' },
    secondaryResultBtnText: { color: COLORS.gray600, fontWeight: '800', fontSize: 16 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    overlayText: { color: '#FFF', marginTop: 16, fontWeight: '700' }
});
