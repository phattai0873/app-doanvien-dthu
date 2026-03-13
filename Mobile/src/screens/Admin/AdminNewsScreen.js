import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    Dimensions,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

const { width } = Dimensions.get('window');

const MOCK_NEWS = [
    { id: '1', tieu_de: 'Khai mạc Đại hội Đoàn năm 2026', trang_thai: 'published', ngay_dang: '10/03/2026', luot_xem: 245 },
    { id: '2', tieu_de: 'Thông báo kết quả thi nghiệp vụ Đoàn viên', trang_thai: 'published', ngay_dang: '09/03/2026', luot_xem: 183 },
    { id: '3', tieu_de: 'Lịch sinh hoạt Chi đoàn tháng 3/2026', trang_thai: 'draft', ngay_dang: '08/03/2026', luot_xem: 0 },
    { id: '4', tieu_de: 'Chiến dịch tình nguyện mùa hè xanh 2026', trang_thai: 'draft', ngay_dang: '07/03/2026', luot_xem: 0 },
];

const STATUS_MAP = {
    published: { label: 'Đã đăng', bg: '#C6F6D5', color: '#22543D' },
    draft: { label: 'Nháp', bg: '#EDF2F7', color: '#4A5568' },
};

function NewsFormModal({ visible, news, onClose, onSave }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (news) {
            setTitle(news.tieu_de || '');
            setContent(news.noi_dung || '');
        } else {
            setTitle('');
            setContent('');
        }
    }, [news, visible]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modal}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={COLORS.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{news ? 'Chỉnh sửa tin' : 'Đăng tin mới'}</Text>
                    <TouchableOpacity onPress={() => onSave({ tieu_de: title, noi_dung: content })}>
                        <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 15 }}>Lưu</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={{ flex: 1, padding: SIZES.md }}>
                    <Text style={styles.inputLabel}>Tiêu đề *</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Nhập tiêu đề bài viết..."
                        value={title}
                        onChangeText={setTitle}
                        multiline
                    />
                    <Text style={styles.inputLabel}>Nội dung *</Text>
                    <TextInput
                        style={[styles.inputField, { minHeight: 200, textAlignVertical: 'top' }]}
                        placeholder="Nhập nội dung bài viết..."
                        value={content}
                        onChangeText={setContent}
                        multiline
                    />
                </ScrollView>
            </View>
        </Modal>
    );
}

import { newsService } from '../../services/newsService';

