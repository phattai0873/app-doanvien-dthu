import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { volunteerService } from '../../services/volunteerService';

export const VolunteerListScreen = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const data = await volunteerService.getActivities();
            setActivities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRegister = (activity) => {
        Alert.alert(
            'Đăng ký tham gia',
            `Đồng chí muốn đăng ký tham gia hoạt động "${activity.title}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng ký',
                    onPress: async () => {
                        try {
                            await volunteerService.register(activity.id);
                            Alert.alert('Thành công', 'Đã gửi yêu cầu đăng ký tham gia.');
                            fetchData();
                        } catch (e) {
                            Alert.alert('Lỗi', 'Đăng ký thất bại. Vui lòng thử lại sau.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.statusBox}>
                    <Icon name="Compass" size={24} color={COLORS.primary} />
                    <View style={styles.statusInfo}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <View style={styles.metaRow}>
                            <Icon name="MapPin" size={12} color="#9CA3AF" />
                            <Text style={styles.metaText}>{item.location}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

                <View style={[styles.infoLine, { marginTop: 12 }]}>
                    <Icon name="Time" size={14} color="#6B7280" />
                    <Text style={styles.infoText}>Bắt đầu: {item.start_time}</Text>
                </View>

                <View style={styles.participantInfo}>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${(item.registered_count / item.max_participants) * 100}%` }
                            ]}
                        />
                    </View>
                    <View style={styles.participantRow}>
                        <Text style={styles.participantText}>Đã đăng ký: {item.registered_count}/{item.max_participants}</Text>
                        <Text style={styles.statusLabel}>{item.status === 'open' ? 'Đang nhận' : 'Đã đóng'}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.actionBtn, item.status !== 'open' && styles.disabledBtn]}
                disabled={item.status !== 'open'}
                onPress={() => handleRegister(item)}
            >
                <Text style={styles.actionBtnText}>
                    {item.status === 'open' ? 'ĐĂNG KÝ THAM GIA' : 'HẾT HẠN / ĐỦ NGƯỜI'}
                </Text>
            </TouchableOpacity>
        </View>
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
            <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.headerTitle}>Hành động cộng đồng</Text>
                        <Text style={styles.headerSubtitle}>Tham gia các hoạt động thiện nguyện để lan tỏa tinh thần Đảng viên.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 100 },
    listHeader: { marginBottom: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    statusBox: { flexDirection: 'row', alignItems: 'center' },
    statusInfo: { marginLeft: 16, flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
    cardBody: { padding: 16 },
    description: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
    infoLine: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 12, color: '#6B7280', marginLeft: 8 },
    participantInfo: { marginTop: 16 },
    progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
    participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    participantText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    statusLabel: { fontSize: 10, fontWeight: 'bold', color: '#10B981', textTransform: 'uppercase' },
    actionBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
    disabledBtn: { backgroundColor: '#D1D5DB' }
});
