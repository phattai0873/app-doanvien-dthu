import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { WorkCard } from '../../components/cards/WorkCard';
import { COLORS } from '../../constants/colors';
import { workService } from '../../services/workService';
import { Image } from 'react-native';

const ICON_SET = {
    tintuc: require('../../../assets/iconset/tintuc.png'),
    hoctap: require('../../../assets/iconset/hoctap.png'),
    sinhhoat: require('../../../assets/iconset/sinhhoat.png'),
    doanphi: require('../../../assets/iconset/doanphi.png'),
    thidua: require('../../../assets/iconset/thidua.png'),
    vanban: require('../../../assets/iconset/vanban.png'),
    tinhnguyen: require('../../../assets/iconset/tinhnguyen.png'),
    canhan: require('../../../assets/iconset/canhan.png'),
};

export const WorkDashboardScreen = ({ onNavigate }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await workService.getWorkSummary();
                setSummary(data);
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

    const navigateTo = (screen) => {
        if (onNavigate) onNavigate(screen);
    };

    return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryRow}>
                <TouchableOpacity
                    style={[styles.summaryCard, styles.bgGradientBlue]}
                    onPress={() => navigateTo('meeting_list')}
                >
                    <View style={styles.cardIconAbs}>
                        <Icon name="Calendar" size={60} color="rgba(255,255,255,0.2)" />
                    </View>
                    <Text style={styles.summaryLabelLight}>HỌP CHI ĐOÀN TỚI</Text>
                    <Text style={styles.summaryValueLight}>{summary?.next_meeting}</Text>
                    <Text style={styles.summaryTable}>table: branch_meetings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.summaryCard, styles.bgWhite]}
                    onPress={() => navigateTo('fee_payment')}
                >
                    <View style={styles.cardIconAbs}>
                        <Icon name="Wallet" size={60} color="rgba(0,86,179,0.1)" />
                    </View>
                    <Text style={styles.summaryLabelDark}>ĐOÀN PHÍ</Text>
                    <Text style={styles.summaryValueBlue}>{summary?.unpaid_fee}</Text>
                    <Text style={styles.summaryTableDark}>table: union_fees</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>NHIỆM VỤ TRỌNG TÂM</Text>

            <View style={styles.gridContainer}>
                <View style={styles.gridRow}>
                    <WorkCard
                        isPng pngIcon={ICON_SET.sinhhoat}
                        icon="Users" bg="#EBF8FF" color="#3182CE" title="Sinh hoạt Chi đoàn" desc="Điểm danh & Tài liệu" table="branch_meetings"
                        onPress={() => navigateTo('meeting_list')}
                    />
                    <WorkCard
                        isPng pngIcon={ICON_SET.doanphi}
                        icon="Wallet" bg="#F0FFF4" color="#38A169" title="Đóng Đoàn phí" desc="Thanh toán trực tuyến" table="union_fees"
                        onPress={() => navigateTo('fee_payment')}
                    />
                </View>
                <View style={styles.gridRow}>
                    <WorkCard
                        isPng pngIcon={ICON_SET.thidua}
                        icon="Award" bg="#FFFAF0" color="#DD6B20" title="Thi đua & Trắc nghiệm" desc="Cuộc thi định kỳ" table="quiz_exams"
                        onPress={() => navigateTo('exam_list')}
                    />
                    <WorkCard
                        isPng pngIcon={ICON_SET.vanban}
                        icon="Library" bg="#E6FFFA" color="#319795" title="Kho Tài liệu" desc="Văn kiện, Nghị quyết" table="documents"
                        onPress={() => navigateTo('document_list')}
                    />
                </View>
                <View style={styles.gridRow}>
                    <WorkCard
                        isPng pngIcon={ICON_SET.hoctap}
                        icon="GraduationCap" bg="#FAF5FF" color="#805AD5" title="Học tập Lý luận" desc="Lớp bồi dưỡng" table="political_studies"
                        onPress={() => navigateTo('theory_study')}
                    />
                    <WorkCard
                        isPng pngIcon={ICON_SET.tinhnguyen}
                        icon="Compass" bg="#FFF5F5" color="#E53E3E" title="Hoạt động Tình nguyện" desc="Hoạt động xã hội" table="volunteer_activities"
                        onPress={() => navigateTo('volunteer_list')}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 12, paddingBottom: 100 }, // Reduced from 16
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 }, // Reduced from 24
    summaryCard: { flex: 1, padding: 12, borderRadius: 12, overflow: 'hidden', minHeight: 100, justifyContent: 'center' },
    bgGradientBlue: { backgroundColor: COLORS.primary },
    bgWhite: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBF8FF' },
    cardIconAbs: { position: 'absolute', right: -10, bottom: -10 },
    summaryLabelLight: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    summaryValueLight: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    summaryTable: { color: 'rgba(0,0,0,0.2)', fontSize: 8, marginTop: 4 },
    summaryLabelDark: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    summaryValueBlue: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    summaryTableDark: { color: '#E5E7EB', fontSize: 8, marginTop: 4 },
    sectionHeader: {
        fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12,
        borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: 8
    },
    gridContainer: { gap: 12 },
    gridRow: { flexDirection: 'row', gap: 12 },
});
