import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { LayoutGrid, Calendar, FileText, Bell, Search, User, Play } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName}>Đoàn Viên 👋</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Bell color={COLORS.primary} size={24} />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Card */}
                <View style={[styles.heroCard, SHADOWS.lg]}>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>BẢN TIN 2024</Text>
                    </View>
                    <Text style={styles.heroTitle}>Kế hoạch hoạt động hè tình nguyện 2025 tại vùng cao</Text>
                    <TouchableOpacity style={styles.heroBtn}>
                        <Text style={styles.heroBtnText}>Xem chi tiết</Text>
                        <Play color={COLORS.white} size={16} fill={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Action Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tính năng chính</Text>
                    <TouchableOpacity><Text style={styles.seeAllText}>Xem tất cả</Text></TouchableOpacity>
                </View>

                <View style={styles.actionGrid}>
                    <ActionItem icon={<FileText color={COLORS.primary} />} label="Hồ sơ" />
                    <ActionItem icon={<Calendar color={COLORS.primary} />} label="Sự kiện" />
                    <ActionItem icon={<LayoutGrid color={COLORS.primary} />} label="Tổ chức" />
                    <ActionItem icon={<Search color={COLORS.primary} />} label="Tra cứu" />
                </View>

                {/* Quick Stats/Upcoming */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sắp diễn ra</Text>
                </View>

                <View style={[styles.eventCard, SHADOWS.sm]}>
                    <View style={styles.eventIconContainer}>
                        <Calendar color={COLORS.primary} size={20} />
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>Lễ ra quân Chiến dịch mùa hè xanh</Text>
                        <Text style={styles.eventMeta}>15 Th 3, 2025 • 07:30 AM</Text>
                    </View>
                </View>

                <View style={[styles.eventCard, SHADOWS.sm]}>
                    <View style={[styles.eventIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                        <User color={COLORS.primary} size={20} />
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>Sinh hoạt chi đoàn kỳ 1 - 2025</Text>
                        <Text style={styles.eventMeta}>20 Th 3, 2025 • 02:00 PM</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const ActionItem = ({ icon, label }) => (
    <TouchableOpacity style={styles.actionItem}>
        <View style={styles.actionIcon}>{icon}</View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: space - between,
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    greeting: {
        fontSize: 16,
        color: COLORS.textMuted,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.error,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    heroCard: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        marginTop: SPACING.md,
        overflow: 'hidden',
    },
    badgeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.sm,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.white,
        lineHeight: 28,
        marginBottom: SPACING.lg,
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        alignSelf: 'flex-start',
        gap: 8,
    },
    heroBtnText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: space - between,
        alignItems: 'baseline',
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: space - between,
    },
    actionItem: {
        width: (width - (SPACING.lg * 2) - 16) / 4,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    actionIcon: {
        width: 56,
        height: 56,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    eventIconContainer: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.primaryLight,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    eventMeta: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});

export default HomeScreen;
