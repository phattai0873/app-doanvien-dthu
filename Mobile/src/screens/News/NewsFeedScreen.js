import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { API_BASE_URL } from '../../services/api';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';

export const NewsFeedScreen = () => {
    const [activeCat, setActiveCat] = useState('all');
    const [activeScope, setActiveScope] = useState('Trường'); // Default to Trường
    const [categories, setCategories] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const [catsRes, newsRes] = await Promise.all([
                newsService.getCategories(),
                newsService.getNews('all', activeScope)
            ]);

            // Xử lý Categories
            const cats = Array.isArray(catsRes) ? catsRes : (catsRes.data || []);
            setCategories([{ id: 'all', name: 'Tất cả' }, ...cats]);

            // Xử lý News
            const rawNews = newsRes.data || (Array.isArray(newsRes) ? newsRes : []);
            const processedNews = rawNews.map(item => ({
                ...item,
                thumbnailUrl: (item.bannerUrl || item.thumbnailUrl)
                    ? `${API_BASE_URL}${item.bannerUrl || item.thumbnailUrl}?t=${Date.now()}`
                    : null,
                publishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : '—'
            }));
            setNews(processedNews);
        } catch (error) {
            console.error("Failed to fetch news:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeScope]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const filteredNews = activeCat === 'all'
        ? news
        : news.filter(item => item.categoryId === activeCat);

    const heroNews = filteredNews.length > 0 ? filteredNews[0] : null;
    const listNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

    if (loading) {
        return (
            <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
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

            {/* Hero News */}
            {heroNews && (
                <View style={styles.heroCard}>
                    <View style={styles.heroImageContainer}>
                        <Image source={{ uri: heroNews.thumbnailUrl }} style={styles.heroImage} />
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>NỔI BẬT</Text>
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>{heroNews.title}</Text>
                    <Text style={styles.heroSummary} numberOfLines={2}>{heroNews.summary}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="Clock" size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{heroNews.publishedAt}</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.divider} />

            {/* List News */}
            <View style={styles.listContainer}>
                {listNews.map(item => (
                    <TouchableOpacity key={item.id} style={styles.newsItem}>
                        <View style={styles.newsThumb}>
                            <Image source={{ uri: item.thumbnailUrl }} style={styles.imgCover} />
                        </View>
                        <View style={styles.newsContent}>
                            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                            <View style={styles.newsFooter}>
                                <Text style={styles.newsCat}>{item.NewsCategory?.name || 'Tin tức'}</Text>
                                <View style={styles.metaItem}>
                                    <Icon name="Clock" size={10} color="#9CA3AF" />
                                    <Text style={styles.metaTextSm}>{item.publishedAt}</Text>
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
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundColor },
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
    catScroll: { marginBottom: 16, paddingVertical: 4 },
    catPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: SIZES.radiusFull,
        borderWidth: 1.5,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
        marginRight: 10,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    catPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
    },
    catText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
    catTextActive: { color: COLORS.white },
    sourceNote: { fontSize: 9, color: COLORS.gray300, fontStyle: 'italic', textAlign: 'right', marginBottom: 10, opacity: 0.5 },
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
