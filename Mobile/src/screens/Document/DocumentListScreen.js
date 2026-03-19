import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Linking,
    Alert,
    RefreshControl
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';

export const DocumentListScreen = ({ onNavigate }) => {
    const [categories, setCategories] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const member = (await authService.getCurrentUser())?.UnionMember;
            const fetchParams = {};
            if (member?.unionBranchId) fetchParams.unionBranchId = member.unionBranchId;

            const [cats, docsRes] = await Promise.all([
                documentService.getDocumentCategories(),
                documentService.getDocuments('all', fetchParams)
            ]);
            setCategories(cats || []);
            setAllDocuments(docsRes.data || docsRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleQuickOpen = async (filePath) => {
        if (!filePath) return;
        try {
            const url = `${API_BASE_URL}${filePath}`;
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể mở tài liệu này");
        }
    };

    // Filter documents by selected category
    const filteredDocs = allDocuments.filter(doc => doc.categoryId === selectedCategory?.id);

    const isImage = (path) => {
        if (!path) return false;
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => setSelectedCategory(item)}
            activeOpacity={0.7}
        >
            <View style={styles.catIconCircle}>
                <Icon name="Folder" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.catInfo}>
                <Text style={styles.catName}>{item.name}</Text>
                <Text style={styles.catCount}>
                    {allDocuments.filter(d => d.categoryId === item.id).length} tài liệu
                </Text>
            </View>
            <Icon name="ChevronRight" size={20} color={COLORS.gray300} />
        </TouchableOpacity>
    );

    const renderDocItem = ({ item }) => (
        <TouchableOpacity
            style={styles.docCard}
            onPress={() => handleQuickOpen(item.filePath)}
            onLongPress={() => onNavigate && onNavigate('document_detail', { id: item.id })}
            activeOpacity={0.7}
        >
            <View style={[
                styles.fileIconBox, 
                { backgroundColor: isImage(item.filePath) ? '#F0FDF4' : (item.filePath?.endsWith('.pdf') ? '#FEF2F2' : '#EFF6FF') }
            ]}>
                <Icon
                    name={isImage(item.filePath) ? 'Image' : (item.filePath?.endsWith('.pdf') ? 'FileText' : 'File')}
                    size={24}
                    color={isImage(item.filePath) ? '#10B981' : (item.filePath?.endsWith('.pdf') ? '#EF4444' : '#3B82F6')}
                />
            </View>
            <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.docBottomRow}>
                    <Text style={styles.docMeta}>{item.issuedDate ? new Date(item.issuedDate).toLocaleDateString('vi-VN') : '—'}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.docMeta}>{item.issuingAuthority || 'Đoàn trường'}</Text>
                </View>
            </View>
            <Icon name="ExternalLink" size={18} color={COLORS.gray400} />
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {selectedCategory ? (
                <View style={styles.flex1}>
                    <View style={styles.listHeader}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedCategory(null)}>
                            <Icon name="ArrowLeft" size={20} color={COLORS.gray700} />
                        </TouchableOpacity>
                        <View style={styles.headerTitles}>
                            <Text style={styles.headerSubtitle}>Chuyên mục</Text>
                            <Text style={styles.headerMainTitle}>{selectedCategory.name}</Text>
                        </View>
                    </View>

                    <FlatList
                        data={filteredDocs}
                        renderItem={renderDocItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Icon name="Library" size={64} color="#E5E7EB" />
                                <Text style={styles.emptyText}>Chưa có tài liệu nào trong mục này</Text>
                            </View>
                        }
                    />
                </View>
            ) : (
                <View style={styles.flex1}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.categoryHeaderTitle}>Kho Tài liệu</Text>
                        <Text style={styles.categoryHeaderSub}>Sắp xếp theo chuyên mục</Text>
                    </View>
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.categoryListContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Icon name="FolderPlus" size={64} color="#E5E7EB" />
                                <Text style={styles.emptyText}>Chưa có chuyên mục tài liệu nào</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex1: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Category Styles
    categoryHeader: { padding: 24, paddingTop: 30, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    categoryHeaderTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray900 },
    categoryHeaderSub: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
    categoryListContent: { padding: 16 },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    catIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    catInfo: { flex: 1 },
    catName: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray900 },
    catCount: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },

    // Document List Styles
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitles: { flex: 1 },
    headerSubtitle: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
    headerMainTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, marginTop: 2 },

    listContent: { padding: 16, paddingBottom: 100 },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    fileIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    docInfo: { flex: 1, marginLeft: 14 },
    docTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, lineHeight: 20 },
    docBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    docMeta: { fontSize: 12, color: COLORS.gray500 },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.gray300, marginHorizontal: 8 },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { color: COLORS.gray400, marginTop: 16, fontSize: 14, fontWeight: '500' }
});

export default DocumentListScreen;
