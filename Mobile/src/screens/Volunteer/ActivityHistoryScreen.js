import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { volunteerService } from '../../services/volunteerService';

export const ActivityHistoryScreen = ({ onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const data = await volunteerService.getMyHistory();
            setHistory(data.data || data);
        } catch (error) {
            console.error('Fetch history error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item }) => {
        const date = item.Activity?.startDate ? new Date(item.Activity.startDate).toLocaleDateString('vi-VN') : '...';
        const isPresent = item.attendanceStatus === 'PRESENT';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="Compass" size={20} color={COLORS.primary} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.title} numberOfLines={1}>{item.Activity?.title || 'Hoạt động'}</Text>
                        <Text style={styles.dateText}>{date}</Text>
                    </View>
                    <View style={[styles.statusBadge, isPresent ? styles.presentBadge : styles.absentBadge]}>
                        <Text style={[styles.statusText, isPresent ? styles.presentText : styles.absentText]}>
                            {isPresent ? 'ĐÃ THAM GIA' : 'VẮNG MẶT'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Icon name="MapPin" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>{item.Activity?.location || 'Không rõ địa điểm'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="Briefcase" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>Ngày CTXH: {item.Activity?.socialWorkDays || 0} ngày</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
                        <Text style={styles.headerSubtitle}>Danh sách các hoạt động bạn đã đăng ký tham gia.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="History" size={64} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Bạn chưa tham gia hoạt động nào</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 40 },
    listHeader: { marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    headerInfo: { flex: 1, marginLeft: 12 },
    title: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    dateText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    presentBadge: { backgroundColor: '#ECFDF5' },
    absentBadge: { backgroundColor: '#FEF2F2' },
    statusText: { fontSize: 10, fontWeight: '800' },
    presentText: { color: '#10B981' },
    absentText: { color: '#EF4444' },
    cardBody: { gap: 8, paddingLeft: 32 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 13, color: '#64748B' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 16 }
});
