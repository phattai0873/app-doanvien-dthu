import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
    TouchableOpacity, Dimensions, RefreshControl, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants';
import { workService } from '../../services/workService';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

// ─── Modules Config ────────────────────────────────────────
const MEMBER_MODULES = [
    {
        id: 'meeting_list',
        route: 'MeetingList',
        label: 'Sinh hoạt\nChi đoàn',
        sub: 'Lịch họp & Điểm danh',
        icon: 'calendar',
        color: '#1B3FE8',
        bg: '#EBF0FE',
        featured: true,
    },
    {
        id: 'fee_payment',
        route: 'FeePayment',
        label: 'Đóng\nĐoàn phí',
        sub: 'Thanh toán trực tuyến',
        icon: 'wallet',
        color: '#1B3FE8', // Dùng màu chủ đạo
        bg: '#F5F8FF',
        featured: true,
    },
    {
        id: 'exam_list',
        route: 'ExamList',
        label: 'Thi đua trắc nghiệm',
        sub: 'Tham gia các cuộc thi',
        icon: 'trophy',
        color: '#F59E0B',
        bg: '#FFFBEB',
    },
    {
        id: 'document_list',
        route: 'DocumentList',
        label: 'Kho tài liệu',
        sub: 'Văn kiện & Nghị quyết',
        icon: 'library',
        color: '#10B981',
        bg: '#ECFDF5',
    },
    {
        id: 'volunteer_list',
        route: 'VolunteerList',
        label: 'Tình nguyện',
        sub: 'Hoạt động vì cộng đồng',
        icon: 'heart',
        color: '#EF4444',
        bg: '#FEF2F2',
    },
];

const OFFICER_MODULES = [
    { route: 'MemberMgmt', label: 'Quản lý Đoàn viên', icon: 'people', color: '#1B3FE8' },
    { route: 'CellMgmt', label: 'Quản lý Chi đoàn', icon: 'business', color: '#1B3FE8' },
    { route: 'MeetingCreate', label: 'Tổ chức Sinh hoạt', icon: 'calendar-outline', color: '#1B3FE8' },
    { route: 'FeeMgmt', label: 'Quản lý Đoàn phí', icon: 'card', color: '#1B3FE8' },
    { route: 'UpdateApproval', label: 'Duyệt Hồ sơ', icon: 'checkmark-done-circle', color: '#1B3FE8' },
    { route: 'NewsMgmt', label: 'Quản lý Tin tức', icon: 'megaphone', color: '#1B3FE8' },
];

