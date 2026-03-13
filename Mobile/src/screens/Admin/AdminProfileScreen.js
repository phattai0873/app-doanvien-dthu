import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, IMAGES } from '../../constants';

const ADMIN_INFO = {
    name: 'Nguyễn Thị Hương',
    role: 'Bí thư Chi đoàn',
    unit: 'Chi đoàn Khoa CNTT - ĐHĐT',
    maDoanVien: 'DV-2021-001',
    email: 'huong.nt@dthu.edu.vn',
    phone: '0987 654 321',
};

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
                <Ionicons name={icon} size={17} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function MenuRow({ icon, label, desc, color, onPress, danger }) {
    return (
        <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: (color || COLORS.primary) + '15' }]}>
                <Ionicons name={icon} size={18} color={danger ? COLORS.error : (color || COLORS.primary)} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
                {desc && <Text style={styles.menuDesc}>{desc}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
        </TouchableOpacity>
    );
}

export const AdminProfileScreen = ({ onLogout }) => {
    const handleChangePassword = () => {
        Alert.alert('Đổi mật khẩu', 'Tính năng đang phát triển — sẽ mở trang nhập mật khẩu mới.');
    };

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: onLogout }
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: SIZES.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Avatar card */}
            <View style={styles.avatarCard}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>{ADMIN_INFO.name[0]}</Text>
                </View>
                <Text style={styles.adminName}>{ADMIN_INFO.name}</Text>
                <View style={styles.roleBadge}>
                    <Ionicons name="shield-checkmark" size={13} color={COLORS.white} />
                    <Text style={styles.roleText}>{ADMIN_INFO.role}</Text>
                </View>
                <Text style={styles.unitText}>{ADMIN_INFO.unit}</Text>
            </View>

            {/* Personal info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                <InfoRow icon="id-card-outline" label="Mã Đoàn viên" value={ADMIN_INFO.maDoanVien} />
                <View style={styles.divider} />
                <InfoRow icon="mail-outline" label="Email" value={ADMIN_INFO.email} />
                <View style={styles.divider} />
                <InfoRow icon="call-outline" label="Điện thoại" value={ADMIN_INFO.phone} />
            </View>

            {/* Quick actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Cài đặt tài khoản</Text>
                <MenuRow
                    icon="key-outline"
                    label="Đổi mật khẩu"
                    desc="Thay đổi mật khẩu đăng nhập"
                    color="#10B981"
                    onPress={handleChangePassword}
                />
                <View style={styles.divider} />
                <MenuRow
                    icon="notifications-outline"
                    label="Cài đặt thông báo"
                    desc="Chọn loại thông báo nhận"
                    color="#F59E0B"
                    onPress={() => {}}
                />
                <View style={styles.divider} />
                <MenuRow
                    icon="phone-portrait-outline"
                    label="Thiết bị đã đăng nhập"
                    desc="Quản lý phiên đăng nhập"
                    color="#8B5CF6"
                    onPress={() => {}}
                />
            </View>

            {/* Version info */}
            <View style={styles.versionCard}>
                <Image source={IMAGES.logo} style={styles.versionLogo} resizeMode="contain" />
                <Text style={styles.versionText}>App Đoàn viên — Phiên bản 1.0.0</Text>
                <Text style={styles.versionSub}>Trường Đại học Đồng Tháp • DTHU</Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    avatarCard: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: SIZES.xl, alignItems: 'center', marginBottom: SIZES.md },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.sm, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    avatarLetter: { fontSize: 36, fontWeight: '900', color: COLORS.white },
    adminName: { fontSize: SIZES.fontXl, fontWeight: '900', color: COLORS.white, marginBottom: SIZES.xs },
    roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: SIZES.radiusFull, gap: 5, marginBottom: SIZES.xs },
    roleText: { color: COLORS.white, fontSize: SIZES.fontSm, fontWeight: '700' },
    unitText: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.fontSm, textAlign: 'center' },
    card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.gray200, elevation: 1 },
    cardTitle: { fontSize: SIZES.fontMd, fontWeight: '800', color: COLORS.gray700, marginBottom: SIZES.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.xs, gap: SIZES.sm },
    infoIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: SIZES.fontXs, color: COLORS.gray400, fontWeight: '600' },
    infoValue: { fontSize: SIZES.fontMd, color: COLORS.textPrimary, fontWeight: '700', marginTop: 1 },
    divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: SIZES.xs },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: SIZES.sm },
    menuIcon: { width: 36, height: 36, borderRadius: SIZES.radiusSm, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.textPrimary },
    menuDesc: { fontSize: SIZES.fontXs, color: COLORS.gray400, marginTop: 1 },
    versionCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray200 },
    versionLogo: { width: 30, height: 30, marginBottom: 8, opacity: 0.6 },
    versionText: { fontSize: SIZES.fontXs, color: COLORS.gray400, fontWeight: '600' },
    versionSub: { fontSize: SIZES.fontXs, color: COLORS.gray300, marginTop: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2', borderRadius: SIZES.radiusLg, padding: SIZES.md, gap: SIZES.sm, borderWidth: 1, borderColor: '#FFE4E6', marginBottom: SIZES.xl },
    logoutText: { color: COLORS.error, fontWeight: '800', fontSize: SIZES.fontMd },
});
