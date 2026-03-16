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
import { SIZES } from '../../constants/sizes';
import { meetingService } from '../../services/meetingService';
import { authService } from '../../services/authService';

export const MeetingListScreen = ({ onNavigate }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            
            // Define fetch parameters based on user's affiliation
            const fetchParams = {};
            if (currentUser && currentUser.UnionMember) {
                const member = currentUser.UnionMember;
                if (member.unionCellId) fetchParams.unionCellId = member.unionCellId;
                
                const branchId = member.unionBranchId || member.UnionCell?.unionBranchId;
                if (branchId) fetchParams.unionBranchId = branchId;
            }

            const rawData = await meetingService.getMeetings(fetchParams);
            
            const mappedData = rawData.map(m => {
                const date = new Date(m.meetingTime);
                const dateStr = date.toLocaleDateString('vi-VN');
                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                
                // Map status from Backend (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED) to UI
                let statusKey = 'scheduled';
                if (m.status === 'IN_PROGRESS') statusKey = 'active';
                else if (m.status === 'COMPLETED') statusKey = 'finished';
                else if (m.status === 'CANCELLED') statusKey = 'cancelled';
                else if (m.status === 'SCHEDULED') statusKey = 'scheduled';

                return {
                    ...m,
                    status: statusKey,
                    start_time: `${dateStr} - ${timeStr}`,
                    locationName: m.Location?.name || 'Phòng họp trực tuyến'
                };
            });

            setMeetings(mappedData);
        } catch (error) {
            console.error('Error fetching meetings:', error);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return '#3B82F6';
            case 'active': return '#10B981';
            case 'finished': return '#6B7280';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Sắp diễn ra';
            case 'active': return 'Đang diễn ra';
            case 'finished': return 'Đã kết thúc';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onNavigate && onNavigate('meeting_detail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
                <Text style={styles.timeText}>{item.start_time?.split(' - ')[1] || '...'}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.infoRow}>
                <Icon name="Clock" size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>{item.start_time?.split(' - ')[0] || '...'}</Text>
            </View>

            <View style={styles.infoRow}>
                <Icon name="MapPin" size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>{item.locationName || 'Chưa xác định'}</Text>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.attendeeInfo}>
                    <Icon name="Users" size={14} color="#6B7280" />
                    <Text style={styles.attendeeText}>
                        Đoàn viên tham gia: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{item.attendance_count || 0}/{item.total_members || 0}</Text>
                    </Text>
                </View>
                <Icon name="ChevronRight" size={20} color="#D1D5DB" />
            </View>
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
            <FlatList
                data={meetings}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="Calendar" size={64} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Chưa có lịch họp nào</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    listContent: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB',
    },
    attendeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendeeText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    }
});
