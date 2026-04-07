import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { notificationService } from '../../services/notificationService';
import CommonHeader from '../../components/CommonHeader';

const getCategoryIcon = (category) => {
    switch (category) {
        case 'SYSTEM': return { name: 'Bell', color: '#6366F1', bg: '#EEF2FF' };
        case 'ACTIVITY': return { name: 'Users', color: '#F59E0B', bg: '#FFFBEB' };
        case 'MEETING': return { name: 'CalendarClock', color: '#10B981', bg: '#ECFDF5' };
        case 'FEE': return { name: 'Wallet', color: '#F43F5E', bg: '#FFF1F2' };
        case 'DOCUMENT': return { name: 'FileText', color: '#3B82F6', bg: '#EFF6FF' };
        default: return { name: 'Info', color: '#94A3B8', bg: '#F1F5F9' };
    }
};

export const NotificationScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRef = false) => {
        if (!isRef) setLoading(true);
        try {
            const res = await notificationService.getNotifications();
            setNotifications(res.data || res || []);
        } catch (error) {
            console.log('Fetch notifications error:', error);
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
        fetchData(true);
    };

    const handleNotifPress = async (item) => {
        // Mark as read
        if (!item.isRead) {
            try {
                await notificationService.markAsRead(item.id);
                setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.log('Failed to mark as read', err);
            }
        }

        // Deep linking logic based on entityType
        const { entityType, entityId, category } = item;

        if (entityType === 'meeting' || category === 'MEETING') {
            navigation.navigate('MeetingList');
        } else if (entityType === 'fee' || category === 'FEE') {
            navigation.navigate('FeePayment');
        } else if (entityType === 'document' || category === 'DOCUMENT') {
            navigation.navigate('DocumentList');
        } else if (entityType === 'exam') {
            navigation.navigate('ExamList');
        } else if (entityType === 'member' || entityType === 'approval') {
            navigation.navigate('MemberInfo');
        } else if (category === 'ACTIVITY') {
            // Có thể navigate tới danh sách hoạt động nếu có
            navigation.navigate('Dashboard'); 
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <CommonHeader title="Thông báo" />
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >
                <View style={styles.infoBox}>
                    <Icon name="Info" size={20} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.infoTitle}>Bảng tin</Text>
                        <Text style={styles.infoText}>Theo dõi các cập nhật mới nhất từ Đoàn trường và đơn vị của bạn.</Text>
                    </View>
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="BellOff" size={48} color={COLORS.gray400} />
                        <Text style={styles.emptyText}>Hộp thư của bạn đang trống</Text>
                    </View>
                ) : notifications.map(item => {
                    const icon = getCategoryIcon(item.category);
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handleNotifPress(item)}
                            style={[styles.notifCard, !item.isRead && styles.notifUnread]}
                        >
                            {!item.isRead && <View style={styles.dotUnread} />}
                            <View style={styles.notifRow}>
                                <View style={[styles.notifIcon, { backgroundColor: icon.bg }]}>
                                    <Icon name={icon.name} size={20} color={icon.color} />
                                </View>
                                <View style={styles.notifContent}>
                                    <View style={styles.notifHeader}>
                                        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                                        {item.priority === 'High' && (
                                            <View style={styles.priorityBadge}>
                                                <Text style={styles.priorityText}>Quan trọng</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.notifBody} numberOfLines={2}>{item.content}</Text>
                                    <View style={styles.notifMeta}>
                                        <Text style={styles.notifTime}>
                                            {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                        </Text>
                                        {item.expiresAt && (
                                            <Text style={styles.expiresText}> • Hết hạn: {new Date(item.expiresAt).toLocaleDateString('vi-VN')}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE'
    },
    infoTitle: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 14 },
    infoText: { color: '#2563EB', fontSize: 12, marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
    notifCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    notifUnread: { backgroundColor: '#FFF', borderColor: COLORS.primary + '30', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
    dotUnread: {
        position: 'absolute', top: 18, right: 18,
        width: 10, height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary
    },
    notifRow: { flexDirection: 'row' },
    notifIcon: {
        width: 44, height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', flex: 1, paddingRight: 20 },
    priorityBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    priorityText: { color: '#E11D48', fontSize: 10, fontWeight: 'bold' },
    notifBody: { fontSize: 13, color: '#64748B', marginBottom: 8, lineHeight: 18 },
    notifMeta: { flexDirection: 'row', alignItems: 'center' },
    notifTime: { fontSize: 11, color: '#94A3B8' },
    expiresText: { fontSize: 11, color: '#E11D48', fontWeight: '500' },
});