export const AdminNewsScreen = ({ onNavigate }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await newsService.getNews();
            // Backend trả về list bài viết (không lọc theo scope ở đây để admin thấy hết hoặc lọc theo branch)
            setNews(data || []);
        } catch (error) {
            console.error('Error fetching admin news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            const newsData = {
                title: data.tieu_de,
                content: data.noi_dung,
                // Mặc định scope là unit nếu admin Khoa đăng
            };
            
            if (editingItem) {
                await newsService.updateNews(editingItem.id, newsData);
                Alert.alert('Thành công', 'Đã cập nhật bài viết');
            } else {
                await newsService.createNews(newsData);
                Alert.alert('Thành công', 'Đã thêm bài viết mới');
            }
            fetchNews();
            setFormVisible(false);
            setEditingItem(null);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu bài viết');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Xóa bài viết', `Xóa "${item.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            { 
                text: 'Xóa', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        // Cần thêm delete method vào newsService
                        await newsService.deleteNews(item.id);
                        fetchNews();
                    } catch (e) {
                        Alert.alert('Lỗi', 'Không thể xóa bài viết');
                    }
                } 
            }
        ]);
    };

    const togglePublish = async (item) => {
        try {
            if (item.status === 'Đã đăng') {
                await newsService.unpublishNews(item.id);
            } else {
                await newsService.publishNews(item.id);
            }
            fetchNews();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thay đổi trạng thái bài viết');
        }
    };

    const STATUS_MAP = {
        'Đã đăng': { label: 'Đã đăng', bg: '#C6F6D5', color: '#22543D' },
        'Nháp': { label: 'Nháp', bg: '#EDF2F7', color: '#4A5568' },
    };

    const filtered = news.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const st = STATUS_MAP[item.status] || STATUS_MAP['Nháp'];
        return (
            <View style={styles.newsCard}>
                <View style={styles.newsCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Text style={styles.newsDate}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : 'Chưa đăng'}</Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.newsStats}>
                    <View style={styles.statChip}>
                        <Ionicons name="eye-outline" size={13} color={COLORS.gray500} />
                        <Text style={styles.statChipText}>0</Text> 
                    </View>
                </View>
                <View style={styles.newsActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => togglePublish(item)}>
                        <Ionicons name={item.status === 'Đã đăng' ? 'archive-outline' : 'send-outline'} size={16} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>{item.status === 'Đã đăng' ? 'Gỡ xuống' : 'Đăng bài'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingItem(item); setFormVisible(true); }}>
                        <Ionicons name="pencil-outline" size={16} color={COLORS.gray600} />
                        <Text style={[styles.actionBtnText, { color: COLORS.gray600 }]}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                        <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search & Add */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={16} color={COLORS.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm tin tức..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingItem(null); setFormVisible(true); }}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{news.filter(n => n.trang_thai === 'published').length}</Text>
                    <Text style={styles.miniStatLabel}>Đã đăng</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{news.filter(n => n.trang_thai === 'draft').length}</Text>
                    <Text style={styles.miniStatLabel}>Nháp</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{news.reduce((s, n) => s + (n.luot_xem || 0), 0)}</Text>
                    <Text style={styles.miniStatLabel}>Lượt xem</Text>
                </View>
            </View>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: SIZES.md, paddingBottom: 100 }}
                ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="newspaper-outline" size={40} color={COLORS.gray300} /><Text style={styles.emptyText}>Chưa có tin tức nào</Text></View>}
            />

            <NewsFormModal
                visible={formVisible}
                news={editingItem}
                onClose={() => setFormVisible(false)}
                onSave={handleSave}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    toolbar: { flexDirection: 'row', alignItems: 'center', padding: SIZES.md, gap: 10 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.sm, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.gray200 },
    searchInput: { flex: 1, marginLeft: SIZES.xs, fontSize: SIZES.fontMd, color: COLORS.textPrimary },
    addBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, justifyContent: 'space-around', borderWidth: 1, borderColor: COLORS.gray200 },
    miniStat: { alignItems: 'center', flex: 1 },
    miniStatValue: { fontSize: SIZES.fontXl, fontWeight: '800', color: COLORS.primary },
    miniStatLabel: { fontSize: SIZES.fontXs, color: COLORS.gray500, marginTop: 2 },
    miniStatDivider: { width: 1, backgroundColor: COLORS.gray200 },
    newsCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.gray200, elevation: 1 },
    newsCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xs },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: SIZES.radiusFull },
    statusText: { fontSize: SIZES.fontXs, fontWeight: 'bold' },
    newsDate: { fontSize: SIZES.fontXs, color: COLORS.gray400 },
    newsTitle: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 22, marginBottom: SIZES.xs },
    newsStats: { flexDirection: 'row', marginBottom: SIZES.sm },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statChipText: { fontSize: SIZES.fontXs, color: COLORS.gray500 },
    newsActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: SIZES.sm, gap: 4 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
    actionBtnText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { color: COLORS.gray400, fontSize: SIZES.fontMd },
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray200, backgroundColor: COLORS.white },
    modalTitle: { fontSize: SIZES.fontLg, fontWeight: '800', color: COLORS.textPrimary },
    inputLabel: { fontSize: SIZES.fontSm, fontWeight: '700', color: COLORS.gray700, marginBottom: SIZES.xs, marginTop: SIZES.md },
    inputField: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.gray200, borderRadius: SIZES.radiusMd, padding: SIZES.md, fontSize: SIZES.fontMd, color: COLORS.textPrimary },
});
