import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';
import CommonHeader from '../../components/CommonHeader';

const DiffItem = ({ label, oldVal, newVal }) => {
    if (oldVal === newVal) return null;
    return (
        <View style={styles.diffItem}>
            <Text style={styles.diffLabel}>{label}</Text>
            <View style={styles.diffRow}>
                <View style={styles.diffOld}>
                    <Text style={styles.diffOldText}>{oldVal || '(Trống)'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={COLORS.gray400} />
                <View style={styles.diffNew}>
                    <Text style={styles.diffNewText}>{newVal || '(Trống)'}</Text>
                </View>
            </View>
        </View>
    );
};

export const UpdateApprovalScreen = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchRequests = async () => {
        try {
            const data = await partyService.getProfileUpdateRequests();
            setRequests(data);
        } catch (error) {
            console.error('Fetch update requests error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn phê duyệt các thay đổi này?', [
            { text: 'Hủy', style: 'cancel' },
            { 
                text: 'Duyệt', 
                onPress: async () => {
                    setProcessing(true);
                    try {
                        await partyService.approveProfileUpdate(id);
                        Alert.alert('Thành công', 'Đã cập nhật hồ sơ đoàn viên.');
                        fetchRequests();
                        setModalVisible(false);
                    } catch (error) {
                        Alert.alert('Lỗi', error.message || 'Không thể phê duyệt');
                    } finally {
                        setProcessing(false);
                    }
                }
            }
        ]);
    };

    const handleReject = async () => {
        if (!rejectNote.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối');
            return;
        }

        setProcessing(true);
        try {
            await partyService.rejectProfileUpdate(selectedRequest.id, rejectNote);
            Alert.alert('Thành công', 'Đã từ chối yêu cầu.');
            fetchRequests();
            setModalVisible(false);
            setRejectNote('');
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể thực hiện');
        } finally {
            setProcessing(false);
        }
    };

    const renderRequestItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.requestCard}
            onPress={() => {
                setSelectedRequest(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.requestInfo}>
                <View style={styles.avatarMini}>
                    <Text style={styles.avatarText}>{item.UnionMember?.fullName?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.memberName}>{item.UnionMember?.fullName}</Text>
                    <Text style={styles.memberCell}>{item.UnionMember?.UnionCell?.name || 'Chi đoàn'}</Text>
                    <Text style={styles.requestDate}>Gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray300} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <CommonHeader title="Duyệt hồ sơ" />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchRequests();
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.gray200} />
                            <Text style={styles.emptyText}>Hiện không có yêu cầu nào cần duyệt</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chi tiết thay đổi</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Đoàn viên: {selectedRequest?.UnionMember?.fullName}</Text>

                        <FlatList
                            data={selectedRequest ? Object.keys(selectedRequest.newData) : []}
                            renderItem={({ item }) => (
                                <DiffItem 
                                    label={
                                        item === 'fullName' ? 'Họ tên' :
                                        item === 'email' ? 'Email' :
                                        item === 'phoneNumber' ? 'Số điện thoại' :
                                        item === 'hometown' ? 'Quê quán' :
                                        item === 'permanentAddress' ? 'Địa chỉ' :
                                        item === 'educationLevel' ? 'Học vấn' :
                                        item === 'joinedDate' ? 'Ngày vào Đoàn' : item
                                    }
                                    oldVal={selectedRequest.oldData[item]}
                                    newVal={selectedRequest.newData[item]}
                                />
                            )}
                            keyExtractor={item => item}
                            style={{ maxHeight: 400 }}
                        />

                        <View style={styles.actions}>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => {
                                    Alert.prompt(
                                        'Từ chối hồ sơ',
                                        'Vui lòng nhập lý do từ chối:',
                                        [
                                            { text: 'Hủy', style: 'cancel' },
                                            { 
                                                text: 'Từ chối', 
                                                onPress: (note) => {
                                                    setRejectNote(note);
                                                    handleReject();
                                                }
                                            }
                                        ]
                                    );
                                }}
                                disabled={processing}
                            >
                                <Text style={styles.rejectText}>Từ chối</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={() => handleApprove(selectedRequest.id)}
                                disabled={processing}
                            >
                                {processing ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.approveText}>Phê duyệt</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: SIZES.md },
    requestCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...COLORS.shadowDark,
    },
    requestInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarMini: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    memberName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
    memberCell: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
    requestDate: { fontSize: 11, color: COLORS.gray400, marginTop: 4 },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: COLORS.gray400, fontSize: 14, fontWeight: '600' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.gray900 },
    modalSubtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginBottom: 20 },
    
    diffItem: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray50, paddingBottom: 12 },
    diffLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray600, marginBottom: 8 },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    diffOld: { flex: 1, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 },
    diffOldText: { fontSize: 12, color: '#991B1B', textDecorationLine: 'line-through' },
    diffNew: { flex: 1, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8 },
    diffNewText: { fontSize: 12, color: '#166534', fontWeight: '700' },
    
    actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    approveBtn: { backgroundColor: COLORS.primary },
    approveText: { color: COLORS.white, fontWeight: '700' },
    rejectBtn: { backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200 },
    rejectText: { color: COLORS.gray600, fontWeight: '700' }
});


