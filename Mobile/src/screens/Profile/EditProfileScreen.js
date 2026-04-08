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

export const EditProfileScreen = ({ navigation, route }) => {
    const { userData } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        ho_ten: userData?.ho_ten || '',
        email: userData?.email || '',
        sdt: userData?.sdt || '',
        ngay_sinh: userData?.ngay_sinh || '',
        gioi_tinh: userData?.gioi_tinh || 'Nam',
        dia_chi: userData?.dia_chi || '',
        que_quan: userData?.que_quan || '',
        trinh_do: userData?.trinh_do || '',
        ngay_vao_doan: userData?.ngay_vao_doan || ''
    });

    const handleSave = async () => {
        if (!formData.ho_ten || !formData.email || !formData.sdt) {
            Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
            return;
        }

        setLoading(true);
        try {
            const memberId = userData?.UnionMember?.id || userData?.id;
            const updateData = {
                fullName: formData.ho_ten,
                email: formData.email,
                phoneNumber: formData.sdt,
                dateOfBirth: formData.ngay_sinh,
                gender: formData.gioi_tinh === 'Nam' ? 'male' : 'female',
                hometown: formData.que_quan,
                permanentAddress: formData.dia_chi,
                educationLevel: formData.trinh_do,
                joinedDate: formData.ngay_vao_doan
            };

            const result = await partyService.updateMemberProfile(memberId, updateData);
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

    const renderGenderOption = (gender) => (
        <TouchableOpacity 
            style={[styles.genderBtn, formData.gioi_tinh === gender && styles.genderBtnActive]}
            onPress={() => setFormData({ ...formData, gioi_tinh: gender })}
        >
            <Ionicons 
                name={gender === 'Nam' ? 'male' : 'female'} 
                size={18} 
                color={formData.gioi_tinh === gender ? COLORS.white : COLORS.gray500} 
            />
            <Text style={[styles.genderText, formData.gioi_tinh === gender && styles.genderTextActive]}>
                {gender}
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
                            value={formData.ho_ten}
                            onChangeText={(text) => setFormData({ ...formData, ho_ten: text })}
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
                            value={formData.sdt}
                            onChangeText={(text) => setFormData({ ...formData, sdt: text })}
                            placeholder="Nhập số điện thoại"
                            keyboardType="phone-pad"
                        />

                        <InputField 
                            label="Ngày sinh" 
                            icon="calendar-outline" 
                            value={formData.ngay_sinh}
                            onChangeText={(text) => setFormData({ ...formData, ngay_sinh: text })}
                            placeholder="YYYY-MM-DD"
                        />

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Giới tính</Text>
                            <View style={styles.genderContainer}>
                                {renderGenderOption('Nam')}
                                {renderGenderOption('Nữ')}
                            </View>
                        </View>

                        <InputField 
                            label="Quê quán" 
                            icon="location-outline" 
                            value={formData.que_quan}
                            onChangeText={(text) => setFormData({ ...formData, que_quan: text })}
                            placeholder="Nhập quê quán (Tỉnh/Thành phố)"
                        />

                        <InputField 
                            label="Trình độ học vấn" 
                            icon="school-outline" 
                            value={formData.trinh_do}
                            onChangeText={(text) => setFormData({ ...formData, trinh_do: text })}
                            placeholder="Ví dụ: 12/12, Đại học..."
                        />

                        <InputField 
                            label="Ngày vào đoàn" 
                            icon="flag-outline" 
                            value={formData.ngay_vao_doan}
                            onChangeText={(text) => setFormData({ ...formData, ngay_vao_doan: text })}
                            placeholder="YYYY-MM-DD"
                        />

                        <InputField 
                            label="Địa chỉ thường trú" 
                            icon="home-outline" 
                            value={formData.dia_chi}
                            onChangeText={(text) => setFormData({ ...formData, dia_chi: text })}
                            placeholder="Nhập địa chỉ nhà"
                        />

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.gray400} />
                            <Text style={styles.infoText}>Mã đoàn viên và Mã sinh viên không được phép thay đổi tự do.</Text>
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


