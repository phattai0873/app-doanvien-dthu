import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, Platform,
    Modal, Image, KeyboardAvoidingView, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { financeService } from '../../services/financeService';

const { width } = Dimensions.get('window');

// ─── Status config ────────────────────────────────────────
const STATUS = {
    APPROVED: { label: 'Đã duyệt', color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle' },
    PENDING: { label: 'Chờ duyệt', color: '#F59E0B', bg: '#FFFBEB', icon: 'time' },
    REJECTED: { label: 'Từ chối', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' },
    UNPAID: { label: 'Chưa nộp', color: '#64748B', bg: '#F1F5F9', icon: 'wallet-outline' },
    OVERDUE: { label: 'Quá hạn', color: '#DC2626', bg: '#FEF2F2', icon: 'alert-circle' },
};

const TABS = [
    { key: 'unpaid', label: 'Cần nộp' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'history', label: 'Lịch sử' },
];

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

// ─── StatusBadge – component ngoài ───────────────────────
const StatusBadge = ({ type }) => {
    const cfg = STATUS[type] || STATUS.UNPAID;
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};
const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    text: { fontSize: 10, fontWeight: '800' },
});

// ─── FeeCard – component ngoài ───────────────────────────
const FeeCard = ({ item, type, onPayPress }) => {
    const cfg = STATUS[type] || STATUS.UNPAID;
    const isActionable = type === 'UNPAID' || type === 'OVERDUE';

    return (
        <View style={[
            styles.feeCard,
            type === 'OVERDUE' && styles.feeCardOverdue,
            type === 'PENDING' && styles.feeCardPending,
            type === 'APPROVED' && styles.feeCardApproved,
        ]}>
            {/* Left: icon */}
            <View style={[styles.feeIconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            </View>

            {/* Center: info */}
            <View style={styles.feeBody}>
                <Text style={styles.feeName} numberOfLines={2}>
                    {item.name || item.UnionFeeType?.name || 'Đoàn phí'}
                </Text>
                <Text style={styles.feeMeta}>
                    Năm {item.period}
                    {item.deadline ? ` • Hạn: ${item.deadline}` : ''}
                    {item.paidAt ? ` • ${new Date(item.paidAt).toLocaleDateString('vi-VN')}` : ''}
                </Text>
                {type === 'APPROVED' && item.approvedAt && (
                    <Text style={styles.feeApprovedMeta}>
                        ✓ Duyệt: {new Date(item.approvedAt).toLocaleDateString('vi-VN')}
                    </Text>
                )}
                {item.id && (type === 'APPROVED' || type === 'PENDING' || type === 'REJECTED') && (
                    <Text style={styles.feeTxnId}>
                        #{String(item.id).substring(0, 8).toUpperCase()}
                    </Text>
                )}
            </View>

            {/* Right: amount + badge + action */}
            <View style={styles.feeRight}>
                <Text style={[styles.feeAmount, type === 'OVERDUE' && { color: '#DC2626' }]}>
                    {fmt(item.amount)}
                </Text>
                <StatusBadge type={type} />
                {isActionable && (
                    <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => onPayPress && onPayPress(item)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.payBtnText}>Nộp ngay</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ─── EmptyState – component ngoài ────────────────────────
const EmptyState = ({ icon, text }) => (
    <View style={styles.emptyBox}>
        <View style={styles.emptyIconBox}>
            <Ionicons name={icon} size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>{text}</Text>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────
export const PartyFeeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('unpaid');
    const [selectedFee, setSelectedFee] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [evidenceImage, setEvidenceImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bankSetting, setBankSetting] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            const [data, bankData] = await Promise.all([
                financeService.getMyFeeDashboard(),
                financeService.getBankSetting(),
            ]);
            setDashboard(data);
            setBankSetting(bankData);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể tải thông tin đoàn phí');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
    const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

    const handlePayOnline = (fee) => {
        if (!dashboard?.summary?.memberCode)
            return Alert.alert('Lỗi', 'Không xác định được mã đoàn viên.');
        setSelectedFee(fee);
        setShowQRModal(true);
    };

    const closeModal = () => {
        setShowQRModal(false);
        setEvidenceImage(null);
        setSelectedFee(null);
    };

    const [showImagePreview, setShowImagePreview] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh.');
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,   // Không cắt ảnh
            quality: 0.85,
        });
        if (!result.canceled) setEvidenceImage(result.assets[0]);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Lỗi', 'Cần quyền camera.');
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,   // Không cắt ảnh
            quality: 0.85,
        });
        if (!result.canceled) setEvidenceImage(result.assets[0]);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                const doc = result.assets[0];
                // Map document picker result to match image picker asset object structure
                setEvidenceImage({
                    uri: doc.uri,
                    name: doc.name,
                    size: doc.size,
                    mimeType: doc.mimeType
                });
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể chọn tài liệu.');
        }
    };

    const handleSubmitPayment = async () => {
        if (!evidenceImage)
            return Alert.alert('Thông báo', 'Vui lòng tải ảnh minh chứng (bill chuyển khoản).');
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('unionFeeTypeId', selectedFee.unionFeeTypeId);
            formData.append('period', selectedFee.period);
            formData.append('amount', selectedFee.amount);
            formData.append('paymentProvider', 'BANK_TRANSFER');
            const fileName = evidenceImage.uri.split('/').pop();
            const fileType = fileName.split('.').pop();
            formData.append('evidence', {
                uri: evidenceImage.uri, name: fileName,
                type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
            });
            await financeService.initPayment(formData);
            Alert.alert('✅ Gửi thành công', 'Yêu cầu đã gửi. Vui lòng chờ Admin phê duyệt.');
            closeModal();
            fetchDashboard();
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi yêu cầu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Derived ──────────────────────────────────────────
    const {
        summary = {},
        unpaidFees = [],
        history = [],
        pendingTransactions = [],
    } = dashboard || {};

    const approvedHistory = history.filter(h =>
        h.status === 'APPROVED' || h.PaymentTransaction?.status === 'APPROVED'
    );
    const isDebt = (summary?.totalDebt || 0) > 0;

    // ─── QR modal values (chỉ tính khi modal mở) ─────────
    const memberCode = dashboard?.summary?.memberCode || '';
    const bankId = bankSetting?.bankId || 'MB';
    const accountNo = bankSetting?.accountNo || '0383123456';
    const accountName = bankSetting?.accountName || 'DOAN THANH NIEN DTHU';
    const description = selectedFee
        ? `DP ${memberCode} ${selectedFee.period}`.toUpperCase()
        : '';
    const qrUrl = selectedFee
        ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${selectedFee.amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`
        : '';

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* ─── ScrollView ──────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Hero */}
                <LinearGradient
                    colors={isDebt ? ['#F59E0B', '#D97706'] : ['#1B3FE8', '#1230B0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.hero, { paddingTop: Math.max(insets.top + 12, 50) }]}
                >
                    <View style={styles.heroDecor} />
                    <View style={styles.heroRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroLabel}>TỔNG NỢ ĐOÀN PHÍ</Text>
                            <Text style={styles.heroAmount}>{fmt(summary?.totalDebt)}</Text>
                            <Text style={styles.heroSub}>
                                {summary?.unpaidCount > 0
                                    ? `Còn ${summary.unpaidCount} khoản chưa đóng`
                                    : '✓ Đã hoàn thành nghĩa vụ'}
                            </Text>
                        </View>
                        <View style={styles.heroIcon}>
                            <Ionicons name="wallet" size={40} color="rgba(255,255,255,0.9)" />
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        {[
                            { num: unpaidFees.length, lbl: 'Chưa nộp' },
                            { num: pendingTransactions.length, lbl: 'Chờ duyệt' },
                            { num: approvedHistory.length, lbl: 'Đã duyệt' },
                            { num: history.length, lbl: 'Lịch sử' },
                        ].map((s, i, arr) => (
                            <React.Fragment key={i}>
                                <View style={styles.statChip}>
                                    <Text style={styles.statNum}>{s.num}</Text>
                                    <Text style={styles.statLbl}>{s.lbl}</Text>
                                </View>
                                {i < arr.length - 1 && <View style={styles.statDiv} />}
                            </React.Fragment>
                        ))}
                    </View>
                </LinearGradient>

                {/* Alert + deadline */}
                {unpaidFees.some(f => f.priority === 'OVERDUE') && (
                    <View style={styles.alertBar}>
                        <Ionicons name="alert-circle" size={18} color="#DC2626" />
                        <Text style={styles.alertText}>Bạn có khoản phí quá hạn! Vui lòng thanh toán sớm.</Text>
                    </View>
                )}
                {summary?.nearestDeadline && summary?.unpaidCount > 0 && (
                    <View style={styles.deadlineBadge}>
                        <Ionicons name="time-outline" size={13} color="#B45309" />
                        <Text style={styles.deadlineText}>Hạn gần nhất: {summary.nearestDeadline}</Text>
                    </View>
                )}

                {/* Tabs */}
                <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScroll}
                    style={{ marginTop: 16 }}
                >
                    {TABS.map(t => {
                        const isActive = activeTab === t.key;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(t.key)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Tab content */}
                <View style={styles.listSection}>

                    {/* Cần nộp */}
                    {activeTab === 'unpaid' && (
                        <>
                            {pendingTransactions.length > 0 && (
                                <View style={styles.pendingBanner}>
                                    <Ionicons name="time" size={15} color="#F59E0B" />
                                    <Text style={styles.pendingBannerText}>
                                        Bạn đang có {pendingTransactions.length} khoản đã gửi, chờ Admin duyệt.
                                    </Text>
                                </View>
                            )}
                            {unpaidFees.length === 0
                                ? <EmptyState icon="checkmark-circle-outline" text="Tuyệt vời! Bạn không còn khoản phí nào." />
                                : unpaidFees.map((item, i) => (
                                    <FeeCard
                                        key={`unpaid-${i}`}
                                        item={item}
                                        type={item.priority === 'OVERDUE' ? 'OVERDUE' : 'UNPAID'}
                                        onPayPress={handlePayOnline}
                                    />
                                ))
                            }
                        </>
                    )}

                    {/* Chờ duyệt */}
                    {activeTab === 'pending' && (
                        pendingTransactions.length === 0
                            ? <EmptyState icon="time-outline" text="Không có khoản nào đang chờ duyệt." />
                            : pendingTransactions.map((item) => (
                                <FeeCard
                                    key={`pending-${item.id}`}
                                    item={{ ...item, name: item.UnionFeeType?.name }}
                                    type="PENDING"
                                />
                            ))
                    )}

                    {/* Đã duyệt */}
                    {activeTab === 'approved' && (
                        approvedHistory.length === 0
                            ? <EmptyState icon="checkmark-done-outline" text="Chưa có khoản phí nào được duyệt." />
                            : approvedHistory.map((item) => (
                                <FeeCard
                                    key={`approved-${item.id}`}
                                    item={{ ...item, name: item.UnionFeeType?.name }}
                                    type="APPROVED"
                                />
                            ))
                    )}

                    {/* Lịch sử */}
                    {activeTab === 'history' && (
                        history.length === 0
                            ? <EmptyState icon="receipt-outline" text="Chưa có lịch sử giao dịch nào." />
                            : history.map((item) => {
                                const txStatus = item.status === 'APPROVED' ? 'APPROVED'
                                    : item.status === 'REJECTED' ? 'REJECTED'
                                        : 'PENDING';
                                return (
                                    <FeeCard
                                        key={`hist-${item.id}`}
                                        item={{ ...item, name: item.UnionFeeType?.name }}
                                        type={txStatus}
                                    />
                                );
                            })
                    )}
                </View>
            </ScrollView>

            {/* ─── Modal xem ảnh to ──────────────────────────────── */}
            <Modal
                visible={showImagePreview}
                animationType="fade"
                transparent
                onRequestClose={() => setShowImagePreview(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowImagePreview(false)}>
                    <View style={styles.imgLightboxOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.imgLightboxContent}>
                                {/* Close */}
                                <TouchableOpacity
                                    style={styles.imgLightboxClose}
                                    onPress={() => setShowImagePreview(false)}
                                >
                                    <Ionicons name="close" size={22} color="#FFF" />
                                </TouchableOpacity>

                                {evidenceImage && (
                                    <Image
                                        source={{ uri: evidenceImage.uri }}
                                        style={styles.imgLightboxImg}
                                        resizeMode="contain"
                                    />
                                )}

                                {/* Footer actions */}
                                <View style={styles.imgLightboxFooter}>
                                    <TouchableOpacity
                                        style={styles.imgLightboxBtn}
                                        onPress={() => { setShowImagePreview(false); setEvidenceImage(null); }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        <Text style={[styles.imgLightboxBtnText, { color: '#EF4444' }]}>Xóa ảnh</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.imgLightboxBtn, { backgroundColor: COLORS.primary }]}
                                        onPress={() => { setShowImagePreview(false); pickImage(); }}
                                    >
                                        <Ionicons name="images-outline" size={18} color="#FFF" />
                                        <Text style={[styles.imgLightboxBtnText, { color: '#FFF' }]}>Chọn lại</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* ─── QR Modal ──────────────────────────────────────── */}
            <Modal
                visible={showQRModal}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        {/* Drag handle */}
                        <View style={styles.modalHandle} />

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Thanh toán VietQR</Text>
                                {selectedFee && (
                                    <Text style={styles.modalTitleSub}>
                                        {selectedFee.name} · Năm {selectedFee.period}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable body */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* QR */}
                            <View style={styles.qrBox}>
                                {qrUrl ? (
                                    <Image source={{ uri: qrUrl }} style={styles.qrImg} resizeMode="contain" />
                                ) : (
                                    <ActivityIndicator color={COLORS.primary} size="large" style={{ height: 220 }} />
                                )}
                                <Text style={styles.qrHint}>Quét mã để chuyển khoản tự động</Text>
                            </View>

                            {/* Bank info */}
                            <View style={styles.bankCard}>
                                {[
                                    { label: 'Ngân hàng', val: bankSetting?.bankName || 'MB Bank' },
                                    { label: 'Số tài khoản', val: accountNo, bold: true },
                                    { label: 'Số tiền', val: selectedFee ? fmt(selectedFee.amount) : '', color: '#DC2626', bold: true },
                                    { label: 'Nội dung CK', val: description, bold: true },
                                ].map((r, i) => (
                                    <View key={i} style={[styles.bankRow, i > 0 && styles.bankRowBorder]}>
                                        <Text style={styles.bankLabel}>{r.label}</Text>
                                        <Text style={[
                                            styles.bankVal,
                                            r.bold && { fontWeight: '800' },
                                            r.color && { color: r.color },
                                        ]} numberOfLines={2}>{r.val}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Upload */}
                            <Text style={styles.uploadTitle}>Ảnh minh chứng (bill CK) *</Text>
                            <View style={styles.uploadRow}>
                                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                    <Ionicons name="images-outline" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadBtnText}>Thư viện</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadBtnText}>Chụp ảnh</Text>
                                </TouchableOpacity>
                                {/* <TouchableOpacity style={[styles.uploadBtn, { flex: 1.2 }]} onPress={pickDocument}>
                                    <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadBtnText}>PDF / Word</Text>
                                </TouchableOpacity> */}
                            </View>

                            {evidenceImage && (
                                <View style={styles.previewSection}>
                                    {/* Header */}
                                    <View style={styles.previewHeader}>
                                        <View style={styles.previewHeaderLeft}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            <Text style={styles.previewHeaderText}>Ảnh đã chọn</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeImgBtn}
                                            onPress={() => setEvidenceImage(null)}
                                        >
                                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                            <Text style={styles.removeImgText}>Xóa</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Preview ảnh – nhấn để xem to */}
                                    <TouchableOpacity
                                        style={styles.previewImgWrap}
                                        onPress={() => {
                                            const isDoc = evidenceImage.mimeType?.includes('pdf') || evidenceImage.mimeType?.includes('word') || evidenceImage.uri.endsWith('.pdf') || evidenceImage.uri.endsWith('.doc') || evidenceImage.uri.endsWith('.docx');
                                            if (!isDoc) setShowImagePreview(true);
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        {(evidenceImage.mimeType?.includes('pdf') || evidenceImage.uri.endsWith('.pdf')) ? (
                                            <View style={[styles.previewImgFull, { backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="document-text" size={60} color="#EF4444" />
                                                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '800', marginTop: 8 }}>{evidenceImage.name || 'FILE PDF'}</Text>
                                            </View>
                                        ) : (evidenceImage.mimeType?.includes('word') || evidenceImage.uri.endsWith('.doc') || evidenceImage.uri.endsWith('.docx')) ? (
                                            <View style={[styles.previewImgFull, { backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="document" size={60} color="#2563EB" />
                                                <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '800', marginTop: 8 }}>{evidenceImage.name || 'FILE WORD'}</Text>
                                            </View>
                                        ) : (
                                            <>
                                                <Image
                                                    source={{ uri: evidenceImage.uri }}
                                                    style={styles.previewImgFull}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.previewZoomHint}>
                                                    <Ionicons name="expand-outline" size={14} color="#FFF" />
                                                    <Text style={styles.previewZoomText}>Nhấn để xem to</Text>
                                                </View>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        {/* Confirm button */}
                        <TouchableOpacity
                            style={[styles.confirmBtn, isSubmitting && { opacity: 0.6 }]}
                            onPress={handleSubmitPayment}
                            disabled={isSubmitting}
                            activeOpacity={0.85}
                        >
                            {isSubmitting
                                ? <ActivityIndicator color="#FFF" />
                                : <>
                                    <Ionicons name="send" size={17} color="#FFF" />
                                    <Text style={styles.confirmText}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</Text>
                                </>
                            }
                        </TouchableOpacity>

                        {/* iOS safe bottom */}
                        <View style={{ height: Math.max(insets.bottom, 8) }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    hero: { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
    heroDecor: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -50,
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    heroAmount: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
    heroIcon: {
        width: 68, height: 68, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    statChip: { flex: 1, alignItems: 'center', paddingVertical: 11 },
    statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 10 },
    statNum: { fontSize: 18, fontWeight: '900', color: '#FFF' },
    statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '700' },

    alertBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 14,
        padding: 12, borderRadius: 14, gap: 8,
        borderWidth: 1, borderColor: '#FEE2E2',
    },
    alertText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '600' },
    deadlineBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FEF3C7', alignSelf: 'flex-start',
        marginHorizontal: 16, marginTop: 8,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    },
    deadlineText: { fontSize: 12, color: '#B45309', fontWeight: '700' },

    tabScroll: { paddingHorizontal: 16, gap: 8 },
    tab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#E8EEF4' },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    tabTextActive: { color: '#FFF' },

    listSection: { paddingHorizontal: 16, marginTop: 14, gap: 12 },
    pendingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#FCD34D',
    },
    pendingBannerText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },

    // Fee Card
    feeCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 18, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        gap: 12,
    },
    feeCardOverdue: { borderWidth: 1, borderColor: '#FEE2E2' },
    feeCardPending: { borderWidth: 1, borderColor: '#FCD34D30', backgroundColor: '#FFFDF5' },
    feeCardApproved: { borderWidth: 1, borderColor: '#10B98120', backgroundColor: '#FAFFFD' },
    feeIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    feeBody: { flex: 1, minWidth: 0 },
    feeName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    feeMeta: { fontSize: 11, color: '#94A3B8', lineHeight: 15 },
    feeApprovedMeta: { fontSize: 10, color: '#10B981', fontWeight: '700', marginTop: 3 },
    feeTxnId: { fontSize: 10, color: '#CBD5E1', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
    feeRight: { alignItems: 'flex-end', flexShrink: 0, gap: 5 },
    feeAmount: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    payBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyIconBox: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#EBF0FE',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', textAlign: 'center', paddingHorizontal: 32 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        maxHeight: '90%',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 14 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'flex-start',
        marginBottom: 16, gap: 12,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    modalTitleSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    modalClose: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
    },
    qrBox: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 14 },
    qrImg: { width: 210, height: 210 },
    qrHint: { fontSize: 11, color: '#94A3B8', marginTop: 8, fontWeight: '600' },
    bankCard: {
        backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0',
    },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
    bankRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    bankLabel: { fontSize: 12, color: '#64748B', flexShrink: 0 },
    bankVal: { fontSize: 12, color: '#1E293B', maxWidth: '58%', textAlign: 'right' },
    uploadTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 10 },
    uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    uploadBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#EBF0FE', paddingVertical: 11, borderRadius: 12, gap: 7,
        borderWidth: 1, borderColor: COLORS.primary + '25',
    },
    uploadBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
    // Preview section
    previewSection: {
        marginBottom: 14,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#10B98130',
        backgroundColor: '#FAFFFD',
    },
    previewHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#E2F5EF',
    },
    previewHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previewHeaderText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    removeImgBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    },
    removeImgText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
    previewImgWrap: {
        width: '100%', height: 180,
        position: 'relative', backgroundColor: '#F1F5F9',
    },
    previewImgFull: { width: '100%', height: '100%' },
    previewZoomHint: {
        position: 'absolute', bottom: 8, right: 8,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    previewZoomText: { fontSize: 11, color: '#FFF', fontWeight: '600' },

    // Lightbox
    imgLightboxOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center', alignItems: 'center',
    },
    imgLightboxContent: {
        width: '100%', height: '100%',
        justifyContent: 'center', alignItems: 'center',
    },
    imgLightboxClose: {
        position: 'absolute', top: 52, right: 20,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
    },
    imgLightboxImg: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.65,
    },
    imgLightboxFooter: {
        position: 'absolute', bottom: 60,
        flexDirection: 'row', gap: 14,
        paddingHorizontal: 24,
    },
    imgLightboxBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 7, paddingVertical: 13, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    imgLightboxBtnText: { fontSize: 14, fontWeight: '700' },
    confirmBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
        backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, marginTop: 8,
    },
    confirmText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
});
