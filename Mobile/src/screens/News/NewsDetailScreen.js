import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import { API_BASE_URL } from '../../services/api';

const { width } = Dimensions.get('window');

export const NewsDetailScreen = ({ route, onBack }) => {
    const { id } = route?.params || {};
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // In a real app, we'd call newsService.getNewsById(id)
                // For now, let's fetch all news and find the one with the matching id
                const res = await newsService.getNews();
                const rawNews = res.data || (Array.isArray(res) ? res : []);
                const found = rawNews.find(item => item.id == id);
                
                if (found) {
                    setNews({
                        ...found,
                        thumbnailUrl: found.bannerUrl || found.thumbnailUrl
                            ? `${API_BASE_URL}${found.bannerUrl || found.thumbnailUrl}`
                            : null,
                        publishedAt: found.publishedAt ? new Date(found.publishedAt).toLocaleDateString('vi-VN') : '—'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch news detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!news) {
        return (
            <View style={styles.center}>
                <Icon name="AlertTriangle" size={48} color={COLORS.gray300} />
                <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {news.thumbnailUrl ? (
                    <Image source={{ uri: news.thumbnailUrl }} style={styles.headerImage} />
                ) : (
                    <View style={[styles.headerImage, { backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' }]}>
                        <Icon name="Image" size={40} color={COLORS.gray300} />
                    </View>
                )}

                <View style={styles.content}>
                    <View style={styles.badgeRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{news.NewsCategory?.name || 'TIN TỨC'}</Text>
                        </View>
                        <Text style={styles.date}>{news.publishedAt}</Text>
                    </View>

                    <Text style={styles.title}>{news.title}</Text>
                    
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Icon name="User" size={16} color={COLORS.gray500} />
                        </View>
                        <Text style={styles.authorName}>Ban Thường vụ Đoàn trường</Text>
                    </View>

                    <View style={styles.article}>
                        <Text style={styles.summary}>{news.summary}</Text>
                        <Text style={styles.body}>{news.content || "Nội dung bài viết đang được cập nhật..."}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Float Back Button */}
            <TouchableOpacity style={styles.floatBack} onPress={onBack}>
                <Icon name="ArrowLeft" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    headerImage: { width: width, height: 280 },
    content: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFF', marginTop: -30 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    categoryBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    categoryText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
    date: { color: COLORS.gray400, fontSize: 13 },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.gray900, lineHeight: 30, marginBottom: 15 },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    authorName: { fontSize: 14, color: COLORS.gray700, fontWeight: '600' },
    article: { borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 20 },
    summary: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, lineHeight: 24, marginBottom: 15, fontStyle: 'italic' },
    body: { fontSize: 16, color: COLORS.gray700, lineHeight: 26 },
    errorText: { marginTop: 15, color: COLORS.gray500, fontSize: 16 },
    backBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: 'bold' },
    floatBack: { 
        position: 'absolute', 
        top: Platform.OS === 'ios' ? 50 : 40, 
        left: 20, 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        alignItems: 'center', 
        justifyContent: 'center' 
    }
});
