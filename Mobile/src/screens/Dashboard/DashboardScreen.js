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
    Platform,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import bannerService from '../../services/bannerService';
import { authService } from '../../services/authService';
import { meetingService } from '../../services/meetingService';
import { notificationService } from '../../services/notificationService';
import { API_BASE_URL } from '../../services/api';
import Banner from '../../components/Banner';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Load old PNG icons
const ICON_SET = {
    tintuc: require('../../../assets/iconset/tintuc.png'),
    sinhhoat: require('../../../assets/iconset/sinhhoat.png'),
    vanban: require('../../../assets/iconset/vanban.png'),
    thidua: require('../../../assets/iconset/thidua.png'),
    tinhnguyen: require('../../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../../assets/iconset/canhan.png'),
};

const NavButton = ({ title, icon, onPress }) => (
    <TouchableOpacity
        style={styles.navButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.iconCircle}>
            <RNImage source={icon} style={styles.pngIcon} resizeMode="contain" />
        </View>
        <Text style={styles.navLabel} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
);

const NewsCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.newsCard} onPress={() => onPress(item)} activeOpacity={0.9}>
        <RNImage source={{ uri: item.thumbnailUrl || 'https://picsum.photos/400/300' }} style={styles.newsImage} />
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.newsOverlay}
        >
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.Category?.name || 'TIN TỨC'}</Text>
            </View>
            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

