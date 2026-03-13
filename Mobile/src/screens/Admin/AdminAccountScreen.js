import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import apiClient from '../../services/api';

export const AdminAccountScreen = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/users');
            // Assuming backend returns { success: true, data: [] }
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Fetch accounts error:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (user) => {
        try {
            const response = await apiClient.patch(`/api/users/${user.id}/toggle-lock`);
            if (response.success) {
                Alert.alert('Thành công', response.data.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
                fetchAccounts();
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải từ 6 ký tự');
            return;
        }
        try {
            const response = await apiClient.patch(`/api/users/${selectedUser.id}/reset-password`, { newPassword });
            if (response.success) {
                Alert.alert('Thành công', 'Đã đặt lại mật khẩu');
                setResetModalVisible(false);
                setNewPassword('');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đặt lại mật khẩu');
        }
    };

    const filtered = accounts.filter(acc => 
        acc.username.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.roleText}>{item.role === 'admin' ? 'Quản trị viên' : 'Đoàn viên'}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.isLocked ? '#FED7D7' : '#C6F6D5' }]}>
                    <Text style={[styles.statusText, { color: item.isLocked ? '#822727' : '#22543D' }]}>
                        {item.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary + '10' }]}
                    onPress={() => {
                        setSelectedUser(item);
                        setResetModalVisible(true);
                    }}
                >
                    <Ionicons name="key-outline" size={16} color={COLORS.primary} />
                    <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Đổi MK</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: item.isLocked ? '#F0FFF4' : '#FFF5F5' }]}
                    onPress={() => toggleLock(item)}
                >
                    <Ionicons name={item.isLocked ? "lock-open-outline" : "lock-closed-outline"} size={16} color={item.isLocked ? '#38A169' : '#E53E3E'} />
                    <Text style={[styles.actionBtnText, { color: item.isLocked ? '#38A169' : '#E53E3E' }]}>
                        {item.isLocked ? 'Mở khóa' : 'Khóa'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={COLORS.gray400} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Tìm kiếm tài khoản..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList 
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy tài khoản</Text>}
                />
            )}

            {/* Reset Password Modal */}
            <Modal visible={resetModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Đặt lại mật khẩu</Text>
                        <Text style={styles.modalSub}>Tài khoản: {selectedUser?.username}</Text>
                        
                        <TextInput 
                            style={styles.input}
                            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleResetPassword}>
                                <Text style={styles.confirmBtnText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: SIZES.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.sm, paddingVertical: 8 },
    searchInput: { flex: 1, marginLeft: SIZES.xs, fontSize: SIZES.fontMd },
    list: { padding: SIZES.md, paddingBottom: 100 },
    card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.gray100, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.md },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    username: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.textPrimary },
    roleText: { fontSize: SIZES.fontXs, color: COLORS.gray500 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: SIZES.radiusFull },
    statusText: { fontSize: 10, fontWeight: '800' },
    cardFooter: { flexDirection: 'row', gap: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.gray50, paddingTop: SIZES.sm },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: SIZES.radiusMd, gap: 6 },
    actionBtnText: { fontSize: SIZES.fontSm, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', color: COLORS.gray400, marginTop: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    modalSub: { fontSize: 14, color: COLORS.gray500, marginBottom: 20 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.gray200, borderRadius: SIZES.radiusMd, padding: 12, marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: COLORS.gray500, fontWeight: '600' },
    confirmBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: SIZES.radiusMd, alignItems: 'center' },
    confirmBtnText: { color: COLORS.white, fontWeight: '700' },
});
