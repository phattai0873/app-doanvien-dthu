import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    Image,
    Dimensions,
    Clipboard,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { volunteerService } from '../../services/volunteerService';
import { useAuth } from '../../contexts/AuthContext';
import QRScannerModal from '../../components/QRScannerModal';

const { width } = Dimensions.get('window');

export const VolunteerListScreen = () => {
    const { user, hasAnyPermission } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('UPCOMING'); // UPCOMING, ONGOING, COMPLETED

    // Check-in Modal States
    const [isCheckinModalVisible, setCheckinModalVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [checkinCode, setCheckinCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrScannerVisible, setQrScannerVisible] = useState(false);

    // Admin Attendance States
    const [isAdminScannerVisible, setAdminScannerVisible] = useState(false);
    const [scanningActivity, setScanningActivity] = useState(null);

    // Admin QR Modal States
    const [isAdminQRVisible, setAdminQRVisible] = useState(false);
    const [adminActivity, setAdminActivity] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [refreshingCode, setRefreshingCode] = useState(false);
    const timerRef = useRef(null);

    const fetchData = async () => {
        try {
            // Backend now handles scoping automatically based on user token
            const fetchParams = {};
            const response = await volunteerService.getActivities(fetchParams);
            const acts = Array.isArray(response) ? response : (response.data || []);
            setActivities(acts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isAdminQRVisible && adminActivity?.checkinCodeExpiresAt) {
            timerRef.current = setInterval(() => {
                const diff = new Date(adminActivity.checkinCodeExpiresAt) - new Date();
                if (diff <= 0) {
                    setTimeLeft('Hết hạn');
                    clearInterval(timerRef.current);
                } else {
                    const m = Math.floor(diff / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isAdminQRVisible, adminActivity?.checkinCodeExpiresAt]);

    const handleRegister = (activity) => {
        const doRegister = async () => {
            try {
                await volunteerService.register(activity.id);
                Alert.alert('Thành công', 'Đã đăng ký tham gia.');
                fetchData();
            } catch (e) {
                Alert.alert('Lỗi', e?.message || 'Đăng ký thất bại.');
            }
        };
        Alert.alert('Đăng ký tham gia', `Xác nhận đăng ký "${activity.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng ký', onPress: doRegister }
        ]);
    };

    const handleUnregister = async (activity) => {
        Alert.alert('Hủy đăng ký', `Xác nhận hủy đăng ký "${activity.title}"?`, [
            { text: 'Quay lại', style: 'cancel' },
            { 
                text: 'Xác nhận hủy', style: 'destructive',
                onPress: async () => {
                    try {
                        await volunteerService.unregister(activity.id);
                        fetchData();
                    } catch (error) {
                        Alert.alert('Lỗi', error?.message || 'Không thể hủy.');
                    }
                }
            }
        ]);
    };

    const openCheckinModal = (activity) => {
        if (user?.UnionMember?.status !== 'approved') {
            Alert.alert('Chưa được phép', 'Hồ sơ đang chờ phê duyệt.');
            return;
        }
        setSelectedActivity(activity);
        setCheckinCode('');
        setCheckinModalVisible(true);
    };

    const handleCheckinSubmit = async () => {
        if (checkinCode.length !== 6) return Alert.alert('Lỗi', 'Nhập mã 6 ký tự.');
        setIsSubmitting(true);
        try {
            await volunteerService.checkIn(selectedActivity.id, checkinCode);
            Alert.alert('Thành công', 'Đã điểm danh.');
            setCheckinModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Lỗi', error?.message || 'Mã không đúng.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQRScan = async (code) => {
        setQrScannerVisible(false);
        setIsSubmitting(true);
        try {
            await volunteerService.checkIn(selectedActivity.id, code);
            Alert.alert('Thành công', 'Đã điểm danh.');
            setCheckinModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Lỗi', error?.message || 'Mã QR không đúng.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAdminScanner = (activity) => {
        setScanningActivity(activity);
        setAdminScannerVisible(true);
    };

    const handleAdminScan = async (scannedData) => {
        setAdminScannerVisible(false);
        setIsSubmitting(true);
        try {
            await volunteerService.markAttendance(scanningActivity.id, scannedData, 'PRESENT', 'Admin quét');
            Alert.alert('Thành công', 'Đã ghi nhận điểm danh.');
            fetchData();
        } catch (error) {
            Alert.alert('Lỗi', error?.message || 'Lỗi xử lý.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAdminQR = (activity) => {
        setAdminActivity(activity);
        setAdminQRVisible(true);
    };

    const handleRefreshAdminCode = async () => {
        setRefreshingCode(true);
        try {
            const res = await volunteerService.refreshCheckinCode(adminActivity.id);
            if (res?.checkinCode) {
                setAdminActivity(p => ({ ...p, checkinCode: res.checkinCode, checkinCodeExpiresAt: res.checkinCodeExpiresAt }));
                fetchData();
            }
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể làm mới.');
        } finally {
            setRefreshingCode(false);
        }
    };

    const renderItem = ({ item }) => {
        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '...';
        const startTime = item.startDate ? new Date(item.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        const maxParticipants = item.maxParticipants || 100;
        const registeredCount = item.participantCount || (item.ActivityParticipants?.length || 0);
        const progress = Math.min((registeredCount / maxParticipants) * 100, 100);

        const isApproved = item.status?.toUpperCase() === 'APPROVED';
        const isInProgress = item.status?.toUpperCase() === 'IN_PROGRESS';
        const isCompleted = item.status?.toUpperCase() === 'COMPLETED';
        const isOpen = isApproved || isInProgress;

        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN' || user?.role === 'CELL_ADMIN';
        const myParticipant = item.ActivityParticipants?.find(p => p.memberId === (user?.UnionMember?.id || user?.id));
        const isRegistered = !!myParticipant;
        const isCheckedIn = myParticipant?.attendanceStatus === 'PRESENT';

        return (
            <View style={styles.card}>
                <View style={[styles.cardHeader, isInProgress && { backgroundColor: '#F0FDF4' }]}>
                    <View style={styles.statusBox}>
                        <View style={styles.headerIconContainerSmall}>
                             <Icon name="Compass" size={20} color={isInProgress ? '#10B981' : COLORS.primary} />
                        </View>
                        <View style={styles.statusInfo}>
                            <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.metaRow}>
                                <Icon name="MapPin" size={12} color="#94A3B8" />
                                <Text style={styles.metaText}>{item.location || 'Chưa xác định'}</Text>
                            </View>
                        </View>
                        {isInProgress && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    <View style={[styles.infoLine, { marginTop: 15 }]}>
                         <View style={styles.miniIconCircle}><Icon name="Calendar" size={12} color="#64748B" /></View>
                         <Text style={styles.infoText}>{startDate} | {startTime}</Text>
                    </View>
                    <View style={styles.participantInfo}>
                        <View style={styles.participantRow}>
                            <Text style={styles.participantText}>{registeredCount}/{maxParticipants} Đoàn viên</Text>
                            <Text style={[styles.statusLabel, { color: isInProgress ? '#10B981' : (isApproved ? COLORS.primary : '#64748B') }]}>
                                {isInProgress ? 'Đang điểm danh' : (isApproved ? 'Nhận đăng ký' : 'Kết thúc')}
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }, isInProgress && { backgroundColor: '#10B981' }]} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.actionBtn,
                        (!isOpen || isCheckedIn || (isApproved && isRegistered)) && styles.disabledBtn,
                        (isApproved && isRegistered) && { backgroundColor: '#F1F5F9' },
                        (isInProgress && !isCheckedIn) && styles.checkinBtn
                    ]}
                    disabled={!isOpen || isCheckedIn}
                    onPress={() => {
                        if (isInProgress) openCheckinModal(item);
                        else if (isRegistered) handleUnregister(item);
                        else handleRegister(item);
                    }}
                >
                    <Icon 
                        name={isCheckedIn ? 'CheckCircle' : (isInProgress ? 'Scan' : (isRegistered ? 'XCircle' : 'UserPlus'))} 
                        size={18} 
                        color={isRegistered && !isInProgress && !isCheckedIn ? '#EF4444' : (isRegistered && isApproved ? '#94A3B8' : '#FFF')} 
                        style={{ marginRight: 8 }} 
                    />
                    <Text style={[styles.actionBtnText, isRegistered && !isInProgress && !isCheckedIn && { color: '#EF4444' }, isRegistered && isApproved && { color: '#94A3B8' }]}>
                        {isCheckedIn ? 'ĐÃ ĐIỂM DANH' : (isInProgress ? 'ĐIỂM DANH NGAY' : (isApproved ? (isRegistered ? 'HỦY ĐĂNG KÝ' : 'ĐĂNG KÝ THAM GIA') : 'ĐÃ KẾT THÚC'))}
                    </Text>
                </TouchableOpacity>

                {isAdmin && isInProgress && (
                    <View style={styles.adminActionRow}>
                        <TouchableOpacity style={styles.adminActionBtn} onPress={() => openAdminScanner(item)}>
                            <Icon name="Users" size={16} color={COLORS.primary} />
                            <Text style={styles.adminActionBtnText}>QUÉT ĐOÀN VIÊN</Text>
                        </TouchableOpacity>
                        <View style={styles.adminDivider} />
                        <TouchableOpacity style={styles.adminActionBtn} onPress={() => openAdminQR(item)}>
                            <Icon name="QrCode" size={16} color={COLORS.primary} />
                            <Text style={styles.adminActionBtnText}>MÃ ADMIN</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={activities.filter(item => {
                    const st = item.status?.toUpperCase();
                    if (activeTab === 'UPCOMING') return st === 'APPROVED';
                    if (activeTab === 'ONGOING') return st === 'IN_PROGRESS';
                    if (activeTab === 'COMPLETED') return st === 'COMPLETED' || st === 'CANCELLED';
                    return true;
                })}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.headerTitleRow}>
                            <View>
                                <Text style={styles.headerTitle}>Hoạt động</Text>
                                <Text style={styles.headerSubtitle}>Khám phá phong trào & tình nguyện</Text>
                            </View>
                            <View style={styles.headerIconContainer}><Icon name="Compass" size={24} color={COLORS.primary} /></View>
                        </View>
                        <View style={styles.tabContainer}>
                            {['UPCOMING', 'ONGOING', 'COMPLETED'].map(tab => (
                                <TouchableOpacity 
                                    key={tab}
                                    style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                        {tab === 'UPCOMING' ? 'Sắp tới' : tab === 'ONGOING' ? 'Đang diễn ra' : 'Lịch sử'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.center, { marginTop: 100 }]}>
                        <Icon name="Database" size={40} color="#CBD5E1" />
                        <Text style={{ marginTop: 12, color: '#94A3B8' }}>Chưa có hoạt động nào</Text>
                    </View>
                }
            />

            <Modal visible={isCheckinModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.inputModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.inputModalTitle}>Điểm danh</Text>
                            <TouchableOpacity onPress={() => setCheckinModalVisible(false)}><Icon name="X" size={24} color="#94A3B8" /></TouchableOpacity>
                        </View>
                        <Text style={styles.inputModalSub}>{selectedActivity?.title}</Text>
                        <TouchableOpacity style={styles.qrScanBtn} onPress={() => setQrScannerVisible(true)}>
                            <Icon name="Scan" size={24} color="#FFF" /><Text style={styles.qrScanBtnText}>Quét mã QR</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.codeInput} placeholder="MÃ 6 KÝ TỰ" placeholderTextColor="#CBD5E1"
                            value={checkinCode} onChangeText={t => setCheckinCode(t.toUpperCase())} maxLength={6}
                        />
                        <TouchableOpacity style={styles.submitModalBtn} onPress={handleCheckinSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitModalBtnText}>XÁC NHẬN</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={isAdminQRVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <View style={styles.qrModalHeader}>
                            <Text style={styles.qrModalTitle} numberOfLines={1}>{adminActivity?.title}</Text>
                            <TouchableOpacity onPress={() => setAdminQRVisible(false)}><Icon name="X" size={24} color="#94A3B8" /></TouchableOpacity>
                        </View>
                        <View style={styles.qrContainer}>
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${adminActivity?.checkinCode}` }}
                                style={[styles.qrImage, refreshingCode && { opacity: 0.1 }]}
                            />
                        </View>
                        <View style={styles.qrCodeBox}>
                            <Text style={styles.qrCodeText}>{adminActivity?.checkinCode}</Text>
                            <TouchableOpacity onPress={() => { Clipboard.setString(adminActivity?.checkinCode || ''); Alert.alert('Đã sao chép'); }}>
                                <Icon name="Copy" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.expireTag}><Text style={styles.expireText}>Hết hạn trong: {timeLeft}</Text></View>
                        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshAdminCode} disabled={refreshingCode}>
                            <Text style={styles.submitModalBtnText}>LÀM MỚI MÃ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <QRScannerModal visible={qrScannerVisible} onClose={() => setQrScannerVisible(false)} onScan={handleQRScan} title="Quét mã điểm danh" />
            <QRScannerModal visible={isAdminScannerVisible} onClose={() => setAdminScannerVisible(false)} onScan={handleAdminScan} title="Quét mã Đoàn viên" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
    listHeader: { marginBottom: 24 },
    headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' },
    headerIconContainer: { backgroundColor: '#FFF', padding: 12, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    headerIconContainerSmall: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 12 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6 },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTabButton: { backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
    tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTabText: { color: COLORS.primary },
    card: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
    cardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    statusBox: { flexDirection: 'row', alignItems: 'center' },
    statusInfo: { marginLeft: 16, flex: 1 },
    activityTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    metaText: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
    liveText: { fontSize: 10, fontWeight: '800', color: '#166534' },
    cardBody: { padding: 20 },
    description: { fontSize: 14, color: '#64748B', lineHeight: 22 },
    infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    miniIconCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    participantInfo: { marginTop: 15 },
    participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    participantText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    statusLabel: { fontSize: 11, fontWeight: '800' },
    progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
    actionBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    checkinBtn: { backgroundColor: '#059669' },
    disabledBtn: { backgroundColor: '#F8FAFC' },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    adminActionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F8FAFC', backgroundColor: '#F9FAFB' },
    adminActionBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    adminDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
    adminActionBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    inputModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    inputModalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    inputModalSub: { fontSize: 14, color: '#64748B', marginBottom: 24 },
    qrScanBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20 },
    qrScanBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
    codeInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, fontSize: 28, fontWeight: '900', textAlign: 'center', color: '#1E293B', letterSpacing: 8, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    submitModalBtn: { backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitModalBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
    qrModalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, width: '100%', alignItems: 'center' },
    qrModalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    qrModalTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#1E293B', textTransform: 'uppercase' },
    qrContainer: { padding: 24, backgroundColor: '#F8FAFC', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E2E8F0', marginBottom: 24 },
    qrImage: { width: width * 0.5, height: width * 0.5 },
    qrCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, marginBottom: 16 },
    qrCodeText: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: 8, marginRight: 16 },
    expireTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 24 },
    expireText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
    refreshBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
});
