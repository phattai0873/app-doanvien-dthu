import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image as RNImage
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES, IMAGES } from '../../constants';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import { partyService } from '../../services/partyService';

export const EditProfileScreen = ({ onBack }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [hometown, setHometown] = useState('');
    const [residence, setResidence] = useState('');
    const [joinedDate, setJoinedDate] = useState('');
    const [joinedPlace, setJoinedPlace] = useState('');
    const [identityNumber, setIdentityNumber] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await partyService.getMemberProfile();
                setUser(data);

                // Map data to fields
                setName(data.ho_ten || '');
                setStudentId(data.UnionMember?.studentId || '');
                setPhone(data.UnionMember?.phoneNumber || '');
                setEmail(data.UnionMember?.email || '');
                setDob(data.UnionMember?.dateOfBirth ? formatDate(data.UnionMember.dateOfBirth) : '');
                setHometown(data.UnionMember?.hometown || '');
                setResidence(data.UnionMember?.homeAddress || '');
                setJoinedDate(data.UnionMember?.joinedDate ? formatDate(data.UnionMember.joinedDate) : '');
                setJoinedPlace(data.UnionMember?.joinedPlace || '');
                setIdentityNumber(data.UnionMember?.identityNumber || '');
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSave = async () => {
        console.log('Button Pressed: handleSave started');
        if (!name.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập họ và tên");
            return;
        }

        setSaving(true);
        try {
            const memberId = user?.UnionMember?.id;
            if (!memberId) {
                Alert.alert("Lỗi", "Không tìm thấy mã đoàn viên để cập nhật.");
                setSaving(false);
                return;
            }

            // Chuẩn bị dữ liệu cập nhật
            const updateData = {
                fullName: name,
                phoneNumber: phone,
                email: email,
                hometown: hometown,
                homeAddress: residence,
                dateOfBirth: dob ? dob.split('/').reverse().join('-') : null,
                studentId: studentId,
                identityNumber: identityNumber,
                joinedDate: joinedDate ? joinedDate.split('/').reverse().join('-') : null,
                joinedPlace: joinedPlace
            };

            const response = await partyService.updateMemberProfile(memberId, updateData);
            
            if (response && response.success) {
                Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật.");
                onBack();
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật thông tin lúc này.");
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert("Lỗi", error.message || "Đã xảy ra lỗi khi lưu thông tin.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const isApproved = user?.UnionMember?.status === 'approved';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <RNImage
                            source={user?.anh_dai_dien ? { uri: user.anh_dai_dien } : IMAGES.user_fallback}
                            style={styles.imageAvatar}
                        />
                        <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
                            <Icon name="Camera" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>Hình ảnh hiển thị trên thẻ Đoàn viên</Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Section 1: Định danh */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin tuyển sinh / Định danh</Text>
                        <TextInput
                            label="Họ và tên *"
                            placeholder="Nhập đầy đủ họ tên"
                            value={name}
                            onChangeText={setName}
                            iconName="person-outline"
                            editable={!isApproved}
                        />
                        <TextInput
                            label="Mã số sinh viên"
                            placeholder="Mã số sinh viên"
                            value={studentId}
                            onChangeText={setStudentId}
                            iconName="card-outline"
                            editable={!isApproved}
                        />
                        <TextInput
                            label="Số CCCD / CMND"
                            placeholder="Nhập số CCCD"
                            value={identityNumber}
                            onChangeText={setIdentityNumber}
                            iconName="id-card-outline"
                            editable={!isApproved}
                        />
                        <TextInput
                            label="Ngày sinh"
                            placeholder="DD/MM/YYYY"
                            value={dob}
                            onChangeText={setDob}
                            iconName="calendar-outline"
                            editable={!isApproved}
                        />
                        {isApproved && (
                            <Text style={styles.lockHint}>
                                * Thông tin định danh đã được xác thực, không thể tự chỉnh sửa.
                            </Text>
                        )}
                    </View>

                    {/* Section 2: Liên lạc */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin liên lạc</Text>
                        <TextInput
                            label="Số điện thoại *"
                            placeholder="Nhập số điện thoại"
                            value={phone}
                            onChangeText={setPhone}
                            iconName="call-outline"
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            label="Email"
                            placeholder="Nhập địa chỉ email"
                            value={email}
                            onChangeText={setEmail}
                            iconName="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            label="Quê quán"
                            placeholder="VD: Cao Lãnh, Đồng Tháp"
                            value={hometown}
                            onChangeText={setHometown}
                            iconName="map-outline"
                        />
                        <TextInput
                            label="Thường trú"
                            placeholder="Nhập địa chỉ thường trú"
                            value={residence}
                            onChangeText={setResidence}
                            iconName="home-outline"
                            multiline
                            style={{ minHeight: 80 }}
                        />
                    </View>

                    {/* Section 3: Đoàn tịch */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin Đoàn tịch</Text>
                        <TextInput
                            label="Ngày vào Đoàn"
                            placeholder="DD/MM/YYYY"
                            value={joinedDate}
                            onChangeText={setJoinedDate}
                            iconName="calendar-outline"
                        />
                        <TextInput
                            label="Nơi vào Đoàn"
                            placeholder="Nơi kết nạp Đoàn"
                            value={joinedPlace}
                            onChangeText={setJoinedPlace}
                            iconName="business-outline"
                        />
                        
                        <View style={styles.staticBox}>
                            <View style={styles.staticHeader}>
                                <Icon name="Building" size={16} color={COLORS.primary} />
                                <Text style={styles.staticTitle}>Cơ cấu tổ chức hiện tại</Text>
                            </View>
                            <View style={styles.staticRow}>
                                <Text style={styles.staticLabel}>Đơn vị:</Text>
                                <Text style={styles.staticValue}>{user?.UnionMember?.UnionCell?.name || '—'}</Text>
                            </View>
                            <View style={styles.staticRow}>
                                <Text style={styles.staticLabel}>Chức vụ:</Text>
                                <Text style={styles.staticValueBold}>{user?.chuc_vu_doan || 'Đoàn viên'}</Text>
                            </View>
                        </View>
                    </View>

                    <Button
                        title="Lưu thay đổi hồ sơ"
                        onPress={handleSave}
                        loading={saving}
                        style={styles.saveBtn}
                    />

                    <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
                        <Text style={styles.cancelBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    
    scrollContent: { paddingBottom: 60 },
    
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    avatarWrapper: {
        position: 'relative',
        width: 110,
        height: 110,
        borderRadius: 55,
        padding: 4,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    imageAvatar: { width: '100%', height: '100%', borderRadius: 55 },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
        elevation: 4,
    },
    avatarHint: {
        marginTop: 16,
        fontSize: 12,
        color: COLORS.gray400,
        fontWeight: '500'
    },

    formContainer: { padding: 20 },
    formSection: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.gray900,
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        paddingLeft: 10
    },
    lockHint: {
        fontSize: 11,
        color: COLORS.gray400,
        fontStyle: 'italic',
        marginTop: 5,
        textAlign: 'center'
    },

    staticBox: {
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
    },
    staticHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8
    },
    staticTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
    staticRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    staticLabel: { fontSize: 13, color: COLORS.gray500 },
    staticValue: { fontSize: 13, color: COLORS.gray800, fontWeight: '500' },
    staticValueBold: { fontSize: 13, color: COLORS.gray900, fontWeight: '800' },

    saveBtn: { marginTop: 10, height: 56, borderRadius: 16 },
    cancelBtn: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center'
    },
    cancelBtnText: {
        fontSize: 15,
        color: COLORS.gray400,
        fontWeight: '600'
    },
});
