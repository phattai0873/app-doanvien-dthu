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
    Image as RNImage,
    Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { authService } from '../../services/authService';
import { USE_MOCK_API } from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Load saved credentials
    React.useEffect(() => {
        const loadCredentials = async () => {
            try {
                const savedUsername = await AsyncStorage.getItem('saved_username');
                const savedPassword = await AsyncStorage.getItem('saved_password');
                const remember = await AsyncStorage.getItem('remember_me');

                if (remember === 'true') {
                    if (savedUsername) setUsername(savedUsername);
                    if (savedPassword) setPassword(savedPassword);
                    setRememberMe(true);
                }
            } catch (error) {
                console.log('Error loading credentials:', error);
            }
        };
        loadCredentials();
    }, []);

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
            // Sử dụng hàm login từ useAuth để xử lý toàn bộ luồng
            const response = await login(username, password);
            
            if (response && (response.token || response.success)) {
                // Save or clear credentials
                if (rememberMe) {
                    await AsyncStorage.setItem('saved_username', username);
                    await AsyncStorage.setItem('saved_password', password);
                    await AsyncStorage.setItem('remember_me', 'true');
                } else {
                    await AsyncStorage.removeItem('saved_username');
                    await AsyncStorage.removeItem('saved_password');
                    await AsyncStorage.setItem('remember_me', 'false');
                }
                // Sau khi login(username, password) trong AuthContext thành công,
                // nó đã tự gọi checkAuth() để cập nhật trạng thái isLoggedIn.
            } else {
                Alert.alert('Lỗi', 'Tên đăng nhập hoặc mật khẩu không đúng');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Removed manual RegisterScreen rendering logic

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
                        <RNImage
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

                    <View style={styles.rememberRow}>
                        <View style={styles.rememberLeft}>
                            <Switch
                                value={rememberMe}
                                onValueChange={setRememberMe}
                                trackColor={{ false: '#E5E7EB', true: COLORS.primary + '80' }}
                                thumbColor={rememberMe ? COLORS.primary : '#FFF'}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                            <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
                        </View>
                        <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu', 'Chức năng đang được phát triển')} style={styles.forgotPasswordButton}>
                            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        title="Đăng nhập"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    {/* 🔧 DEV MODE: Nút đăng nhập nhanh, chỉ hiện khi USE_MOCK_API = true */}
                    {USE_MOCK_API && (
                        <TouchableOpacity
                            onPress={() => login && login({ success: true, token: 'mock-token', role: 'user' })}
                            style={styles.devLoginButton}
                        >
                            <Text style={styles.devLoginText}>🔧 Đăng nhập nhanh (Dev)</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
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
    forgotPasswordButton: { alignSelf: 'center' },
    forgotPasswordText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: -8,
    },
    rememberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberText: {
        fontSize: 14,
        color: COLORS.gray600,
        marginLeft: 4,
        fontWeight: '500'
    },
    loginButton: { marginTop: 8 },
    devLoginButton: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FFF3CD',
        borderWidth: 1,
        borderColor: '#FFC107',
        alignItems: 'center',
    },
    devLoginText: { fontSize: 14, color: '#856404', fontWeight: '700' },
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
