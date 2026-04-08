import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image as RNImage,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants';

// PNG icon cũ
const ICON_SET = {
    tintuc: require('../../../assets/iconset/tintuc.png'),
    sinhhoat: require('../../../assets/iconset/sinhhoat.png'),
    vanban: require('../../../assets/iconset/vanban.png'),
    thidua: require('../../../assets/iconset/thidua.png'),
    tinhnguyen: require('../../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../../assets/iconset/canhan.png'),
};
import { newsService } from '../../services/newsService';
import bannerService from '../../services/bannerService';
import { authService } from '../../services/authService';
import { volunteerService } from '../../services/volunteerService';
import { notificationService } from '../../services/notificationService';
import { API_BASE_URL } from '../../services/api';
import Banner from '../../components/Banner';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

// ──────────────────────────────────────────────
// Quick Action buttons (6 ô lưới) – dùng PNG icon cũ
// ───────────────────────  ───────────────────────
const QUICK_ACTIONS = [
    { id: 'news', pngIcon: ICON_SET.tintuc, label: 'Tin tức', route: 'News' },
    { id: 'meeting', pngIcon: ICON_SET.sinhhoat, label: 'Sinh hoạt', route: 'MeetingList' },
    { id: 'docs', pngIcon: ICON_SET.vanban, label: 'Văn bản', route: 'DocumentList' },
    { id: 'exam', pngIcon: ICON_SET.thidua, label: 'Thi đua', route: 'ExamList' },
    { id: 'volunteer', pngIcon: ICON_SET.tinhnguyen, label: 'Tình nguyện', route: 'VolunteerList' },
    { id: 'profile', pngIcon: ICON_SET.canhan, label: 'Cá nhân', route: 'Profile' },
];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────
const QuickActionBtn = ({ item, onPress }) => (
    <TouchableOpacity style={styles.qaBtn} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.qaIconWrap}>
            <RNImage source={item.pngIcon} style={styles.qaIconImg} resizeMode="contain" />
        </View>
        <Text style={styles.qaLabel} numberOfLines={1}>{item.label}</Text>
    </TouchableOpacity>
);

const NewsCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.newsCard} onPress={onPress} activeOpacity={0.9}>
        <RNImage
            source={{ uri: item.thumbnailUrl || 'https://picsum.photos/seed/' + item.id + '/400/240' }}
            style={styles.newsImage}
        />
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.newsOverlay}
        >
            <View style={styles.newsCatBadge}>
                <Text style={styles.newsCatText}>{item.Category?.name || 'TIN TỨC'}</Text>
            </View>
            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

