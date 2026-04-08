import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions, Image, Platform,
    StatusBar, SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';
import { ConfirmModal } from '../../components/ConfirmModal';

const { width } = Dimensions.get('window');

export const ExamDetailScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
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
                setTimeLeft((examData.timeLimit || 20) * 60);
                setUser(userData.data || userData);
            } catch (error) {
                console.error('Fetch exam detail error:', error);
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
    const questions = exam?.quiz_questions || exam?.QuizQuestions || [];

    const handleStart = () => {
        if (user?.UnionMember?.status === 'rejected') {
            Alert.alert('Thông báo', 'Hồ sơ của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên.');
            return;
        }
        if (!questions || questions.length === 0) {
            Alert.alert('Thông báo', 'Kỳ thi này hiện chưa cập nhật câu hỏi.');
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
            
            setResultData({
                ...data,
                completionDate: new Date().toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            });
            setCurrentView('result');
        } catch (e) {
            console.error('Submit error:', e);
            Alert.alert('Lỗi nộp bài', e?.response?.data?.message || 'Không thể gửi kết quả. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    }, [answers, id, user]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1B3FE8" />
                <Text style={styles.loadingText}>Đang tải đề thi...</Text>
            </View>
        );
    }

    const goBack = () => navigation.goBack();

    // ─── RENDERING VIEWS ──────────────────────────────────────────────────

    const renderIntro = () => (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.introHeader}>
                <View style={styles.introImageContainer}>
                    {exam.thumbnail ? (
                        <Image 
                            source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${exam.thumbnail}` }} 
                            style={styles.introThumbnail}
                        />
                    ) : (
                        <View style={styles.introIconBg}>
                            <Ionicons name="ribbon" size={70} color="#1B3FE8" />
                        </View>
                    )}
                </View>
                <Text style={styles.introTitle}>{exam.title}</Text>
                <Text style={styles.introSubtitle}>KỲ THI TRỰC TUYẾN</Text>
            </View>

            <View style={styles.examCard}>
                <Text style={styles.sectionTitle}>THÔNG TIN KỲ THI</Text>
                <Text style={styles.sectionValue}>{exam.description || 'Tham gia kiểm tra kiến thức để rèn luyện và tích lũy điểm rèn luyện.'}</Text>
                
                <View style={styles.divider} />

                <View style={styles.rulesGrid}>
                    <View style={styles.ruleBox}>
                        <View style={styles.ruleIconCircle}>
                            <Ionicons name="time" size={20} color="#1B3FE8" />
                        </View>
                        <Text style={styles.ruleLabel}>Thời gian</Text>
                        <Text style={styles.ruleValue}>{exam.timeLimit || 20}p</Text>
                    </View>
                    <View style={styles.ruleBox}>
                        <View style={styles.ruleIconCircle}>
                            <Ionicons name="layers" size={20} color="#1B3FE8" />
                        </View>
                        <Text style={styles.ruleLabel}>Câu hỏi</Text>
                        <Text style={styles.ruleValue}>{questions.length} câu</Text>
                    </View>
                    <View style={styles.ruleBox}>
                        <View style={[styles.ruleIconCircle, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="star" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.ruleLabel}>Điểm đạt</Text>
                        <Text style={styles.ruleValue}>{exam.satisfactoryScore || 10}đ</Text>
                    </View>
                </View>

                <View style={styles.infoList}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                        <Text style={styles.infoText}>Bắt đầu: {new Date(exam.startDate).toLocaleDateString('vi-VN')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                        <Text style={styles.infoText}>Kết thúc: {new Date(exam.endDate).toLocaleDateString('vi-VN')}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                    colors={['#1B3FE8', '#1230B0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.mainBtnGrad}
                >
                    <Text style={styles.mainBtnText}>BẮT ĐẦU NGAY</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtnTextOnly} onPress={goBack}>
                <Text style={styles.backLink}>Quay lại danh sách</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderQuiz = () => {
        const q = questions[currentQuestion];
        const options = q?.QuizOptions || q?.quiz_options || [];
        const progress = ((currentQuestion + 1) / questions.length) * 100;

        return (
            <SafeAreaView style={styles.flex1}>
                <View style={[styles.quizHeader, { paddingTop: Platform.OS === 'ios' ? 0 : 40 }]}>
                    <TouchableOpacity onPress={() => goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    
                    <View style={styles.progressSection}>
                        <Text style={styles.progressText}>Câu {currentQuestion + 1} / {questions.length}</Text>
                        <View style={styles.barContainer}>
                            <View style={[styles.barFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <View style={[styles.timerBadge, isTimeLow && styles.timerBadgeLow]}>
                        <Ionicons name="time" size={16} color={isTimeLow ? '#FFF' : '#EF4444'} />
                        <Text style={[styles.timerText, isTimeLow && styles.timerTextLow]}>{formatTime(timeLeft)}</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.quizScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>{q?.content}</Text>
                    </View>

                    <View style={styles.optionsList}>
                        {options.map((opt, index) => {
                            const isSelected = answers[q.id] === opt.id;
                            const label = String.fromCharCode(65 + index);
                            
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
                                            <Ionicons name="checkmark" size={16} color="#FFF" />
                                        ) : isCorrect ? (
                                            <Ionicons name="checkmark" size={16} color="#FFF" />
                                        ) : isWrongSelection ? (
                                            <Ionicons name="close" size={16} color="#FFF" />
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
                            <Text style={styles.nextBtnText}>Tiếp theo</Text>
                            <Ionicons name="chevron-forward" size={18} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={() => isReviewMode ? setCurrentView('result') : setShowSubmitModal({
                                title: 'Nộp bài thi',
                                message: 'Đồng chí chắc chắn muốn kết thúc và gửi kết quả ngay?',
                                onConfirm: () => submitAnswers(false)
                            })}
                        >
                            <Text style={styles.submitBtnText}>{isReviewMode ? 'THOÁT XEM' : 'NỘP BÀI'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    };

    const renderResult = () => (
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.resultHeader}>
                <LinearGradient
                    colors={['#F59E0B', '#FCD34D']}
                    style={styles.trophyBg}
                >
                    <Ionicons name="trophy" size={60} color="#FFF" />
                </LinearGradient>
                <Text style={styles.resultTitle}>Hoàn thành!</Text>
                <Text style={styles.resultDesc}>Đồng chí đã hoàn tất bài trắc nghiệm.</Text>
            </View>

            <View style={styles.scoreBoard}>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{resultData?.score ?? 0}</Text>
                    <Text style={styles.scoreLabel}>Tổng điểm</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreItem}>
                    <View style={[styles.statusBox, { backgroundColor: resultData?.isPassed ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Text style={[styles.statusResult, { color: resultData?.isPassed ? '#10B981' : '#EF4444' }]}>
                            {resultData?.isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                        </Text>
                    </View>
                    <Text style={styles.scoreLabel}>Kết quả</Text>
                </View>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statLine}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                    <Text style={styles.statLabelText}>Số câu đúng:</Text>
                    <Text style={styles.statValueText}>{resultData?.correctCount ?? 0} / {questions.length}</Text>
                </View>
                <View style={styles.statLine}>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                    <Text style={styles.statLabelText}>Thời gian làm:</Text>
                    <Text style={styles.statValueText}>{formatTime((exam?.timeLimit || 20) * 60 - timeLeft)}</Text>
                </View>
                <View style={styles.statLine}>
                    <Ionicons name="calendar-outline" size={18} color="#64748B" />
                    <Text style={styles.statLabelText}>Ngày giờ thi:</Text>
                    <Text style={[styles.statValueText, { color: '#1B3FE8' }]}>{resultData?.completionDate || '--:-- 00/00/0000'}</Text>
                </View>
            </View>

            <View style={styles.resultActions}>
                <TouchableOpacity style={styles.primaryResultBtn} onPress={goBack} activeOpacity={0.8}>
                    <Text style={styles.primaryResultBtnText}>Quay về danh sách</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryResultBtn} onPress={() => {
                    setIsReviewMode(true);
                    setCurrentView('quiz');
                    setCurrentQuestion(0);
                }}>
                    <Text style={styles.secondaryResultBtnText}>Xem lại bài làm</Text>
                    <Ionicons name="eye-outline" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },

    // Intro Styles
    introScroll: { padding: 24, paddingBottom: 60 },
    introHeader: { alignItems: 'center', marginBottom: 24 },
    introImageContainer: { 
        width: 140, height: 140, borderRadius: 32, overflow: 'hidden', 
        backgroundColor: '#FFF', elevation: 8, shadowOpacity: 0.1, shadowRadius: 15, 
        justifyContent: 'center', alignItems: 'center', marginBottom: 20 
    },
    introThumbnail: { width: '100%', height: '100%' },
    introIconBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F8FF' },
    introTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
    introSubtitle: { fontSize: 11, color: '#1B3FE8', fontWeight: '800', marginTop: 8, letterSpacing: 1.5 },

    examCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, elevation: 4, shadowOpacity: 0.04, shadowRadius: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
    sectionValue: { fontSize: 14, color: '#475569', lineHeight: 22 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },

    rulesGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    ruleBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, padding: 12, alignItems: 'center' },
    ruleIconCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    ruleLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
    ruleValue: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginTop: 2 },

    infoList: { gap: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    mainBtn: { marginTop: 32, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#1B3FE8', shadowOpacity: 0.3, shadowRadius: 12 },
    mainBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    mainBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    backBtnTextOnly: { marginTop: 24, alignItems: 'center' },
    backLink: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },

    // Quiz Styles
    quizHeader: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 
    },
    progressSection: { flex: 1 },
    progressText: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 6 },
    barContainer: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#1B3FE8' },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    timerBadgeLow: { backgroundColor: '#EF4444' },
    timerText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
    timerTextLow: { color: '#FFF' },

    quizScroll: { padding: 20 },
    questionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowOpacity: 0.04 },
    questionText: { fontSize: 18, fontWeight: '800', color: '#1E293B', lineHeight: 28 },
    optionsList: { gap: 14 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#F1F5F9' },
    optionSelected: { borderColor: '#1B3FE8', backgroundColor: '#F5F8FF' },
    optionIndicator: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    indicatorActive: { backgroundColor: '#1B3FE8' },
    indicatorLabel: { fontSize: 14, fontWeight: '800', color: '#94A3B8' },
    optionText: { flex: 1, fontSize: 15, color: '#475569', fontWeight: '600' },
    optionTextSelected: { color: '#1B3FE8', fontWeight: '800' },

    optionCorrect: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    optionWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    indicatorCorrect: { backgroundColor: '#10B981' },
    indicatorWrong: { backgroundColor: '#EF4444' },
    textCorrect: { color: '#10B981', fontWeight: '800' },
    textWrong: { color: '#EF4444', fontWeight: '800' },

    quizFooter: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12 },
    navBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    navBtnText: { color: '#64748B', fontWeight: '800' },
    nextBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B', borderRadius: 16, gap: 8 },
    nextBtnText: { color: '#FFF', fontWeight: '800' },
    submitBtn: { flex: 1.5, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 0.5 },
    disabledBtn: { opacity: 0.5 },

    // Result Styles
    resultScroll: { padding: 30, paddingBottom: 60 },
    resultHeader: { alignItems: 'center', marginBottom: 30 },
    trophyBg: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 12, shadowOpacity: 0.2, shadowRadius: 15 },
    resultTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
    resultDesc: { fontSize: 14, color: '#94A3B8', marginTop: 8 },
    scoreBoard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 28, padding: 24, marginBottom: 24, alignItems: 'center', elevation: 4, shadowOpacity: 0.04 },
    scoreItem: { flex: 1, alignItems: 'center' },
    scoreValue: { fontSize: 36, fontWeight: '900', color: '#1B3FE8' },
    scoreLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' },
    scoreDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9' },
    statusBox: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginBottom: 4 },
    statusResult: { fontSize: 14, fontWeight: '900' },

    statsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 32, gap: 16, borderLeftWidth: 4, borderLeftColor: '#1B3FE8' },
    statLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statLabelText: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '600' },
    statValueText: { fontSize: 14, color: '#1E293B', fontWeight: '800' },

    resultActions: { gap: 14 },
    primaryResultBtn: { backgroundColor: '#1B3FE8', paddingVertical: 18, borderRadius: 20, alignItems: 'center', elevation: 6, shadowColor: '#1B3FE8', shadowOpacity: 0.3 },
    primaryResultBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    secondaryResultBtn: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        paddingVertical: 18, borderRadius: 20, borderWidth: 2, borderColor: '#F1F5F9', gap: 10 
    },
    secondaryResultBtnText: { color: '#64748B', fontWeight: '800', fontSize: 16 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    overlayText: { color: '#FFF', marginTop: 16, fontWeight: '800' }
});