export const DashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user: authUser } = useAuth();
    const [news, setNews] = useState([]);
    const [banners, setBanners] = useState([]);
    const [user, setUser] = useState(authUser);
    const [nextMeeting, setNextMeeting] = useState(null);
    const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Quyền cán bộ
    const isOfficer = authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'ADMIN' || authUser?.role === 'BRANCH_ADMIN' || authUser?.role === 'CELL_ADMIN' || authUser?.isSuperAdmin;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!refreshing) setLoading(true);
        try {
            const [newsData, bannersRes, userData, meetingsRes, notifications] = await Promise.all([
                newsService.getNews(),
                bannerService.getActiveBanners(),
                authService.getCurrentUser(),
                meetingService.getMeetings({ limit: 1 }),
                notificationService.getNotifications({ limit: 10 })
            ]);

            const rawNews = (newsData && Array.isArray(newsData.data)) ? newsData.data : (Array.isArray(newsData) ? newsData : []);
            const processedNews = rawNews.slice(0, 5).map(item => ({
                ...item,
                thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                    ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                    : null
            }));
            setNews(processedNews);

            if (bannersRes && bannersRes.success && Array.isArray(bannersRes.data)) {
                const imageUrls = bannersRes.data.slice(0, 3).map(b => `${API_BASE_URL}${b.imageUrl}?t=${Date.now()}`);
                setBanners(imageUrls);
            }

            if (userData) {
                const realUser = userData.data || userData;
                setUser(realUser);
            }

            const meetings = Array.isArray(meetingsRes) ? meetingsRes : (meetingsRes.data || []);
            if (meetings.length > 0) {
                const latest = meetings[0];
                const mDate = new Date(latest.meetingTime);
                setNextMeeting({
                    ...latest,
                    day: mDate.getDate(),
                    month: `Thg ${mDate.getMonth() + 1}`,
                    title: latest.title,
                    location: latest.Location?.name || 'Văn phòng Đoàn'
                });
            } else {
                setNextMeeting(null);
            }

            const rawNotifs = Array.isArray(notifications) ? notifications : (notifications.data || []);
            const unread = rawNotifs.some(n => !n.ReadStatuses || n.ReadStatuses.length === 0);
            setHasUnreadNotif(unread);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >
                {/* 1. Header / Welcome Section (Original Simple Style) */}
                <View style={[styles.headerHero, { paddingTop: Math.max(insets.top, 16) }]}>
                    <View style={styles.welcomeInfo}>
                        <Text style={styles.greeting}>Xin chào,</Text>
                        <Text style={styles.userName}>{user?.UnionMember?.fullName || user?.username || 'Đoàn viên DThU'} 👋</Text>
                    </View>

                    <View style={styles.headerActions}>
                        {isOfficer && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { marginRight: 12 }]}
                                onPress={() => navigation.navigate('AdminDashboard')}
                            >
                                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('Notification')}
                        >
                            <Ionicons name="notifications" size={24} color={COLORS.gray900} />
                            {hasUnreadNotif && <View style={styles.notifBadge} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Banner Section */}
                <View style={styles.bannerContainer}>
                    {loading ? (
                        <View style={styles.bannerPlaceholder}>
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    ) : banners.length > 0 ? (
                        <Banner images={banners} />
                    ) : null}
                </View>

                {/* 2. Main Functions Section (Classic Grid Style) */}
                <View style={styles.navGrid}>
                    <View style={styles.gridRow}>
                        <NavButton title="Tin tức" icon={ICON_SET.tintuc} onPress={() => navigation.navigate('News')} />
                        <NavButton title="Sinh hoạt" icon={ICON_SET.sinhhoat} onPress={() => navigation.navigate('MeetingList')} />
                        <NavButton title="Văn bản" icon={ICON_SET.vanban} onPress={() => navigation.navigate('DocumentList')} />
                    </View>
                    <View style={styles.gridRow}>
                        <NavButton title="Thi đua" icon={ICON_SET.thidua} onPress={() => navigation.navigate('ExamList')} />
                        <NavButton title="Tỉnh nguyện" icon={ICON_SET.tinhnguyen} onPress={() => navigation.navigate('VolunteerList')} />
                        <NavButton title="Cá nhân" icon={ICON_SET.canhan} onPress={() => navigation.navigate('Profile')} />
                    </View>
                </View>

                {/* Next Meeting */}
                {nextMeeting && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Lịch làm việc sắp tới</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('MeetingList')}>
                                <Text style={styles.viewMore}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.scheduleCard}
                            onPress={() => navigation.navigate('MeetingDetail', { id: nextMeeting.id })}
                        >
                            <View style={styles.scheduleTime}>
                                <Text style={styles.timeDay}>{nextMeeting.day}</Text>
                                <Text style={styles.timeMonth}>{nextMeeting.month}</Text>
                            </View>
                            <View style={styles.scheduleContent}>
                                <Text style={styles.scheduleTitle} numberOfLines={1}>{nextMeeting.title}</Text>
                                <View style={styles.scheduleMeta}>
                                    <Ionicons name="location" size={14} color={COLORS.gray400} />
                                    <Text style={styles.metaText}>{nextMeeting.location}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray300} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Featured News */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tin tức nổi bật</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('News')}>
                            <Text style={styles.viewMore}>Tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={width * 0.8 + 16}
                            decelerationRate="fast"
                            contentContainerStyle={styles.newsScroll}
                        >
                            {news.length > 0 ? (
                                news.map((item, index) => (
                                    <NewsCard key={index} item={item} onPress={() => navigation.navigate('NewsDetail', { id: item.id })} />
                                ))
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>Chưa có tin tức mới</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 0 },
    headerHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    greeting: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },
    userName: { fontSize: 24, color: COLORS.gray900, fontWeight: '900', marginTop: 2 },
    welcomeInfo: { flex: 1, marginLeft: 16 },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...COLORS.shadow,
    },
    notifBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.error,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    bannerContainer: {
        marginBottom: 24,
    },
    bannerPlaceholder: {
        height: 180,
        marginHorizontal: 16,
        borderRadius: 24,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...COLORS.shadowDark,
    },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.gray900,
    },
    viewMore: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    navGrid: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        ...COLORS.shadow,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    navButton: {
        width: (width - 64) / 3,
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    pngIcon: {
        width: 48,
        height: 48,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.gray700,
        textAlign: 'center'
    },
    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        ...COLORS.shadowDark,
    },
    scheduleTime: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: COLORS.gray50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDay: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
    timeMonth: { fontSize: 10, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase' },
    scheduleContent: { flex: 1, paddingHorizontal: 16 },
    scheduleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, marginBottom: 4 },
    scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: COLORS.gray500 },
    newsScroll: { paddingRight: 24 },
    newsCard: {
        width: width * 0.75,
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        marginRight: 16,
        backgroundColor: COLORS.gray200,
        ...COLORS.shadowDark,
    },
    newsImage: { width: '100%', height: '100%' },
    newsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        height: '60%',
        justifyContent: 'flex-end',
    },
    categoryBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8
    },
    categoryText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
    newsTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', lineHeight: 22 },
    emptyCard: { width: width - 48, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.gray200 },
    emptyText: { color: COLORS.gray400, fontSize: 13 }
});