export const WorkDashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isOfficer = user?.role === 'SUPER_ADMIN'
        || user?.role === 'ADMIN'
        || user?.role === 'BRANCH_ADMIN'
        || user?.role === 'CELL_ADMIN'
        || user?.isSuperAdmin;

    const fetchData = async () => {
        try {
            const data = await workService.getWorkSummary();
            setSummary(data);
        } catch (e) {
            console.error('WorkDashboard fetchData error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const featuredModules = MEMBER_MODULES.filter(m => m.featured);
    const otherModules = MEMBER_MODULES.filter(m => !m.featured);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* ─── Hero Section ─────────────────────────── */}
                <LinearGradient
                    colors={['#1B3FE8', '#1230B0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.hero, { paddingTop: Math.max(insets.top + 16, 50) }]}
                >
                    <View style={styles.heroDecor} />
                    <View style={styles.heroRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroGreet}>Hành trình thanh niên</Text>
                            <Text style={styles.heroTitle}>CÔNG TÁC ĐOÀN</Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <Ionicons name="shield-checkmark" size={42} color="rgba(255,255,255,0.2)" />
                        </View>
                    </View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        <TouchableOpacity
                            style={styles.statBox}
                            onPress={() => navigation.navigate('MeetingList')}
                        >
                            <Text style={styles.statVal} numberOfLines={1}>{summary?.next_meeting || '—'}</Text>
                            <Text style={styles.statLbl}>Họp Chi đoàn</Text>
                        </TouchableOpacity>
                        <View style={styles.statDiv} />
                        <TouchableOpacity
                            style={styles.statBox}
                            onPress={() => navigation.navigate('FeePayment')}
                        >
                            <Text style={[styles.statVal, summary?.unpaid_fee && summary.unpaid_fee !== '0đ' && { color: '#FCD34D' }]} numberOfLines={1}>
                                {summary?.unpaid_fee || '0đ'}
                            </Text>
                            <Text style={styles.statLbl}>Đoàn phí</Text>
                        </TouchableOpacity>
                        <View style={styles.statDiv} />
                        <TouchableOpacity
                            style={styles.statBox}
                            onPress={() => navigation.navigate('ExamList')}
                        >
                            <Text style={styles.statVal}>{summary?.pending_exams ?? 0}</Text>
                            <Text style={styles.statLbl}>Thi đua</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ─── Featured Tasks ───────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.secHeader}>
                        <View style={styles.secAccent} />
                        <Text style={styles.secTitle}>Nhiệm vụ trọng tâm</Text>
                    </View>

                    <View style={styles.featuredRow}>
                        {featuredModules.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.featuredCard}
                                onPress={() => navigation.navigate(m.route)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.cardIconWrap, { backgroundColor: m.bg }]}>
                                        <Ionicons name={m.icon} size={28} color={m.color} />
                                    </View>
                                    <View style={styles.cardArrow}>
                                        <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                                    </View>
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={[styles.cardLabel, { color: m.color }]}>{m.label}</Text>
                                    <Text style={styles.cardSub}>{m.sub}</Text>
                                </View>

                                {/* Badge notify for Fee */}
                                {m.id === 'fee_payment' && summary?.unpaid_fee && summary.unpaid_fee !== '0đ' && (
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.cardBadgeText}>Chưa nộp</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ─── Other Modules List ───────────────────── */}
                <View style={styles.section}>
                    <View style={styles.secHeader}>
                        <View style={styles.secAccent} />
                        <Text style={styles.secTitle}>Tiện ích & Học tập</Text>
                    </View>

                    <View style={styles.moduleList}>
                        {otherModules.map((m, i) => (
                            <React.Fragment key={m.id}>
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => navigation.navigate(m.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.listIconBox, { backgroundColor: m.bg }]}>
                                        <Ionicons name={m.icon} size={22} color={m.color} />
                                    </View>
                                    <View style={styles.listText}>
                                        <Text style={styles.listLabel}>{m.label}</Text>
                                        <Text style={styles.listSub}>{m.sub}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                                </TouchableOpacity>
                                {i < otherModules.length - 1 && <View style={styles.listDiv} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* ─── Officer Admin Section ────────────────── */}
                {isOfficer && (
                    <View style={[styles.section, { marginTop: 30 }]}>
                        <LinearGradient
                            colors={['#1E293B', '#0F172A']}
                            style={styles.adminCard}
                        >
                            <View style={styles.adminHeader}>
                                <Ionicons name="cog" size={20} color="#6366F1" />
                                <Text style={styles.adminTitle}>BẢNG ĐIỀU KHIỂN CÁN BỘ</Text>
                            </View>

                            <View style={styles.adminGrid}>
                                {OFFICER_MODULES.map((m) => (
                                    <TouchableOpacity
                                        key={m.route}
                                        style={styles.adminBtn}
                                        onPress={() => navigation.navigate(m.route)}
                                    >
                                        <View style={styles.adminIconBox}>
                                            <Ionicons name={m.icon} size={22} color="#FFF" />
                                        </View>
                                        <Text style={styles.adminLbl} numberOfLines={1}>{m.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </LinearGradient>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Hero
    hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    heroDecor: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -40 },
    heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
    heroGreet: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 4, letterSpacing: 0.5 },
    heroIconBox: { width: 68, height: 68, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 22, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
    statVal: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: '700' },

    // Section
    section: { paddingHorizontal: 20, marginTop: 24 },
    secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    secAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#1B3FE8', marginRight: 10 },
    secTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },

    // Featured Row
    featuredRow: { flexDirection: 'row', gap: 14 },
    featuredCard: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 24,
        padding: 16, borderHeight: 1, borderColor: '#F1F5F9',
        shadowColor: '#1B3FE8', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08, shadowRadius: 15, elevation: 4,
        position: 'relative', overflow: 'hidden',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardIconWrap: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    cardArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1 },
    cardLabel: { fontSize: 15, fontWeight: '900', lineHeight: 20 },
    cardSub: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
    cardBadge: {
        position: 'absolute', top: 0, right: 0,
        backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 4,
        borderBottomLeftRadius: 14,
    },
    cardBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

    // List
    moduleList: { backgroundColor: '#FFF', borderRadius: 24, padding: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    listIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    listText: { flex: 1 },
    listLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    listSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    listDiv: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 62 },

    // Admin
    adminCard: { padding: 20, borderRadius: 32, overflow: 'hidden' },
    adminHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, opacity: 0.9 },
    adminTitle: { fontSize: 12, fontWeight: '900', color: '#6366F1', letterSpacing: 1.5 },
    adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    adminBtn: {
        width: (width - 40 - 40 - 24) / 3,
        alignItems: 'center', gap: 8,
    },
    adminIconBox: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    adminLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
