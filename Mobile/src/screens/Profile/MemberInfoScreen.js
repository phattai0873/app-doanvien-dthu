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
            {!user?.is_verified && (
                <View style={styles.alertBox}>
                    <Icon name="AlertTriangle" size={20} color="#F97316" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.alertTitle}>Chưa xác thực CCCD Đoàn viên</Text>
                        <TouchableOpacity style={styles.alertBtn}>
                            <Text style={styles.alertBtnText}>Xác thực ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="User" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>THÔNG TIN CÁ NHÂN (ĐOÀN VIÊN)</Text>
                </View>
                <InputReadOnly label="Họ tên" value={user?.ho_ten} />
                <InputReadOnly label="Ngày sinh" value={user?.ngay_sinh} />
                <InputReadOnly label="CCCD" value={user?.cccd} />
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="Phone" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>THÔNG TIN LIÊN HỆ</Text>
                </View>
                <InputReadOnly label="Số điện thoại" value={user?.sdt} />
                <InputReadOnly label="Email" value={user?.email} />
                <InputReadOnly label="Địa chỉ" value={user?.dia_chi} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    alertBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF7ED',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFEDD5'
    },
    alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#C2410C' },
    alertBtn: {
        backgroundColor: '#F97316',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 8
    },
    alertBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginLeft: 8 },
});
