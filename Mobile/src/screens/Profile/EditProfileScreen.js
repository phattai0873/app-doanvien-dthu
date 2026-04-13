import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';
import CommonHeader from '../../components/CommonHeader';

const InputField = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', editable = true }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, !editable && styles.disabledInput]}>
            <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray400}
                keyboardType={keyboardType}
                editable={editable}
            />
        </View>
    </View>
);

const SelectorField = ({ label, icon, value, options, onSelect, placeholder, disabled = false }) => {
    const showOptions = () => {
        if (disabled) return;
        Alert.alert(
            label,
            'Chọn một tùy chọn:',
            [
                ...options.map(opt => ({
                    text: opt.name || opt.title,
                    onPress: () => onSelect(opt.id)
                })),
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    const selectedName = options.find(opt => opt.id === value)?.name || '';

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TouchableOpacity 
                style={[styles.inputContainer, disabled && styles.disabledInput]} 
                onPress={showOptions}
                disabled={disabled}
            >
                <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={[styles.textInput, !selectedName && { color: COLORS.gray400 }]}>
                    {selectedName || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
        </View>
    );
};

export const EditProfileScreen = ({ navigation, route }) => {
    const { userData } = route.params || {};
    const [loading, setLoading] = useState(false);
    const member = userData?.UnionMember || {};
    const [branches, setBranches] = useState([]);
    const [cells, setCells] = useState([]);
    const [formData, setFormData] = useState({
        fullName: userData?.unionMember?.fullName || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        dateOfBirth: userData?.unionMember?.dateOfBirth || '',
        gender: userData?.unionMember?.gender || 'male',
        permanentAddress: userData?.unionMember?.permanentAddress || '',
        hometown: userData?.unionMember?.hometown || '',
        ethnicity: userData?.unionMember?.ethnicity || 'Kinh',
        religion: userData?.unionMember?.religion || 'Không',
        professionalLevel: userData?.unionMember?.professionalLevel || '',
        itLevel: userData?.unionMember?.itLevel || '',
        itLevel: userData?.unionMember?.itLevel || '',
        languageLevel: userData?.unionMember?.languageLevel || '',
    });

    const isDirty = JSON.stringify(formData) !== JSON.stringify({
        fullName: userData?.unionMember?.fullName || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        dateOfBirth: userData?.unionMember?.dateOfBirth || '',
        gender: userData?.unionMember?.gender || 'male',
        permanentAddress: userData?.unionMember?.permanentAddress || '',
        hometown: userData?.unionMember?.hometown || '',
        ethnicity: userData?.unionMember?.ethnicity || 'Kinh',
        religion: userData?.unionMember?.religion || 'Không',
        professionalLevel: userData?.unionMember?.professionalLevel || '',
        itLevel: userData?.unionMember?.itLevel || '',
        languageLevel: userData?.unionMember?.languageLevel || '',
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!isDirty || loading) {
                return;
            }

            e.preventDefault();

            Alert.alert(
                'Thay đổi chưa lưu',
                'Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát không?',
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
    }, [navigation, isDirty, loading]);

    const handleSave = async () => {
        if (!formData.fullName || !formData.email || !formData.phoneNumber) {
            Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
            return;
        }

        setLoading(true);
        try {
            const memberId = userData?.unionMember?.id; 
            
            // WHITELIST Cứng: Chỉ gửi các trường được phép thay đổi
            const updateData = {
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                hometown: formData.hometown,
                permanentAddress: formData.permanentAddress,
                ethnicity: formData.ethnicity,
                religion: formData.religion,
                professionalLevel: formData.professionalLevel,
                itLevel: formData.itLevel,
                languageLevel: formData.languageLevel,
                userId: userData?.id 
            };

            let result;
            if (memberId && memberId !== 'undefined') {
                result = await partyService.updateMemberProfile(memberId, updateData);
            } else {
                // Trường hợp chưa có hồ sơ
                result = await partyService.createMemberProfile(updateData);
            }
            const response = result.data || result; // Phụ thuộc vào cấu trúc trả về của axios interceptor
            
            if (response.isRequest) {
                Alert.alert('Đã gửi yêu cầu', 'Thông tin thay đổi của bạn đã được gửi và đang chờ Bí thư phê duyệt.', [
                    { text: 'Đã hiểu', onPress: () => navigation.goBack() }
                ]);
            } else if (result.success || response) {
                Alert.alert('Thành công', 'Hồ sơ của bạn đã được cập nhật.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const renderGenderOption = (genderValue, label) => (
        <TouchableOpacity 
            style={[styles.genderBtn, formData.gender === genderValue && styles.genderBtnActive]}
            onPress={() => setFormData({ ...formData, gender: genderValue })}
        >
            <Ionicons 
                name={genderValue === 'male' ? 'male' : 'female'} 
                size={18} 
                color={formData.gender === genderValue ? COLORS.white : COLORS.gray500} 
            />
            <Text style={[styles.genderText, formData.gender === genderValue && styles.genderTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <CommonHeader title="Chỉnh sửa hồ sơ" />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.formCard}>
                        <InputField 
                            label="Họ và tên (*)" 
                            icon="person-outline" 
                            value={formData.fullName}
                            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                            placeholder="Nhập họ và tên đầy đủ"
                        />

                        <InputField 
                            label="Email (*)" 
                            icon="mail-outline" 
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            placeholder="Nhập email liên hệ"
                            keyboardType="email-address"
                        />

                        <InputField 
                            label="Số điện thoại (*)" 
                            icon="call-outline" 
                            value={formData.phoneNumber}
                            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                            placeholder="Nhập số điện thoại"
                            keyboardType="phone-pad"
                        />

                        <InputField 
                            label="Ngày sinh" 
                            icon="calendar-outline" 
                            value={formData.dateOfBirth}
                            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                            placeholder="YYYY-MM-DD"
                        />

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Giới tính</Text>
                            <View style={styles.genderContainer}>
                                {renderGenderOption('male', 'Nam')}
                                {renderGenderOption('female', 'Nữ')}
                            </View>
                        </View>

                        <InputField 
                            label="Dân tộc" 
                            icon="people-outline" 
                            value={formData.ethnicity}
                            onChangeText={(text) => setFormData({ ...formData, ethnicity: text })}
                        />

                        <InputField 
                            label="Tôn giáo" 
                            icon="heart-outline" 
                            value={formData.religion}
                            onChangeText={(text) => setFormData({ ...formData, religion: text })}
                        />

                        <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 }} />
                        <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.primary, marginBottom: 15, textTransform: 'uppercase' }}>Trình độ & Chuyên môn</Text>

                        <InputField 
                            label="Trình độ chuyên môn" 
                            icon="school-outline" 
                            value={formData.professionalLevel}
                            onChangeText={(text) => setFormData({ ...formData, professionalLevel: text })}
                        />

                        <InputField 
                            label="Ngoại ngữ" 
                            icon="language-outline" 
                            value={formData.languageLevel}
                            onChangeText={(text) => setFormData({ ...formData, languageLevel: text })}
                        />

                        <InputField 
                            label="Tin học" 
                            icon="desktop-outline" 
                            value={formData.itLevel}
                            onChangeText={(text) => setFormData({ ...formData, itLevel: text })}
                        />

                        <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 }} />

                        <InputField 
                            label="Quê quán" 
                            icon="location-outline" 
                            value={formData.hometown}
                            onChangeText={(text) => setFormData({ ...formData, hometown: text })}
                            placeholder="Nhập quê quán (Tỉnh/Thành phố)"
                        />

                        <InputField 
                            label="Địa chỉ thường trú" 
                            icon="home-outline" 
                            value={formData.permanentAddress}
                            onChangeText={(text) => setFormData({ ...formData, permanentAddress: text })}
                            placeholder="Nhập địa chỉ nhà"
                        />

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.gray400} />
                            <Text style={styles.infoText}>Các thông tin nghiệp vụ (Chi đoàn, Ngày vào Đoàn...) chỉ có thể được thay đổi bởi Ban Chấp hành.</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SIZES.md },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: SIZES.md,
        ...COLORS.shadowDark,
        marginBottom: SIZES.lg,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray700,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        paddingHorizontal: 12,
        height: 54,
    },
    disabledInput: {
        backgroundColor: COLORS.gray100,
        opacity: 0.6,
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        color: COLORS.gray900,
        fontSize: 15,
        fontWeight: '600',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.gray50,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    genderBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    genderText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray600,
    },
    genderTextActive: {
        color: COLORS.white,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.gray400,
        marginLeft: 8,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...COLORS.shadowBlue,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
    }
});


