import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image as RNImage,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Alert,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';
import { useAuth } from '../../contexts/AuthContext';
import CommonHeader from '../../components/CommonHeader';

const { width } = Dimensions.get('window');

const DetailRow = ({ label, value, icon }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailIconWrapper}>
            <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.detailTextWrapper}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'Chưa cập nhật'}</Text>
        </View>
    </View>
);

const MenuButton = ({ label, icon, onPress, color = COLORS.gray700, isError = false }) => (
    <TouchableOpacity 
        style={[styles.menuButton, isError && styles.menuButtonError]} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.menuIconWrapper, isError && styles.menuIconError]}>
            <Ionicons name={icon} size={22} color={isError ? COLORS.error : COLORS.primary} />
        </View>
        <Text style={[styles.menuLabel, isError && styles.menuLabelError]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={isError ? COLORS.error + '50' : COLORS.gray300} />
    </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
    const { user: authUser, logout } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Kiểm tra quyền cán bộ dựa trên AuthContext
    const role = authUser?.role;
    const isOfficer = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'BRANCH_ADMIN' || role === 'CELL_ADMIN' || authUser?.isSuperAdmin;
    const isCellOfficer = role === 'CELL_ADMIN';
    const isBranchOfficer = role === 'BRANCH_ADMIN';
    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || authUser?.isSuperAdmin;

    const fetchData = useCallback(async () => {
        try {
            const data = await partyService.getMemberProfile();
            setUser(data);
        } catch (error) {
            console.log('Fetch profile error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
            </View>
        );
    }

    const member = user?.UnionMember;
    const status = member?.status || 'none'; 

    return (
        <View style={styles.container}>
            <CommonHeader title="Trang cá nhân" />
            
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >
                {/* Profile Card */}
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.profileCard}
                >
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <RNImage
                                source={user?.anh_dai_dien ? { uri: user.anh_dai_dien } : { uri: `https://ui-avatars.com/api/?name=${user?.ho_ten || 'U'}&background=2563EB&color=fff` }}
                                style={styles.avatar}
                            />
                            {status === 'approved' && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                                </View>
                            )}
                        </View>
                        <View style={styles.nameContainer}>
                            <View style={styles.nameHeaderRow}>
                                <Text style={styles.nameText}>{user?.ho_ten || 'Đoàn viên'}</Text>
                                <TouchableOpacity 
                                    style={styles.editBtn}
                                    onPress={() => navigation.navigate('EditProfile', { userData: user })}
                                >
                                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.roleText}>{user?.chuc_vu_doan || 'Thành viên'}</Text>
                            <View style={[styles.statusTag, status === 'approved' ? styles.statusApproved : styles.statusPending]}>
                                <Text style={[styles.statusTagText, status === 'approved' ? styles.textSuccess : styles.textWarning]}>
                                    {status === 'approved' ? 'Đoàn viên chính thức' : 'Đang chờ phê duyệt'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Identity Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hồ sơ cá nhân</Text>
                    <View style={styles.sectionCard}>
                        <DetailRow icon="finger-print-outline" label="Mã số sinh viên" value={member?.studentId} />
                        <View style={styles.divider} />
                        <DetailRow icon="call-outline" label="Số điện thoại" value={user?.sdt} />
                        <View style={styles.divider} />
                        <DetailRow icon="mail-outline" label="Email" value={user?.email} />
                        <View style={styles.divider} />
                        <DetailRow icon="calendar-outline" label="Ngày sinh" value={member?.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : null} />
                        <View style={styles.divider} />
                        <DetailRow icon="location-outline" label="Quê quán" value={user?.que_quan} />
                        <View style={styles.divider} />
                        <DetailRow icon="home-outline" label="Địa chỉ thường trú" value={user?.dia_chi} />
                        <View style={styles.divider} />
                        <DetailRow icon="school-outline" label="Trình độ học vấn" value={user?.trinh_do} />
                        <View style={styles.divider} />
                        <DetailRow icon="flag-outline" label="Ngày vào đoàn" value={user?.ngay_vao_doan ? new Date(user.ngay_vao_doan).toLocaleDateString('vi-VN') : null} />
                    </View>
                </View>
                {/* Organization Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tổ chức Đoàn</Text>
                    <View style={styles.sectionCard}>
                        <DetailRow icon="business-outline" label="Chi đoàn" value={member?.UnionCell?.name} />
                        <View style={styles.divider} />
                        <DetailRow icon="school-outline" label="Trực thuộc" value={member?.UnionCell?.UnionBranch?.name || 'Trường Đại học Đồng Tháp'} />
                    </View>
                </View>

                {/* Organizational Management for Officers */}
                {isOfficer && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quản lý Đơn vị</Text>
                        <View style={styles.menuGroup}>
                            {isCellOfficer && (
                                <MenuButton 
                                    label="Quản lý Đoàn viên lớp" 
                                    icon="people-circle-outline" 
                                    onPress={() => navigation.navigate('MemberMgmt')} 
                                />
                            )}
                            
                            {isBranchOfficer && (
                                <MenuButton 
                                    label="Quản lý Các Chi đoàn" 
                                    icon="business-outline" 
                                    onPress={() => navigation.navigate('CellMgmt')} 
                                />
                            )}

                            {isAdmin && (
                                <MenuButton 
                                    label="Bảng Quản trị Hệ thống" 
                                    icon="shield-checkmark-outline" 
                                    onPress={() => navigation.navigate('AdminDashboard')} 
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* Account Settings & Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tài khoản & Ứng dụng</Text>
                    <View style={styles.menuGroup}>
                        <MenuButton label="Cài đặt tài khoản" icon="settings-outline" onPress={() => navigation.navigate('Settings')} />
                        <View style={styles.divider} />
                        <MenuButton label="Lịch sử hoạt động" icon="time-outline" onPress={() => navigation.navigate('ActivityHistory')} />
                        <View style={styles.divider} />
                        <MenuButton label="Đoàn phí & Quỹ" icon="wallet-outline" onPress={() => navigation.navigate('FeePayment')} />
                        <View style={styles.divider} />
                        <MenuButton label="Thông báo" icon="notifications-outline" onPress={() => navigation.navigate('Notification')} />
                        <View style={styles.divider} />
                        <MenuButton label="Đăng xuất" icon="log-out-outline" onPress={logout} isError />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>App Đoàn viên DTHU • Phiên bản 1.0.0</Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SIZES.md },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: COLORS.gray500, fontWeight: '600' },
    
    profileCard: {
        borderRadius: 32,
        padding: SIZES.lg,
        marginBottom: SIZES.lg,
        ...COLORS.shadowDark,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 32,
        backgroundColor: COLORS.gray100,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 2,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    nameContainer: {
        marginLeft: SIZES.md,
        flex: 1,
    },
    nameHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nameText: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.gray900,
        flex: 1,
    },
    editBtn: {
        padding: 8,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
    },
    roleText: {
        fontSize: 14,
        color: COLORS.gray500,
        fontWeight: '600',
        marginTop: 2,
    },
    statusTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 8,
    },
    statusApproved: { backgroundColor: '#DEF7EC' },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusTagText: { fontSize: 11, fontWeight: '800' },
    textSuccess: { color: '#03543F' },
    textWarning: { color: '#92400E' },

    section: {
        marginBottom: SIZES.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.gray900,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: SIZES.md,
        ...COLORS.shadowDark,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailTextWrapper: {
        marginLeft: 16,
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.gray400,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 15,
        color: COLORS.gray800,
        fontWeight: '700',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray50,
        marginHorizontal: 4,
    },
    
    menuGroup: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        overflow: 'hidden',
        ...COLORS.shadowDark,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuButtonError: {
        backgroundColor: '#FFF5F5',
    },
    menuIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuIconError: {
        backgroundColor: '#FFE4E4',
    },
    menuLabel: {
        flex: 1,
        marginLeft: 16,
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.gray700,
    },
    menuLabelError: {
        color: COLORS.error,
    },
    
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.gray300,
        fontWeight: '600',
    }
});
