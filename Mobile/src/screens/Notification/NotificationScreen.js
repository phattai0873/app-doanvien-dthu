import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { notificationService } from '../../services/notificationService';

export const NotificationScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await notificationService.getNotifications();
                setNotifications(data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoBox}>
                <Icon name="Info" size={20} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.infoTitle}>Lưu ý</Text>
                    <Text style={styles.infoText}>Đây là các thông báo nhắc việc. Tin tức xem tại Bản tin.</Text>
                </View>
            </View>

            {notifications.map(item => (
                <View key={item.id} style={[styles.notifCard, !item.is_read && styles.notifUnread]}>
                    {!item.is_read && <View style={styles.dotUnread} />}
                    <View style={styles.notifRow}>
                        <View style={[styles.notifIcon, item.loai_thong_bao === 'meeting' ? styles.bgRedLight : styles.bgBlueLight]}>
                            <Icon
                                name={item.loai_thong_bao === 'meeting' ? 'Users' : 'Wallet'}
                                size={20}
                                color={item.loai_thong_bao === 'meeting' ? COLORS.primary : '#2563EB'}
                            />
                        </View>
                        <View style={styles.notifContent}>
                            <Text style={styles.notifTitle}>{item.title}</Text>
                            <View style={styles.notifMeta}>
                                <Text style={styles.notifSender}>{item.nguoi_gui_ten}</Text>
                                <Text style={styles.notifTime}>• {item.thoi_gian_gui}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: '#F9FAFB' },
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
    notifCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    notifUnread: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
    dotUnread: {
        position: 'absolute', top: 12, right: 12,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary
    },
    notifRow: { flexDirection: 'row' },
    notifIcon: {
        width: 40, height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    bgRedLight: { backgroundColor: '#FEE2E2' },
    bgBlueLight: { backgroundColor: '#DBEAFE' },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    notifMeta: { flexDirection: 'row', alignItems: 'center' },
    notifSender: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    notifTime: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
});
