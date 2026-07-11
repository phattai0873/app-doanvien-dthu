import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image as RNImage, 
    StyleSheet, 
    ActivityIndicator, 
    RefreshControl,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../services/api';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import { formatViews } from '../../utils/helpers';
import CommonHeader from '../../components/CommonHeader';

const { width } = Dimensions.get('window');

export const NewsFeedScreen = ({ navigation }) => {
    const [activeCat, setActiveCat] = useState('all');
    const [activeScope, setActiveScope] = useState('Trường'); 
    const [categories, setCategories] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const formatThumbnail = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    const fetchData = useCallback(async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
            const [catsRes, newsRes] = await Promise.all([
                newsService.getCategories().catch(() => []),
                newsService.getNews(activeCat, activeScope)
            ]);

            const cats = Array.isArray(catsRes) ? catsRes : (catsRes.data || []);
            setCategories([{ id: 'all', name: 'Tất cả' }, ...cats]);

            const rawNews = newsRes.data || (Array.isArray(newsRes) ? newsRes : []);
            const processedNews = rawNews.map(item => ({
                ...item,
                thumbnailUrl: formatThumbnail(item.bannerUrl || item.thumbnailUrl),
                publishedAtDisplay: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : '—'
            }));
            setNews(processedNews);
        } catch (error) {
            console.error("Failed to fetch news:", error);
            setError("Không thể tải tin tức. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeScope, activeCat]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const filteredNews = activeCat === 'all'
        ? news
        : news.filter(item => item.categoryId === activeCat);

    const heroNews = filteredNews.length > 0 ? filteredNews[0] : null;
    const listNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

    return (
        <View style={styles.container}>
            <CommonHeader title="Tin tức" />
            
            <ScrollView 
                style={styles.scrollContainer} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Scope Switcher */}
                <View style={styles.scopeSwitcher}>
                    {['Trường', 'Tỉnh'].map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.scopeBtn, activeScope === s && styles.scopeBtnActive]}
                            onPress={() => setActiveScope(s)}
                        >
                            <Text style={[styles.scopeBtnText, activeScope === s && styles.scopeBtnTextActive]}>
                                CẤP {s.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Categories */}
                <View style={styles.catWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catPill, activeCat === cat.id && styles.catPillActive]}
                                onPress={() => setActiveCat(cat.id)}
                            >
                                <Text style={[styles.catText, activeCat === cat.id && styles.catTextActive]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.centerMode}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : error && news.length === 0 ? (
                    <View style={styles.centerMode}>
                        <Ionicons name="cloud-offline-outline" size={64} color={COLORS.gray300} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
                            <Text style={styles.retryText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Hero News */}
                        {heroNews && (
                            <TouchableOpacity 
                                style={styles.heroCard}
                                onPress={() => navigation.navigate('NewsDetail', { id: heroNews.id })}
                                activeOpacity={0.9}
                            >
                                <View style={styles.heroImageContainer}>
                                    {heroNews.thumbnailUrl ? (
                                        <RNImage source={{ uri: heroNews.thumbnailUrl }} style={styles.heroImage} />
                                    ) : (
                                        <View style={[styles.heroImage, { backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Ionicons name="image-outline" size={48} color={COLORS.gray200} />
                                        </View>
                                    )}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={styles.heroOverlay}
                                    >
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>NỔI BẬT</Text>
                                        </View>
                                        <Text style={styles.heroTitle} numberOfLines={2}>{heroNews.title}</Text>
                                        <View style={styles.heroMeta}>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
                                                <Text style={styles.heroMetaText}>{heroNews.publishedAtDisplay}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.8)" />
                                                <Text style={styles.heroMetaText}>{formatViews(heroNews.viewsCount || 0)}</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* List News */}
                        <View style={styles.listContainer}>
                            {listNews.map(item => (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={styles.newsItem}
                                    onPress={() => navigation.navigate('NewsDetail', { id: item.id })}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.newsThumb}>
                                        {item.thumbnailUrl ? (
                                            <RNImage source={{ uri: item.thumbnailUrl }} style={styles.imgCover} />
                                        ) : (
                                            <View style={[styles.imgCover, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.gray50 }]}>
                                                <Ionicons name="image-outline" size={24} color={COLORS.gray200} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.newsContent}>
                                        <View>
                                            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                                            <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                                        </View>
                                        <View style={styles.newsFooter}>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="time-outline" size={12} color={COLORS.gray400} />
                                                <Text style={styles.metaTextSm}>{item.publishedAtDisplay}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="eye-outline" size={12} color={COLORS.gray400} />
                                                <Text style={styles.metaTextSm}>{formatViews(item.viewsCount || 0)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {listNews.length === 0 && !heroNews && (
                            <View style={styles.emptyState}>
                                <Ionicons name="newspaper-outline" size={64} color={COLORS.gray200} />
                                <Text style={styles.emptyText}>Chưa có bài viết trong mục này.</Text>
                            </View>
                        )}
                    </>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
    errorText: { marginTop: 15, color: COLORS.gray500, textAlign: 'center', paddingHorizontal: 40 },
    retryBtn: { 
        marginTop: 20, 
        paddingHorizontal: 24, 
        paddingVertical: 10, 
        backgroundColor: COLORS.primary, 
        borderRadius: SIZES.radiusMd 
    },
    retryText: { color: COLORS.white, fontWeight: '700' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: SIZES.md },
    scopeSwitcher: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 4,
        marginBottom: SIZES.md,
    },
    scopeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    scopeBtnActive: {
        backgroundColor: COLORS.white,
        ...COLORS.shadowDark,
    },
    scopeBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.gray500,
    },
    scopeBtnTextActive: {
        color: COLORS.primary,
    },
    catWrapper: { marginBottom: SIZES.md },
    catScroll: { gap: 8 },
    catPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    catPillActive: { 
        backgroundColor: COLORS.primary, 
        borderColor: COLORS.primary,
        ...COLORS.shadow,
    },
    catText: { fontSize: 13, color: COLORS.gray600, fontWeight: '600' },
    catTextActive: { color: COLORS.white, fontWeight: '700' },
    heroCard: {
        borderRadius: 24,
        marginBottom: SIZES.lg,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        ...COLORS.shadowDark,
    },
    heroImageContainer: { height: 240, width: '100%' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        padding: SIZES.md,
        justifyContent: 'flex-end',
    },
    badgeContainer: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
    heroTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, marginBottom: 8, lineHeight: 28 },
    heroMeta: { flexDirection: 'row', gap: 16 },
    heroMetaText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginLeft: 4, fontWeight: '600' },
    listContainer: { gap: 12 },
    newsItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 12,
        ...COLORS.shadowDark,
    },
    newsThumb: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden' },
    imgCover: { width: '100%', height: '100%' },
    newsContent: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    newsTitle: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, lineHeight: 20 },
    newsSummary: { fontSize: 13, color: COLORS.gray500, marginTop: 4, lineHeight: 18 },
    newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaTextSm: { fontSize: 11, color: COLORS.gray400, marginLeft: 4, fontWeight: '600' },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { color: COLORS.gray400, marginTop: 16, textAlign: 'center', fontWeight: '600' },
});
