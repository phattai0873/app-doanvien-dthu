import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image as RNImage,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import { API_BASE_URL, USE_MOCK_API } from '../../services/api';
import { decodeHtml } from '../../utils/helpers';

const { width } = Dimensions.get('window');

// Cấu hình style cho HTML
const tagsStyles = {
    body: {
        color: COLORS.gray800,
        fontSize: 17,
        lineHeight: 28,
    },
    p: {
        marginBottom: 16,
    },
    img: {
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 10,
    },
    strong: {
        fontWeight: 'bold',
        color: COLORS.gray900,
    }
};

export const NewsDetailScreen = ({ route, onBack, onNavigate }) => {
    const { id } = route?.params || {};
    const [news, setNews] = useState(null);
    const [relatedNews, setRelatedNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatThumbnail = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    // Helper xử lý URL ảnh trong chuỗi HTML
    const processHtml = (html) => {
        if (!html) return '';
        // Thay thế src="/uploads/..." thành src="http://IP:5000/uploads/..."
        return html.replace(/src="\/uploads\//g, `src="${API_BASE_URL}/uploads/`);
    };

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch main news detail
                const res = await newsService.getNewsDetail(id);

                // Backend trả về { success: true, data: { ...news } }
                // Hoặc nếu là Mock/Supabase thì trả về trực tiếp data
                const actualData = res?.data || res;

                if (actualData) {
                    setNews({
                        ...actualData,
                        thumbnailUrl: formatThumbnail(actualData.bannerUrl || actualData.thumbnailUrl),
                        publishedAtDisplay: actualData.publishedAt ? new Date(actualData.publishedAt).toLocaleDateString('vi-VN') : '—',
                        decodedSummary: decodeHtml(actualData.summary),
                        // Lưu HTML đã xử lý URL ảnh
                        processedContent: processHtml(actualData.content)
                    });

                    // 2. Fetch related news (same category)
                    if (actualData.categoryId) {
                        try {
                            const relatedRes = await newsService.getNews(actualData.categoryId);
                            const relatedList = relatedRes.data || (Array.isArray(relatedRes) ? relatedRes : []);
                            // Filter current and take 4
                            const filtered = relatedList.filter(item => String(item.id) !== String(id)).slice(0, 4);
                            setRelatedNews(filtered);
                        } catch (relErr) {
                            console.error("Related news fetch error:", relErr);
                        }
                    }
                } else {
                    console.error("News detail not found in response:", res);
                }
            } catch (error) {
                console.error("Failed to fetch news data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải nội dung...</Text>
            </View>
        );
    }

    if (!news) {
        return (
            <View style={styles.center}>
                <Icon name="AlertTriangle" size={48} color={COLORS.gray300} />
                <Text style={styles.errorText}>Không tìm thấy bài viết hoặc lỗi kết nối</Text>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    {news.thumbnailUrl ? (
                        <RNImage source={{ uri: news.thumbnailUrl }} style={styles.headerImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.headerImage, { backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' }]}>
                            <Icon name="Image" size={60} color={COLORS.gray200} />
                        </View>
                    )}
                    <View style={styles.imageOverlay} />
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.headerInfo}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{news.NewsCategory?.name || 'TIN TỨC'}</Text>
                        </View>
                        <View style={styles.timeRow}>
                            <Icon name="Clock" size={14} color={COLORS.gray400} />
                            <Text style={styles.date}>{news.publishedAtDisplay}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{news.title}</Text>
                    <View style={styles.authorCard}>
                        <View style={styles.authorAvatar}>
                            <Icon name="User" size={20} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.authorName}>Ban Thường vụ Đoàn trường</Text>
                            <Text style={styles.authorRole}>Đại học Đồng Tháp</Text>
                        </View>
                    </View>

                    <View style={styles.articleBody}>
                        {news.decodedSummary ? (
                            <Text style={styles.summaryText}>{news.decodedSummary}</Text>
                        ) : null}

                        {news.processedContent ? (
                            <RenderHTML
                                contentWidth={width - 48}
                                source={{ html: news.processedContent }}
                                tagsStyles={tagsStyles}
                            />
                        ) : (
                            <Text style={styles.contentText}>Nội dung bài viết đang được cập nhật...</Text>
                        )}
                    </View>

                    {/* Related News Section */}
                    {relatedNews.length > 0 && (
                        <View style={styles.relatedSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionDot} />
                                <Text style={styles.sectionTitle}>Tin liên quan</Text>
                            </View>

                            {relatedNews.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.relatedItem}
                                    onPress={() => onNavigate && onNavigate('news_detail', { id: item.id })}
                                >
                                    <RNImage
                                        source={{ uri: formatThumbnail(item.thumbnailUrl || item.bannerUrl) }}
                                        style={styles.relatedThumb}
                                    />
                                    <View style={styles.relatedContent}>
                                        <Text style={styles.relatedItemTitle} numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.relatedItemDate}>
                                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : '—'}
                                        </Text>
                                    </View>
                                    <Icon name="ChevronRight" size={18} color={COLORS.gray300} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Footer decoration */}
                    <View style={styles.footerLine} />
                    <Text style={styles.footerNote}>Nguồn: Cổng thông tin Đoàn thanh niên DTHU</Text>
                </View>
            </ScrollView>

            {/* Float Back Button */}
            <TouchableOpacity
                style={styles.floatBack}
                onPress={onBack}
                activeOpacity={0.8}
            >
                <Icon name="ArrowLeft" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
                style={styles.floatShare}
                onPress={() => { }}
                activeOpacity={0.8}
            >
                <Icon name="Share2" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 10, color: COLORS.gray500, fontSize: 14 },
    scrollContent: { paddingBottom: 60 },
    imageContainer: { width: width, height: 320, position: 'relative' },
    headerImage: { width: width, height: 320 },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    contentCard: {
        backgroundColor: COLORS.white,
        marginTop: -40,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingTop: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    categoryBadge: {
        backgroundColor: COLORS.primary + '12',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '20'
    },
    categoryText: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    date: { color: COLORS.gray500, fontSize: 13, fontWeight: '500' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.gray900,
        lineHeight: 34,
        marginBottom: 24,
        letterSpacing: -0.5
    },
    authorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        padding: 12,
        borderRadius: 16,
        marginBottom: 30
    },
    authorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: COLORS.gray200
    },
    authorName: { fontSize: 15, color: COLORS.gray900, fontWeight: '700' },
    authorRole: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    articleBody: { marginBottom: 30 },
    summaryText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.gray700,
        lineHeight: 28,
        marginBottom: 20,
        fontStyle: 'italic',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        paddingLeft: 16
    },
    contentText: {
        fontSize: 17,
        color: COLORS.gray800,
        lineHeight: 30,
        textAlign: 'justify'
    },
    footerLine: { height: 1, backgroundColor: COLORS.gray100, marginTop: 20, marginBottom: 16 },
    footerNote: { fontSize: 12, color: COLORS.gray400, textAlign: 'center', fontStyle: 'italic' },

    relatedSection: { marginTop: 40, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 30, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, textTransform: 'uppercase', letterSpacing: 1 },
    relatedItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: COLORS.white },
    relatedThumb: { width: 80, height: 60, borderRadius: 10, marginRight: 15 },
    relatedContent: { flex: 1, paddingRight: 10 },
    relatedItemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, lineHeight: 20, marginBottom: 4 },
    relatedItemDate: { fontSize: 12, color: COLORS.gray400 },

    errorText: { marginTop: 15, color: COLORS.gray500, fontSize: 16, textAlign: 'center' },
    backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 12 },
    backBtnText: { color: '#FFF', fontWeight: 'bold' },
    floatBack: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 44,
        left: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    floatShare: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 44,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    }
});

export default NewsDetailScreen;
