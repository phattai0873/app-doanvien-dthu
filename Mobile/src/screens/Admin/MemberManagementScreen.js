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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { partyService } from '../../services/partyService';
import { useAuth } from '../../contexts/AuthContext';

export const MemberManagementScreen = ({ navigation, route }) => {
    const { cellId: paramCellId, cellName } = route.params || {};
    const { user: authUser } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const params = {};
            
            // Xử lý bộ lọc theo quyền
            const member = authUser?.UnionMember;
            const role = authUser?.role;
            
            // Ưu tiên lọc theo cellId truyền từ màn hình quản lý Chi đoàn
            if (paramCellId) {
                params.unionCellId = paramCellId;
            } else if (role === 'CELL_ADMIN') {
                // Bí thư Chi đoàn -> Lọc theo Chi đoàn mình quản lý
                if (member?.unionCellId) params.unionCellId = member.unionCellId;
            } else if (role === 'BRANCH_ADMIN') {
                // Bí thư Liên chi đoàn -> Lọc theo Liên chi đoàn mình quản lý
                if (member?.UnionCell?.unionBranchId) params.unionBranchId = member.UnionCell.unionBranchId;
            }
            // Admin (ADMIN/SUPERADMIN) -> Không gửi params để lấy tất cả

            const data = await partyService.getMembers(params);
            setMembers(data || []);
        } catch (error) {
            console.error('Error loading members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách đoàn viên');
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = (members || []).filter(m =>
        m.ho_ten?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.ma_dang_vien?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApprove = async (id) => {
        try {
            const response = await partyService.approveMember(id);
            if (response.success) {
                Alert.alert('Thành công', 'Đã duyệt đoàn viên');
                loadMembers();
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể duyệt đoàn viên');
        }
    };

    const handleReject = async (id) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn từ chối đoàn viên này?',
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Từ chối', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await partyService.rejectMember(id);
                            if (response.success) {
                                Alert.alert('Thành công', 'Đã từ chối đoàn viên');
                                loadMembers();
                            }
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể thực hiện thao tác');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return { bg: '#C6F6D5', text: '#22543D', label: 'Chính thức' };
            case 'pending': return { bg: '#FEEBC8', text: '#7B341E', label: 'Chờ duyệt' };
            case 'rejected': return { bg: '#FED7D7', text: '#822727', label: 'Từ chối' };
            default: return { bg: '#EDF2F7', text: '#4A5568', label: 'N/A' };
        }
    };

    const renderItem = ({ item }) => {
        const status = getStatusColor(item.status);
        return (
            <View style={styles.memberCard}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.ho_ten?.[0]}</Text>
                </View>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.ho_ten}</Text>
                    <Text style={styles.memberCode}>{item.ma_dang_vien}</Text>
                    <View style={styles.tagContainer}>
                        <View style={[styles.tag, { backgroundColor: status.bg }]}>
                            <Text style={[styles.tagText, { color: status.text }]}>
                                {status.label}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {item.status === 'pending' && (
                    <View style={styles.actionGroup}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                            <Ionicons name="checkmark-circle" size={24} color="#38A169" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                            <Ionicons name="close-circle" size={24} color="#E53E3E" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray500} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên hoặc mã số..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredMembers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không tìm thấy đoàn viên nào</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        margin: SIZES.md,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd,
        elevation: 2,
    },
    searchInput: { flex: 1, marginLeft: SIZES.sm, fontSize: SIZES.fontMd },
    listContent: { padding: SIZES.md, paddingBottom: 100 },
    memberCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.md,
        marginBottom: SIZES.md,
        alignItems: 'center',
        elevation: 1,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.md,
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    memberInfo: { flex: 1 },
    memberName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.black },
    memberCode: { fontSize: SIZES.fontSm, color: COLORS.gray500, marginTop: 2 },
    tagContainer: { flexDirection: 'row', marginTop: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: 'bold' },
    actionButton: { padding: SIZES.xs },
    actionGroup: { flexDirection: 'row', gap: SIZES.sm },
    approveBtn: { padding: 4 },
    rejectBtn: { padding: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.gray500, fontSize: SIZES.fontMd },
});
