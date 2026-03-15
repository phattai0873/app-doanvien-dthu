import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
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
import { API_BASE_URL } from '../../services/api';
import Banner from '../../components/Banner';

const { width } = Dimensions.get('window');
const GRID_PADDING = 12; // Reduced from 20
const COLUMN_COUNT = 4;
const TILE_SIZE = (width - (GRID_PADDING * 2) - (8 * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

// Removed MOCK_BANNERS - now using bannerService

const NavButton = ({ title, icon, color, isPng, onPress }) => (
    <TouchableOpacity
        style={styles.navButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.iconCircle, { backgroundColor: isPng ? 'transparent' : color + '15' }]}>
            {isPng ? (
                <Image source={icon} style={styles.pngIcon} resizeMode="contain" />
            ) : (
                <Icon name={icon} size={24} color={color} />
            )}
        </View>
        <Text style={styles.navLabel} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
);

const NewsCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.newsCard} onPress={() => onPress(item)} activeOpacity={0.9}>
        <Image source={{ uri: item.thumbnailUrl || 'https://picsum.photos/400/300' }} style={styles.newsImage} />
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!refreshing) setLoading(true);
        try {
            const [newsData, bannersRes, userData] = await Promise.all([
                newsService.getNews(),
                bannerService.getActiveBanners(),
                authService.getCurrentUser()
            ]);

            const rawNews = Array.isArray(newsData) ? newsData : (newsData.data || []);
            const processedNews = rawNews.slice(0, 5).map(item => ({
                ...item,
                thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                    ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                    : null
            }));
            setNews(processedNews);

            if (bannersRes && bannersRes.success && Array.isArray(bannersRes.data)) {
                // Chỉ lấy tối đa 3 banner như yêu cầu giao diện
                const imageUrls = bannersRes.data.slice(0, 3).map(b => `${API_BASE_URL}${b.imageUrl}?t=${Date.now()}`);
                setBanners(imageUrls);
            }

            if (userData) {
                const realUser = userData.data || userData;
                setUser(realUser);
            }
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
                    <View style={styles.notifBadge} />
                </TouchableOpacity>
            </View>

            {/* Event/Seasonal Banner */}
            <View style={styles.bannerContainer}>
                {banners.length > 0 && <Banner images={banners} />}
            </View>

            {/* Quick Navigation 4x4 Grid */}
            <View style={styles.navGrid}>
                <View style={styles.row}>
                    <NavButton title="Tin tức" icon={ICON_SET.tintuc} isPng onPress={() => onNavigate('news')} />
                    <NavButton title="Sinh hoạt" icon={ICON_SET.sinhhoat} isPng onPress={() => onNavigate('meeting_list')} />
                    <NavButton title="Văn bản" icon={ICON_SET.vanban} isPng onPress={() => onNavigate('document_list')} />
                    <NavButton title="Tình nguyện" icon={ICON_SET.tinhnguyen} isPng onPress={() => onNavigate('volunteer_list')} />
                </View>
                <View style={[styles.row, { justifyContent: 'flex-start' }]}>
                    <NavButton title="Cá nhân" icon={ICON_SET.canhan} isPng onPress={() => onNavigate('profile')} />
                </View>
            </View>

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
                        {news.map((item, index) => (
                            <NewsCard key={index} item={item} onPress={() => onNavigate('news')} />
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Calendar / Schedule Summary (Optional UI addition) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lịch làm việc</Text>
                <View style={styles.scheduleCard}>
                    <View style={styles.scheduleTime}>
                        <Text style={styles.timeDay}>24</Text>
                        <Text style={styles.timeMonth}>Thg 2</Text>
                    </View>
                    <View style={styles.scheduleContent}>
                        <Text style={styles.scheduleTitle}>Họp Ban chỉ đạo Chiến dịch TN tình nguyện</Text>
                        <View style={styles.scheduleMeta}>
                            <Icon name="MapPin" size={14} color={COLORS.gray400} />
                            <Text style={styles.metaText}>Phòng họp G2</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 40 },
    bannerContainer: {
        marginBottom: 24,
        paddingHorizontal: 0, // Banner component might already have width logic
    },
    headerHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        marginBottom: 24
    },
    greeting: { fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
    userName: { fontSize: 24, color: COLORS.gray900, fontWeight: '800', marginTop: 2 },
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
        marginHorizontal: 12, // Reduced from 20
        borderRadius: 20,
        padding: 12, // Reduced from 16
        paddingTop: 16, // Reduced from 24
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 24 // Reduced from 32
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12 // Reduced from 20
    },
    navButton: {
        width: TILE_SIZE,
        alignItems: 'center',
    },
    iconCircle: {
        width: 56, // Reduced from 64
        height: 56, // Reduced from 64
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4, // Reduced from 8
    },
    pngIcon: {
        width: 50, // Reduced from 64
        height: 50, // Reduced from 64
    },
    navLabel: {
        fontSize: 12,
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
        fontWeight: '800',
        color: COLORS.gray900,
        letterSpacing: -0.5
    },
    viewMore: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    newsScroll: { paddingRight: 24 },
    newsCard: {
        width: width * 0.8,
        height: 200,
        borderRadius: 24,
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
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray100
    },
    scheduleTime: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: COLORS.gray100,
        width: 60
    },
    timeDay: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    timeMonth: { fontSize: 10, fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase' },
    scheduleContent: { flex: 1, paddingLeft: 16 },
    scheduleTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray800, marginBottom: 4 },
    scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: COLORS.gray500 }
});
