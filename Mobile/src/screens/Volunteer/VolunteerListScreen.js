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
import { authService } from '../../services/authService';
import QRScannerModal from '../../components/QRScannerModal';

const { width } = Dimensions.get('window');

export const VolunteerListScreen = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    
    // Check-in Modal States
    const [isCheckinModalVisible, setCheckinModalVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [checkinCode, setCheckinCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrScannerVisible, setQrScannerVisible] = useState(false);

    // Admin QR Modal States
    const [isAdminQRVisible, setAdminQRVisible] = useState(false);
    const [adminActivity, setAdminActivity] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [refreshingCode, setRefreshingCode] = useState(false);
    const timerRef = useRef(null);

    const fetchData = async () => {
        try {
            const currentUserInfo = await authService.getCurrentUser();
            const currentUser = currentUserInfo;
            if (currentUser && currentUser.Roles && currentUser.Roles.length > 0) {
                currentUser.role = currentUser.Roles[0].code;
            }
            setUser(currentUser);

            const fetchParams = {};
            if (currentUser && currentUser.UnionMember) {
                const member = currentUser.UnionMember;
                // Fetch activities for the branch (Faculty) plus School-wide ones
                const branchId = member.unionBranchId || member.UnionCell?.unionBranchId;
                if (branchId) fetchParams.unionBranchId = branchId;
                if (member.unionCellId) fetchParams.unionCellId = member.unionCellId;
            }

            const acts = await volunteerService.getActivities(fetchParams);
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

    // Timer for Admin QR expiration
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
        console.log('[Mobile] Registering for activity:', activity.id, activity.title);
        
        const doRegister = async () => {
            console.log('[Mobile] User confirmed registration, calling API...');
            try {
                const response = await volunteerService.register(activity.id);
                console.log('[Mobile] Registration API Success:', response);
                if (Platform.OS === 'web') {
                    alert('Thành công: Đã gửi yêu cầu đăng ký tham gia hoặc hệ thống đã tự duyệt hồ sơ.');
                } else {
                    Alert.alert('Thành công', 'Đã gửi yêu cầu đăng ký tham gia hoặc hệ thống đã tự duyệt hồ sơ.');
                }
                fetchData();
            } catch (e) {
                console.error('[Mobile] Registration API Error:', e);
                const msg = e?.message || e?.response?.data?.message || 'Đăng ký thất bại.';
                if (Platform.OS === 'web') alert('Lỗi: ' + msg);
                else Alert.alert('Lỗi', msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Đồng chí muốn đăng ký tham gia hoạt động "${activity.title}"?`)) {
                doRegister();
            }
        } else {
            Alert.alert(
                'Đăng ký tham gia',
                `Đồng chí muốn đăng ký tham gia hoạt động "${activity.title}"?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng ký', onPress: doRegister }
                ]
            );
        }
    };

    const openCheckinModal = (activity) => {
        // Kiểm tra permission
        if (user?.UnionMember?.status !== 'approved') {
            Alert.alert(
                'Chưa được phép',
                'Hồ sơ của bạn đang chờ phê duyệt. Bạn không thể thực hiện điểm danh lúc này.'
            );
            return;
        }
        setSelectedActivity(activity);
        setCheckinCode('');
        setCheckinModalVisible(true);
    };

    const handleCheckinSubmit = async () => {
        if (!checkinCode.trim() || checkinCode.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập đúng 6 ký tự mã điểm danh.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await volunteerService.checkIn(selectedActivity.id, checkinCode);
            Alert.alert('Thành công', 'Đã lưu điểm danh cho hoạt động này.');
            setCheckinModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(
                'Lỗi điểm danh',
                error?.message || 'Mã điểm danh không đúng hoặc đã hết hạn.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQRScan = async (code) => {
        setQrScannerVisible(false);
        setCheckinCode(code);
        
        // Tự động submmit sau khi quét được mã
        setIsSubmitting(true);
        try {
            await volunteerService.checkIn(selectedActivity.id, code);
            Alert.alert('Thành công', 'Đã lưu điểm danh cho hoạt động này.');
            setCheckinModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert(
                'Lỗi điểm danh',
                error?.message || 'Mã điểm danh không đúng hoặc đã hết hạn.'
            );
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
            const response = await volunteerService.refreshCheckinCode(adminActivity.id);
            if (response && response.checkinCode) {
                setAdminActivity(prev => ({
                    ...prev,
                    checkinCode: response.checkinCode,
                    checkinCodeExpiresAt: response.checkinCodeExpiresAt
                }));
                Alert.alert('Thành công', 'Đã làm mới mã điểm danh');
                fetchData(); // Sync list in background
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể làm mới mã');
        } finally {
            setRefreshingCode(false);
        }
    };

    const renderItem = ({ item }) => {
        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '...';
        const startTime = item.startDate ? new Date(item.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        const maxParticipants = item.maxParticipants || 100;
        const registeredCount = item.participantCount || (item.ActivityParticipants ? item.ActivityParticipants.length : 0);
        const progress = Math.min((registeredCount / maxParticipants) * 100, 100);
        
        const isApproved = item.status === 'APPROVED' || item.status === 'approved';
        const isInProgress = item.status === 'IN_PROGRESS' || item.status === 'in_progress';
        const isOpen = isApproved || isInProgress;

        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN' || user?.role === 'CELL_ADMIN';
        const memberIdToCheck = user?.UnionMember?.id || user?.id;
        const myParticipant = item.ActivityParticipants?.find(p => p.memberId === memberIdToCheck);
        const isRegistered = !!myParticipant;
        const isCheckedIn = myParticipant?.attendanceStatus === 'PRESENT';

        console.log(`[Mobile-UI] Activity: ${item.title}, Status: ${item.status}, isOpen: ${isOpen}, isRegistered: ${isRegistered}, isCheckedIn: ${isCheckedIn}`);

        return (
            <View style={styles.card}>
                <View style={[styles.cardHeader, isInProgress && { backgroundColor: '#F0FDF4' }]}>
                    <View style={styles.statusBox}>
                        <Icon name="Compass" size={24} color={isInProgress ? '#10B981' : COLORS.primary} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.metaRow}>
                                <Icon name="MapPin" size={12} color="#9CA3AF" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.location || 'Chưa xác định'}</Text>
                            </View>
                        </View>
                        {isInProgress && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>ĐANG DIỄN RA</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                    <View style={[styles.infoLine, { marginTop: 12 }]}>
                        <Icon name="Calendar" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>Bắt đầu: {startDate} {startTime}</Text>
                    </View>

                    <View style={styles.participantInfo}>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${progress}%` },
                                    isInProgress && { backgroundColor: '#10B981' }
                                ]}
                            />
                        </View>
                        <View style={styles.participantRow}>
                            <Text style={styles.participantText}>Đã đăng ký: {registeredCount}/{maxParticipants}</Text>
                            <Text style={[styles.statusLabel, { color: isInProgress ? '#10B981' : (isOpen ? COLORS.primary : '#EF4444') }]}>
                                {isInProgress ? 'ĐANG ĐIỂM DANH' : (isOpen ? 'ĐANG NHẬN' : 'ĐÃ ĐÓNG')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Primary CTA Button */}
                <TouchableOpacity
                    style={[
                        styles.actionBtn, 
                        (!isOpen || (isApproved && isRegistered) || isCheckedIn) && styles.disabledBtn,
                        (isInProgress && !isCheckedIn) && styles.checkinBtn
                    ]}
                    disabled={!isOpen || (isApproved && isRegistered) || isCheckedIn}
                    onPress={() => {
                        if (isInProgress) openCheckinModal(item);
                        else handleRegister(item);
                    }}
                >
                    <Icon name={isCheckedIn ? 'CheckCircle' : (isInProgress ? 'Scan' : (isRegistered && !isInProgress ? 'Check' : 'UserPlus'))} size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>
                        {isCheckedIn ? 'ĐÃ ĐIỂM DANH' : (isInProgress ? 'ĐIỂM DANH THAM GIA' : (isApproved ? (isRegistered ? 'ĐÃ ĐĂNG KÝ' : 'ĐĂNG KÝ NGAY') : 'HẾT HẠN / ĐÃ ĐÓNG'))}
                    </Text>
                </TouchableOpacity>

                {/* Secondary Admin Action */}
                {isAdmin && isInProgress && item.checkinCode && (
                    <TouchableOpacity
                        style={styles.adminActionBtn}
                        onPress={() => openAdminQR(item)}
                    >
                        <Icon name="QrCode" size={18} color={COLORS.primary} />
                        <Text style={styles.adminActionBtnText}>MÃ QR CHECK-IN (ADMIN)</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

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
                        <Text style={styles.headerSubtitle}>Đăng ký và điểm danh trực tiếp các hoạt động tại đây.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.center, { marginTop: 60 }]}>
                        <Icon name="Compass" size={48} color="#D1D5DB" />
                        <Text style={{ marginTop: 16, color: '#6B7280' }}>Chưa có hoạt động nào trong danh sách</Text>
                    </View>
                }
            />

            {/* Check-in Input Modal */}
            <Modal visible={isCheckinModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.inputModalContent}>
                        <View style={styles.modalIconHeader}>
                            <Icon name="Scan" size={32} color={COLORS.primary} />
                        </View>
                        <Text style={styles.inputModalTitle}>Điểm danh Hoạt động</Text>
                        <Text style={styles.inputModalSub}>{selectedActivity?.title}</Text>
                        
                        <TouchableOpacity 
                            style={styles.qrScanBtn} 
                            onPress={() => setQrScannerVisible(true)}
                        >
                            <Icon name="QrCode" size={24} color="#FFF" />
                            <Text style={styles.qrScanBtnText}>Quét mã QR</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>Hoặc nhập mã</Text>
                            <View style={styles.line} />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nhập mã xác nhận (6 ký tự)</Text>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="Ví dụ: A1B2C3"
                                placeholderTextColor="#9CA3AF"
                                value={checkinCode}
                                onChangeText={(text) => setCheckinCode(text.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity 
                                style={styles.cancelModalBtn} 
                                onPress={() => setCheckinModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.submitModalBtn, isSubmitting && { opacity: 0.7 }]} 
                                onPress={handleCheckinSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitModalBtnText}>Xác nhận</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Admin QR Detail Modal */}
            <Modal visible={isAdminQRVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <View style={styles.qrModalHeader}>
                            <Text style={styles.qrModalTitle} numberOfLines={1}>{adminActivity?.title}</Text>
                            <TouchableOpacity onPress={() => setAdminQRVisible(false)}>
                                <Icon name="X" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.qrLabel}>Sử dụng mã dưới đây để cấp cho người tham dự</Text>

                        <View style={styles.qrContainer}>
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${adminActivity?.checkinCode}` }}
                                style={[styles.qrImage, refreshingCode && { opacity: 0.2 }]}
                            />
                            {refreshingCode && <ActivityIndicator style={styles.absoluteCenter} color={COLORS.primary} size="large" />}
                        </View>

                        <View style={styles.qrCodeBox}>
                            <Text style={styles.qrCodeText}>{adminActivity?.checkinCode}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Clipboard.setString(adminActivity?.checkinCode || '');
                                    Alert.alert('Đã sao chép', 'Mã điểm danh đã được sao chép vào bộ nhớ tạm.');
                                }}
                                style={styles.copyBtn}
                            >
                                <Icon name="Copy" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {adminActivity?.checkinCodeExpiresAt && (
                            <View style={styles.expireTagBox}>
                                <View style={styles.expireTag}>
                                    <Icon name="Clock" size={12} color="#D97706" style={{ marginRight: 4 }} />
                                    <Text style={styles.expireText}>Hết hạn trong: {timeLeft}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={[styles.submitModalBtn, { flex: 2, marginRight: 10 }]}
                                onPress={handleRefreshAdminCode}
                                disabled={refreshingCode}
                            >
                                <Icon name="RotateCw" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitModalBtnText}>Tạo mã mới</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <QRScannerModal
                visible={qrScannerVisible}
                onClose={() => setQrScannerVisible(false)}
                onScan={handleQRScan}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    qrScanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary || '#da251d',
        paddingVertical: 12,
        borderRadius: 12,
        marginVertical: 15,
        width: '100%',
        gap: 10,
    },
    qrScanBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        gap: 10,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    listContent: { padding: 16, paddingBottom: 100 },
    listHeader: { marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 20 },
    
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
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    statusBox: { flexDirection: 'row', alignItems: 'flex-start' },
    statusInfo: { marginLeft: 16, flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', lineHeight: 22 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    metaText: { fontSize: 12, color: '#6B7280', marginLeft: 4, flex: 1 },
    liveBadge: { position: 'absolute', top: -4, right: -4, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 4 },
    liveText: { fontSize: 9, fontWeight: 'bold', color: '#EF4444' },

    cardBody: { padding: 16 },
    description: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
    infoLine: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 13, color: '#374151', marginLeft: 8, fontWeight: '500' },
    participantInfo: { marginTop: 16 },
    progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
    participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    participantText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    statusLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    actionBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    checkinBtn: { backgroundColor: '#10B981' },
    disabledBtn: { backgroundColor: '#D1D5DB' },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
    
    adminActionBtn: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    adminActionBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 8 },

    // Input Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    inputModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', elevation: 5 },
    modalIconHeader: { alignItems: 'center', marginBottom: 16 },
    inputModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    inputModalSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 10 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    codeInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', letterSpacing: 4 },
    modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cancelModalBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelModalBtnText: { color: '#4B5563', fontWeight: 'bold', fontSize: 14 },
    submitModalBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    submitModalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    // QR Admin Modal
    qrModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', elevation: 5 },
    qrModalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    qrModalTitle: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginRight: 16 },
    qrLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
    qrContainer: { padding: 16, backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', marginBottom: 20, position: 'relative' },
    qrImage: { width: width * 0.45, height: width * 0.45 },
    absoluteCenter: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -15 }, { translateY: -15 }] },
    qrCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
    qrCodeText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 6, marginRight: 16 },
    copyBtn: { padding: 8, backgroundColor: '#EEF2FF', borderRadius: 10 },
    expireTagBox: { alignItems: 'center', marginTop: 16 },
    expireTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    expireText: { fontSize: 12, fontWeight: 'bold', color: '#D97706' },
});
