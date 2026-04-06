import React, { useState, useEffect, useRef } from 'react';
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
    Dimensions,
    Clipboard,
    TextInput
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { SIZES } from '../../constants/sizes';
import { meetingService } from '../../services/meetingService';
import { authService } from '../../services/authService';
import QRScannerModal from '../../components/QRScannerModal';

const { width } = Dimensions.get('window');

export const MeetingDetailScreen = ({ route, onNavigate }) => {
    const { id } = route?.params || {};
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const timerRef = useRef(null);

    // Checkin modal state
    const [isCheckinModalVisible, setCheckinModalVisible] = useState(false);
    const [checkinCode, setCheckinCode] = useState('');
    const [qrScannerVisible, setQrScannerVisible] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, userData] = await Promise.all([
                    meetingService.getMeetingDetail(id),
                    authService.getCurrentUser()
                ]);

                // user object returned has a Roles array
                const currentUser = userData;
                if (currentUser && currentUser.Roles && currentUser.Roles.length > 0) {
                    currentUser.role = currentUser.Roles[0].code; // gán role string để dễ dùng
                }

                setUser(currentUser);

                // Mapping dữ liệu
                const meetingData = m.data || m;
                const date = new Date(meetingData.meetingTime);
                const dateStr = date.toLocaleDateString('vi-VN');
                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                let statusKey = 'scheduled';
                if (meetingData.status === 'IN_PROGRESS') statusKey = 'active';
                else if (meetingData.status === 'COMPLETED') statusKey = 'finished';
                else if (meetingData.status === 'CANCELLED') statusKey = 'cancelled';
                else if (meetingData.status === 'SCHEDULED') statusKey = 'scheduled';

                setMeeting({
                    ...meetingData,
                    status: statusKey,
                    start_time: `${dateStr} - ${timeStr}`
                });
            } catch (error) {
                console.error('Error fetching meeting detail:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    useEffect(() => {
        if (showQR && meeting?.checkinCodeExpiresAt) {
            timerRef.current = setInterval(() => {
                const diff = new Date(meeting.checkinCodeExpiresAt) - new Date();
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
    }, [showQR, meeting?.checkinCodeExpiresAt]);

    const handleRefreshCode = async () => {
        setRefreshing(true);
        try {
            // Cần thêm refreshCheckinCode vào meetingService của Mobile
            const response = await meetingService.refreshCheckinCode(id);
            if (response && response.success) {
                setMeeting(prev => ({
                    ...prev,
                    checkinCode: response.data.checkinCode,
                    checkinCodeExpiresAt: response.data.checkinCodeExpiresAt
                }));
                Alert.alert('Thành công', 'Đã làm mới mã điểm danh');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể làm mới mã');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAttendance = async () => {
        // Kiểm tra trạng thái hồ sơ đoàn viên
        if (user?.UnionMember?.status !== 'approved') {
            Alert.alert(
                'Chưa được phép',
                'Hồ sơ của bạn đang chờ quản trị viên phê duyệt. Đồng chí vui lòng đợi sau khi hồ sơ được xác thực để thực hiện điểm danh.'
            );
            return;
        }

        if (!checkinCode.trim() || checkinCode.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập đúng 6 ký tự mã xác nhận.');
            return;
        }

        setSubmitting(true);
        try {
            await meetingService.submitAttendance(id, checkinCode);
            Alert.alert('Thành công', 'Đã điểm danh thành công!');
            setCheckinModalVisible(false);
            // Refresh detail
            const res = await meetingService.getMeetingDetail(id);
            setMeeting(res.data || res);
        } catch (error) {
            Alert.alert('Lỗi điểm danh', error?.response?.data?.message || 'Điểm danh thất bại. Mã không hợp lệ hoặc đã hết hạn.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQRScan = async (code) => {
        setQrScannerVisible(false);
        setCheckinCode(code);
        
        // Tự động submit sau khi quét được mã
        setSubmitting(true);
        try {
            await meetingService.submitAttendance(id, code);
            Alert.alert('Thành công', 'Đã điểm danh thành công!');
            setCheckinModalVisible(false);
            // Refresh detail
            const res = await meetingService.getMeetingDetail(id);
            setMeeting(res.data || res);
        } catch (error) {
            Alert.alert('Lỗi điểm danh', error?.response?.data?.message || 'Điểm danh thất bại. Mã không hợp lệ hoặc đã hết hạn.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!meeting) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy thông tin cuộc họp</Text>
            </View>
        );
    }

    const myAttendance = meeting.Attendances?.find(a => a.unionMemberId === user?.UnionMember?.id);
    const isCheckedIn = myAttendance?.status === 'PRESENT';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header Info */}
            <View style={styles.header}>
                <Text style={styles.title}>{meeting.title}</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.badge, { backgroundColor: meeting.status === 'scheduled' ? '#3B82F6' : '#10B981' }]}>
                        <Text style={styles.badgeText}>{meeting.status === 'scheduled' ? 'Sắp diễn ra' : 'Đang diễn ra'}</Text>
                    </View>
                    <Text style={styles.idText}>Mã: CM-{meeting.id}</Text>
                </View>
            </View>

            {/* Time & Location Card */}
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="Calendar" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.infoTextGroup}>
                        <Text style={styles.infoLabel}>Thời gian</Text>
                        <Text style={styles.infoValue}>{meeting.start_time}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="MapPin" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.infoTextGroup}>
                        <Text style={styles.infoLabel}>Địa điểm</Text>
                        <Text style={styles.infoValue}>{meeting.Location?.name || meeting.location || '—'}</Text>
                    </View>
                </View>
            </View>

            {/* Agenda section */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>NỘI DUNG / CHƯƠNG TRÌNH</Text>
                <View style={styles.agendaBox}>
                    <Text style={styles.description}>{meeting.description}</Text>
                    <View style={styles.agendaItem}>
                        <Text style={styles.agendaDot}>•</Text>
                        <Text style={styles.agendaText}>Ổn định tổ chức, tuyên bố lý do.</Text>
                    </View>
                    <View style={styles.agendaItem}>
                        <Text style={styles.agendaDot}>•</Text>
                        <Text style={styles.agendaText}>Thông báo tình hình đảng viên, cử thư ký.</Text>
                    </View>
                    <View style={styles.agendaItem}>
                        <Text style={styles.agendaDot}>•</Text>
                        <Text style={styles.agendaText}>Thông qua chương trình sinh hoạt.</Text>
                    </View>
                </View>
            </View> */}

            {/* Documents section */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>TÀI LIỆU ĐÍNH KÈM</Text>
                <TouchableOpacity style={styles.docItem}>
                    <Icon name="FileText" size={24} color="#EF4444" />
                    <Text style={styles.docName}>Du-thao-nghi-quyet-thang-02.pdf</Text>
                    <Icon name="Download" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View> */}

            {/* Attendance Action */}
            {meeting.status !== 'finished' && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[
                            styles.attendanceBtn, 
                            (meeting.status !== 'active' || isCheckedIn) && styles.disabledBtn
                        ]}
                        onPress={() => meeting.status === 'active' ? setCheckinModalVisible(true) : Alert.alert('Thông báo', 'Cuộc họp chưa diễn ra hoặc đã kết thúc.')}
                        disabled={meeting.status !== 'active' || isCheckedIn}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name={isCheckedIn ? 'CheckCircle' : 'Scan'} size={20} color="#FFF" />
                                <Text style={styles.attendanceBtnText}>
                                    {isCheckedIn ? 'ĐÃ ĐIỂM DANH' : 'ĐIỂM DANH NGAY'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Admin QR Action */}
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN' || user?.role === 'CELL_ADMIN') && meeting.status === 'active' && meeting.checkinCode && (
                        <TouchableOpacity
                            style={[styles.qrBtn, { marginTop: 12 }]}
                            onPress={() => setShowQR(true)}
                        >
                            <Icon name="QrCode" size={20} color={COLORS.primary} />
                            <Text style={styles.qrBtnText}>HIỂN THỊ MÃ QUÉT (ADMIN)</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.hintText}>Sử dụng mã do Bí thư cung cấp để điểm danh cuộc họp.</Text>
                </View>
            )}

            {/* Check-in Input Modal */}
            <Modal visible={isCheckinModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.inputModalContent}>
                        <View style={styles.modalIconHeader}>
                            <Icon name="Scan" size={32} color={COLORS.primary} />
                        </View>
                        <Text style={styles.inputModalTitle}>Điểm danh Cuộc họp</Text>
                        <Text style={styles.inputModalSub}>{meeting?.title}</Text>

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
                                style={[styles.submitModalBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleAttendance}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitModalBtnText}>Xác nhận</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* QR Modal for Admin */}
            <Modal
                visible={showQR}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowQR(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mã điểm danh: {meeting.title}</Text>
                            <TouchableOpacity onPress={() => setShowQR(false)}>
                                <Icon name="X" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrContainer}>
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${meeting.checkinCode}` }}
                                style={[styles.qrImage, refreshing && { opacity: 0.3 }]}
                            />
                            {refreshing && <ActivityIndicator style={styles.absoluteCenter} color={COLORS.primary} size="large" />}
                        </View>

                        <Text style={styles.qrLabel}>Mã xác nhận</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={styles.qrCodeText}>{meeting.checkinCode}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Clipboard.setString(meeting.checkinCode);
                                    Alert.alert('Thành công', 'Đã sao chép mã điểm danh');
                                }}
                                style={{ backgroundColor: '#F3F4F6', p: 8, borderRadius: 8, padding: 8 }}
                            >
                                <Icon name="Copy" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {meeting.checkinCodeExpiresAt && (
                            <View style={{ alignItems: 'center', marginTop: 12 }}>
                                <View style={styles.expireTag}>
                                    <Text style={styles.expireText}>Hết hạn trong: {timeLeft}</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: 'bold' }}>
                                    Hiệu lực đến: {new Date(meeting.checkinCodeExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(meeting.checkinCodeExpiresAt).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.refreshBtn}
                                onPress={handleRefreshCode}
                                disabled={refreshing}
                            >
                                <Icon name="RotateCw" size={18} color="#FFF" />
                                <Text style={styles.refreshBtnText}>Làm mới mã</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQR(false)}>
                                <Text style={styles.closeBtnText}>Đóng</Text>
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', lineHeight: 28 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    idText: { fontSize: 13, color: '#9CA3AF', marginLeft: 12 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    infoTextGroup: { marginLeft: 16 },
    infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' },
    infoValue: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1, marginBottom: 12 },
    agendaBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    description: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 12 },
    agendaItem: { flexDirection: 'row', marginBottom: 6 },
    agendaDot: { color: COLORS.primary, fontWeight: 'bold', marginRight: 8 },
    agendaText: { flex: 1, fontSize: 14, color: '#4B5563' },
    docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    docName: { flex: 1, marginLeft: 12, fontSize: 14, color: '#374151' },
    actionContainer: { marginTop: 32, alignItems: 'center' },
    attendanceBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    attendanceBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    disabledBtn: { opacity: 0.7 },
    hintText: { fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
    qrBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: '#FFF'
    },
    qrBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
    // Input Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    inputModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', elevation: 5 },
    qrScanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary || '#da251d',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 15,
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

    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        elevation: 5
    },
    modalHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    modalTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase'
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E5E7EB',
        marginBottom: 20,
        position: 'relative'
    },
    qrImage: {
        width: width * 0.5,
        height: width * 0.5
    },
    qrLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4
    },
    qrCodeText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 8
    },
    expireTag: {
        marginTop: 12,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    expireText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#D97706'
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 32,
        width: '100%'
    },
    refreshBtn: {
        flex: 2,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    refreshBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14
    },
    closeBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    closeBtnText: {
        color: '#4B5563',
        fontWeight: 'bold',
        fontSize: 14
    },
    absoluteCenter: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -15 }, { translateY: -15 }]
    }
});
