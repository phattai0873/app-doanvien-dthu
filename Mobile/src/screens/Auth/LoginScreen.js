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
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { authService } from '../../services/authService';

const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
        if (!password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await authService.login(username, password);
            if (response && (response.token || response.success)) { // Flexible check for mock vs real
                if (onLogin) onLogin(response);
            } else {
                Alert.alert('Lỗi', 'Đăng nhập thất bại');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Quên mật khẩu', 'Chức năng đang được phát triển');
    };

    if (showRegister) {
        // Cần import RegisterScreen ở trên
        const RegisterScreen = require('./RegisterScreen').default;
        return <RegisterScreen onNavigateBack={() => setShowRegister(false)} />;
    }

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
                    <View style={styles.logoContainer}>
                        <Image
                            source={IMAGES.logo}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Đăng Nhập</Text>
                    <Text style={styles.subtitle}>
                        Ứng dụng Đoàn thanh niên trực thuộc ĐTHU
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <TextInput
                        label="Tên đăng nhập"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChangeText={(text) => {
                            setUsername(text);
                            if (errors.username) setErrors({ ...errors, username: null });
                        }}
                        iconName="person-outline"
                        error={errors.username}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TextInput
                        label="Mật khẩu"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        iconName="lock-closed-outline"
                        secureTextEntry
                        error={errors.password}
                    />

                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    <Button
                        title="Đăng nhập"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />
                    
                    <TouchableOpacity onPress={() => setShowRegister(true)} style={styles.registerLink}>
                        <Text style={styles.registerText}>
                            Chưa có tài khoản? <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.helpContainer}>
                        <Ionicons name="information-circle-outline" size={SIZES.iconSm} color={COLORS.gray500} />
                        <Text style={styles.helpText}>Liên hệ quản trị viên để được hỗ trợ</Text>
                    </View>
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
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40
    },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30, // Squircle-like
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    logoImage: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.gray900,
        marginBottom: 8,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20
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
    forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotPasswordText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
    loginButton: { marginTop: 8 },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 12
    },
    registerText: { fontSize: 14, color: COLORS.gray600 },
    registerTextBold: { color: COLORS.primary, fontWeight: '700' },
    footer: { marginTop: 'auto', paddingTop: 20 },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gray100,
        padding: 14,
        borderRadius: SIZES.radiusMd,
        gap: 8
    },
    helpText: { fontSize: 13, color: COLORS.gray600, fontWeight: '500' },
});

export default LoginScreen;