const SectionHeader = ({ title, label = 'Xem tất cả', onPress }) => (
    <View style={styles.secHeader}>
        <View style={styles.secTitleRow}>
            <View style={styles.secAccent} />
            <Text style={styles.secTitle}>{title}</Text>
        </View>
        {onPress && (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <Text style={styles.viewAll}>{label} →</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
export const DashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user: authUser } = useAuth();

    const [news, setNews] = useState([]);
    const [banners, setBanners] = useState([]);
    const [user, setUser] = useState(authUser);
    const [activities, setActivities] = useState([]);   // danh sách hoạt động sắp tới
    const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isOfficer = authUser?.role === 'SUPER_ADMIN'
        || authUser?.role === 'ADMIN'
        || authUser?.role === 'BRANCH_ADMIN'
        || authUser?.role === 'CELL_ADMIN'
        || authUser?.isSuperAdmin;

    // ─── Data fetch ────────────────────────────
    const loadData = async () => {
        if (!refreshing) setLoading(true);
        try {
            const [newsData, bannersRes, userData, activitiesRes, notifications] = await Promise.all([
                newsService.getNews(),
                bannerService.getActiveBanners(),
                authService.getCurrentUser(),
                volunteerService.getActivities({ limit: 5 }),
                notificationService.getNotifications({ limit: 10 }),
            ]);

            // News
            const rawNews = Array.isArray(newsData?.data) ? newsData.data : (Array.isArray(newsData) ? newsData : []);
            setNews(rawNews.slice(0, 6).map(item => ({
                ...item,
                thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                    ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                    : null,
            })));

            // Banners
            if (bannersRes?.success && Array.isArray(bannersRes.data)) {
                setBanners(bannersRes.data.slice(0, 4).map(b => `${API_BASE_URL}${b.imageUrl}?t=${Date.now()}`));
            }

            // User
            if (userData) setUser(userData.data || userData);

            // Activities (hoạt động tình nguyện, đoàn thể)
            const rawActivities = Array.isArray(activitiesRes) ? activitiesRes : [];
            const upcoming = rawActivities
                .filter(a => {
                    const s = (a.status || '').toUpperCase();
                    return s === 'UPCOMING' || s === 'SCHEDULED' || s === 'OPEN' || s === 'ONGOING' || s === 'IN_PROGRESS';
                })
                .slice(0, 3)
                .map(a => {
                    // activities dùng startDate (không phải meetingTime)
                    const date = new Date(a.startDate || a.startTime || a.createdAt);
                    const isActive = ['ONGOING', 'IN_PROGRESS'].includes((a.status || '').toUpperCase());
                    return {
                        ...a,
                        day: date.getDate(),
                        month: `Thg ${date.getMonth() + 1}`,
                        timeStr: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        locationName: a.location || a.Location?.name || 'Chưa xác định',
                        isActive,
                    };
                });
            setActivities(upcoming);

            // Notifications
            const rawNotifs = Array.isArray(notifications) ? notifications : (notifications?.data || []);
            setHasUnreadNotif(rawNotifs.some(n => !n.ReadStatuses || n.ReadStatuses.length === 0));

        } catch (err) {
            console.error('Dashboard loadData:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, []);
    const onRefresh = () => { setRefreshing(true); loadData(); };

    // ─── Greeting ──────────────────────────────
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const displayName = user?.UnionMember?.fullName || user?.username || 'Đoàn viên';

    // ─── Render ────────────────────────────────
    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* ─── HERO HEADER ─────────────────── */}
                <LinearGradient
                    colors={['#1B3FE8', '#1230B0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.hero, { paddingTop: Math.max(insets.top + 12, 50) }]}
                >
                    {/* Decorative blobs */}
                    <View style={styles.blob1} />
                    <View style={styles.blob2} />

                    {/* Top bar: greeting + actions */}
                    <View style={styles.heroTopBar}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroGreet}>{greeting} ☀️</Text>
                            <Text style={styles.heroName} numberOfLines={1}>{displayName}</Text>
                        </View>
                        <View style={styles.heroActions}>
                            {isOfficer && (
                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => navigation.navigate('AdminDashboard')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.heroBtn}
                                onPress={() => navigation.navigate('Notification')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="notifications-outline" size={20} color="#FFF" />
                                {hasUnreadNotif && <View style={styles.notifDot} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quick Action Grid */}
                    <View style={styles.qaCard}>
                        {QUICK_ACTIONS.map((item) => (
                            <QuickActionBtn
                                key={item.id}
                                item={item}
                                onPress={() => navigation.navigate(item.route)}
                            />
                        ))}
                    </View>
                </LinearGradient>

                {/* ─── BANNER SLIDER ───────────────── */}
                {loading ? (
                    <View style={styles.bannerPlaceholder}>
                        <ActivityIndicator color={COLORS.primary} />
                    </View>
                ) : banners.length > 0 ? (
                    <View style={{ marginTop: 20 }}>
                        <Banner images={banners} />
                    </View>
                ) : null}

                {/* ─── HOẠT ĐỘNG SẮP TỚI ──────────── */}
                <View style={styles.section}>
                    <SectionHeader
                        title="Hoạt động sắp tới"
                        onPress={() => navigation.navigate('VolunteerList')}
                    />

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
                    ) : activities.length > 0 ? (
                        <View style={styles.activityList}>
                            {activities.map((a) => (
                                <TouchableOpacity
                                    key={a.id}
                                    style={[styles.actCard, a.isActive && styles.actCardActive]}
                                    onPress={() => navigation.navigate('VolunteerList')}
                                    activeOpacity={0.85}
                                >
                                    {/* Status bar trái */}
                                    <View style={[styles.actBar, { backgroundColor: a.isActive ? '#10B981' : COLORS.primary }]} />

                                    {/* Date block */}
                                    <View style={[styles.actDateBox, { backgroundColor: a.isActive ? '#ECFDF5' : '#EBF0FE' }]}>
                                        <Text style={[styles.actDay, { color: a.isActive ? '#10B981' : COLORS.primary }]}>{a.day}</Text>
                                        <Text style={[styles.actMonth, { color: a.isActive ? '#10B981' : COLORS.primary }]}>{a.month}</Text>
                                    </View>

                                    {/* Content */}
                                    <View style={styles.actContent}>
                                        {a.isActive && (
                                            <View style={styles.actLiveBadge}>
                                                <View style={styles.actLiveDot} />
                                                <Text style={styles.actLiveText}>Đang diễn ra</Text>
                                            </View>
                                        )}
                                        <Text style={styles.actTitle} numberOfLines={2}>{a.title || a.name}</Text>
                                        <View style={styles.actMeta}>
                                            <Ionicons name="time-outline" size={12} color="#94A3B8" />
                                            <Text style={styles.actMetaText}>{a.timeStr}</Text>
                                            <View style={styles.actMetaDot} />
                                            <Ionicons name="location-outline" size={12} color="#94A3B8" />
                                            <Text style={styles.actMetaText} numberOfLines={1}>{a.locationName}</Text>
                                        </View>
                                    </View>

                                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyActivity}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="heart-outline" size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có hoạt động</Text>
                            <Text style={styles.emptyDesc}>Không có hoạt động tình nguyện nào sắp tới.</Text>
                        </View>
                    )}
                </View>

                {/* ─── TIN TỨC NỔI BẬT ────────────── */}
                <View style={styles.section}>
                    <SectionHeader
                        title="Tin tức nổi bật"
                        onPress={() => navigation.navigate('News')}
                    />

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
                    ) : news.length > 0 ? (
                        <>
                            {/* Hero news card (first item) */}
                            <TouchableOpacity
                                style={styles.heroNewsCard}
                                onPress={() => navigation.navigate('NewsDetail', { id: news[0].id })}
                                activeOpacity={0.9}
                            >
                                <RNImage
                                    source={{ uri: news[0].thumbnailUrl || `https://picsum.photos/seed/${news[0].id}/600/320` }}
                                    style={styles.heroNewsImg}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.88)']}
                                    style={styles.heroNewsOverlay}
                                >
                                    <View style={styles.newsCatBadge}>
                                        <Text style={styles.newsCatText}>{news[0].Category?.name || 'TIN TỨC'}</Text>
                                    </View>
                                    <Text style={styles.heroNewsTitle} numberOfLines={3}>{news[0].title}</Text>
                                    <Text style={styles.heroNewsMeta}>
                                        {new Date(news[0].createdAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Horizontal list (rest) */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={width * 0.68 + 12}
                                decelerationRate="fast"
                                contentContainerStyle={{ gap: 12, paddingRight: 4, marginTop: 12 }}
                            >
                                {news.slice(1).map((item) => (
                                    <NewsCard
                                        key={item.id}
                                        item={item}
                                        onPress={() => navigation.navigate('NewsDetail', { id: item.id })}
                                    />
                                ))}
                            </ScrollView>
                        </>
                    ) : (
                        <View style={styles.emptyActivity}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="newspaper-outline" size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có tin tức</Text>
                            <Text style={styles.emptyDesc}>Tin tức mới sẽ xuất hiện tại đây.</Text>
                        </View>
                    )}
                </View>

                {/* ─── ADMIN SHORTCUT ──────────────── */}
                {isOfficer && (
                    <View style={styles.section}>
                        <SectionHeader title="Quản trị nhanh" />
                        <View style={styles.adminRow}>
                            {[
                                { icon: 'people', label: 'Đoàn viên', route: 'MemberMgmt', color: '#1B3FE8', bg: '#EBF0FE' },
                                { icon: 'bar-chart', label: 'Thống kê', route: 'StatisticsMgmt', color: '#10B981', bg: '#ECFDF5' },
                                { icon: 'megaphone', label: 'Đăng tin', route: 'NewsMgmt', color: '#F59E0B', bg: '#FFFBEB' },
                                { icon: 'card', label: 'Đoàn phí', route: 'FeeMgmt', color: '#8B5CF6', bg: '#F5F3FF' },
                            ].map((a) => (
                                <TouchableOpacity
                                    key={a.route}
                                    style={styles.adminCard}
                                    onPress={() => navigation.navigate(a.route)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.adminIcon, { backgroundColor: a.bg }]}>
                                        <Ionicons name={a.icon} size={22} color={a.color} />
                                    </View>
                                    <Text style={styles.adminLabel}>{a.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8' },

    // ── Hero ────────────────────────────────────
    hero: {
        paddingHorizontal: 16,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    blob1: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60,
    },
    blob2: {
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)', bottom: 40, left: -30,
    },
    heroTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroGreet: { fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: '600' },
    heroName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
    heroActions: { flexDirection: 'row', gap: 10 },
    heroBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute', top: 8, right: 9,
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1, borderColor: '#1B3FE8',
    },

    // Quick Action Card (white card floating on hero)
    qaCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: -20,      // Overlap below hero
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 8,
    },
    qaBtn: {
        width: (width - 48) / 6,
        alignItems: 'center',
        paddingVertical: 4,
    },
    qaIconWrap: {
        width: 52, height: 52,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
    },
    qaIconImg: {
        width: 46, height: 46,
    },
    qaLabel: {
        fontSize: 10, fontWeight: '700',
        color: '#334155', textAlign: 'center',
    },

    // ── Banner Placeholder ──────────────────────
    bannerPlaceholder: {
        height: 170, marginHorizontal: 16, marginTop: 40,
        borderRadius: 20, backgroundColor: '#E8EEF4',
        justifyContent: 'center', alignItems: 'center',
    },

    // ── Section ─────────────────────────────────
    section: { marginTop: 28, paddingHorizontal: 16 },
    secHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    secTitleRow: { flexDirection: 'row', alignItems: 'center' },
    secAccent: {
        width: 4, height: 18, borderRadius: 2,
        backgroundColor: COLORS.primary, marginRight: 10,
    },
    secTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    viewAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

    // ── Activity cards ───────────────────────────
    activityList: { gap: 10 },
    actCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    actCardActive: {
        borderWidth: 1,
        borderColor: '#10B98120',
        shadowColor: '#10B981',
        shadowOpacity: 0.10,
    },
    actBar: {
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
    },
    actDateBox: {
        width: 52, height: 58, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    actDay: { fontSize: 22, fontWeight: '900' },
    actMonth: { fontSize: 10, fontWeight: '700', marginTop: 1 },
    actContent: { flex: 1 },
    actLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    actLiveDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#10B981', marginRight: 5,
    },
    actLiveText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
    actTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
    actMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, marginTop: 6, flexWrap: 'wrap',
    },
    actMetaText: { fontSize: 11, color: '#94A3B8', fontWeight: '500', flexShrink: 1 },
    actMetaDot: {
        width: 3, height: 3, borderRadius: 2,
        backgroundColor: '#CBD5E1', marginHorizontal: 2,
    },

    // Empty State
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#EBF0FE',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
    emptyDesc: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },

    // ── Hero News Card ──────────────────────────
    heroNewsCard: {
        width: '100%', height: 210,
        borderRadius: 20, overflow: 'hidden',
        backgroundColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    heroNewsImg: { width: '100%', height: '100%' },
    heroNewsOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, height: '75%', justifyContent: 'flex-end',
    },
    heroNewsTitle: {
        color: '#FFF', fontSize: 16, fontWeight: '800',
        lineHeight: 22, marginTop: 6,
    },
    heroNewsMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },

    // ── Horizontal news ─────────────────────────
    newsCard: {
        width: width * 0.65,
        height: 160,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    newsImage: { width: '100%', height: '100%' },
    newsOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 12, height: '65%', justifyContent: 'flex-end',
    },
    newsCatBadge: {
        backgroundColor: COLORS.primary, alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, marginBottom: 6,
    },
    newsCatText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
    newsTitle: { color: '#FFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },

    // ── Admin shortcuts ─────────────────────────
    adminRow: { flexDirection: 'row', gap: 10 },
    adminCard: {
        flex: 1, backgroundColor: '#FFF',
        borderRadius: 16, padding: 14, alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    adminIcon: {
        width: 46, height: 46, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    adminLabel: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' },
});
