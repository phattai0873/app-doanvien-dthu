import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';

export const CellManagementScreen = () => {
    const [cells, setCells] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCells();
    }, []);

    const loadCells = async () => {
        setLoading(true);
        try {
            const data = await partyService.getCells();
            setCells(data || []);
        } catch (error) {
            console.error('Error loading cells:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách chi đoàn');
        } finally {
            setLoading(false);
        }
    };

    const filteredCells = cells.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.cellCard}>
            <View style={styles.cellIcon}>
                <Ionicons name="business" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cellInfo}>
                <Text style={styles.cellName}>{item.name}</Text>
                <Text style={styles.cellCode}>Mã: {item.code}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={14} color={COLORS.gray500} />
                        <Text style={styles.statText}>{item.memberCount || 0} đoàn viên</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray500} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc mã chi đoàn..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCells}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không tìm thấy chi đoàn nào</Text>
                        </View>
                    }
                />
            )}
            
            <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Thông báo', 'Tính năng tạo chi đoàn mới sẽ được cập nhật sau.')}>
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        margin: SIZES.md,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd,
        elevation: 2,
    },
    searchInput: { flex: 1, marginLeft: SIZES.sm, fontSize: SIZES.fontMd },
    listContent: { padding: SIZES.md, paddingBottom: 100 },
    cellCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.md,
        marginBottom: SIZES.md,
        alignItems: 'center',
        elevation: 1,
    },
    cellIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.md,
    },
    cellInfo: { flex: 1 },
    cellName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.black },
    cellCode: { fontSize: SIZES.fontSm, color: COLORS.gray500, marginTop: 2 },
    statsRow: { flexDirection: 'row', marginTop: 8, gap: SIZES.md },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: SIZES.fontXs, color: COLORS.gray600 },
    actionButton: { padding: SIZES.xs },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.gray500, fontSize: SIZES.fontMd },
    fab: {
        position: 'absolute',
        bottom: SIZES.xl,
        right: SIZES.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    }
});
