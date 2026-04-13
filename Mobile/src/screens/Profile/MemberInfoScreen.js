import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { InputReadOnly } from '../../components/common/InputReadOnly';
import { COLORS } from '../../constants/colors';
import { partyService } from '../../services/partyService';

export const MemberInfoScreen = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await partyService.getMemberProfile();
                setUser(data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="User" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>THÔNG TIN CÁ NHÂN</Text>
                </View>
                <InputReadOnly label="Họ tên" value={user.unionMember?.fullName} />
                <InputReadOnly label="Mã số Đoàn viên" value={user.unionMember?.memberCode} />
                <InputReadOnly label="Giới tính" value={user.unionMember?.gender === 'female' ? 'Nữ' : 'Nam'} />
                <InputReadOnly label="Ngày sinh" value={user.unionMember?.dateOfBirth ? new Date(user.unionMember.dateOfBirth).toLocaleDateString('vi-VN') : '—'} />
                <InputReadOnly label="CCCD (Mã hóa)" value={user.unionMember?.identityNumberMasked} />
                <InputReadOnly label="Dân tộc" value={user.unionMember?.ethnicity || 'Kinh'} />
                <InputReadOnly label="Tôn giáo" value={user.unionMember?.religion || 'Không'} />
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="Book" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>TRÌNH ĐỘ & CHUYÊN MÔN</Text>
                </View>
                <InputReadOnly label="Trình độ chuyên môn" value={user.unionMember?.professionalLevel || '—'} />
                <InputReadOnly label="Trình độ văn hóa" value={user.unionMember?.educationLevel || '—'} />
                <InputReadOnly label="Ngoại ngữ" value={user.unionMember?.languageLevel || '—'} />
                <InputReadOnly label="Tin học" value={user.unionMember?.itLevel || '—'} />
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="Award" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>KHEN THƯỞNG</Text>
                </View>
                {user.unionMember?.Rewards?.length > 0 ? (
                    user.unionMember.Rewards.map(r => (
                        <View key={r.id} style={styles.rewardItem}>
                            <Text style={styles.rewardTitle}>{r.title}</Text>
                            <Text style={styles.rewardDate}>{new Date(r.issuedDate).toLocaleDateString('vi-VN')}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Chưa có thông tin khen thưởng</Text>
                )}
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="Phone" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>LIÊN HỆ</Text>
                </View>
                <InputReadOnly label="Số điện thoại" value={user.phoneNumber} />
                <InputReadOnly label="Email" value={user.email} />
                <InputReadOnly label="Quê quán" value={user.unionMember?.hometown} />
                <InputReadOnly label="Thường trú" value={user.unionMember?.permanentAddress} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#374151', marginLeft: 10, letterSpacing: 0.5 },
    rewardItem: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary
    },
    rewardTitle: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
    rewardDate: { fontSize: 11, color: '#6B7280', marginTop: 4 },
    emptyText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: 10 },
});
