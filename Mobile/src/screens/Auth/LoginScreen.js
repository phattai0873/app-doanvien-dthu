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
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, IMAGES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { authService } from '../../services/authService';
import { USE_MOCK_API } from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

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
            const response = await login(username, password);
            
            if (response && (response.token || response.success)) {
                if (rememberMe) {
                    await AsyncStorage.setItem('saved_username', username);
                    await AsyncStorage.setItem('saved_password', password);
                    await AsyncStorage.setItem('remember_me', 'true');
                } else {
                    await AsyncStorage.removeItem('saved_username');
                    await AsyncStorage.removeItem('saved_password');
                    await AsyncStorage.setItem('remember_me', 'false');
                }
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
                {/* Header Gradient Background */}
                <View style={styles.topContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, '#4F46E5']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    
                    <View style={styles.header}>
                        <View style={styles.logoOuterContainer}>
                            <View style={styles.logoContainer}>
                                <RNImage
                                    source={IMAGES.logo}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        <Text style={styles.title}>Đoàn Thanh Niên</Text>
                        <Text style={styles.subtitle}>
                            Trường Đại học Đồng Tháp (DTHU)
                        </Text>
                    </View>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Chào mừng trở lại!</Text>
                        <Text style={styles.formSubtitle}>Vui lòng đăng nhập để tiếp tục</Text>

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
                                    trackColor={{ false: '#E2E8F0', true: COLORS.primary + '80' }}
                                    thumbColor={rememberMe ? COLORS.primary : '#FFF'}
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                />
                                <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => Alert.alert('Quên mật khẩu', 'Vui lòng liên hệ Văn phòng Đoàn để được cấp lại mật khẩu.')} 
                                style={styles.forgotPasswordButton}
                            >
                                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title="ĐĂNG NHẬP"
                            onPress={handleLogin}
                            loading={loading}
                            variant="gradient"
                            style={styles.loginButton}
                        />

                        {USE_MOCK_API && (
                            <TouchableOpacity
                                onPress={() => login && login({ success: true, token: 'mock-token', role: 'user' })}
                                style={styles.devLoginButton}
                            >
                                <Text style={styles.devLoginText}>🔧 Đăng nhập nhanh (Dev Mode)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
                            <Text style={styles.registerText}>
                                Chưa có tài khoản? <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.helpContainer}
                        onPress={() => Alert.alert('Hỗ trợ', 'Email: doanthanhnien@dthu.edu.vn\nHotline: 02773.xxx.xxx')}
                    >
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.gray500} />
                        <Text style={styles.helpText}>Cần hỗ trợ? Liên hệ quản trị viên</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundColor || '#F8FAFC' },
    scrollContent: {
        flexGrow: 1,
    },
    topContainer: {
        height: Dimensions.get('window').height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        alignItems: 'center',
        zIndex: 1,
    },
    logoOuterContainer: {
        padding: 10,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 16,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    logoImage: {
        width: 75,
        height: 75,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: 4,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '500',
    },
    formSection: {
        paddingHorizontal: 24,
        marginTop: -40, // Pull form up into gradient
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 30,
        padding: 28,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.gray900,
        labelSpacing: -0.5,
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 24,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 4,
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
    forgotPasswordButton: { },
    forgotPasswordText: { 
        fontSize: 14, 
        color: COLORS.primary, 
        fontWeight: '700' 
    },
    loginButton: { 
        marginTop: 8,
        height: 56,
        borderRadius: 16,
    },
    devLoginButton: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    devLoginText: { fontSize: 13, color: COLORS.gray600, fontWeight: '700' },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8
    },
    registerText: { fontSize: 14, color: COLORS.gray600, fontWeight: '500' },
    registerTextBold: { color: COLORS.primary, fontWeight: '800' },
    footer: { 
        paddingVertical: 30,
        alignItems: 'center',
    },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
    },
    helpText: { fontSize: 13, color: COLORS.gray600, fontWeight: '600' },
});

export default LoginScreen;

