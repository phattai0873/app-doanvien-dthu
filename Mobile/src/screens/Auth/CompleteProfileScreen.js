import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import StatusModal from '../../components/common/StatusModal';
import { partyService } from '../../services/partyService';
import { Pressable } from 'react-native';

const CompleteProfileScreen = ({ onSuccess, onLogout }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        studentId: '', // Mã số sinh viên
        dateOfBirth: '',
        hometown: '',
        homeAddress: '',
        unionCellId: '',
    });
    const [cells, setCells] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [showCellModal, setShowCellModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetchingCells, setFetchingCells] = useState(true);

    // Status Modal State
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        onClose: () => {}
    });

    useEffect(() => {
        loadCells();
    }, []);

    const loadCells = async () => {
        try {
            const response = await partyService.getCells();
            setCells(response.data || []);
        } catch (error) {
            console.error('Error loading cells:', error);
            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Lỗi tải dữ liệu',
                message: 'Không thể tải danh sách chi đoàn. Vui lòng kiểm tra kết nối mạng.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setFetchingCells(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
        if (!formData.unionCellId) newErrors.unionCellId = 'Vui lòng chọn chi đoàn sinh hoạt';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const response = await partyService.createMemberProfile(formData);
            if (response && response.success) {
                setModalConfig({
                    visible: true,
                    type: 'success',
                    title: 'Gửi thành công',
                    message: 'Hồ sơ của bạn đã được gửi và đang chờ quản trị viên phê duyệt. Bạn sẽ nhận được thông báo sau khi hồ sơ được xác thực.',
                    onClose: () => {
                        setModalConfig(prev => ({ ...prev, visible: false }));
                        onSuccess && onSuccess();
                    }
                });
            }
        } catch (error) {
            console.error(error);
            setModalConfig({
                visible: true,
                type: 'error',
                title: 'Lỗi nộp hồ sơ',
                message: error.response?.data?.message || 'Không thể gửi hồ sơ lúc này. Vui lòng liên hệ cán bộ đoàn nếu vấn đề tiếp diễn.',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    const renderCellItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.cellItem}
            onPress={() => {
                setSelectedCell(item);
                setFormData(prev => ({ ...prev, unionCellId: item.id }));
                setErrors(prev => ({ ...prev, unionCellId: null }));
                setShowCellModal(false);
            }}
        >
            <View>
                <Text style={styles.cellName}>{item.name}</Text>
                <Text style={styles.cellCode}>{item.code} - {item.UnionBranch?.name}</Text>
            </View>
            {selectedCell?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

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
                <View style={styles.header}>
                    <Text style={styles.title}>Hoàn Thiện Hồ Sơ</Text>
                    <Text style={styles.subtitle}>
                        Vui lòng cung cấp thông tin chính xác để Ban chấp hành duyệt hồ sơ của bạn.
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        label="Họ và tên *"
                        placeholder="Nhập đầy đủ họ và tên"
                        value={formData.fullName}
                        onChangeText={(text) => handleChange('fullName', text)}
                        iconName="person-outline"
                        error={errors.fullName}
                    />



                    <TextInput
                        label="Ngày sinh"
                        placeholder="DD/MM/YYYY"
                        value={formData.dateOfBirth}
                        onChangeText={(text) => handleChange('dateOfBirth', text)}
                        iconName="calendar-outline"
                    />

                    <TextInput
                        label="MSSV"
                        placeholder="Mã số sinh viên (nếu có)"
                        value={formData.studentId}
                        onChangeText={(text) => handleChange('studentId', text)}
                        iconName="card-outline"
                    />

                    <TextInput
                        label="Quê quán"
                        placeholder="VD: Cao Lãnh, Đồng Tháp"
                        value={formData.hometown}
                        onChangeText={(text) => handleChange('hometown', text)}
                        iconName="map-outline"
                    />

                    <TextInput
                        label="Thường trú"
                        placeholder="Nhập địa chỉ thường trú"
                        value={formData.homeAddress}
                        onChangeText={(text) => handleChange('homeAddress', text)}
                        iconName="home-outline"
                        multiline
                    />

                    {/* Cell Picker */}
                    <Text style={styles.label}>Chi đoàn sinh hoạt *</Text>
                    <TouchableOpacity 
                        style={[
                            styles.pickerButton,
                            errors.unionCellId && styles.pickerButtonError
                        ]}
                        onPress={() => setShowCellModal(true)}
                    >
                        <View style={styles.pickerInner}>
                            <Ionicons name="business-outline" size={20} color={COLORS.gray400} style={{ marginRight: 12 }} />
                            <Text style={[
                                styles.pickerText,
                                !selectedCell && { color: COLORS.gray400 }
                            ]}>
                                {selectedCell ? selectedCell.name : 'Chọn chi đoàn'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                    {errors.unionCellId && <Text style={styles.errorText}>{errors.unionCellId}</Text>}

                    <Button
                        title="Gửi Hồ Sơ"
                        onPress={handleSubmit}
                        loading={loading}
                        style={{ marginTop: 24 }}
                    />

                    <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <StatusModal 
                visible={modalConfig.visible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onAttemptClose={modalConfig.onClose}
            />

            {/* Cell Modal */}
            <Modal
                visible={showCellModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCellModal(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => {
                        // Check logic dirty for cell modal (thường chọn xong là thoát, ít ai lỡ tay)
                        // Nhưng vẫn block nếu đang có filter hoặc gì đó nếu phức tạp.
                        // Ở đây đơn giản là thoát nếu click ngoài.
                        setShowCellModal(false);
                    }}
                >
                    <Pressable style={styles.modalContent} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Chi đoàn</Text>
                            <TouchableOpacity onPress={() => setShowCellModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray700} />
                            </TouchableOpacity>
                        </View>
                        
                        {fetchingCells ? (
                            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
                        ) : (
                            <FlatList
                                data={cells}
                                keyExtractor={item => item.id.toString()}
                                renderItem={renderCellItem}
                                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40
    },
    header: { marginBottom: 32 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.gray600,
        lineHeight: 22
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 24,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray700,
        marginBottom: 8,
        marginLeft: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1.5,
        borderColor: COLORS.gray100,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    pickerButtonError: {
        borderColor: COLORS.error,
        backgroundColor: '#FFF1F2',
    },
    pickerInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 15,
        color: COLORS.gray900,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 6,
        marginLeft: 8,
        fontWeight: '600',
    },
    logoutButton: {
        marginTop: 20,
        padding: 10,
        alignItems: 'center'
    },
    logoutText: {
        color: COLORS.gray500,
        fontSize: 14,
        textDecorationLine: 'underline'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gray900
    },
    cellItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray50
    },
    cellName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray900,
        marginBottom: 4
    },
    cellCode: {
        fontSize: 13,
        color: COLORS.gray500
    },
    loadingText: {
        textAlign: 'center',
        padding: 40,
        color: COLORS.gray500
    }
});

export default CompleteProfileScreen;
