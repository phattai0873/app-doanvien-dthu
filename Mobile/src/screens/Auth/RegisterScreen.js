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
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import StatusModal from '../../components/common/StatusModal';
import { authService } from '../../services/authService';
import { Pressable } from 'react-native';

const { width, height } = Dimensions.get('window');

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

    // Route Guard
    React.useEffect(() => {
        const isDirty = Object.values(formData).some(val => val.length > 0);
        
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!isDirty || loading) return;
            e.preventDefault();
            Alert.alert(
                'Thay đổi chưa lưu',
                'Bạn có chắc muốn thoát và xóa thông tin đã nhập không?',
                [
                    { text: 'Ở lại', style: 'cancel' },
                    { text: 'Thoát', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, formData, loading]);

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
                {/* Header Section */}
                <View style={styles.topContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, '#4F46E5']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
                        <Text style={styles.subtitle}>
                            Trở thành một thành viên của gia đình DTHU
                        </Text>
                    </View>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.formContainer}>
                        {/* Section 1: Account Info */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                        </View>

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

                        <View style={styles.divider} />

                        {/* Section 2: Union Details */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="briefcase-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Xác minh thông tin</Text>
                        </View>

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
                            label="Ngày sinh (DD/MM/YYYY) *"
                            placeholder="31/12/2000"
                            value={formData.dateOfBirth}
                            onChangeText={(text) => handleChange('dateOfBirth', text)}
                            iconName="calendar-outline"
                            error={errors.dateOfBirth}
                            keyboardType="numeric"
                        />

                        <View style={styles.lookupContainer}>
                            <Text style={styles.lookupLabel}>Mã đoàn viên *</Text>
                            <TouchableOpacity onPress={() => setIsLookupVisible(true)}>
                                <Text style={styles.lookupLink}>Quên mã đoàn viên?</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            placeholder="VD: DV2024001"
                            value={formData.memberCode}
                            onChangeText={(text) => handleChange('memberCode', text)}
                            iconName="id-card-outline"
                            error={errors.memberCode}
                            autoCapitalize="characters"
                        />

                        <Button
                            title="ĐĂNG KÝ NGAY"
                            onPress={handleRegister}
                            loading={loading}
                            variant="gradient"
                            style={styles.registerButton}
                        />
                        
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                            <Text style={styles.loginText}>
                                Đã có tài khoản? <Text style={styles.loginTextBold}>Đăng nhập</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <View style={styles.termsBox}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.gray500} />
                        <Text style={styles.footerText}>
                            Bằng việc đăng ký, bạn đồng ý với <Text style={{fontWeight: '700'}}>Điều khoản</Text> & <Text style={{fontWeight: '700'}}>Chính sách bảo mật</Text> của chúng tôi.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Lookup Modal Redesign */}
            {isLookupVisible && (
                <View style={styles.modalOverlay}>
                    <Pressable 
                        style={StyleSheet.absoluteFill} 
                        onPress={() => setIsLookupVisible(false)} 
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Tra cứu mã đoàn viên</Text>
                                <Text style={styles.modalSubtitle}>Nhập thông tin cá nhân để tìm mã</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setIsLookupVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <TextInput
                                label="Họ và tên"
                                placeholder="Nhập đầy đủ họ tên"
                                value={lookupData.fullName}
                                onChangeText={(val) => setLookupData(p => ({ ...p, fullName: val }))}
                                iconName="person-outline"
                            />
                            <TextInput
                                label="Ngày sinh (DD/MM/YYYY)"
                                placeholder="31/12/2000"
                                value={lookupData.dateOfBirth}
                                onChangeText={(val) => setLookupData(p => ({ ...p, dateOfBirth: val }))}
                                iconName="calendar-outline"
                            />
                            
                            <Button 
                                title="Tìm kiếm"
                                onPress={handleLookup}
                                loading={lookupLoading}
                                variant="primary"
                                style={{ marginVertical: 10 }}
                            />

                            {lookupResults.length > 0 && (
                                <View style={styles.resultsSection}>
                                    <Text style={styles.resultsTitle}>Kết quả tìm thấy:</Text>
                                    {lookupResults.map((item, idx) => (
                                        <View key={idx} style={styles.resultCard}>
                                            <View style={styles.resultInfo}>
                                                <Text style={styles.resultName}>{item.fullName}</Text>
                                                <Text style={styles.resultCode}>{item.memberCodeMasked}</Text>
                                            </View>
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        </View>
                                    ))}
                                    <View style={styles.resultNote}>
                                        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                                        <Text style={styles.resultNoteText}>Vui lòng điền mã này vào biểu mẫu đăng ký.</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
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
    container: { flex: 1, backgroundColor: COLORS.background || '#F8FAFC' },
    scrollContent: {
        flexGrow: 1,
    },
    topContainer: {
        height: height * 0.22,
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    header: {
        marginTop: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    formSection: {
        paddingHorizontal: 24,
        marginTop: -30,
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.gray800,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20,
    },
    lookupContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    lookupLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray700,
    },
    lookupLink: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
    },
    registerButton: {
        marginTop: 10,
        height: 56,
        borderRadius: 16,
    },
    loginLink: { 
        alignItems: 'center', 
        marginTop: 20,
        paddingVertical: 10 
    },
    loginText: { fontSize: 14, color: COLORS.gray600, fontWeight: '500' },
    loginTextBold: { color: COLORS.primary, fontWeight: '800' },
    footer: {
        paddingVertical: 20,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    termsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.gray900,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    resultsSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    resultsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.gray800,
        marginBottom: 12,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    resultInfo: {
        flex: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    resultCode: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    resultNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    resultNoteText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        flex: 1,
    }
});

export default RegisterScreen;

