import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    Image,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { SIZES } from '../../constants/sizes';
import { financeService } from '../../services/financeService';
import * as ImagePicker from 'expo-image-picker';

export const PartyFeeScreen = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            const data = await financeService.getFees();
            setFees(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenPay = (fee) => {
        setSelectedFee(fee);
        setShowPayModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            // Xin phép truy cập thư viện ảnh
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để gửi bằng chứng.');
                return;
            }

            // Chọn ảnh
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
            });

            if (result.canceled) return;

            setUploading(true);
            const image = result.assets[0];

            const formData = new FormData();
            if (selectedFee.unionMemberId) {
                formData.append('unionMemberId', selectedFee.unionMemberId);
            }
            formData.append('period', selectedFee.period);
            formData.append('amount', selectedFee.amount);
            
            const uri = Platform.OS === 'android' ? image.uri : image.uri.replace('file://', '');
            formData.append('evidence', {
                uri: uri,
                name: `evidence_${selectedFee.period}.jpg`,
                type: 'image/jpeg'
            });

            await financeService.payFee(formData);
            Alert.alert('Thành công', 'Đã nộp bằng chứng. Vui lòng chờ Admin duyệt.');
            setShowPayModal(false);
            fetchData();
        } catch (e) {
            console.error(e);
            Alert.alert('Lỗi', 'Không thể gửi bằng chứng. Thử lại sau.');
        } finally {
            setUploading(false);
        }
    };

    const totalUnpaid = fees.filter(f => f.status === 'unpaid' || f.status === 'pending').length;
    const totalAmount = fees.filter(f => f.status === 'unpaid' || f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Payment Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryLabel}>CHƯA THANH TOÁN</Text>
                    <Text style={styles.summaryValue}>{totalUnpaid} tháng</Text>
                    <Text style={styles.totalAmount}>{totalAmount.toLocaleString()}đ</Text>
                </View>
                <Icon name="Wallet" size={60} color="rgba(255,255,255,0.2)" style={styles.summaryIcon} />
            </View>

            <Text style={styles.sectionTitle}>LỊCH SỬ ĐÓNG PHÍ 2026</Text>

            <View style={styles.feeList}>
                {fees.filter(f => f.status === 'unpaid').map(fee => (
                    <View key={fee.id} style={styles.feeItem}>
                        <View style={[styles.monthBox, { backgroundColor: '#FFF5F5' }]}>
                            <Text style={[styles.monthText, { color: '#E53E3E' }]}>T{fee.month}</Text>
                        </View>

                        <View style={styles.feeInfo}>
                            <Text style={styles.feeAmount}>{fee.amount.toLocaleString()}đ</Text>
                            <Text style={styles.feeStatus}>Chưa đóng</Text>
                        </View>

                        <TouchableOpacity style={styles.payBtn} onPress={() => handleOpenPay(fee)}>
                            <Text style={styles.payBtnText}>Đóng phí</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {fees.filter(f => f.status === 'unpaid').length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="CheckCircle" size={40} color="#10B981" style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyText}>Tuyệt vời! Bạn không còn nợ phí.</Text>
                        <TouchableOpacity 
                            style={styles.manualUploadBtn}
                            onPress={() => handleOpenPay({ 
                                month: new Date().getMonth() + 1, 
                                year: new Date().getFullYear(),
                                amount: 20000, // Giá trị mặc định hoặc lấy từ config
                                period: `Tháng ${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`
                            })}
                        >
                            <Text style={styles.manualUploadBtnText}>Nộp bằng chứng thanh toán mới</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>LỊCH SỬ GỬI BẰNG CHỨNG</Text>
                <TouchableOpacity 
                    onPress={() => handleOpenPay({ 
                        month: new Date().getMonth() + 1, 
                        year: new Date().getFullYear(),
                        amount: 20000,
                        period: `Tháng ${(new Date().getMonth() + 1)}/${new Date().getFullYear()}`
                    })}
                >
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: 'bold' }}>+ Nộp mới</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.historyList}>
                {fees.filter(f => f.status !== 'unpaid').map(fee => (
                    <View key={fee.id} style={styles.historyItem}>
                        <View style={styles.evidenceThumb}>
                            {fee.evidenceImage ? (
                                <Image 
                                    source={{ uri: `http://localhost:5000${fee.evidenceImage}` }} 
                                    style={styles.thumbImage} 
                                />
                            ) : (
                                <View style={styles.noImageThumb}>
                                    <Icon name="Image" size={20} color="#9CA3AF" />
                                </View>
                            )}
                        </View>
                        <View style={styles.historyInfo}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyTitle}>Tháng {fee.month}/{fee.year}</Text>
                                <Text style={styles.historyTime}>{new Date(fee.updatedAt).toLocaleDateString('vi-VN')}</Text>
                            </View>
                            <View style={styles.historyFooter}>
                                <Text style={styles.historyAmount}>{fee.amount.toLocaleString()}đ</Text>
                                <View style={[styles.statusBadge, { 
                                    backgroundColor: fee.status === 'paid' ? '#DEF7EC' : fee.status === 'pending' ? '#FEF3C7' : '#FDE8E8' 
                                }]}>
                                    <Text style={[styles.statusText, { 
                                        color: fee.status === 'paid' ? '#03543F' : fee.status === 'pending' ? '#92400E' : '#9B1C1C' 
                                    }]}>
                                        {fee.status === 'paid' ? 'Đã duyệt' : fee.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
                {fees.filter(f => f.status !== 'unpaid').length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Chưa có lịch sử nộp phí.</Text>
                    </View>
                )}
            </View>

            {/* Payment Modal */}
            <Modal visible={showPayModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Thanh toán Đoàn phí</Text>
                                <Text style={styles.modalSubTitle}>Tháng {selectedFee?.month}/{selectedFee?.year}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowPayModal(false)}>
                                <Icon name="X" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.qrSection}>
                                <Text style={styles.qrInstruction}>Vui lòng quét mã QR hoặc chuyển khoản vào tài khoản bên dưới</Text>
                                
                                <View style={styles.qrWrapper}>
                                    {/* MOCK QR UI */}
                                    <View style={styles.qrPlaceholder}>
                                        <Icon name="QrCode" size={180} color={COLORS.primary} />
                                        <View style={styles.qrLogoBox}>
                                            <Image source={require('../../../assets/icon.png')} style={styles.qrLogo} />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.bankDetailCard}>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankLabel}>Ngân hàng</Text>
                                        <Text style={styles.bankValue}>Agribank - CN Đồng Tháp</Text>
                                    </View>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankLabel}>Số tài khoản</Text>
                                        <Text style={[styles.bankValue, { fontWeight: 'bold', color: COLORS.primary }]}>6701234567890</Text>
                                    </View>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankLabel}>Chủ tài khoản</Text>
                                        <Text style={styles.bankValue}>ĐOÀN TRƯỜNG ĐH ĐỒNG THÁP</Text>
                                    </View>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankLabel}>Nội dung</Text>
                                        <Text style={[styles.bankValue, { color: COLORS.error, fontWeight: 'bold' }]}>DP {selectedFee?.period} {selectedFee?.unionMemberId?.substring(0, 5)}</Text>
                                    </View>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankLabel}>Số tiền</Text>
                                        <Text style={[styles.bankValue, { fontSize: 18, color: '#10B981' }]}>{selectedFee?.amount?.toLocaleString()}đ</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.uploadSection}>
                                <Text style={styles.uploadTitle}>XÁC NHẬN CHUYỂN KHOẢN</Text>
                                <Text style={styles.uploadDesc}>Sau khi chuyển khoản, vui lòng tải lên ảnh chụp màn hình bằng chứng để được phê duyệt.</Text>
                                
                                <TouchableOpacity 
                                    style={[styles.submitBtn, uploading && { opacity: 0.7 }]} 
                                    onPress={handleConfirmPayment}
                                    disabled={uploading}
                                >
                                    {uploading ? <ActivityIndicator color="#FFF" /> : (
                                        <>
                                            <Icon name="Camera" size={20} color="#FFF" />
                                            <Text style={styles.submitBtnText}>Gửi bằng chứng thanh toán</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={styles.noteBox}>
                <Icon name="Info" size={16} color="#6B7280" />
                <Text style={styles.noteText}>Hệ thống tự động nhắc nhở đóng đoàn phí vào ngày 05 hàng tháng.</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    summaryInfo: { flex: 1 },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' },
    summaryValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
    totalAmount: { color: '#FFF', fontSize: 16, marginTop: 4, opacity: 0.9 },
    summaryIcon: { position: 'absolute', right: 10, top: 10 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    feeList: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
    feeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    monthBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthText: { fontSize: 16, fontWeight: 'bold' },
    feeInfo: { flex: 1, marginLeft: 16 },
    feeAmount: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    feeStatus: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    payBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    payBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    noteBox: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        marginTop: 24,
        alignItems: 'center',
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 8,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalBody: {
        marginBottom: 24,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrText: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 16,
    },
    qrBox: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        marginBottom: 16,
    },
    bankInfo: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: { padding: 32, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },
    historyList: { gap: 12, marginBottom: 24 },
    historyItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    evidenceThumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbImage: { width: '100%', height: '100%' },
    noImageThumb: { alignItems: 'center', justifyContent: 'center' },
    historyInfo: { flex: 1, marginLeft: 12 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    historyTime: { fontSize: 10, color: '#9CA3AF' },
    historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    historyAmount: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    modalSubTitle: { fontSize: 12, color: '#6B7280' },
    qrSection: { alignItems: 'center', marginBottom: 24 },
    qrInstruction: { fontSize: 13, color: '#4B5563', textAlign: 'center', marginBottom: 20 },
    qrWrapper: { 
        padding: 20, 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        marginBottom: 24 
    },
    qrPlaceholder: { position: 'relative' },
    qrLogoBox: { 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: [{ translateX: -20 }, { translateY: -20 }], 
        width: 40, 
        height: 40, 
        backgroundColor: '#FFF', 
        borderRadius: 8, 
        padding: 4 
    },
    qrLogo: { width: '100%', height: '100%', resizeMode: 'contain' },
    bankDetailCard: { 
        width: '100%', 
        backgroundColor: '#F9FAFB', 
        borderRadius: 16, 
        padding: 16, 
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between' },
    bankLabel: { fontSize: 12, color: '#6B7280' },
    bankValue: { fontSize: 12, color: '#1F2937', textAlign: 'right', flex: 1, marginLeft: 16 },
    uploadSection: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 24,
    },
    uploadTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
    uploadDesc: { fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
    manualUploadBtn: {
        marginTop: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        elevation: 2,
    },
    manualUploadBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
