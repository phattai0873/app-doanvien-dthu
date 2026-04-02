import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    Alert,
    Platform,
    Image
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';

export const ExamListScreen = ({ onNavigate }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ONGOING');
    const [userStats, setUserStats] = useState({ totalPoints: 0, quizCount: 0, rank: 'C' });

    const TABS = [
        { id: 'ONGOING', name: 'Đang diễn ra' },
        { id: 'UPCOMING', name: 'Sắp tới' },
        { id: 'FINISHED', name: 'Đã kết thúc' },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const currentUser = await authService.getCurrentUser();
            const member = currentUser?.UnionMember;

            // Set real stats
            if (currentUser?.statistics) {
                setUserStats(currentUser.statistics);
            }

            const fetchParams = {};
            if (member?.unionBranchId) fetchParams.unionBranchId = member.unionBranchId;
            if (activeTab !== 'all') fetchParams.status = activeTab;

            const res = await examService.getExams(fetchParams);
            setExams(res.data || res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'UPCOMING': return { bg: '#EBF8FF', text: '#3182CE', label: 'Sắp bắt đầu' };
            case 'ONGOING': return { bg: '#E6FFFA', text: '#319795', label: 'Đang diễn ra' };
            case 'FINISHED': return { bg: '#FEE2E2', text: '#EF4444', label: 'Đã kết thúc' };
            case 'DRAFT': return { bg: '#F3F4F6', text: '#6B7280', label: 'Bản nháp' };
            default: return { bg: '#F3F4F6', text: '#6B7280', label: status };
        }
    };

    const handleExamPress = (item) => {
        const currentStatus = item.computedStatus || item.status;
        if (currentStatus === 'ONGOING') {
            onNavigate && onNavigate('exam_detail', { id: item.id });
        } else if (currentStatus === 'UPCOMING') {
            Alert.alert("Thông báo", "Kỳ thi này chưa bắt đầu.");
        } else {
            Alert.alert("Thông báo", "Kỳ thi này đã kết thúc.");
        }
    };

    const renderItem = ({ item }) => {
        const currentStatus = item.computedStatus || item.status;
        const { bg, text, label } = getStatusStyle(currentStatus);
        const isOngoing = currentStatus === 'ONGOING';
        const isUpcoming = currentStatus === 'UPCOMING';

        if (item.thumbnail) {
            console.log(`[ExamList] Title: ${item.title}, Thumbnail: ${API_BASE_URL}${item.thumbnail}`);
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleExamPress(item)}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: bg + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: text }]} />
                        <Text style={[styles.statusText, { color: text }]}>{label}</Text>
                    </View>
                    {item.isMandatory && (
                        <View style={styles.mandatoryBadge}>
                            <Icon name="AlertCircle" size={12} color="#FFF" />
                            <Text style={styles.mandatoryText}>Bắt buộc</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.imagePlaceholder}>
                        {item.thumbnail ? (
                            <Image
                                source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${item.thumbnail}` }}
                                style={styles.quizThumbnail}
                                resizeMode="cover"
                                onError={(e) => console.log(`[ExamList] Image Load Error: ${e.nativeEvent.error} for ${item.title}`)}
                            />
                        ) : (
                            <Icon name="Trophy" size={32} color={isOngoing ? COLORS.primary : COLORS.gray400} />
                        )}
                    </View>

                    <View style={styles.cardInfo}>
                        <Text style={styles.examTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.examDesc} numberOfLines={1}>{item.description || 'Chưa có mô tả'}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.metaGroup}>
                        <View style={styles.metaItem}>
                            <Icon name="Layers" size={14} color={COLORS.gray500} />
                            <Text style={styles.metaValue}>{item.totalQuestions || 0} câu</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="Clock" size={14} color={COLORS.gray500} />
                            <Text style={styles.metaValue}>{item.timeLimit || 0} phút</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="Star" size={14} color="#F59E0B" />
                            <Text style={styles.metaValue}>{item.satisfactoryScore || 0} điểm</Text>
                        </View>
                    </View>

                    <View style={[styles.actionBtn, { backgroundColor: isOngoing ? COLORS.primary : COLORS.gray100 }]}>
                        <Icon
                            name={isOngoing ? "ChevronRight" : (isUpcoming ? "Lock" : "CheckCircle")}
                            size={18}
                            color={isOngoing ? "#FFF" : COLORS.gray400}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && exams.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>


            {/* Content Section */}
            <View style={styles.contentBody}>
                <View style={styles.tabContainer}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={exams}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchData}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Icon name="Inbox" size={40} color={COLORS.gray300} />
                            </View>
                            <Text style={styles.emptyText}>Hiện không có cuộc thi nào trong mục này</Text>
                            <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
                                <Text style={styles.refreshBtnText}>Tải lại dữ liệu</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header Styles
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        zIndex: 10
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    greeting: { fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray900, marginTop: 2 },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + '20'
    },
    scoreText: { marginLeft: 8, fontWeight: 'bold', color: COLORS.primary, fontSize: 14 },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingVertical: 15
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray900 },
    statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 4, fontWeight: '600' },
    statDivider: { height: 25, width: 1, backgroundColor: COLORS.gray300 },

    // Content Styles
    contentBody: { flex: 1, marginTop: -20, paddingTop: 30 },
    // Tabs Styles
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTabButton: {
        backgroundColor: '#FFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.gray500,
    },
    activeTabText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },

    listContent: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    mandatoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 5
    },
    mandatoryText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    cardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    imagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden'
    },
    quizThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 18
    },
    cardInfo: { flex: 1, marginLeft: 16 },
    examTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray900, lineHeight: 22 },
    examDesc: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    metaGroup: { flexDirection: 'row', gap: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaValue: { fontSize: 12, color: COLORS.gray600, fontWeight: '600' },
    actionBtn: { width: 40, height: 40, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

    // Empty States
    emptyContainer: { alignItems: 'center', paddingVertical: 50 },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
    refreshBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, backgroundColor: '#E2E8F0', borderRadius: 15 },
    refreshBtnText: { color: COLORS.gray700, fontWeight: 'bold', fontSize: 14 }
});
