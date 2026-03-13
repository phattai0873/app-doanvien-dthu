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
import { authService } from '../../services/authService';

const RegisterScreen = ({ onNavigateBack }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        studentId: '', // Mã đoàn viên
        dateOfBirth: '',
        phoneNumber: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
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

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleRegister = async (skipOptionalInfo = false) => {
        // Nếu user nhấn 'Nhập sau', ta có thể bỏ qua validation tên
        const payload = { ...formData };
        if (skipOptionalInfo) {
            payload.fullName = '';
            payload.studentId = '';
            payload.dateOfBirth = '';
            payload.phoneNumber = '';
        } else {
            // Nếu gửi bình thường mà chưa có tên thì có thể báo (tuỳ ý)
            // Ở đây vì có tính năng 'Nhập sau', nên họ và tên cũng ko nhất thiết phải ép buộc
        }

        setLoading(true);
        try {
            const response = await authService.register(payload);
            
            if (response && response.success) {
                Alert.alert(
                    'Đăng ký thành công',
                    'Tài khoản của bạn đã được tạo. Vui lòng chờ admin duyệt trước khi đăng nhập.',
                    [
                        { text: 'Quay lại đăng nhập', onPress: () => onNavigateBack && onNavigateBack() }
                    ]
                );
            } else {
                Alert.alert('Lỗi', response?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Lỗi', error.response?.data?.error || error.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.');
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
                    <TouchableOpacity onPress={step === 2 ? () => setStep(1) : onNavigateBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.gray700} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Bước 1: Thông tin đăng nhập hệ thống' : 'Bước 2: Thông tin Đoàn viên cá nhân'}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    {step === 1 ? (
                        <>
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
                                title="Tiếp tục"
                                onPress={handleNextStep}
                                style={styles.nextButton}
                            />
                            
                            <TouchableOpacity onPress={onNavigateBack} style={styles.loginLink}>
                                <Text style={styles.loginText}>Đã có tài khoản? <Text style={styles.loginTextBold}>Đăng nhập ngay</Text></Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TextInput
                                label="Họ và tên"
                                placeholder="Nhập họ và tên đầy đủ"
                                value={formData.fullName}
                                onChangeText={(text) => handleChange('fullName', text)}
                                iconName="text-outline"
                                error={errors.fullName}
                            />

                            <TextInput
                                label="Mã số sinh viên (hoặc mã Đoàn viên)"
                                placeholder="Nhập mã số"
                                value={formData.studentId}
                                onChangeText={(text) => handleChange('studentId', text)}
                                iconName="card-outline"
                            />

                            <TextInput
                                label="Ngày sinh"
                                placeholder="DD/MM/YYYY"
                                value={formData.dateOfBirth}
                                onChangeText={(text) => handleChange('dateOfBirth', text)}
                                iconName="calendar-outline"
                            />
                            
                            <TextInput
                                label="Số điện thoại"
                                placeholder="Nhập số điện thoại thường dùng"
                                value={formData.phoneNumber}
                                onChangeText={(text) => handleChange('phoneNumber', text)}
                                iconName="call-outline"
                                keyboardType="phone-pad"
                            />

                            <Button
                                title="Hoàn tất đăng ký"
                                onPress={() => handleRegister(false)}
                                loading={loading}
                                style={styles.nextButton}
                            />

                            <TouchableOpacity 
                                style={styles.skipButton} 
                                onPress={() => handleRegister(true)}
                                disabled={loading}
                            >
                                <Text style={styles.skipButtonText}>Nhập sau ({'>'})</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                
                <View style={styles.footerInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.footerText}>Tài khoản sau khi đăng ký cần được xét duyệt trước khi có thể đăng nhập.</Text>
                </View>

            </ScrollView>
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
