import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Image, Alert, Platform,
    Dimensions, RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';

const { width } = Dimensions.get('window');

const TABS = [
    { id: 'ONGOING', name: 'Đang diễn ra', icon: 'play-circle' },
    { id: 'UPCOMING', name: 'Sắp tới', icon: 'time' },
    { id: 'FINISHED', name: 'Đã hoàn thành', icon: 'checkmark-circle' },
];

export const ExamListScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('ONGOING');
    const [userStats, setUserStats] = useState({ totalPoints: 0, quizCount: 0, rank: 'C' });

    const fetchData = async () => {
        if (!refreshing) setLoading(true);
        try {
            const currentUser = await authService.getCurrentUser();
            const member = currentUser?.UnionMember;

            if (currentUser?.statistics) {
                setUserStats(currentUser.statistics);
            }

            const fetchParams = { status: activeTab };
            if (member?.unionBranchId) fetchParams.unionBranchId = member.unionBranchId;

            const res = await examService.getExams(fetchParams);
            setExams(res.data || res || []);
        } catch (error) {
            console.error('Fetch exams error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleExamPress = (item) => {
        const status = (item.computedStatus || item.status || '').toUpperCase();
        if (status === 'ONGOING' || status === 'OPEN') {
            navigation.navigate('ExamDetail', { id: item.id });
        } else if (status === 'UPCOMING' || status === 'SCHEDULED') {
            Alert.alert("Thông báo", "Kỳ thi này chưa bắt đầu.");
        } else {
            Alert.alert("Thông báo", "Kỳ thi này đã kết thúc.");
        }
    };

    const getStatusConfig = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'UPCOMING': case 'SCHEDULED':
                return { label: 'Sắp tới', color: '#0EA5E9', bg: '#F0F9FF' };
            case 'ONGOING': case 'OPEN':
                return { label: 'Đang mở', color: '#10B981', bg: '#ECFDF5' };
            case 'FINISHED': case 'CLOSED':
                return { label: 'Đã đóng', color: '#64748B', bg: '#F1F5F9' };
            default:
                return { label: s, color: '#94A3B8', bg: '#F8FAFC' };
        }
    };

    const renderExamItem = ({ item }) => {
        const status = item.computedStatus || item.status;
        const config = getStatusConfig(status);
        const isOngoing = ['ONGOING', 'OPEN'].includes(String(status).toUpperCase());

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleExamPress(item)}
                activeOpacity={0.9}
            >
                {/* Thumbnail / Header */}
                <View style={styles.cardInfo}>
                    <View style={styles.thumbnailBox}>
                        {item.thumbnail ? (
                            <Image
                                source={{ uri: `${API_BASE_URL.replace(/\/$/, '')}${item.thumbnail}` }}
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.thumbnailFallback, { backgroundColor: config.bg }]}>
                                <Ionicons name="trophy" size={28} color={config.color} />
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
                            <Text style={styles.statusText}>{config.label}</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.titleRow}>
                            <Text style={styles.examTitle} numberOfLines={2}>{item.title}</Text>
                        </View>
                        <Text style={styles.examDesc} numberOfLines={1}>
                            {item.description || 'Tham gia kiểm tra kiến thức và nhận điểm rèn luyện.'}
                        </Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="list" size={12} color="#64748B" />
                                <Text style={styles.statLabel}>{item.totalQuestions || 20} câu</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                <Text style={styles.statLabel}>{item.timeLimit || 15} phút</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.statLabel}>{item.satisfactoryScore || 10} đ</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <Ionicons name="people-outline" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>BTC Đoàn Trường</Text>
                    </View>
                    <View style={[styles.actionBtn, { backgroundColor: isOngoing ? '#1B3FE8' : '#F1F5F9' }]}>
                        <Text style={[styles.actionBtnText, { color: isOngoing ? '#FFF' : '#64748B' }]}>
                            {isOngoing ? 'VÀO THI NGAY' : config.label}
                        </Text>
                        <Ionicons 
                            name={isOngoing ? "arrow-forward" : "lock-closed"} 
                            size={16} 
                            color={isOngoing ? "#FFF" : "#94A3B8"} 
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            {/* Header Hero */}
            <LinearGradient
                colors={['#1B3FE8', '#1230B0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: Math.max(insets.top + 12, 50) }]}
            >
                <View style={styles.heroDecor} />
                <View style={styles.heroRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroLabel}>Rèn luyện Đoàn viên</Text>
                        <Text style={styles.heroTitle}>THI ĐUA TRỰC TUYẾN</Text>
                    </View>
                    <View style={styles.heroIconWrap}>
                        <Ionicons name="ribbon" size={42} color="rgba(255,255,255,0.2)" />
                    </View>
                </View>

                {/* Tabs inside Hero */}
                <View style={styles.tabContainer}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabBtn, active && styles.tabBtnActive]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Ionicons name={tab.icon} size={16} color={active ? '#1B3FE8' : 'rgba(255,255,255,0.7)'} />
                                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                    {tab.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            <FlatList
                data={exams}
                renderItem={renderExamItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B3FE8']} />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                        <Text style={styles.listHeaderText}>Vui lòng chọn kỳ thi đang diễn ra để bắt đầu làm bài.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyText}>Không tìm thấy cuộc thi nào</Text>
                        <Text style={styles.emptySub}>Vui lòng quay lại sau hoặc kiểm tra các mục khác.</Text>
                    </View>
                }
            />

            {loading && !refreshing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1B3FE8" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    // Hero
    hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    heroDecor: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
    heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
    heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 4 },
    heroIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.12)',
        borderRadius: 16, padding: 4,
    },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
    tabBtnActive: { backgroundColor: '#FFF', elevation: 2, shadowOpacity: 0.1 },
    tabText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    tabTextActive: { color: '#1B3FE8' },

    // List
    list: { paddingHorizontal: 20, paddingTop: 16 },
    listHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, opacity: 0.8 },
    listHeaderText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

    card: {
        backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20,
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10,
        overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
    },
    cardInfo: { flexDirection: 'row', padding: 14 },
    thumbnailBox: { width: 96, height: 96, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    thumbnail: { width: '100%', height: '100%' },
    thumbnailFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    statusBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 4, alignItems: 'center' },
    statusText: { color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

    cardBody: { flex: 1, marginLeft: 14 },
    examTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', lineHeight: 22 },
    examDesc: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
    
    statsRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },

    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFBFC', borderTopWidth: 1, borderTopColor: '#F1F5F9'
    },
    footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    actionBtnText: { fontSize: 11, fontWeight: '900' },

    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 2, shadowOpacity: 0.05 },
    emptyText: { fontSize: 16, fontWeight: '800', color: '#475569' },
    emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
});
