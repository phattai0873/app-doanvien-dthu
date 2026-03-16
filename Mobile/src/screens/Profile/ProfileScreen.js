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
    Alert
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { MenuRow } from '../../components/common/MenuRow';
import { COLORS, SIZES, IMAGES } from '../../constants';
import { partyService } from '../../services/partyService';

export const ProfileScreen = ({ onNavigate, onLogout }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
            </View>
        );
    }

    const member = user?.UnionMember;
    const status = member?.status || 'none'; // none, pending, approved, rejected

    const renderStatusBadge = () => {
        switch (status) {
            case 'approved':
                return (
                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                        <Icon name="BadgeCheck" size={14} color="#10B981" />
                        <Text style={[styles.statusBadgeText, { color: '#059669' }]}>Chính thức</Text>
                    </View>
                );
            case 'pending':
                return (
                    <View style={[styles.statusBadge, { backgroundColor: '#FFFBEB' }]}>
                        <Icon name="Clock" size={14} color="#F59E0B" />
                        <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Chờ duyệt</Text>
                    </View>
                );
            case 'rejected':
                return (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
                        <Icon name="AlertTriangle" size={14} color="#EF4444" />
                        <Text style={[styles.statusBadgeText, { color: '#B91C1C' }]}>Từ chối</Text>
                    </View>
                );
            default:
                return (
                    <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                        <Icon name="User" size={14} color="#6B7280" />
                        <Text style={[styles.statusBadgeText, { color: '#374151' }]}>Chưa tạo hồ sơ</Text>
                    </View>
                );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {/* 1. Profile Card Section */}
            <View style={styles.profileCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarWrapper}>
                        <RNImage
                            source={user?.anh_dai_dien ? { uri: user.anh_dai_dien } : IMAGES.user_fallback}
                            style={styles.avatar}
                        />
                        {status === 'approved' && (
                            <View style={styles.verifiedDot}>
                                <Icon name="BadgeCheck" size={16} color="#FFF" />
                            </View>
                        )}
                    </View>
                    <View style={styles.basicInfo}>
                        <Text style={styles.nameText}>{user?.ho_ten || 'Đoàn viên'}</Text>
                        <Text style={styles.roleText}>{user?.chuc_vu_doan || 'Thành viên App'}</Text>
                        {renderStatusBadge()}
                    </View>
                    <TouchableOpacity
                        style={styles.settingsBtn}
                        onPress={() => onNavigate('edit_profile')}
                    >
                        <Icon name="Settings" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>
                </View>

                {/* Status Messages */}
                {status === 'pending' && (
                    <View style={styles.infoBanner}>
                        <Icon name="Info" size={16} color="#B45309" />
                        <Text style={styles.infoBannerText}>Hồ sơ đang được Bí thư Chi đoàn phê duyệt.</Text>
                    </View>
                )}
                {status === 'none' && (
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => onNavigate('complete_profile')}
                    >
                        <Text style={styles.ctaButtonText}>Hoàn thiện hồ sơ ngay</Text>
                        <Icon name="ChevronRight" size={16} color="#FFF" />
                    </TouchableOpacity>
                )}

                {/* Stats Bar - Ẩn vì chưa có dữ liệu thực tế từ backend */}
                {/* 
                {status !== 'none' && (
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Hoạt động</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>75</Text>
                            <Text style={styles.statLabel}>Điểm RL</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>Tốt</Text>
                            <Text style={styles.statLabel}>Xếp loại</Text>
                        </View>
                    </View>
                )} 
                */}
            </View>

            {/* 2. Interactive Digital Card Entry */}
            {status === 'approved' && (
                <TouchableOpacity
                    style={styles.digitalCardEntry}
                    onPress={() => onNavigate('qr_card')}
                    activeOpacity={0.9}
                >
                    <View style={styles.digitalCardLeft}>
                        <Icon name="QrCode" size={28} color={COLORS.primary} />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={styles.digitalCardTitle}>Thẻ Đoàn viên điện tử</Text>
                            <Text style={styles.digitalCardSub}>Nhấn để xem mã QR định danh</Text>
                        </View>
                    </View>
                    <Icon name="ChevronRight" size={20} color={COLORS.gray400} />
                </TouchableOpacity>
            )}

            {/* 3. Detail Information Sections */}
            {status !== 'none' && (
                <>
                    {/* Identity Group */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="User" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            <DetailRow label="Mã số sinh viên" value={member?.studentId} />
                            <DetailRow label="Số điện thoại" value={member?.phoneNumber} />
                            <DetailRow label="Email" value={member?.email || user?.email} />
                            <DetailRow label="Ngày sinh" value={member?.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : null} />
                            <DetailRow label="Quê quán" value={member?.hometown} />
                            <DetailRow label="Thường trú" value={member?.homeAddress} />
                        </View>
                    </View>

                    {/* Organization Group */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="Shield" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Thông tin tổ chức</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            <DetailRow label="Chi đoàn" value={member?.UnionCell?.name} />
                            <DetailRow label="Trực thuộc" value={member?.UnionCell?.UnionBranch?.name || 'Trường Đại học Đồng Tháp'} />
                            <DetailRow label="Ngày vào đoàn" value={member?.joinedDate ? new Date(member.joinedDate).toLocaleDateString('vi-VN') : '—'} />
                            <DetailRow label="Nơi vào đoàn" value={member?.joinedPlace} />
                        </View>
                    </View>
                </>
            )}

            {/* 4. Menu Actions */}
            <View style={styles.menuCard}>
                <MenuRow
                    icon="Wallet"
                    label="Đoàn phí & Quỹ"
                    onPress={() => onNavigate('fee_payment')}
                    badge="Mới"
                />
                <View style={styles.menuCardDivider} />
                <MenuRow
                    icon="FileText"
                    label="Tài liệu & Văn bản"
                    onPress={() => onNavigate('document_list')}
                />
            </View>

            <View style={styles.menuCard}>
                <MenuRow
                    icon="Settings"
                    label="Cài đặt tài khoản"
                    onPress={() => onNavigate('settings')}
                />
                <View style={styles.menuCardDivider} />
                <MenuRow
                    icon="Info"
                    label="Về ứng dụng"
                    onPress={() => {}}
                />
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Icon name="LogOut" size={20} color={COLORS.error} />
                <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>App Đoàn viên DTHU • v1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const DetailRow = ({ label, value, isCopyable }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={styles.detailValueWrapper}>
            <Text style={[styles.detailValue, !value && { color: COLORS.gray300 }]}>
                {value || 'Chưa cập nhật'}
            </Text>
            {isCopyable && value && (
                <TouchableOpacity style={{ marginLeft: 8 }}>
                    <Icon name="Copy" size={14} color={COLORS.gray400} />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    loadingText: { marginTop: 12, color: COLORS.gray500, fontWeight: '500' },

    profileCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.gray100
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.gray100 },
    verifiedDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center'
    },
    basicInfo: { flex: 1, marginLeft: 16 },
    nameText: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 2 },
    roleText: { fontSize: 13, color: COLORS.gray500, marginBottom: 8, fontWeight: '500' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    settingsBtn: { padding: 8 },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FEF3C7'
    },
    infoBannerText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' },

    ctaButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        marginBottom: 16
    },
    ctaButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray50
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 15, fontWeight: '800', color: COLORS.gray900 },
    statLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 2, fontWeight: '500' },
    statDivider: { width: 1, height: 24, backgroundColor: COLORS.gray100 },

    digitalCardEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2
    },
    digitalCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    digitalCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
    digitalCardSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },

    section: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.gray100 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.gray900, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionContent: { gap: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    detailLabel: { fontSize: 13, color: COLORS.gray400, fontWeight: '500', flex: 1 },
    detailValueWrapper: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    detailValue: { fontSize: 14, color: COLORS.gray800, fontWeight: '600', textAlign: 'right' },

    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100
    },
    menuCardDivider: { height: 1, backgroundColor: COLORS.gray50, marginHorizontal: 20 },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        marginTop: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2'
    },
    logoutBtnText: { color: COLORS.error, fontWeight: '800', fontSize: 15 },

    footer: { alignItems: 'center', marginTop: 30, paddingBottom: 20 },
    footerText: { fontSize: 11, color: COLORS.gray300, fontWeight: '500' }
});
