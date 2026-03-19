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
    RefreshControl
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';

// Load new PNG icons
const ICON_SET = {
    tintuc: require('../../../assets/iconset/tintuc.png'),
    hoctap: require('../../../assets/iconset/hoctap.png'),
    sinhhoat: require('../../../assets/iconset/sinhhoat.png'),
    doanphi: require('../../../assets/iconset/doanphi.png'),
    thidua: require('../../../assets/iconset/thidua.png'),
    vanban: require('../../../assets/iconset/vanban.png'),
    tinhnguyen: require('../../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../../assets/iconset/canhan.png'),
};
import { newsService } from '../../services/newsService';
import bannerService from '../../services/bannerService';
import { authService } from '../../services/authService';
import { meetingService } from '../../services/meetingService';
import { notificationService } from '../../services/notificationService';
import { API_BASE_URL } from '../../services/api';
import Banner from '../../components/Banner';

const { width } = Dimensions.get('window');
const GRID_PADDING = 12;
const COLUMN_COUNT = 3;
const TILE_SIZE = (width - (GRID_PADDING * 2) - (16 * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

const NavButton = ({ title, icon, color, isPng, onPress }) => (
    <TouchableOpacity
        style={styles.navButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.iconCircle, { backgroundColor: isPng ? 'transparent' : color + '15' }]}>
            {isPng ? (
                <RNImage source={icon} style={styles.pngIcon} resizeMode="contain" />
            ) : (
                <Icon name={icon} size={24} color={color} />
            )}
        </View>
        <Text style={styles.navLabel} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
);

const NewsCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.newsCard} onPress={() => onPress(item)} activeOpacity={0.9}>
        <RNImage source={{ uri: item.thumbnailUrl || 'https://picsum.photos/400/300' }} style={styles.newsImage} />
        <View style={styles.newsOverlay}>
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.Category?.name || 'TIN TỨC'}</Text>
            </View>
            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        </View>
    </TouchableOpacity>
);

export const DashboardScreen = ({ onNavigate }) => {
    const [news, setNews] = useState([]);
    const [banners, setBanners] = useState([]);
    const [user, setUser] = useState(null);
    const [nextMeeting, setNextMeeting] = useState(null);
    const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

            // News
            const rawNews = Array.isArray(newsData) ? newsData : (newsData.data || []);
            const processedNews = rawNews.slice(0, 5).map(item => ({
                ...item,
                thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                    ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                    : null
            }));
            setNews(processedNews);

            // Banners
            if (bannersRes && bannersRes.success && Array.isArray(bannersRes.data)) {
                const imageUrls = bannersRes.data.slice(0, 3).map(b => `${API_BASE_URL}${b.imageUrl}?t=${Date.now()}`);
                setBanners(imageUrls);
            }

            // User
            if (userData) {
                const realUser = userData.data || userData;
                setUser(realUser);
            }

            // Meeting
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

            // Notifications unread check
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
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
            {/* Header / Welcome */}
            <View style={styles.headerHero}>
                <View>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName}>{user?.UnionMember?.fullName || user?.username || 'Đoàn viên DThU'} 👋</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn} onPress={() => onNavigate('notif')}>
                    <Icon name="Bell" size={24} color={COLORS.gray900} />
                    {hasUnreadNotif && <View style={styles.notifBadge} />}
                </TouchableOpacity>
            </View>

            {/* Event/Seasonal Banner */}
            <View style={styles.bannerContainer}>
                {loading ? (
                    <View style={styles.bannerPlaceholder}>
                        <ActivityIndicator color={COLORS.primary} />
                    </View>
                ) : banners.length > 0 ? (
                    <Banner images={banners} />
                ) : null}
            </View>

            {/* Quick Navigation Grid - 2 hàng, 8 icons đầy đủ */}
            <View style={styles.navGrid}>
                <View style={styles.row}>
                    <NavButton title="Tin tức" icon={ICON_SET.tintuc} isPng onPress={() => onNavigate('news')} />
                    <NavButton title="Sinh hoạt" icon={ICON_SET.sinhhoat} isPng onPress={() => onNavigate('meeting_list')} />
                    <NavButton title="Văn bản" icon={ICON_SET.vanban} isPng onPress={() => onNavigate('document_list')} />
                </View>
                <View style={[styles.row, { marginBottom: 0 }]}>
                    <NavButton title="Thi đua" icon={ICON_SET.thidua} isPng onPress={() => onNavigate('exam_list')} />
                    <NavButton title="T.Nguyện" icon={ICON_SET.tinhnguyen} isPng onPress={() => onNavigate('volunteer_list')} />
                    <NavButton title="Cá nhân" icon={ICON_SET.canhan} isPng onPress={() => onNavigate('profile')} />
                </View>
            </View>

            {/* Next Meeting / Schedule - Hiển thị thật từ database */}
            {nextMeeting && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Lịch làm việc sắp tới</Text>
                        <TouchableOpacity onPress={() => onNavigate('meeting_list')}>
                            <Text style={styles.viewMore}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.scheduleCard} onPress={() => onNavigate('meeting_detail', { id: nextMeeting.id })}>
                        <View style={styles.scheduleTime}>
                            <Text style={styles.timeDay}>{nextMeeting.day}</Text>
                            <Text style={styles.timeMonth}>{nextMeeting.month}</Text>
                        </View>
                        <View style={styles.scheduleContent}>
                            <Text style={styles.scheduleTitle} numberOfLines={1}>{nextMeeting.title}</Text>
                            <View style={styles.scheduleMeta}>
                                <Icon name="MapPin" size={14} color={COLORS.gray400} />
                                <Text style={styles.metaText}>{nextMeeting.location}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Featured Section (News) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tin tức nổi bật</Text>
                    <TouchableOpacity onPress={() => onNavigate('news')}>
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
                                <NewsCard key={index} item={item} onPress={() => onNavigate('news_detail', { id: item.id })} />
                            ))
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Chưa có tin tức mới</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 40 },
    bannerContainer: {
        marginBottom: 20,
    },
    bannerPlaceholder: {
        height: 180,
        marginHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        marginBottom: 24
    },
    greeting: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },
    userName: { fontSize: 24, color: COLORS.gray900, fontWeight: '900', marginTop: 2 },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray100
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
        borderColor: COLORS.white
    },
    navGrid: {
        backgroundColor: COLORS.white,
        marginHorizontal: 12,
        borderRadius: 24,
        padding: 16,
        paddingTop: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 20
    },
    navButton: {
        width: TILE_SIZE - 4,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    pngIcon: {
        width: 60,
        height: 60,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.gray700,
        textAlign: 'center'
    },
    section: { marginTop: 8, paddingHorizontal: 24, marginBottom: 24 },
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
        letterSpacing: -0.5
    },
    viewMore: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    newsScroll: { paddingRight: 24 },
    newsCard: {
        width: width * 0.8,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 16,
        backgroundColor: COLORS.gray200
    },
    newsImage: { width: '100%', height: '100%' },
    newsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    categoryBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6
    },
    categoryText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
    newsTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2
    },
    scheduleTime: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: COLORS.gray100,
        width: 60
    },
    timeDay: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
    timeMonth: { fontSize: 11, fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase' },
    scheduleContent: { flex: 1, paddingLeft: 16 },
    scheduleTitle: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
    scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: COLORS.gray500 },
    emptyCard: { width: width - 48, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.gray200 },
    emptyText: { color: COLORS.gray400, fontSize: 13 }
});
