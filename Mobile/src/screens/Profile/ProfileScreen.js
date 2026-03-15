import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { MenuRow } from '../../components/common/MenuRow';
import { COLORS, SIZES, IMAGES } from '../../constants';
import { partyService } from '../../services/partyService';

export const ProfileScreen = ({ onNavigate, onLogout }) => {
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
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.profileContent}>
            <View style={styles.profileCard}>
                <View style={styles.avatarWrapper}>
                    <Image source={{ uri: user?.anh_dai_dien }} style={styles.avatar} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.ho_ten}</Text>
                    <Text style={styles.profileRole}>{user?.chuc_vu_doan}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{user?.trang_thai_doan}</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.editIconBtn} 
                    onPress={() => onNavigate('edit_profile')}
                >
                    <Icon name="Settings" size={20} color={COLORS.gray400} />
                </TouchableOpacity>
            </View>

            <View style={styles.menuGroup}>
                <MenuRow icon="User" color={COLORS.primary} label="Thông tin Đoàn viên" onPress={() => onNavigate('member_info')} />
                <View style={styles.menuDivider} />
                <MenuRow icon="Users" color={COLORS.primary} label="Thông tin Tổ chức Đoàn" onPress={() => onNavigate('org_info')} />
                <View style={styles.menuDivider} />
                <MenuRow icon="QrCode" color={COLORS.gray700} label="Thẻ Đoàn viên điện tử" onPress={() => onNavigate('qr_card')} />
            </View>

            <View style={styles.menuGroup}>
                <MenuRow icon="Settings" color={COLORS.gray600} label="Cài đặt" onPress={() => onNavigate('settings')} />
                <View style={styles.menuDivider} />
                <MenuRow icon="FileText" color={COLORS.gray600} label="Điều khoản sử dụng" />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Icon name="LogOut" size={20} color={COLORS.error} />
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <View style={styles.versionCard}>
                <Image source={IMAGES.logo} style={styles.versionLogo} resizeMode="contain" />
                <Text style={styles.versionText}>App Đoàn viên — Phiên bản 1.0.0</Text>
                <Text style={styles.versionSub}>Trường Đại học Đồng Tháp • DTHU</Text>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, backgroundColor: COLORS.background },
    profileContent: { padding: 16, paddingTop: 60, paddingBottom: 100 },
    profileCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 24,
        paddingTop: 40,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 20,
        position: 'relative'
    },
    editIconBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 5
    },
    avatarWrapper: {
        position: 'absolute',
        top: -44,
        padding: 5,
        backgroundColor: COLORS.white,
        borderRadius: 50,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4
    },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.gray100 },
    profileInfo: { alignItems: 'center', marginTop: 24 },
    profileName: { fontSize: 20, fontWeight: '800', color: COLORS.gray900 },
    profileRole: { fontSize: 14, color: COLORS.gray500, marginTop: 4, fontWeight: '500' },
    statusBadge: {
        backgroundColor: '#EEF2FF', // Indigo 50
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: SIZES.radiusFull,
        marginTop: 16
    },
    statusText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
    menuGroup: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    menuDivider: { height: 1, backgroundColor: COLORS.gray100, marginHorizontal: 16 },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF1F2', // Rose 50
        padding: 16,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: '#FFE4E6',
    },
    logoutText: { color: COLORS.error, fontWeight: '800', marginLeft: 8 },
    versionCard: { marginTop: 24, alignItems: 'center', paddingBottom: 20 },
    versionLogo: { width: 30, height: 30, marginBottom: 8, opacity: 0.5 },
    versionText: { fontSize: 12, color: COLORS.gray400, fontWeight: '600' },
    versionSub: { fontSize: 11, color: COLORS.gray300, marginTop: 2 },
});
