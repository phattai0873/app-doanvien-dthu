import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { documentService } from '../../services/documentService';

export const DocumentListScreen = ({ onNavigate }) => {
    const [categories, setCategories] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [activeCat, setActiveCat] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, docs] = await Promise.all([
                    documentService.getDocumentCategories(),
                    documentService.getDocuments()
                ]);
                setCategories([{ id: 'all', name: 'Tất cả' }, ...cats]);
                setDocuments(docs);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredDocs = activeCat === 'all'
        ? documents
        : documents.filter(doc => doc.category_id === activeCat);

    const renderDocItem = ({ item }) => (
        <TouchableOpacity
            style={styles.docCard}
            onPress={() => onNavigate && onNavigate('document_detail', { id: item.id })}
        >
            <View style={styles.fileIconBox}>
                <Icon
                    name={item.file_type === 'pdf' ? 'FileText' : 'BookOpen'}
                    size={28}
                    color={item.file_type === 'pdf' ? '#EF4444' : '#3B82F6'}
                />
            </View>
            <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.docMeta}>{item.created_at} • {item.file_type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.downloadBtn}>
                <Icon name="Download" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Category Selector */}
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

            <FlatList
                data={filteredDocs}
                renderItem={renderDocItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="Library" size={64} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Chưa có tài liệu nào trong mục này</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    catWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    catScroll: { padding: 12, gap: 8 },
    catPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    catTextActive: { color: '#FFF', fontWeight: 'bold' },
    listContent: { padding: 16, paddingBottom: 100 },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    fileIconBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    docInfo: { flex: 1, marginLeft: 12 },
    docTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    docMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    downloadBtn: { padding: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { color: '#9CA3AF', marginTop: 16, fontSize: 14 }
});
