import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image as RNImage,
    ActivityIndicator,
    Dimensions,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES, IMAGES } from '../../constants';
import { partyService } from '../../services/partyService';

const { width } = Dimensions.get('window');

export const QRCardScreen = ({ onBack }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await partyService.getMemberProfile();
                setUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                    <Icon name="ArrowLeft" size={24} color={COLORS.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thẻ Đoàn viên điện tử</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.cardWrapper}>
                <View style={styles.card}>
                    {/* Top Header of Card */}
                    <View style={styles.cardHeader}>
                        <RNImage source={IMAGES.logo} style={styles.logo} resizeMode="contain" />
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.orgName}>ĐOÀN TNCS HỒ CHÍ MINH</Text>
                            <Text style={styles.schoolName}>TRƯỜNG ĐẠI HỌC ĐỒNG THÁP</Text>
                        </View>
                    </View>

                    {/* Member Info Section */}
                    <View style={styles.cardMain}>
                        <View style={styles.memberAvatarWrapper}>
                            <RNImage source={{ uri: user?.anh_dai_dien }} style={styles.memberAvatar} />
                        </View>
                        
                        <View style={styles.memberDetails}>
                            <Text style={styles.memberName}>{user?.ho_ten?.toUpperCase()}</Text>
                            <Text style={styles.memberRole}>{user?.chuc_vu_doan || 'Đoàn viên'}</Text>
                            <View style={styles.idRow}>
                                <Text style={styles.idLabel}>Mã số:</Text>
                                <Text style={styles.idValue}>{user?.ma_so_doan || 'DTHU-12345678'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* QR Code Section */}
                    <View style={styles.qrSection}>
                        <View style={styles.qrWrapper}>
                            {/* Placeholder for QR Code */}
                            <Icon name="QrCode" size={150} color={COLORS.gray800} />
                        </View>
                        <Text style={styles.qrHint}>Sử dụng mã này để điểm danh hoạt động</Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                        <Text style={styles.validUntil}>Hạn dùng: 31/12/2026</Text>
                        <View style={styles.activeBadge}>
                            <View style={styles.dot} />
                            <Text style={styles.activeText}>ĐANG HOẠT ĐỘNG</Text>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.saveImageBtn}>
                <Icon name="Download" size={20} color="#FFF" />
                <Text style={styles.saveImageText}>Lưu ảnh vào thư viện</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'ios' ? 50 : 20, 
        paddingBottom: 15,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
    backIcon: { padding: 4 },
    cardWrapper: { padding: 20, flex: 1, justifyContent: 'center' },
    card: { 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        padding: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 15 },
    logo: { width: 44, height: 44, marginRight: 12 },
    cardHeaderText: { flex: 1 },
    orgName: { fontSize: 13, fontWeight: '800', color: '#1E40AF' },
    schoolName: { fontSize: 11, fontWeight: '600', color: '#3B82F6', marginTop: 2 },
    cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    memberAvatarWrapper: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        borderWidth: 3, 
        borderColor: '#3B82F6', 
        padding: 2,
        marginRight: 20
    },
    memberAvatar: { width: '100%', height: '100%', borderRadius: 40 },
    memberDetails: { flex: 1 },
    memberName: { fontSize: 18, fontWeight: '900', color: COLORS.gray900 },
    memberRole: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
    idRow: { flexDirection: 'row', marginTop: 6, gap: 5 },
    idLabel: { fontSize: 11, color: COLORS.gray400 },
    idValue: { fontSize: 11, color: COLORS.gray700, fontWeight: '700' },
    qrSection: { alignItems: 'center', marginBottom: 30 },
    qrWrapper: { padding: 15, backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    qrHint: { fontSize: 11, color: COLORS.gray400, marginTop: 15, fontWeight: '500' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
    validUntil: { fontSize: 10, color: COLORS.gray400, fontWeight: '600' },
    activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
    activeText: { fontSize: 9, color: '#059669', fontWeight: '800' },
    saveImageBtn: { 
        margin: 20, 
        backgroundColor: COLORS.gray800, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 15, 
        borderRadius: 16,
        gap: 10
    },
    saveImageText: { color: '#FFF', fontWeight: 'bold' }
});
