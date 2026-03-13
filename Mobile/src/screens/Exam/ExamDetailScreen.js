import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { examService } from '../../services/examService';

const { width } = Dimensions.get('window');

export const ExamDetailScreen = ({ route, goBack }) => {
    const { id } = route?.params || {};
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await examService.getExamDetail(id);
                setExam(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleStart = () => setStarted(true);

    const selectOption = (questionId, optionId) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = () => {
        Alert.alert(
            'Nộp bài',
            'Đồng chí chắc chắn muốn nộp bài thi này?',
            [
                { text: 'Kiểm tra lại', style: 'cancel' },
                {
                    text: 'Nộp bài',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            // In real app, format answers for API
                            await examService.submitAttempt(id, answers);
                            Alert.alert('Thành công', 'Đã nộp bài thi thành công!');
                            if (goBack) goBack();
                        } catch (e) {
                            Alert.alert('Lỗi', 'Gửi bài thi thất bại');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!started) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.introContent}>
                    <View style={styles.introIcon}>
                        <Icon name="Award" size={80} color={COLORS.primary} />
                    </View>
                    <Text style={styles.introTitle}>{exam.title}</Text>
                    <Text style={styles.introDesc}>{exam.description}</Text>

                    <View style={styles.rulesCard}>
                        <Text style={styles.rulesTitle}>QUY ĐỊNH PHÒNG THI</Text>
                        <View style={styles.ruleItem}>
                            <Icon name="Time" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Thời gian làm bài: {exam.duration_minutes} phút</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <Icon name="CheckCircle" size={16} color="#6B7280" />
                            <Text style={styles.ruleText}>Số lượng câu hỏi: 20 câu</Text>
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

    // Mock questions for UI display
    const mockQuestions = [
        {
            id: 1, text: 'Đại hội đại biểu toàn quốc lần thứ XIII của Đảng diễn ra vào thời gian nào?', options: [
                { id: 'a', text: 'Tháng 01/2021' },
                { id: 'b', text: 'Tháng 02/2021' },
                { id: 'c', text: 'Tháng 03/2021' },
                { id: 'd', text: 'Tháng 04/2021' }
            ]
        },
        {
            id: 2, text: 'Chủ đề của Đại hội XIII là gì?', options: [
                { id: 'a', text: 'Đoàn kết - Dân chủ - Kỷ cương - Sáng tạo - Phát triển' },
                { id: 'b', text: 'Đoàn kết - Trách nhiệm - Đổi mới' },
                { id: 'c', text: 'Hướng về cơ sở, nâng cao năng lực lãnh đạo' }
            ]
        }
    ];

    const q = mockQuestions[currentQuestion] || mockQuestions[0];

    return (
        <View style={styles.container}>
            {/* Header / Timer info */}
            <View style={styles.quizHeader}>
                <View>
                    <Text style={styles.qCount}>Câu hỏi {currentQuestion + 1}/{mockQuestions.length}</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%` }]} />
                    </View>
                </View>
                <View style={styles.timerBadge}>
                    <Icon name="Time" size={16} color="#EF4444" />
                    <Text style={styles.timerText}>{exam.duration_minutes}:00</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.quizContent}>
                <Text style={styles.questionText}>{q.text}</Text>

                {q.options.map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionCard, answers[q.id] === opt.id && styles.optionSelected]}
                        onPress={() => selectOption(q.id, opt.id)}
                    >
                        <View style={[styles.optionCircle, answers[q.id] === opt.id && styles.circleSelected]}>
                            {answers[q.id] === opt.id && <View style={styles.circleInner} />}
                        </View>
                        <Text style={[styles.optionText, answers[q.id] === opt.id && styles.textSelected]}>{opt.text}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.quizFooter}>
                <TouchableOpacity
                    style={[styles.navBtn, currentQuestion === 0 && styles.disabledBtn]}
                    disabled={currentQuestion === 0}
                    onPress={() => setCurrentScreen(curr => curr - 1)}
                >
                    <Text style={styles.navBtnText}>Quay lại</Text>
                </TouchableOpacity>

                {currentQuestion < mockQuestions.length - 1 ? (
                    <TouchableOpacity
                        style={styles.navBtnPrimary}
                        onPress={() => setCurrentQuestion(curr => curr + 1)}
                    >
                        <Text style={styles.navBtnTextPrimary}>Tiếp theo</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmit}
                    >
                        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>NỘP BÀI</Text>}
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
    introIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
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
    timerText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
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
