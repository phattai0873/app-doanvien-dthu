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

const StatCard = ({ title, value, icon, color, bg }) => (
    <View style={[styles.statCard, { backgroundColor: bg || COLORS.white }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={styles.statLabel}>{title}</Text>
            <Text style={[styles.statValue, { color: color }]}>{value}</Text>
        </View>
    </View>
);

const QuickAction = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={28} color={COLORS.white} />
        </View>
        <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
);

export const AdminDashboardScreen = ({ navigation }) => {
    const [stats, setStats] = React.useState({
        members: 0,
        cells: 0,
        activities: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { branchService } = require('../../services/branchService');
            const data = await branchService.getBranchStats();
            // data check if it has 'counts'
            if (data && data.counts) {
                setStats({
                    members: data.counts.members || 0,
                    cells: data.counts.cells || 0,
                    activities: data.counts.activities || 0
                });
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Summary Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tổng quan khoa/đơn vị</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Đoàn viên"
                        value={stats.members.toString()}
                        icon="people"
                        color="#3182CE"
                    />
                    <StatCard
                        title="Chi đoàn"
                        value={stats.cells.toString()}
                        icon="business"
                        color="#38A169"
                    />
                    <StatCard
                        title="Hoạt động"
                        value={stats.activities.toString()}
                        icon="rocket"
                        color="#E53E3E"
                    />
                    <StatCard
                        title="Tin mới"
                        value="5"
                        icon="newspaper"
                        color="#D69E2E"
                    />
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quản lý khoa/đơn vị</Text>
                <View style={styles.actionsGrid}>
                    <QuickAction
                        title="Đoàn viên"
                        icon="people"
                        color="#3182CE"
                        onPress={() => navigation.navigate('MemberMgmt')}
                    />
                    <QuickAction
                        title="Chi đoàn"
                        icon="business"
                        color="#38A169"
                        onPress={() => navigation.navigate('CellMgmt')}
                    />
                    <QuickAction
                        title="Lịch họp"
                        icon="calendar"
                        color="#D69E2E"
                        onPress={() => navigation.navigate('MeetingCreate')}
                    />
                    <QuickAction
                        title="Điểm danh QR"
                        icon="qr-code"
                        color="#805AD5"
                        onPress={() => navigation.navigate('AttendanceMgmt')}
                    />
                    <QuickAction
                        title="Đoàn phí"
                        icon="wallet"
                        color="#ED8936"
                        onPress={() => navigation.navigate('FeeMgmt')}
                    />
                    <QuickAction
                        title="Thống kê"
                        icon="bar-chart"
                        color="#48BB78"
                        onPress={() => navigation.navigate('StatisticsMgmt')}
                    />
                    <QuickAction
                        title="Duyệt hồ sơ"
                        icon="shield-checkmark"
                        color="#F56565"
                        onPress={() => navigation.navigate('UpdateApproval')}
                    />
                </View>
            </View>

            {/* Recent Activities */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                {[1, 2, 3].map((item) => (
                    <View key={item} style={styles.activityItem}>
                        <View style={styles.activityDot} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>
                                {item === 1 ? "Nguyễn Văn B đã đóng Đoàn phí tháng 2" :
                                    item === 2 ? "Lịch họp Chi đoàn tháng 3 đã được khởi tạo" :
                                        "Hệ thống đã tự động sao lưu dữ liệu"}
                            </Text>
                            <Text style={styles.activityTime}>10 phút trước</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    section: { padding: SIZES.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    sectionTitle: { fontSize: SIZES.fontLarge, fontWeight: 'bold', color: COLORS.black, marginBottom: SIZES.md },
    seeAll: { color: COLORS.primary, fontSize: SIZES.fontMd },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: {
        width: (width - SIZES.lg * 3) / 2,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.md,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.sm,
    },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.gray500 },
    statValue: { fontSize: SIZES.fontLarge, fontWeight: 'bold' },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: SIZES.xs },
    actionItem: {
        width: (width - SIZES.lg * 3) / 2,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.lg,
        alignItems: 'center',
        marginBottom: SIZES.md,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.sm,
    },
    actionText: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.black, textAlign: 'center' },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: SIZES.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginTop: 6,
        marginRight: SIZES.md,
    },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: SIZES.fontMd, color: COLORS.black, lineHeight: 22 },
    activityTime: { fontSize: SIZES.fontSm, color: COLORS.gray500, marginTop: 4 },
});
