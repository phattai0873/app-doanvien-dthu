import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { InputReadOnly } from '../../components/common/InputReadOnly';
import { COLORS } from '../../constants/colors';
import { partyService } from '../../services/partyService';

export const OrgInfoScreen = () => {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await partyService.getOrgInfo();
                setInfo(data);
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

    const { cell, committee } = info || {};

    return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.orgCard}>
                <Icon name="Users" size={40} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.orgName}>{cell?.ten_chi_bo}</Text>
                <Text style={styles.orgCode}>{cell?.ma_chi_bo}</Text>
                <View style={styles.divider} />
                <View style={styles.orgRow}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.orgLabel}>THÀNH LẬP</Text>
                        <Text style={styles.orgValue}>{cell?.ngay_thanh_lap}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.orgLabel}>ĐOÀN VIÊN</Text>
                        <Text style={styles.orgValue}>{cell?.so_dang_vien}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionCard}>
                <InputReadOnly label="Bí thư Chi đoàn" value={cell?.bi_thu_ten} />
                <InputReadOnly label="Đơn vị trực thuộc" value={cell?.don_vi_truc_thuoc} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    orgCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    orgName: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
    orgCode: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%', marginVertical: 16 },
    orgRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    orgLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
    orgValue: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 4 },
    sectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
});
