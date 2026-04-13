import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { meetingService } from '../../services/meetingService';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
    scheduled: {
        label: 'Sắp diễn ra',
        color: '#1B3FE8',
        bg: '#EBF0FE',
        icon: 'time-outline',
    },
    active: {
        label: 'Đang diễn ra',
        color: '#10B981',
        bg: '#ECFDF5',
        icon: 'radio-button-on',
    },
    finished: {
        label: 'Đã kết thúc',
        color: '#64748B',
        bg: '#F1F5F9',
        icon: 'checkmark-circle-outline',
    },
    cancelled: {
        label: 'Đã hủy',
        color: '#EF4444',
        bg: '#FEF2F2',
        icon: 'close-circle-outline',
    },
};

const TABS = [
    { key: 'UPCOMING', label: 'Sắp tới', filter: (m) => m.status === 'scheduled' },
    { key: 'ONGOING',  label: 'Đang diễn ra', filter: (m) => m.status === 'active' },
    { key: 'COMPLETED', label: 'Đã xong', filter: (m) => m.status === 'finished' || m.status === 'cancelled' },
];

export const MeetingListScreen = ({ navigation }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('UPCOMING');

    const fetchData = async () => {
        try {
            const response = await meetingService.getMeetings({});
            const rawData = Array.isArray(response) ? response : (response.data || []);

            const mapped = rawData.map(m => {
                const date = new Date(m.meetingTime);
                const dateStr = date.toLocaleDateString('vi-VN');
                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                let statusKey = 'scheduled';
                if (m.status === 'IN_PROGRESS') statusKey = 'active';
                else if (m.status === 'COMPLETED') statusKey = 'finished';
                else if (m.status === 'CANCELLED') statusKey = 'cancelled';
                return {
                    ...m,
                    status: statusKey,
                    dateStr,
                    timeStr,
                    locationName: m.Location?.name || 'Chưa xác định địa điểm',
                };
            });
            setMeetings(mapped);
        } catch (e) {
            console.error('fetchMeetings:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const currentTab = TABS.find(t => t.key === activeTab);
    const filtered = meetings.filter(currentTab?.filter ?? (() => true));

    const renderItem = ({ item, index }) => {
        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.scheduled;
        const isActive = item.status === 'active';

        return (
            <TouchableOpacity
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => navigation.navigate('MeetingDetail', { id: item.id })}
                activeOpacity={0.85}
            >
                {/* Active meeting: colored left border */}
                {isActive && <View style={styles.activeBar} />}

                {/* Header row */}
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} style={{ marginRight: 5 }} />
                        <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.timeChip}>{item.timeStr}</Text>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {/* Meta row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                        <Text style={styles.metaText}>{item.dateStr}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#94A3B8" />
                        <Text style={styles.metaText} numberOfLines={1}>{item.locationName}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.attendRow}>
                        <Ionicons name="people-outline" size={15} color="#64748B" />
                        <Text style={styles.attendText}>
                            tham gia{' '}
                            <Text style={{ fontWeight: '800', color: COLORS.primary }}>
                                {item.attendance_count ?? 0}/{item.total_members ?? 0}
                            </Text>
                        </Text>
                    </View>
                    <View style={[styles.detailBtn, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.detailBtnText, { color: cfg.color }]}>Chi tiết</Text>
                        <Ionicons name="chevron-forward" size={13} color={cfg.color} />
                    </View>
                </View>
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
            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id?.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListHeaderComponent={
                    <View>
                        {/* Header Banner */}
                        <LinearGradient
                            colors={['#1B3FE8', '#1230B0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.banner}
                        >
                            <View style={styles.bannerDecor} />
                            <View style={styles.bannerContent}>
                                <View>
                                    <Text style={styles.bannerTitle}>Sinh hoạt Chi đoàn</Text>
                                    <Text style={styles.bannerSub}>Theo dõi lịch họp & điểm danh</Text>
                                </View>
                                <View style={styles.bannerIconBox}>
                                    <Ionicons name="calendar" size={32} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>
                            {/* Count chips */}
                            <View style={styles.countRow}>
                                {TABS.map(t => {
                                    const count = meetings.filter(t.filter).length;
                                    return (
                                        <View key={t.key} style={styles.countChip}>
                                            <Text style={styles.countNum}>{count}</Text>
                                            <Text style={styles.countLabel}>{t.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </LinearGradient>

                        {/* Tabs */}
                        <View style={styles.tabRow}>
                            {TABS.map(t => {
                                const isActive = activeTab === t.key;
                                return (
                                    <TouchableOpacity
                                        key={t.key}
                                        style={[styles.tab, isActive && styles.tabActive]}
                                        onPress={() => setActiveTab(t.key)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="calendar-outline" size={40} color={COLORS.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>Không có lịch họp</Text>
                        <Text style={styles.emptyDesc}>
                            {activeTab === 'UPCOMING' ? 'Chưa có buổi sinh hoạt sắp tới.' :
                             activeTab === 'ONGOING' ? 'Hiện không có buổi họp đang diễn ra.' :
                             'Chưa có lịch họp nào kết thúc.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 100 },

    // Banner
    banner: {
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    bannerDecor: {
        position: 'absolute', width: 180, height: 180,
        borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)',
        top: -50, right: -40,
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    bannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
    bannerIconBox: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    countRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    countChip: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    countNum: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    countLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: '600' },

    // Tabs
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        backgroundColor: '#E8EEF4',
        borderRadius: 14,
        padding: 4,
    },
    tab: {
        flex: 1, paddingVertical: 9,
        alignItems: 'center', borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    tabTextActive: { color: COLORS.primary, fontWeight: '800' },

    // Cards
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    cardActive: {
        borderWidth: 1,
        borderColor: '#1B3FE820',
        shadowColor: '#1B3FE8',
        shadowOpacity: 0.12,
    },
    activeBar: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 4, backgroundColor: '#10B981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusLabel: { fontSize: 11, fontWeight: '800' },
    timeChip: {
        fontSize: 12, color: '#94A3B8', fontWeight: '600',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 10,
    },
    cardTitle: {
        fontSize: 16, fontWeight: '800', color: '#0F172A',
        lineHeight: 22, marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 6,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaDot: {
        width: 3, height: 3, borderRadius: 2,
        backgroundColor: '#CBD5E1',
    },
    metaText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    attendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    attendText: { fontSize: 12, color: '#64748B' },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 3,
    },
    detailBtnText: { fontSize: 12, fontWeight: '700' },

    // Empty
    emptyBox: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#EBF0FE',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
