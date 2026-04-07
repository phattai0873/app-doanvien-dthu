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

export const ExamListScreen = ({ navigation }) => {
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
            navigation.navigate('ExamDetail', { id: item.id });
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

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleExamPress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.cardTop}>
                    <View style={styles.imageWrapper}>
                        {item.thumbnail ? (
                            <Image
                                source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${item.thumbnail}` }}
                                style={styles.quizThumbnail}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.fallbackIcon, { backgroundColor: text + '10' }]}>
                                <Icon name="Trophy" size={32} color={text} />
                            </View>
                        )}
                        <View style={[styles.statusTag, { backgroundColor: text }]}>
                            <Text style={styles.statusTagText}>{label}</Text>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.titleRow}>
                            <Text style={styles.examTitle} numberOfLines={2}>{item.title}</Text>
                            {item.isMandatory && (
                                <View style={styles.mandatoryIndicator}>
                                    <Icon name="AlertCircle" size={14} color={COLORS.error} />
                                </View>
                            )}
                        </View>
                        <Text style={styles.examDesc} numberOfLines={1}>
                            {item.description || 'Tham gia kiểm tra kiến thức ngay'}
                        </Text>

                        <View style={styles.statsGrid}>
                            <View style={styles.statContainer}>
                                <Icon name="Layers" size={14} color={COLORS.gray400} />
                                <Text style={styles.statLabel}>{item.totalQuestions || 0} câu</Text>
                            </View>
                            <View style={styles.statContainer}>
                                <Icon name="Clock" size={14} color={COLORS.gray400} />
                                <Text style={styles.statLabel}>{item.timeLimit || 0} phút</Text>
                            </View>
                            <View style={styles.statContainer}>
                                <Icon name="Star" size={14} color={COLORS.warning} />
                                <Text style={styles.statLabel}>{item.satisfactoryScore || 0} điểm</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.cardAction}>
                    <View style={styles.authorBadge}>
                        <Icon name="User" size={12} color={COLORS.gray500} />
                        <Text style={styles.authorText}>BTC Đoàn trường</Text>
                    </View>
                    <View style={[styles.startBtn, { backgroundColor: isOngoing ? COLORS.primary : COLORS.gray200 }]}>
                        <Text style={[styles.startBtnText, { color: isOngoing ? '#FFF' : COLORS.gray500 }]}>
                            {isOngoing ? 'Vào thi' : (isUpcoming ? 'Chưa mở' : 'Đã đóng')}
                        </Text>
                        <Icon 
                            name={isOngoing ? "ChevronRight" : "Lock"} 
                            size={16} 
                            color={isOngoing ? "#FFF" : COLORS.gray500} 
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
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Hệ thống Thi</Text>
                        <Text style={styles.headerSubtitle}>Trực tuyến DTHU</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn}>
                        <Icon name="BadgeCheck" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

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
                            <Icon name="Database" size={40} color={COLORS.gray300} />
                        </View>
                        <Text style={styles.emptyText}>Hiện không có cuộc thi nào trong mục này</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.gray900, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 16, color: COLORS.primary, fontWeight: '700', marginTop: -4 },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center' },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
    },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTabButton: { backgroundColor: '#FFF', elevation: 2, shadowOpacity: 0.1, shadowRadius: 3 },
    tabText: { fontSize: 13, fontWeight: '700', color: COLORS.gray500 },
    activeTabText: { color: COLORS.primary },

    listContent: { padding: 20, paddingBottom: 120 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        overflow: 'hidden'
    },
    cardTop: { flexDirection: 'row', padding: 16 },
    imageWrapper: { width: 90, height: 90, borderRadius: 20, overflow: 'hidden', position: 'relative' },
    quizThumbnail: { width: '100%', height: '100%' },
    fallbackIcon: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    statusTag: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 2, alignItems: 'center' },
    statusTagText: { color: '#FFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

    cardContent: { flex: 1, marginLeft: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    examTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray900, lineHeight: 22 },
    mandatoryIndicator: { marginLeft: 8 },
    examDesc: { fontSize: 13, color: COLORS.gray500, marginTop: 4, fontStyle: 'italic' },
    
    statsGrid: { flexDirection: 'row', marginTop: 12, gap: 12 },
    statContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statLabel: { fontSize: 11, color: COLORS.gray600, fontWeight: '600' },

    cardAction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    authorText: { fontSize: 11, color: COLORS.gray500, fontWeight: '600' },
    startBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 14, 
        paddingVertical: 8, 
        borderRadius: 12,
        gap: 6
    },
    startBtnText: { fontSize: 13, fontWeight: '800' },

    emptyContainer: { alignItems: 'center', paddingVertical: 100 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    emptyText: { marginTop: 20, color: COLORS.gray400, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 }
});
