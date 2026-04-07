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

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });
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
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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

            <StatusModal 
                visible={modalConfig.visible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={modalConfig.onClose}
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
    }
});

export default RegisterScreen;
