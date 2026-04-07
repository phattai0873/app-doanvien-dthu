import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image as RNImage,
    Alert
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SIZES } from '../constants';
import { API_BASE_URL } from '../services/api';

const DrawerItem = ({ label, icon, onPress, color = COLORS.gray700 }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.drawerLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const CustomDrawerContent = (props) => {
    const { user, logout, hasPermission } = useAuth();
    const isAdmin = user?.isSuperAdmin || (user?.Roles && user.Roles.length > 0);

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc muốn đăng xuất khỏi ứng dụng?",
            [
                { text: "Hủy", style: "cancel" },
                { text: "Đăng xuất", onPress: logout, style: "destructive" }
            ]
        );
    };

    const avatarUrl = user?.UnionMember?.avatar 
        ? `${API_BASE_URL}${user.UnionMember.avatar}`
        : null;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <RNImage source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={40} color={COLORS.gray400} />
                            </View>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.UnionMember?.fullName || user?.username || 'Đoàn viên DThU'}
                        </Text>
                        <Text style={styles.userRole} numberOfLines={1}>
                            {user?.username || 'Chưa cập nhật'}
                        </Text>
                    </View>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                <View style={styles.menuContainer}>
                    <DrawerItem 
                        label="Trang chủ" 
                        icon="home-outline" 
                        onPress={() => props.navigation.navigate('MainTabs', { screen: 'Dashboard' })} 
                    />
                    <DrawerItem 
                        label="Thông tin đoàn viên" 
                        icon="id-card-outline" 
                        onPress={() => props.navigation.navigate('MemberInfo')} 
                    />
                    <DrawerItem 
                        label="Tổ chức Đoàn" 
                        icon="business-outline" 
                        onPress={() => props.navigation.navigate('OrgInfo')} 
                    />
                    
                    <View style={styles.divider} />
                    
                    {isAdmin && (
                        <>
                            <Text style={styles.sectionTitle}>QUẢN TRỊ</Text>
                            <DrawerItem 
                                label="Bảng điều khiển" 
                                icon="stats-chart-outline" 
                                color={COLORS.primary}
                                onPress={() => props.navigation.navigate('AdminDashboard')} 
                            />
                            <DrawerItem 
                                label="Quản lý đoàn viên" 
                                icon="people-outline" 
                                onPress={() => props.navigation.navigate('MemberMgmt')} 
                            />
                        </>
                    )}

                    <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>
                    <DrawerItem 
                        label="Cài đặt tài khoản" 
                        icon="settings-outline" 
                        onPress={() => props.navigation.navigate('Settings')} 
                    />
                    <DrawerItem 
                        label="Điều khoản & Chính sách" 
                        icon="document-text-outline" 
                        onPress={() => {}} 
                    />
                </View>
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: 24,
        paddingTop: 48,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.gray100,
        overflow: 'hidden',
        ...COLORS.shadowSmall,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.gray900,
    },
    userRole: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 2,
    },
    menuContainer: {
        paddingTop: 16,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        borderRadius: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.gray400,
        marginLeft: 24,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 24,
        marginVertical: 16,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '900',
        color: COLORS.error,
        marginLeft: 12,
    },
});

export default CustomDrawerContent;
