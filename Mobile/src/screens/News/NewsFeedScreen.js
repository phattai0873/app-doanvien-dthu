import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image as RNImage, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { API_BASE_URL } from '../../services/api';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import { formatViews } from '../../utils/helpers';

export const NewsFeedScreen = ({ onNavigate }) => {
    const [activeCat, setActiveCat] = useState('all');
    const [activeScope, setActiveScope] = useState('Trường'); // Default to Trường
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
                newsService.getCategories().catch(e => {
                    console.error("Cats load error:", e);
                    return [];
                }),
                newsService.getNews('all', activeScope)
            ]);

            // Xử lý Categories
            const cats = Array.isArray(catsRes) ? catsRes : (catsRes.data || []);
            setCategories([{ id: 'all', name: 'Tất cả' }, ...cats]);

            // Xử lý News
            const rawNews = newsRes.data || (Array.isArray(newsRes) ? newsRes : []);
            const processedNews = rawNews.map(item => ({
                ...item,
                thumbnailUrl: formatThumbnail(item.bannerUrl || item.thumbnailUrl),
                publishedAtDisplay: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : '—'
            }));
            setNews(processedNews);
        } catch (error) {
            console.error("Failed to fetch news:", error);
            setError("Không thể tải tin tức. Vui lòng kiểm tra kết nối mạng.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeScope]);

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

    if (loading && !refreshing) {
        return (
            <View style={styles.centerMode}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải bản tin...</Text>
            </View>
        );
    }

    if (error && news.length === 0) {
        return (
            <View style={styles.centerMode}>
                <Icon name="WifiOff" size={48} color={COLORS.gray300} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
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

            {/* Hero News */}
            {heroNews && (
                <TouchableOpacity 
                    style={styles.heroCard}
                    onPress={() => onNavigate && onNavigate('news_detail', { id: heroNews.id })}
                >
                    <View style={styles.heroImageContainer}>
                        {heroNews.thumbnailUrl ? (
                            <RNImage source={{ uri: heroNews.thumbnailUrl }} style={styles.heroImage} />
                        ) : (
                            <View style={[styles.heroImage, { backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' }]}>
                                <Icon name="Image" size={40} color={COLORS.gray200} />
                            </View>
                        )}
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>NỔI BẬT</Text>
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>{heroNews.title}</Text>
                    <Text style={styles.heroSummary} numberOfLines={2}>{heroNews.summary}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="Clock" size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{heroNews.publishedAtDisplay}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={styles.metaItem}>
                                <Icon name={heroNews.isLiked ? "HeartFilled" : "Heart"} size={12} color={heroNews.isLiked ? COLORS.error : "#6B7280"} />
                                <Text style={[styles.metaText, heroNews.isLiked && { color: COLORS.error }]}>{heroNews.likesCount || 0}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Icon name="Share2" size={12} color="#6B7280" />
                                <Text style={styles.metaText}>{heroNews.sharesCount || 0}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Icon name="Eye" size={12} color="#6B7280" />
                                <Text style={styles.metaText}>{formatViews(heroNews.viewsCount || 0)}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            <View style={styles.divider} />

            {/* List News */}
            <View style={styles.listContainer}>
                {listNews.map(item => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.newsItem}
                        onPress={() => onNavigate && onNavigate('news_detail', { id: item.id })}
                    >
                        <View style={styles.newsThumb}>
                            {item.thumbnailUrl ? (
                                <RNImage source={{ uri: item.thumbnailUrl }} style={styles.imgCover} />
                            ) : (
                                <View style={[styles.imgCover, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Icon name="Image" size={24} color={COLORS.gray200} />
                                </View>
                            )}
                        </View>
                        <View style={styles.newsContent}>
                            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                            <View style={styles.newsFooter}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={styles.metaItem}>
                                        <Icon name={item.isLiked ? "HeartFilled" : "Heart"} size={10} color={item.isLiked ? COLORS.error : "#9CA3AF"} />
                                        <Text style={[styles.metaTextSm, item.isLiked && { color: COLORS.error }]}>{item.likesCount || 0}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Icon name="Share2" size={10} color="#9CA3AF" />
                                        <Text style={styles.metaTextSm}>{item.sharesCount || 0}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Icon name="Eye" size={10} color="#9CA3AF" />
                                        <Text style={styles.metaTextSm}>{formatViews(item.viewsCount || 0)}</Text>
                                    </View>
                                </View>
                                <View style={styles.metaItem}>
                                    <Icon name="Clock" size={10} color="#9CA3AF" />
                                    <Text style={styles.metaTextSm}>{item.publishedAtDisplay}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {listNews.length === 0 && !heroNews && (
                <View style={styles.emptyState}>
                    <Icon name="Database" size={40} color="#E5E7EB" />
                    <Text style={styles.emptyText}>Chưa có bài viết.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
    loadingText: { marginTop: 10, color: COLORS.gray500 },
    errorText: { marginTop: 15, color: COLORS.gray500, textAlign: 'center', lineHeight: 20 },
    retryBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd },
    retryText: { color: '#FFF', fontWeight: '800' },
    scrollContainer: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 16, paddingBottom: 100 },
    scopeSwitcher: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray100,
        borderRadius: SIZES.radiusMd,
        padding: 4,
        marginBottom: 20,
    },
    scopeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: SIZES.radiusSm,
    },
    scopeBtnActive: {
        backgroundColor: COLORS.white,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scopeBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.gray500,
        letterSpacing: 0.5,
    },
    scopeBtnTextActive: {
        color: COLORS.primary,
    },
    catWrapper: { marginBottom: 15 },
    catScroll: { paddingHorizontal: 20, gap: 10 },
    catPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catPillActive: { 
        backgroundColor: COLORS.primary, 
        borderColor: COLORS.primary, 
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    catText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    catTextActive: { color: '#FFF', fontWeight: 'bold' },
    heroCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    heroImageContainer: { height: 210, width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    badgeContainer: {
        position: 'absolute', top: 16, left: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: SIZES.radiusSm,
    },
    badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, margin: 16, marginBottom: 6, lineHeight: 26 },
    heroSummary: { fontSize: 14, color: COLORS.gray600, marginHorizontal: 16, marginBottom: 16, lineHeight: 22 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, color: COLORS.gray500, marginLeft: 6, fontWeight: '500' },
    divider: { height: 1.5, backgroundColor: COLORS.gray100, marginBottom: 20, marginHorizontal: 8 },
    listContainer: { gap: 16 },
    newsItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    newsThumb: { width: 100, height: 100, borderRadius: SIZES.radiusSm, overflow: 'hidden', backgroundColor: COLORS.gray100 },
    imgCover: { width: '100%', height: '100%' },
    newsContent: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
    newsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, lineHeight: 22 },
    newsSummary: { fontSize: 13, color: COLORS.gray500, marginTop: 4, lineHeight: 18 },
    newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    newsCat: {
        fontSize: 10,
        color: COLORS.primary,
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: SIZES.radiusXs,
        fontWeight: '700',
    },
    metaTextSm: { fontSize: 11, color: COLORS.gray400, marginLeft: 5, fontWeight: '500' },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 60 },
    emptyText: { color: COLORS.gray400, marginTop: 15, fontWeight: '500' },
});
