import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ImageBackground
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { examService } from '../../services/examService';

export const ExamListScreen = ({ onNavigate }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await examService.getExams();
                setExams(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'UPCOMING': return { bg: '#EBF8FF', text: '#3182CE', label: 'Sắp bắt đầu' };
            case 'ONGOING': return { bg: '#E6FFFA', text: '#319795', label: 'Đang diễn ra' };
            case 'FINISHED': return { bg: '#FEE2E2', text: '#EF4444', label: 'Đã kết thúc' };
            case 'DRAFT': return { bg: '#F3F4F6', text: '#6B7280', label: 'Bản nháp' };
            default: return { bg: '#F3F4F6', text: '#6B7280', label: status };
        }
    };

    const renderItem = ({ item }) => {
        const { bg, text, label } = getStatusStyle(item.computedStatus);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => item.computedStatus === 'ONGOING' && onNavigate && onNavigate('exam_detail', { id: item.id })}
            >
                <View style={styles.cardBody}>
                    <View style={styles.examIconBox}>
                        <Icon name="Award" size={32} color={COLORS.primary} />
                    </View>

                    <View style={styles.examInfo}>
                        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                            <Text style={[styles.statusText, { color: text }]}>{label}</Text>
                        </View>
                        <Text style={styles.examTitle}>{item.title}</Text>
                        <Text style={styles.examDesc} numberOfLines={2}>{item.description}</Text>

                        <View style={styles.examMeta}>
                            <View style={styles.metaItem}>
                                <Icon name="Clock" size={14} color="#9CA3AF" />
                                <Text style={styles.metaText}>{item.timeLimit} phút</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Icon name="Calendar" size={14} color="#9CA3AF" />
                                <Text style={styles.metaText}>{item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '—'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {item.computedStatus === 'ONGOING' && (
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => onNavigate && onNavigate('exam_detail', { id: item.id })}
                    >
                        <Text style={styles.startBtnText}>BẮT ĐẦU THI</Text>
                        <Icon name="ChevronRight" size={16} color="#FFF" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
                style={styles.headerHero}
                imageStyle={{ opacity: 0.1 }}
            >
                <Text style={styles.heroTitle}>Trắc nghiệm Nhận thức</Text>
                <Text style={styles.heroText}>Tham gia các kỳ thi định kỳ để nâng cao kiến thức chính trị.</Text>
            </ImageBackground>

            <FlatList
                data={exams}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<Text style={styles.sectionTitle}>KỲ THI ĐANG DIỄN RA</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerHero: {
        backgroundColor: '#1E293B',
        padding: 24,
        paddingBottom: 40,
    },
    heroTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    heroText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, lineHeight: 18 },
    listContent: { padding: 16, paddingTop: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', marginBottom: 16, letterSpacing: 1 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
    },
    cardBody: { flexDirection: 'row', padding: 16 },
    examIconBox: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    examInfo: { flex: 1, marginLeft: 16 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    examTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    examDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    examMeta: { flexDirection: 'row', marginTop: 12, gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
    startBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    startBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }
});
