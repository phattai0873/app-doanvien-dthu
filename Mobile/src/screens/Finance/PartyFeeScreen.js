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
import { financeService } from '../../services/financeService';

export const PartyFeeScreen = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handlePay = (fee) => {
        Alert.alert(
            'Thanh toán Đoàn phí',
            `Xác nhận đóng đoàn phí tháng ${fee.month}/${fee.year} số tiền ${fee.amount.toLocaleString()}đ?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Thanh toán',
                    onPress: async () => {
                        try {
                            await financeService.payFee(fee.id);
                            Alert.alert('Thành công', 'Đã thanh toán đoàn phí thành công');
                            fetchData();
                        } catch (e) {
                            Alert.alert('Lỗi', 'Thanh toán thất bại');
                        }
                    }
                }
            ]
        );
    };

    const totalUnpaid = fees.filter(f => f.status === 'unpaid').length;
    const totalAmount = fees.filter(f => f.status === 'unpaid').reduce((sum, f) => sum + f.amount, 0);

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
                {fees.map(fee => (
                    <View key={fee.id} style={styles.feeItem}>
                        <View style={[styles.monthBox, { backgroundColor: fee.status === 'paid' ? '#EBF8FF' : '#FFF5F5' }]}>
                            <Text style={[styles.monthText, { color: fee.status === 'paid' ? '#3182CE' : '#E53E3E' }]}>T{fee.month}</Text>
                        </View>

                        <View style={styles.feeInfo}>
                            <Text style={styles.feeAmount}>{fee.amount.toLocaleString()}đ</Text>
                            <Text style={styles.feeStatus}>
                                {fee.status === 'paid' ? `Đã đóng: ${fee.paid_at}` : 'Chưa đóng'}
                            </Text>
                        </View>

                        {fee.status === 'unpaid' ? (
                            <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(fee)}>
                                <Text style={styles.payBtnText}>Đóng phí</Text>
                            </TouchableOpacity>
                        ) : (
                            <Icon name="CheckCircle" size={24} color="#10B981" />
                        )}
                    </View>
                ))}
            </View>

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
    }
});
