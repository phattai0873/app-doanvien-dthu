import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import StatusModal from '../../components/common/StatusModal';
import { authService } from '../../services/authService';
import { Pressable } from 'react-native';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        memberCode: '',
        dateOfBirth: '', // Format: DD/MM/YYYY
    });
    const [lookupData, setLookupData] = useState({
        fullName: '',
        dateOfBirth: '',
        unionCellId: null
    });
    const [lookupResults, setLookupResults] = useState([]);
    const [isLookupVisible, setIsLookupVisible] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Status Modal State
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        onClose: () => {}
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
        
        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!/^\d{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 số)';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (!formData.memberCode.trim()) {
            newErrors.memberCode = 'Vui lòng nhập mã đoàn viên';
        }

        if (!formData.dateOfBirth.trim()) {
            newErrors.dateOfBirth = 'Vui lòng nhập ngày sinh';
        } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth)) {
            newErrors.dateOfBirth = 'Định dạng: DD/MM/YYYY';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Route Guard: Chặn quay lại nếu đang nhập liệu
    React.useEffect(() => {
        const isDirty = Object.values(formData).some(val => val.length > 0);
        
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!isDirty) return;

            // Chặn chuyển trang
            e.preventDefault();

            // Hiển thị confirm
            Alert.alert(
                'Thay đổi chưa lưu',
                'Bạn đang nhập đăng ký tài khoản. Bạn có chắc muốn thoát và xóa thông tin đã nhập không?',
                [
                    { text: 'Ở lại', style: 'cancel', onPress: () => {} },
                    {
                        text: 'Thoát',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, formData]);

    const handleLookup = async () => {
        if (!lookupData.fullName.trim() || !lookupData.dateOfBirth.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên và ngày sinh để tra cứu');
            return;
        }
        setLookupLoading(true);
        try {
            const res = await authService.lookupMemberCode(lookupData);
            if (res.success) {
                setLookupResults(res.data);
            } else {
                Alert.alert('Lỗi', res.message || 'Không tìm thấy thông tin');
            }
        } catch (error) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi khi tra cứu');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const response = await authService.register(formData);
            
            if (response && response.success) {
                setModalConfig({
                    visible: true,
                    type: 'success',
                    title: 'Đăng ký thành công',
                    message: 'Tài khoản của bạn đã được tạo. Quay lại màn hình đăng nhập để tiếp tục hoàn thiện hồ sơ.',
                    onClose: () => {
                        setModalConfig(prev => ({ ...prev, visible: false }));
                        navigation.goBack();
                    }
                });
            } else {
                setModalConfig({
                    visible: true,
                    type: 'error',
                    title: 'Đăng ký thất bại',
                    message: response?.message || 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            }
        } catch (error) {
            console.log(error);
            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Lỗi hệ thống',
                message: error.response?.data?.message || 'Không thể kết nối đến máy chủ. Tên đăng nhập có thể đã tồn tại.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
                    <Text style={styles.subtitle}>
                        Nhập thông tin để tạo tài khoản hệ thống
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <TextInput
                        label="Tên đăng nhập *"
                        placeholder="Nhập tên đăng nhập"
                        value={formData.username}
                        onChangeText={(text) => handleChange('username', text)}
                        iconName="person-outline"
                        error={errors.username}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TextInput
                        label="Email *"
                        placeholder="example@dtu.edu.vn"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        iconName="mail-outline"
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        label="Số điện thoại *"
                        placeholder="09xxx..."
                        value={formData.phoneNumber}
                        onChangeText={(text) => handleChange('phoneNumber', text)}
                        iconName="call-outline"
                        error={errors.phoneNumber}
                        keyboardType="phone-pad"
                    />

                    <View style={styles.activationHeader}>
                        <Text style={styles.sectionTitle}>Xác minh đoàn viên</Text>
                        <TouchableOpacity onPress={() => setIsLookupVisible(true)}>
                            <Text style={styles.lookupLink}>Tìm mã đoàn viên?</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        label="Mã đoàn viên *"
                        placeholder="VD: DV2024001"
                        value={formData.memberCode}
                        onChangeText={(text) => handleChange('memberCode', text)}
                        iconName="id-card-outline"
                        error={errors.memberCode}
                        autoCapitalize="characters"
                    />

                    <TextInput
                        label="Ngày sinh (DD/MM/YYYY) *"
                        placeholder="31/12/2000"
                        value={formData.dateOfBirth}
                        onChangeText={(text) => handleChange('dateOfBirth', text)}
                        iconName="calendar-outline"
                        error={errors.dateOfBirth}
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="Mật khẩu *"
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                        iconName="lock-closed-outline"
                        secureTextEntry
                        error={errors.password}
                    />
                    
                    <TextInput
                        label="Xác nhận mật khẩu *"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChangeText={(text) => handleChange('confirmPassword', text)}
                        iconName="lock-closed-outline"
                        secureTextEntry
                        error={errors.confirmPassword}
                    />

                    <Button
                        title="Đăng Ký"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.nextButton}
                    />
                    
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                        <Text style={styles.loginText}>Đã có tài khoản? <Text style={styles.loginTextBold}>Đăng nhập ngay</Text></Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.footerInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.footerText}>Bằng việc đăng ký, bạn đồng ý với Điều khoản & Chính sách của ứng dụng.</Text>
                </View>

            </ScrollView>

            {/* Lookup Modal */}
            {isLookupVisible && (
                <Pressable 
                    style={[StyleSheet.absoluteFill, styles.modalOverlay]}
                    onPress={() => {
                        const lookupDirty = lookupData.fullName.trim() || lookupData.dateOfBirth.trim();
                        if (lookupDirty) {
                            Alert.alert(
                                'Thông báo',
                                'Bạn đang tra cứu. Thoát cửa sổ này?',
                                [
                                    { text: 'Ở lại', style: 'cancel' },
                                    { text: 'Thoát', onPress: () => setIsLookupVisible(false) }
                                ]
                            );
                        } else {
                            setIsLookupVisible(false);
                        }
                    }}
                >
                    <Pressable style={styles.modalContent} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tra cứu mã đoàn viên</Text>
                            <TouchableOpacity onPress={() => setIsLookupVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <TextInput
                                label="Họ và tên"
                                placeholder="Nhập đầy đủ họ tên"
                                value={lookupData.fullName}
                                onChangeText={(val) => setLookupData(p => ({ ...p, fullName: val }))}
                            />
                            <TextInput
                                label="Ngày sinh (DD/MM/YYYY)"
                                placeholder="31/12/2000"
                                value={lookupData.dateOfBirth}
                                onChangeText={(val) => setLookupData(p => ({ ...p, dateOfBirth: val }))}
                            />
                            
                            <Button 
                                title="Tìm kiếm"
                                onPress={handleLookup}
                                loading={lookupLoading}
                                style={{ marginBottom: 15 }}
                            />

                            {lookupResults.length > 0 && (
                                <View>
                                    <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Kết quả tìm thấy:</Text>
                                    {lookupResults.map((item, idx) => (
                                        <View key={idx} style={styles.resultItem}>
                                            <View>
                                                <Text style={styles.resultText}>{item.fullName}</Text>
                                                <Text style={{ color: COLORS.gray600 }}>{item.memberCodeMasked}</Text>
                                            </View>
                                            {/* Chú ý: Vì mã bị mask nên ko thể "Áp dụng" trực tiếp, user vẫn phải tự điền hoặc admin báo mã */}
                                            <Text style={{ fontStyle: 'italic', fontSize: 11, color: COLORS.primary }}>
                                                Vui lòng điền mã này vào form
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            )}

            <StatusModal 
                visible={modalConfig.visible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onAttemptClose={modalConfig.onClose}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40
    },
    header: { alignItems: 'center', marginBottom: 24, position: 'relative' },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 5,
        zIndex: 10
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 8,
        letterSpacing: -0.5,
        marginTop: 30
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 10
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 5,
        marginBottom: 24,
    },
    nextButton: { marginTop: 16 },
    skipButton: {
        marginTop: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
    },
    skipButtonText: {
        color: COLORS.gray600,
        fontWeight: 'bold',
        fontSize: 14
    },
    loginLink: { 
        alignItems: 'center', 
        marginTop: 20,
        paddingVertical: 10 
    },
    loginText: { fontSize: 14, color: COLORS.gray600 },
    loginTextBold: { color: COLORS.primary, fontWeight: '700' },
    footerInfo: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    footerText: {
        fontSize: 12,
        color: '#D97706',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18
    },
    activationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 15
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.gray800
    },
    lookupLink: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
        textDecorationLine: 'underline'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary
    },
    resultItem: {
        padding: 12,
        backgroundColor: COLORS.gray50,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    resultText: {
        fontSize: 14,
        color: COLORS.gray800,
        fontWeight: '600'
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    applyText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold'
    }
});

export default RegisterScreen;
