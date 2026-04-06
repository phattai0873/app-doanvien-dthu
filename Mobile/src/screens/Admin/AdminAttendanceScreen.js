import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Dimensions,
    Image as RNImage
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { meetingService } from '../../services/meetingService';
import { volunteerService } from '../../services/volunteerService';

const { width } = Dimensions.get('window');

export const AdminAttendanceScreen = ({ onBack }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('meeting'); // 'meeting' or 'activity'
    const [selectedItem, setSelectedItem] = useState(null);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, [type]);

    const loadData = async () => {
        setLoading(true);
        try {
            let data = [];
            if (type === 'meeting') {
                data = await meetingService.getMeetings({ status: 'active,scheduled' });
            } else {
                data = await volunteerService.getActivities({ status: 'in_progress,approved' });
            }
            setItems(data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowQR = (item) => {
        setSelectedItem(item);
        setQrModalVisible(true);
    };

    const handleRefreshCode = async () => {
        if (!selectedItem) return;
        try {
            let response;
            if (type === 'meeting') {
                response = await meetingService.refreshCheckinCode(selectedItem.id);
            } else {
                response = await volunteerService.refreshCheckinCode(selectedItem.id);
            }
            if (response.success || response.data) {
                const newData = response.data || response;
                setSelectedItem({ ...selectedItem, checkinCode: newData.checkinCode });
                loadData(); // Refresh list to update current item code in background
            }
        } catch (error) {
            console.error('Error refreshing code:', error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => item.checkinCode ? handleShowQR(item) : null}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Ionicons 
                    name={type === 'meeting' ? 'calendar-outline' : 'rocket-outline'} 
                    size={24} 
                    color={COLORS.primary} 
                />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemTime}>
                        {new Date(item.meetingTime || item.startDate).toLocaleString('vi-VN')}
                    </Text>
                </View>
                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Mã số:</Text>
                    <Text style={styles.codeValue}>{item.checkinCode || '---'}</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <View style={[styles.badge, item.checkinCode ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, item.checkinCode ? styles.badgeTextActive : styles.badgeTextInactive]}>
                        {item.checkinCode ? 'Có mã điểm danh' : 'Chưa mở điểm danh'}
                    </Text>
                </View>
                {item.checkinCode && (
                    <View style={styles.qrLink}>
                        <Text style={styles.qrLinkText}>Xem mã QR</Text>
                        <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const qrValue = selectedItem?.checkinCode ? 
        `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(JSON.stringify({
            type: type,
            id: selectedItem.id,
            code: selectedItem.checkinCode
        }))}` : null;

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, type === 'meeting' && styles.activeTab]}
                    onPress={() => setType('meeting')}
                >
                    <Text style={[styles.tabText, type === 'meeting' && styles.activeTabText]}>Sinh hoạt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, type === 'activity' && styles.activeTab]}
                    onPress={() => setType('activity')}
                >
                    <Text style={[styles.tabText, type === 'activity' && styles.activeTabText]}>Hoạt động</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="documents-outline" size={64} color={COLORS.gray200} />
                            <Text style={styles.emptyText}>Không có mục nào đang diễn ra</Text>
                        </View>
                    }
                />
            )}

            {/* QR Modal */}
            <Modal
                visible={qrModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setQrModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.closeBtn}
                            onPress={() => setQrModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={COLORS.gray500} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
                        <Text style={styles.modalSubtitle}>Đưa mã QR cho Đoàn viên quét điểm danh</Text>
                        
                        <View style={styles.qrContainer}>
                            {qrValue ? (
                                <RNImage
                                    source={{ uri: qrValue }}
                                    style={{ width: width * 0.6, height: width * 0.6 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text>Thiếu mã điểm danh</Text>
                            )}
                        </View>

                        <Text style={styles.qrCodeText}>{selectedItem?.checkinCode}</Text>

                        <TouchableOpacity 
                            style={styles.refreshBtn}
                            onPress={handleRefreshCode}
                        >
                            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                            <Text style={styles.refreshBtnText}>Làm mới mã điểm danh</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 4, margin: 16, marginBottom: 8, borderRadius: 12 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { fontWeight: '600', color: COLORS.gray500 },
    activeTabText: { color: COLORS.white },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
    itemTime: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
    codeContainer: { alignItems: 'flex-end' },
    codeLabel: { fontSize: 10, color: COLORS.gray400 },
    codeValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeActive: { backgroundColor: '#EBF8FF' },
    badgeInactive: { backgroundColor: '#F7FAFC' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    badgeTextActive: { color: COLORS.primary },
    badgeTextInactive: { color: COLORS.gray400 },
    qrLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    qrLinkText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.gray400, marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
    closeBtn: { alignSelf: 'flex-end', padding: 4 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, textAlign: 'center', marginTop: 8 },
    modalSubtitle: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', marginTop: 4, marginBottom: 24 },
    qrContainer: { padding: 16, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray100 },
    qrCodeText: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: 8, marginTop: 24, marginBottom: 24 },
    refreshBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.primary, 
        paddingHorizontal: 20, 
        paddingVertical: 12, 
        borderRadius: 12,
        gap: 8
    },
    refreshBtnText: { color: COLORS.white, fontWeight: '700' }
});
