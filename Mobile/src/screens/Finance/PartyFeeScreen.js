import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StatusBar,
    Platform,
    Modal,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants';
import { financeService } from '../../services/financeService';

const FeatureCard = ({ title, value, subtitle, icon, color = COLORS.primary }) => (
    <View style={[styles.summaryCard, { backgroundColor: color }]}>
        <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
            {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
        </View>
        <Icon name={icon} size={60} color="rgba(255,255,255,0.2)" style={styles.summaryIcon} />
    </View>
);

export const PartyFeeScreen = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid', 'history'
    const [selectedFee, setSelectedFee] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [evidenceImage, setEvidenceImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bankSetting, setBankSetting] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            const data = await financeService.getMyFeeDashboard();
            setDashboard(data);
            const bankData = await financeService.getBankSetting();
            setBankSetting(bankData);
        } catch (error) {
            console.error('Fetch dashboard error:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin đoàn phí');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const handlePayOnline = (fee) => {
        if (!dashboard?.summary?.memberCode) {
            return Alert.alert('Lỗi', 'Không xác định được mã đoàn viên.');
        }
        setSelectedFee(fee);
        setShowQRModal(true);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Ứng dụng cần quyền truy cập thư viện ảnh để gửi minh chứng.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEvidenceImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Ứng dụng cần quyền camera để chụp ảnh minh chứng.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEvidenceImage(result.assets[0]);
        }
    };

    const handleSubmitPayment = async () => {
        if (!evidenceImage) {
            return Alert.alert('Thông báo', 'Vui lòng tải ảnh minh chứng (Bill chuyển khoản) để Admin đối soát.');
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('unionFeeTypeId', selectedFee.unionFeeTypeId);
            formData.append('period', selectedFee.period);
            formData.append('amount', selectedFee.amount);
            formData.append('paymentProvider', 'BANK_TRANSFER');
            
            // Xử lý File cho FormData
            const fileName = evidenceImage.uri.split('/').pop();
            const fileType = fileName.split('.').pop();
            formData.append('evidence', {
                uri: evidenceImage.uri,
                name: fileName,
                type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`
            });

            await financeService.initPayment(formData);
            Alert.alert('Thành công', 'Yêu cầu của bạn đã được gửi. Vui lòng đợi Admin phê duyệt.');
            setShowQRModal(false);
            setEvidenceImage(null);
            fetchDashboard();
        } catch (error) {
            console.error('Submit payment error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu xác nhận.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const VietQRModal = () => {
        if (!selectedFee || !dashboard?.summary) return null;

        const { memberCode } = dashboard.summary;
        const bankId = bankSetting?.bankId || 'MB';
        const accountNo = bankSetting?.accountNo || '0383123456'; 
        const accountName = bankSetting?.accountName || 'DOAN THANH NIEN DTHU';
        const description = `DP ${memberCode} ${selectedFee.period}`.toUpperCase();
        
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${selectedFee.amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

        return (
            <Modal visible={showQRModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thanh toán VietQR</Text>
                            <TouchableOpacity onPress={() => setShowQRModal(false)}>
                                <Icon name="X" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalSub}>Quét mã QR dưới đây để chuyển khoản</Text>
                            
                            <View style={styles.qrContainer}>
                                <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                            </View>

                            <View style={styles.bankInfoBox}>
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Ngân hàng:</Text>
                                    <Text style={styles.bankVal}>{bankSetting?.bankName || 'MB Bank'}</Text>
                                </View>
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Số tài khoản:</Text>
                                    <Text style={[styles.bankVal, styles.bold]}>{accountNo}</Text>
                                </View>
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Số tiền:</Text>
                                    <Text style={[styles.bankVal, { color: '#DC2626' }, styles.bold]}>{selectedFee.amount.toLocaleString()}đ</Text>
                                </View>
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Nội dung:</Text>
                                    <Text style={[styles.bankVal, styles.bold]}>{description}</Text>
                                </View>
                            </View>

                            <Text style={styles.uploadLabel}>Tải ảnh minh chứng (Bill thanh toán) *</Text>
                            <View style={styles.uploadOptions}>
                                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                    <Icon name="Image" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadBtnText}>Thư viện</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                                    <Icon name="Camera" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadBtnText}>Chụp ảnh</Text>
                                </TouchableOpacity>
                            </View>

                            {evidenceImage && (
                                <View style={styles.evidencePreview}>
                                    <Image source={{ uri: evidenceImage.uri }} style={styles.previewImg} />
                                    <TouchableOpacity style={styles.removeImg} onPress={() => setEvidenceImage(null)}>
                                        <Icon name="X" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.confirmBtn, isSubmitting && styles.disabledBtn]} 
                            onPress={handleSubmitPayment}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</Text>}
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const { summary, unpaidFees, history, pendingTransactions } = dashboard || { summary: {}, unpaidFees: [], history: [], pendingTransactions: [] };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Summary Card */}
                <View style={styles.header}>
                    <FeatureCard 
                        title="TỔNG NỢ ĐOÀN PHÍ" 
                        value={`${(summary?.totalDebt || 0).toLocaleString()}đ`} 
                        subtitle={summary?.unpaidCount > 0 ? `Còn ${summary.unpaidCount} khoản chưa đóng` : 'Đã hoàn thành nghĩa vụ'}
                        icon="Wallet"
                        color={summary?.unpaidCount > 0 ? '#F59E0B' : COLORS.primary}
                    />
                    
                    {summary?.unpaidCount > 0 && (
                        <View style={styles.deadlineBadge}>
                            <Icon name="Clock" size={16} color="#B45309" />
                            <Text style={styles.deadlineText}>Hạn gần nhất: {summary.nearestDeadline || 'Chưa xác định'}</Text>
                        </View>
                    )}
                </View>

                {/* Overdue Banner */}
                {unpaidFees.some(f => f.priority === 'OVERDUE') && (
                    <View style={styles.alertBanner}>
                        <Icon name="AlertTriangle" size={20} color="#DC2626" />
                        <Text style={styles.alertText}>Bạn có khoản phí quá hạn. Vui lòng thanh toán sớm!</Text>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'unpaid' && styles.activeTab]}
                        onPress={() => setActiveTab('unpaid')}
                    >
                        <Text style={[styles.tabText, activeTab === 'unpaid' && styles.activeTabText]}>Cần nộp ({unpaidFees.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Lịch sử</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'unpaid' ? (
                    <View style={styles.listSection}>
                        {[...pendingTransactions, ...unpaidFees].length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="CheckCircle" size={64} color="#E5E7EB" />
                                <Text style={styles.emptyText}>Tuyệt vời! Bạn không còn khoản phí nào.</Text>
                            </View>
                        ) : (
                            <>
                                {pendingTransactions.map(item => (
                                    <View key={`pending-${item.id}`} style={[styles.feeItem, styles.pendingItem]}>
                                        <View style={styles.feeIconWrap}>
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                        </View>
                                        <View style={styles.feeInfo}>
                                            <Text style={styles.feeName}>{item.UnionFeeType?.name}</Text>
                                            <Text style={styles.feePeriod}>Năm {item.period} • Đang xử lý...</Text>
                                        </View>
                                        <Text style={styles.feeAmount}>{Number(item.amount).toLocaleString()}đ</Text>
                                    </View>
                                ))}
                                {unpaidFees.map((item, index) => (
                                    <View key={`unpaid-${index}`} style={styles.feeItem}>
                                        <View style={[styles.feeIconWrap, { backgroundColor: item.priority === 'OVERDUE' ? '#FEF2F2' : '#F3F4F6' }]}>
                                            <Icon 
                                                name={item.priority === 'OVERDUE' ? 'AlertTriangle' : 'CreditCard'} 
                                                size={24} 
                                                color={item.priority === 'OVERDUE' ? '#EF4444' : '#6B7280'} 
                                            />
                                        </View>
                                        <View style={styles.feeInfo}>
                                            <Text style={styles.feeName}>{item.name}</Text>
                                            <Text style={styles.feePeriod}>Năm {item.period} • Hạn: {item.deadline}</Text>
                                        </View>
                                        <View style={styles.feeAction}>
                                            <Text style={styles.feeAmount}>{item.amount.toLocaleString()}đ</Text>
                                            <TouchableOpacity style={styles.payOptionBtn} onPress={() => handlePayOnline(item)}>
                                                <Text style={styles.payOptionText}>Nộp ngay</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.listSection}>
                        {history.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="FileText" size={64} color="#E5E7EB" />
                                <Text style={styles.emptyText}>Chưa có lịch sử giao dịch nào.</Text>
                            </View>
                        ) : (
                            history.map(item => (
                                <View key={item.id} style={styles.feeItem}>
                                    <View style={[styles.feeIconWrap, { backgroundColor: '#ECFDF5' }]}>
                                        <Icon name="CheckCircle" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.feeInfo}>
                                        <Text style={styles.feeName}>{item.UnionFeeType?.name || 'Đoàn phí'}</Text>
                                        <Text style={styles.feePeriod}>{new Date(item.paidAt).toLocaleDateString()} • {item.PaymentTransaction?.paymentProvider || 'TIỀN MẶT'}</Text>
                                    </View>
                                    <View style={styles.feeEnd}>
                                        <Text style={styles.feeAmount}>{Number(item.amount).toLocaleString()}đ</Text>
                                        <Text style={styles.txnId}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
            <VietQRModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 20 },
    summaryCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    summaryContent: { flex: 1 },
    summaryTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
    summaryValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 },
    summarySubtitle: { color: '#FFF', fontSize: 14, marginTop: 8, opacity: 0.9 },
    summaryIcon: { position: 'absolute', right: 4, bottom: 4 },
    deadlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: -16,
        marginLeft: 24,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    deadlineText: { fontSize: 12, fontWeight: 'bold', color: '#B45309', marginLeft: 6 },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    alertText: { flex: 1, fontSize: 13, color: '#DC2626', marginLeft: 8, fontWeight: '600' },
    tabContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#F3F4F6', 
        borderRadius: 16, 
        padding: 4, 
        marginBottom: 20 
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF' },
    activeTabText: { color: COLORS.primary },
    listSection: { gap: 12 },
    feeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    pendingItem: { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '05' },
    feeIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    feeInfo: { flex: 1, marginLeft: 16 },
    feeName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    feePeriod: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    feeAction: { alignItems: 'flex-end' },
    feeAmount: { fontSize: 16, fontWeight: '900', color: '#111827' },
    payOptionBtn: { marginTop: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    payOptionText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    feeEnd: { alignItems: 'flex-end' },
    txnId: { fontSize: 10, color: '#D1D5DB', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    modalSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
    qrContainer: { alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 24, padding: 16, marginBottom: 20 },
    qrImage: { width: 240, height: 240 },
    bankInfoBox: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 20, borderDash: [5, 5], borderWidth: 1, borderColor: '#E5E7EB' },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bankLabel: { fontSize: 13, color: '#6B7280' },
    bankVal: { fontSize: 13, color: '#111827', fontWeight: '500' },
    bold: { fontWeight: 'bold' },
    uploadLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
    uploadOptions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#DBEAFE' },
    uploadBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
    evidencePreview: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    previewImg: { width: '100%', height: '100%' },
    removeImg: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
    confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    disabledBtn: { opacity: 0.6 }
});
