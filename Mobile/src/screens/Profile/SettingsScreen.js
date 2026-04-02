import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Platform,
    Switch
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { authService } from '../../services/authService';
import { Alert } from 'react-native';

export const SettingsScreen = ({ onBack, onLogout }) => {
    const [notifEnabled, setNotifEnabled] = React.useState(true);
    const [biometricEnabled, setBiometricEnabled] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Xác nhận xóa tài khoản",
            "Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xác nhận xóa", 
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const response = await authService.deleteAccount();
                            if (response && response.success) {
                                Alert.alert("Thành công", "Tài khoản của bạn đã được xóa.");
                                onLogout && onLogout();
                            } else {
                                Alert.alert("Lỗi", "Không thể xóa tài khoản lúc này.");
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Lỗi", error.response?.data?.message || "Đã có lỗi xảy ra khi xóa tài khoản.");
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, label, rightElement, onPress }) => (
        <TouchableOpacity 
            style={styles.item} 
            onPress={onPress} 
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={styles.iconBox}>
                    <Icon name={icon} size={20} color={COLORS.gray600} />
                </View>
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            {rightElement || <Icon name="ChevronRight" size={18} color={COLORS.gray300} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                    <Icon name="ArrowLeft" size={24} color={COLORS.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông báo</Text>
                    <View style={styles.group}>
                        <SettingItem 
                            icon="Bell" 
                            label="Thông báo đẩy" 
                            rightElement={
                                <Switch 
                                    value={notifEnabled} 
                                    onValueChange={setNotifEnabled}
                                    trackColor={{ false: '#E5E7EB', true: COLORS.primary + '80' }}
                                    thumbColor={notifEnabled ? COLORS.primary : '#FFF'}
                                />
                            } 
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bảo mật</Text>
                    <View style={styles.group}>
                        <SettingItem icon="Shield" label="Đổi mật khẩu" />
                        <View style={styles.divider} />
                        <SettingItem 
                            icon="History" 
                            label="Xác thực vân tay/FaceID" 
                            rightElement={
                                <Switch 
                                    value={biometricEnabled} 
                                    onValueChange={setBiometricEnabled}
                                    trackColor={{ false: '#E5E7EB', true: COLORS.primary + '80' }}
                                    thumbColor={biometricEnabled ? COLORS.primary : '#FFF'}
                                />
                            } 
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
                    <View style={styles.group}>
                        <SettingItem icon="Info" label="Về chúng tôi" />
                        <View style={styles.divider} />
                        <SettingItem icon="FileText" label="Chính sách bảo mật" />
                        <View style={styles.divider} />
                        <SettingItem icon="AlertTriangle" label="Báo cáo lỗi" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tài khoản</Text>
                    <View style={styles.group}>
                        <TouchableOpacity 
                            style={styles.item} 
                            onPress={handleDeleteAccount}
                            disabled={deleting}
                        >
                            <View style={styles.itemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                    <Icon name="Trash2" size={20} color={COLORS.error} />
                                </View>
                                <Text style={[styles.itemLabel, { color: COLORS.error }]}>Xóa tài khoản</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>Phiên bản 1.0.0 (Build 100)</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
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
    scrollContent: { paddingVertical: 20 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray400, paddingHorizontal: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    group: { backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    item: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 14, 
        paddingHorizontal: 20 
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    itemLabel: { fontSize: 15, color: COLORS.gray700, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 70 },
    footer: { alignItems: 'center', marginTop: 10, paddingBottom: 40 },
    version: { fontSize: 12, color: COLORS.gray400 }
});
