import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

const { width } = Dimensions.get('window');

const STATS_DATA = [
    { label: 'Tổng đoàn viên', value: '128', icon: 'people', color: '#4F46E5', bg: '#EEF2FF', change: '+3 tháng này' },
    { label: 'Đã đóng phí', value: '95%', icon: 'wallet', color: '#10B981', bg: '#ECFDF5', change: '+5% so với kỳ trước' },
    { label: 'Buổi sinh hoạt', value: '12', icon: 'calendar', color: '#F59E0B', bg: '#FFFBEB', change: 'trong năm học' },
    { label: 'Tin đã đăng', value: '47', icon: 'newspaper', color: '#EF4444', bg: '#FEF2F2', change: 'tổng cộng' },
];

const ACTIVITY_RATE = [
    { label: 'Tham gia hoạt động', percent: 87, color: '#4F46E5' },
    { label: 'Đóng đoàn phí đúng hạn', percent: 95, color: '#10B981' },
    { label: 'Hoàn thành học lý luận', percent: 72, color: '#F59E0B' },
    { label: 'Tham gia tình nguyện', percent: 63, color: '#8B5CF6' },
];

const MONTHLY_DATA = [
    { month: 'T9', activities: 4, attendance: 38 },
    { month: 'T10', activities: 5, attendance: 42 },
    { month: 'T11', activities: 3, attendance: 35 },
    { month: 'T12', activities: 2, attendance: 28 },
    { month: 'T1', activities: 1, attendance: 20 },
    { month: 'T2', activities: 3, attendance: 36 },
    { month: 'T3', activities: 2, attendance: 31 },
];

const maxAttendance = Math.max(...MONTHLY_DATA.map(d => d.attendance));

function StatBigCard({ label, value, icon, color, bg, change }) {
    return (
        <View style={[styles.bigCard, { borderLeftColor: color }]}>
            <View style={[styles.bigCardIcon, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.bigCardValue}>{value}</Text>
                <Text style={styles.bigCardLabel}>{label}</Text>
                <Text style={[styles.bigCardChange, { color: color }]}>{change}</Text>
            </View>
        </View>
    );
}

function ProgressBar({ label, percent, color }) {
    return (
        <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{label}</Text>
                <Text style={[styles.progressPct, { color }]}>{percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

export const AdminStatisticsScreen = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: SIZES.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

            {/* Summary Cards */}
            <Text style={styles.sectionTitle}>Tổng quan</Text>
            {STATS_DATA.map(s => (
                <StatBigCard key={s.label} {...s} />
            ))}

            {/* Activity Rate */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Tỉ lệ tham gia</Text>
                </View>
                {ACTIVITY_RATE.map(r => (
                    <ProgressBar key={r.label} {...r} />
                ))}
            </View>

            {/* Monthly Chart (simple bar) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="stats-chart-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Bảng điểm danh theo tháng</Text>
                </View>
                <View style={styles.chartContainer}>
                    {MONTHLY_DATA.map(d => (
                        <View key={d.month} style={styles.bar}>
                            <Text style={styles.barValue}>{d.attendance}</Text>
                            <View style={[styles.barFill, { height: (d.attendance / maxAttendance) * 100, backgroundColor: COLORS.primary }]} />
                            <Text style={styles.barLabel}>{d.month}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.chartNote}>* Số lượt tham gia tích lũy</Text>
            </View>

            {/* Gender Ratio */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="pie-chart-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Cơ cấu Đoàn viên</Text>
                </View>
                <View style={styles.genderRow}>
                    {[
                        { label: 'Nam', value: 72, color: '#4F46E5' },
                        { label: 'Nữ', value: 56, color: '#EC4899' },
                    ].map(g => (
                        <View key={g.label} style={styles.genderCard}>
                            <Text style={[styles.genderValue, { color: g.color }]}>{g.value}</Text>
                            <Text style={styles.genderLabel}>{g.label}</Text>
                            <View style={[styles.genderBar, { backgroundColor: g.color + '30' }]}>
                                <View style={[styles.genderFill, { width: `${(g.value / 128) * 100}%`, backgroundColor: g.color }]} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Export button */}
            <TouchableOpacity style={styles.exportBtn}>
                <Ionicons name="download-outline" size={18} color={COLORS.white} />
                <Text style={styles.exportText}>Xuất báo cáo PDF</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    sectionTitle: { fontSize: SIZES.fontLg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SIZES.sm },
    bigCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm,
        borderLeftWidth: 4, elevation: 1, borderWidth: 1, borderColor: COLORS.gray200,
    },
    bigCardIcon: { width: 46, height: 46, borderRadius: SIZES.radiusSm, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.md },
    bigCardValue: { fontSize: SIZES.fontXxl, fontWeight: '900', color: COLORS.textPrimary },
    bigCardLabel: { fontSize: SIZES.fontSm, color: COLORS.gray500, fontWeight: '500' },
    bigCardChange: { fontSize: SIZES.fontXs, fontWeight: '700', marginTop: 2 },
    card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.gray200, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.md, gap: 8 },
    cardTitle: { fontSize: SIZES.fontLg, fontWeight: '800', color: COLORS.textPrimary },
    progressItem: { marginBottom: SIZES.sm },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: SIZES.fontSm, color: COLORS.gray700, fontWeight: '500' },
    progressPct: { fontSize: SIZES.fontSm, fontWeight: '800' },
    progressTrack: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 },
    bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barFill: { width: 24, borderRadius: 4 },
    barValue: { fontSize: SIZES.fontXs, color: COLORS.gray500, marginBottom: 4 },
    barLabel: { fontSize: SIZES.fontXs, color: COLORS.gray500, marginTop: 6 },
    chartNote: { fontSize: SIZES.fontXs, color: COLORS.gray400, textAlign: 'center', marginTop: SIZES.sm },
    genderRow: { flexDirection: 'row', gap: 12 },
    genderCard: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: SIZES.radiusMd, padding: SIZES.md },
    genderValue: { fontSize: SIZES.fontXl, fontWeight: '900' },
    genderLabel: { fontSize: SIZES.fontSm, color: COLORS.gray500, fontWeight: '600', marginBottom: 8 },
    genderBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    genderFill: { height: 8, borderRadius: 4 },
    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: SIZES.md, gap: 8, marginTop: SIZES.sm },
    exportText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.fontMd },
});
