import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';

export const EditProfileScreen = ({ onBack }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await partyService.getMemberProfile();
                setUser(data);
                setName(data.ho_ten || '');
                setPhone('0987654321'); // Mock
                setEmail('student@dthu.edu.vn'); // Mock
                setAddress('Đồng Tháp, Việt Nam'); // Mock
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = () => {
        setSaving(true);
        // Mock save logic
        setTimeout(() => {
            setSaving(false);
            Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật.");
            onBack();
        }, 1500);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                    <Icon name="ArrowLeft" size={24} color={COLORS.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Text style={styles.saveBtnText}>Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <Icon name="User" size={40} color={COLORS.gray400} />
                    </View>
                    <TouchableOpacity style={styles.changeAvatarBtn}>
                        <Icon name="Camera" size={16} color="#FFF" />
                        <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <TextInput 
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập họ tên"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <TextInput 
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Nhập số điện thoại"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput 
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Nhập email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Nhập địa chỉ"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.staticInfo}>
                        <Text style={styles.staticLabel}>Đơn vị sinh hoạt (Không thể chỉnh sửa)</Text>
                        <Text style={styles.staticValue}>{user?.don_vi || 'Đang cập nhật...'}</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'ios' ? 50 : 20, 
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
    backIcon: { padding: 4 },
    saveBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
    scrollContent: { paddingBottom: 40 },
    avatarSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#F9FAFB' },
    avatarWrapper: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: COLORS.gray100, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray200
    },
    changeAvatarBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.gray800, 
        paddingHorizontal: 15, 
        paddingVertical: 8, 
        borderRadius: 20,
        marginTop: -15
    },
    changeAvatarText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },
    form: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.gray600, marginBottom: 8 },
    input: { 
        backgroundColor: '#F9FAFB', 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        borderRadius: 12, 
        paddingHorizontal: 15, 
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.gray900
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    staticInfo: { marginTop: 10, padding: 15, backgroundColor: COLORS.gray50, borderRadius: 12 },
    staticLabel: { fontSize: 12, color: COLORS.gray400, marginBottom: 4 },
    staticValue: { fontSize: 14, color: COLORS.gray600, fontWeight: '500' }
});
