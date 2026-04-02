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
    Platform,
    Share,
    Alert,
    KeyboardAvoidingView,
    TextInput,
    Keyboard,
    Pressable
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { newsService } from '../../services/newsService';
import { API_BASE_URL, USE_MOCK_API } from '../../services/api';
import { decodeHtml, formatViews } from '../../utils/helpers';

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

    // Comment states
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { id, username }
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleLike = async () => {
        if (!news) return;
        const previousState = { ...news };
        
        // Optimistic UI update
        const newIsLiked = !news.isLiked;
        const newLikesCount = news.likesCount + (newIsLiked ? 1 : -1);
        
        setNews(prev => ({
            ...prev,
            isLiked: newIsLiked,
            likesCount: Math.max(0, newLikesCount)
        }));

        try {
            if (newIsLiked) {
                await newsService.likeNews(id);
            } else {
                await newsService.unlikeNews(id);
            }
        } catch (error) {
            console.error("Like error:", error);
            // Rollback on error
            setNews(previousState);
            Alert.alert("Lỗi", "Không thể thực hiện tương tác này. Vui lòng thử lại sau.");
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = `${API_BASE_URL.replace('/api', '')}/news/${id}`; // Giả định domain web
            const result = await Share.share({
                message: `${news.title}\nXem chi tiết tại: ${shareUrl}`,
                url: shareUrl,
                title: news.title
            });

            if (result.action === Share.sharedAction) {
                await newsService.shareNews(id);
                setNews(prev => ({ ...prev, sharesCount: (prev.sharesCount || 0) + 1 }));
            }
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    // ==================== COMMENT LOGIC ====================

    const fetchComments = async () => {
        if (!id) return;
        setCommentsLoading(true);
        try {
            const res = await newsService.getComments(id);
            // res = { success: true, data: [...], pagination: {...} }
            setComments(res.data || []);
        } catch (error) {
            console.error("Fetch comments error:", error);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await newsService.createComment(id, commentText, replyingTo?.id);
            if (res.success) {
                setCommentText('');
                setReplyingTo(null);
                Keyboard.dismiss();
                // Refresh list
                fetchComments();
            }
        } catch (error) {
            Alert.alert("Lỗi", error.response?.data?.message || "Không thể gửi bình luận");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            const res = await newsService.likeComment(commentId);
            if (res.success) {
                // Update local state
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return { ...c, isLiked: res.data.isLiked, likesCount: res.data.likesCount };
                    }
                    // Check replies if any
                    if (c.Replies) {
                        const updatedReplies = c.Replies.map(r => 
                            r.id === commentId ? { ...r, isLiked: res.data.isLiked, likesCount: res.data.likesCount } : r
                        );
                        return { ...c, Replies: updatedReplies };
                    }
                    return c;
                }));
            }
        } catch (error) {
            console.error("Like comment error:", error);
        }
    };

    const handleReportComment = (commentId) => {
        Alert.prompt(
            "Báo cáo vi phạm",
            "Lý do báo cáo bình luận này:",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Gửi", 
                    onPress: async (reason) => {
                        try {
                            await newsService.reportComment(commentId, reason);
                            Alert.alert("Thành công", "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ sớm xử lý.");
                        } catch (error) {
                            Alert.alert("Lỗi", error.response?.data?.message || "Không thể gửi báo cáo");
                        }
                    } 
                }
            ]
        );
    };

    const toggleReplies = async (parentComment) => {
        // Nếu đã load rồi thì thôi (hoặc có thể toggle ẩn/hiện)
        if (parentComment.showReplies) {
            setComments(prev => prev.map(c => c.id === parentComment.id ? { ...c, showReplies: false } : c));
            return;
        }

        try {
            const replies = await newsService.getReplies(parentComment.id);
            setComments(prev => prev.map(c => 
                c.id === parentComment.id ? { ...c, Replies: replies, showReplies: true } : c
            ));
        } catch (error) {
            console.error("Load replies error:", error);
        }
    };

    const handleDeleteComment = (commentId) => {
        Alert.alert(
            "Xóa bình luận",
            "Bạn có chắc muốn xóa bình luận này?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await newsService.deleteComment(commentId);
                            fetchComments(); // Reload to see "Bình luận đã bị xóa"
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa bình luận");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch main news detail
                const res = await newsService.getNewsDetail(id);

                // Backend trả về { success: true, data: { ...news } }
                const actualData = res?.data || res;

                if (actualData) {
                    setNews({
                        ...actualData,
                        thumbnailUrl: formatThumbnail(actualData.bannerUrl || actualData.thumbnailUrl),
                        publishedAtDisplay: actualData.publishedAt ? new Date(actualData.publishedAt).toLocaleDateString('vi-VN') : '—',
                        decodedSummary: decodeHtml(actualData.summary),
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
        fetchComments();
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

                    {/* Interaction Bar */}
                    <View style={styles.interactionBar}>
                        <TouchableOpacity style={styles.interactionBtn} onPress={handleLike}>
                            <Icon 
                                name={news.isLiked ? "HeartFilled" : "Heart"} 
                                size={22} 
                                color={news.isLiked ? COLORS.error : COLORS.gray500} 
                            />
                            <Text style={[styles.interactionText, news.isLiked && { color: COLORS.error }]}>
                                {news.likesCount || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.interactionBtn} onPress={handleShare}>
                            <Icon name="Share2" size={22} color={COLORS.gray500} />
                            <Text style={styles.interactionText}>{news.sharesCount || 0}</Text>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }} />
                        
                        <View style={styles.viewCount}>
                            <Icon name="Eye" size={16} color={COLORS.gray400} />
                            <Text style={styles.viewCountText}>{formatViews(news.viewsCount || 0)}</Text>
                        </View>
                    </View>
 
                    {/* Comment Section */}
                    <View style={styles.commentSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionDot} />
                            <Text style={styles.sectionTitle}>Bình luận</Text>
                        </View>
 
                        {commentsLoading ? (
                            <View style={styles.commentLoading}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.loadingTextSm}>Đang tải bình luận...</Text>
                            </View>
                        ) : comments.length === 0 ? (
                            <View style={styles.emptyComments}>
                                <Icon name="MessageSquare" size={40} color={COLORS.gray200} />
                                <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy trở thành người đầu tiên!</Text>
                            </View>
                        ) : (
                            <View>
                                {comments.map(comment => renderCommentItem(comment))}
                            </View>
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

            {/* Comment Input Bar */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <View style={[styles.commentInputContainer, replyingTo && styles.commentInputReplying]}>
                    {replyingTo && (
                        <View style={styles.replyingBar}>
                            <Text style={styles.replyingText} numberOfLines={1}>
                                Trả lời <Text style={{ fontWeight: 'bold' }}>@{replyingTo.username}</Text>
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Icon name="X" size={16} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={replyingTo ? "Viết phản hồi..." : "Viết bình luận..."}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                                maxLength={500}
                            />
                        </View>
                        <TouchableOpacity 
                            style={[styles.sendBtn, (!commentText.trim() || isSubmitting) && styles.sendBtnDisabled]} 
                            onPress={handleSendComment}
                            disabled={!commentText.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Icon name="Send" size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

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
                onPress={handleShare}
                activeOpacity={0.8}
            >
                <Icon name="Share2" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    function renderCommentItem(comment, isReply = false) {
        return (
            <View key={comment.id} style={[styles.commentItem, isReply && styles.replyItem]}>
                <RNImage 
                    source={comment.User?.avatar ? { uri: formatThumbnail(comment.User.avatar) } : require('../../assets/images/default-avatar.png')} 
                    style={isReply ? styles.replyAvatar : styles.commentAvatar} 
                />
                <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{comment.User?.username || 'Người dùng'}</Text>
                        <Text style={styles.commentTime}>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}</Text>
                    </View>
                    
                    <Pressable 
                        onLongPress={() => handleReportComment(comment.id)}
                        onPress={() => {
                            // Double tap logic simple implementation
                            const now = Date.now();
                            if (this.lastTap && (now - this.lastTap) < 300) {
                                handleLikeComment(comment.id);
                            }
                            this.lastTap = now;
                        }}
                    >
                        <Text style={[styles.commentContent, comment.isDeleted && styles.deletedContent]}>
                            {comment.content}
                        </Text>
                    </Pressable>

                    <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLikeComment(comment.id)}>
                            <Icon 
                                name={comment.isLiked ? "HeartFilled" : "Heart"} 
                                size={14} 
                                color={comment.isLiked ? COLORS.error : COLORS.gray400} 
                            />
                            <Text style={[styles.actionText, comment.isLiked && { color: COLORS.error }]}>
                                {comment.likesCount > 0 ? comment.likesCount : 'Thích'}
                            </Text>
                        </TouchableOpacity>

                        {!isReply && !comment.isDeleted && (
                            <TouchableOpacity 
                                style={styles.actionBtn} 
                                onPress={() => {
                                    setReplyingTo({ id: comment.id, username: comment.User?.username });
                                    // Scroll to input would be nice here
                                }}
                            >
                                <Icon name="MessageSquare" size={14} color={COLORS.gray400} />
                                <Text style={styles.actionText}>Trả lời</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleReportComment(comment.id)}>
                            <Text style={styles.actionText}>Báo cáo</Text>
                        </TouchableOpacity>

                        {/* Nếu là user của mình thì hiện nút xóa (Giả định userId khớp, cần auth context thực tế) */}
                        {/* {comment.userId === currentUserId && (
                             <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteComment(comment.id)}>
                                <Text style={[styles.actionText, {color: COLORS.error}]}>Xóa</Text>
                            </TouchableOpacity>
                        )} */}
                    </View>

                    {/* Replies mapping */}
                    {!isReply && comment.repliesCount > 0 && !comment.showReplies && (
                        <TouchableOpacity style={styles.showRepliesBtn} onPress={() => toggleReplies(comment)}>
                            <View style={styles.replyLine} />
                            <Text style={styles.showRepliesText}>Xem {comment.repliesCount} câu trả lời</Text>
                        </TouchableOpacity>
                    )}

                    {comment.showReplies && comment.Replies && (
                        <View style={styles.repliesList}>
                            {comment.Replies.map(reply => renderCommentItem(reply, true))}
                        </View>
                    )}
                </View>
            </View>
        );
    }
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
    },

    interactionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.gray100,
        marginBottom: 10
    },
    interactionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
        gap: 8
    },
    interactionText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.gray600
    },
    viewCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    viewCountText: {
        fontSize: 13,
        color: COLORS.gray400,
        fontWeight: '500'
    },

    // Comment Styles
    commentSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100
    },
    commentLoading: { padding: 30, alignItems: 'center' },
    loadingTextSm: { fontSize: 13, color: COLORS.gray400, marginTop: 8 },
    emptyComments: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    
    commentItem: { flexDirection: 'row', marginBottom: 24 },
    replyItem: { marginTop: 16, marginBottom: 0 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100 },
    replyAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray100 },
    commentBody: { flex: 1, marginLeft: 12 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    commentUser: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginRight: 8 },
    commentTime: { fontSize: 11, color: COLORS.gray400 },
    commentContent: { fontSize: 15, color: COLORS.gray700, lineHeight: 22 },
    deletedContent: { fontStyle: 'italic', color: COLORS.gray400 },
    
    commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20, gap: 4 },
    actionText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
    
    showRepliesBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    replyLine: { width: 24, height: 1, backgroundColor: COLORS.gray200, marginRight: 10 },
    showRepliesText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
    repliesList: { marginTop: 10 },

    commentInputContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    commentInputReplying: { borderTopWidth: 0 },
    replyingBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: COLORS.gray50, 
        paddingHorizontal: 12, 
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8
    },
    replyingText: { fontSize: 12, color: COLORS.gray600 },
    
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    inputWrapper: { 
        flex: 1, 
        backgroundColor: COLORS.gray100, 
        borderRadius: 20, 
        paddingHorizontal: 16, 
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        maxHeight: 100
    },
    textInput: { fontSize: 15, color: COLORS.gray800, padding: 0 },
    sendBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: COLORS.primary, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    sendBtnDisabled: { backgroundColor: COLORS.gray300 }
});

export default NewsDetailScreen;
