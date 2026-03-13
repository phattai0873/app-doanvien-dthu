import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { SIZES } from '../../constants/sizes';
import { meetingService } from '../../services/meetingService';

export const MeetingDetailScreen = ({ route, onNavigate }) => {
    const { id } = route?.params || {};
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const m = await meetingService.getMeetingDetail(id);
                
                // Mapping dữ liệu
                const date = new Date(m.meetingTime);
                const dateStr = date.toLocaleDateString('vi-VN');
                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                
                let statusKey = 'scheduled';
                if (m.status === 'Đang họp') statusKey = 'active';
                else if (m.status === 'Hoàn thành') statusKey = 'finished';
                else if (m.status === 'Hủy') statusKey = 'cancelled';

                setMeeting({
                    ...m,
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

    const handleAttendance = async () => {
        setSubmitting(true);
        try {
            await meetingService.submitAttendance(id, 'present');
            Alert.alert('Thành công', 'Đã điểm danh thành công!');
            // Refresh detail
            const data = await meetingService.getMeetingDetail(id);
            setMeeting(data);
        } catch (error) {
            Alert.alert('Lỗi', 'Điểm danh thất bại. Vui lòng thử lại.');
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
                        <Text style={styles.infoValue}>{meeting.location}</Text>
                    </View>
                </View>
            </View>

            {/* Agenda section */}
            <View style={styles.section}>
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
            </View>

            {/* Documents section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>TÀI LIỆU ĐÍNH KÈM</Text>
                <TouchableOpacity style={styles.docItem}>
                    <Icon name="FileText" size={24} color="#EF4444" />
                    <Text style={styles.docName}>Du-thao-nghi-quyet-thang-02.pdf</Text>
                    <Icon name="Download" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Attendance Action */}
            {meeting.status !== 'finished' && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.attendanceBtn, submitting && styles.disabledBtn]}
                        onPress={handleAttendance}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name="Scan" size={20} color="#FFF" />
                                <Text style={styles.attendanceBtnText}>ĐIỂM DANH NGAY</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Điểm danh bằng GPS hoặc quét mã QR tại phòng họp.</Text>
                </View>
            )}
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
    hintText: { fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }
});
