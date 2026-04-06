import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Modal,
    ScrollView,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { financeService } from '../../services/financeService';
import { partyService } from '../../services/partyService';

export const AdminFeeManagementScreen = () => {
    const [unpaidList, setUnpaidList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
    const [branches, setBranches] = useState([]);
    const [cells, setCells] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedTypeId, setSelectedTypeId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid', 'pending', 'history'
    const [showAddModal, setShowAddModal] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [payingId, setPayingId] = useState(null);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [isSavingType, setIsSavingType] = useState(false);
    
    // For Approval
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankSetting, setBankSetting] = useState(null);
    const [isSavingBank, setIsSavingBank] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'unpaid') {
            loadUnpaidMembers();
        } else if (activeTab === 'history') {
            loadHistory();
        } else {
            loadPending();
        }
    }, [selectedPeriod, selectedBranch, selectedCell, selectedTypeId, activeTab]);

    const loadInitialData = async () => {
        try {
            const bRes = await partyService.getCommittees();
            setBranches(bRes.data || bRes || []);
            
            const mRes = await partyService.getMembers();
            setAllMembers(mRes.data || mRes || []);

            const tRes = await financeService.getFeeTypes();
            const types = tRes.data || tRes || [];
            setFeeTypes(types);
            if (types.length > 0) setSelectedTypeId(types[0].id);

            const bankRes = await financeService.getBankSetting();
            setBankSetting(bankRes);

            // Load pending count for badge
            loadPending();
        } catch (error) {
            console.error('Load initial data error:', error);
        }
    };

    const handleBranchChange = async (branchId) => {
        setSelectedBranch(branchId);
        setSelectedCell(null);
        if (branchId) {
            try {
                const res = await partyService.getCells();
                const allCells = res.data || res || [];
                setCells(allCells.filter(c => c.unionBranchId === branchId));
            } catch (error) {
                console.error('Load cells error:', error);
            }
        } else {
            setCells([]);
        }
    };

    const loadUnpaidMembers = async () => {
        setLoading(true);
        try {
            const result = await financeService.getUnpaidMembers({ 
                period: selectedPeriod,
                unionFeeTypeId: selectedTypeId || undefined,
                unionBranchId: selectedBranch || undefined,
                unionCellId: selectedCell || undefined
            });
            setUnpaidList(result.data || result.rows || result || []);
        } catch (error) {
            setUnpaidList([]);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const result = await financeService.getFees({
                period: selectedPeriod,
                unionFeeTypeId: selectedTypeId || undefined,
                unionBranchId: selectedBranch || undefined,
                unionCellId: selectedCell || undefined
            });
            setHistoryList(result.data || result.rows || result || []);
        } catch (error) {
            setHistoryList([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPending = async () => {
        try {
            const data = await financeService.getPendingTransactions();
            setPendingList(data);
        } catch (error) {
            setPendingList([]);
        }
    };

    const handleApprove = (item) => {
        Alert.alert(
            'Phê duyệt giao dịch',
            `Xác nhận đoàn viên ${item.UnionMember?.fullName} đã thanh toán đúng?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Phê duyệt',
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            await financeService.approveTransaction(item.id);
                            Alert.alert('Thành công', 'Đã phê duyệt và ghi nhận phí.');
                            loadPending();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể phê duyệt.');
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (item) => {
        Alert.alert(
            'Từ chối giao dịch',
            'Xác nhận từ chối giao dịch này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'destructive',
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            await financeService.rejectTransaction(item.id, 'Minh chứng không hợp lệ');
                            Alert.alert('Đã từ chối', 'Giao dịch đã được chuyển trạng thái Thất bại.');
                            loadPending();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể từ chối.');
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleConfirmPayment = (member) => {
        const typeObj = feeTypes.find(t => t.id === selectedTypeId) || { name: 'Đoàn phí' };
        const amount = 24000;
        const typeLabel = `${typeObj.name} năm ${selectedPeriod}`;
        Alert.alert(
            'Xác nhận nộp phí',
            `Xác nhận đoàn viên ${member.fullName} đã nộp ${typeLabel}? (Ghi nhận số tiền 24,000đ)`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        setPayingId(member.id);
                        try {
                            await financeService.payFee({
                                unionMemberId: member.id,
                                period: selectedPeriod,
                                amount,
                                unionFeeTypeId: selectedTypeId,
                                paymentMethod: 'CASH',
                                status: 'COMPLETED',
                                note: `Nộp ${typeLabel}`
                            });
                            Alert.alert('Thành công', 'Đã ghi nhận nộp phí');
                            loadUnpaidMembers();
                        } catch (error) {
                            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể ghi nhận');
                        } finally {
                            setPayingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc muốn xóa bản ghi này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await financeService.deleteFee(id);
                            Alert.alert('Thành công', 'Đã xóa');
                            if (activeTab === 'unpaid') loadUnpaidMembers();
                            else loadHistory();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa');
                        }
                    }
                }
            ]
        );
    };

    const handleManualAdd = async (data) => {
        try {
            await financeService.payFee(data);
            Alert.alert('Thành công', 'Đã lưu bản ghi');
            setShowAddModal(false);
            if (activeTab === 'unpaid') loadUnpaidMembers();
            else loadHistory();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu bản ghi');
        }
    };

    const handleAddFeeType = async () => {
        if (!newTypeName.trim()) return;
        setIsSavingType(true);
        try {
            await financeService.createFeeType({ name: newTypeName, description: `Tạo từ Mobile` });
            setNewTypeName('');
            const tRes = await financeService.getFeeTypes();
            setFeeTypes(tRes.data || tRes || []);
            Alert.alert('Thành công', 'Đã thêm loại phí mới');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm loại phí');
        } finally {
            setIsSavingType(false);
        }
    };

    const handleDeleteFeeType = (type) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa loại phí "${type.name}"? Việc này có thể ảnh hưởng đến các bản ghi đã đóng.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await financeService.deleteFeeType(type.id);
                            const tRes = await financeService.getFeeTypes();
                            setFeeTypes(tRes.data || tRes || []);
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa loại phí này');
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateBank = async (data) => {
        setIsSavingBank(true);
        try {
            await financeService.updateBankSetting(data);
            setBankSetting(data);
            Alert.alert('Thành công', 'Đã cập nhật thông tin ngân hàng thụ hưởng.');
            setShowBankModal(false);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin ngân hàng.');
        } finally {
            setIsSavingBank(false);
        }
    };

    const getFilteredList = () => {
        if (activeTab === 'pending') return pendingList;
        const currentList = activeTab === 'unpaid' ? unpaidList : historyList;
        return currentList.filter(item => {
            const name = item.fullName || item.UnionMember?.fullName || '';
            const code = item.memberCode || item.UnionMember?.memberCode || '';
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                code.toLowerCase().includes(searchQuery.toLowerCase());
        });
    };

    const renderItem = ({ item }) => {
        if (activeTab === 'pending') {
            return (
                <View style={[styles.card, styles.pendingCard]}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.memberName}>{item.UnionMember?.fullName}</Text>
                        <Text style={styles.memberCode}>{item.UnionMember?.memberCode} • Kỳ {item.period}</Text>
                        <Text style={styles.cellName}>{item.UnionFeeType?.name}</Text>
                        <Text style={styles.amountText}>{Number(item.amount).toLocaleString()}đ</Text>
                    </View>
                    
                    <View style={styles.actionColumn}>
                        <TouchableOpacity 
                            style={styles.evidenceBtn} 
                            onPress={() => {
                                setSelectedEvidence(item.evidenceImageUrl);
                                setShowEvidenceModal(true);
                            }}
                        >
                            <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.evidenceBtnText}>Xem Bill</Text>
                        </TouchableOpacity>

                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => handleApprove(item)}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReject(item)}>
                                <Ionicons name="close-circle" size={32} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <Text style={styles.memberName}>{item.fullName || item.UnionMember?.fullName}</Text>
                    <Text style={styles.memberCode}>{item.memberCode || item.UnionMember?.memberCode}</Text>
                    <View style={styles.cardRow}>
                        <Text style={styles.cellName}>{item.UnionCell?.name || item.UnionMember?.UnionCell?.name}</Text>
                        {activeTab === 'history' && (
                            <Text style={styles.amountText}>{Number(item.amount).toLocaleString()}đ</Text>
                        )}
                    </View>
                </View>
                {activeTab === 'unpaid' ? (
                    <TouchableOpacity 
                        style={[styles.payBtn, payingId === item.id && { opacity: 0.7 }]} 
                        onPress={() => handleConfirmPayment(item)}
                        disabled={payingId === item.id}
                    >
                        {payingId === item.id ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Text style={styles.payBtnText}>Ghi nhận</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={20} color={'#EF4444'} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const FeeTypeManagerModal = () => (
        <Modal visible={showTypeModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Quản lý loại đoàn phí</Text>
                        <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.gray600} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.addTypeRow}>
                        <TextInput 
                            style={[styles.input, { flex: 1, marginRight: 10 }]}
                            placeholder="Tên loại phí mới..."
                            value={newTypeName}
                            onChangeText={setNewTypeName}
                        />
                        <TouchableOpacity 
                            style={[styles.smallAddBtn, (!newTypeName.trim() || isSavingType) && { opacity: 0.5 }]}
                            onPress={handleAddFeeType}
                            disabled={!newTypeName.trim() || isSavingType}
                        >
                            {isSavingType ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="add" size={24} color="#FFF" />}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ marginTop: 10 }}>
                        {feeTypes.map(t => (
                            <View key={t.id} style={styles.typeItem}>
                                <Text style={styles.typeName}>{t.name}</Text>
                                <TouchableOpacity onPress={() => handleDeleteFeeType(t)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const FeeManualModal = () => {
        const [formData, setFormData] = useState({
            unionMemberId: '',
            period: selectedPeriod,
            amount: '24000',
            unionFeeTypeId: selectedTypeId,
            paymentMethod: 'CASH',
            status: 'COMPLETED'
        });

        return (
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ghi nhận nộp phí thủ công</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>Chọn loại phí *</Text>
                            <View style={styles.tagList}>
                                {feeTypes.map(t => (
                                    <TouchableOpacity 
                                        key={t.id}
                                        style={[styles.tag, formData.unionFeeTypeId === t.id && styles.tagSelected]}
                                        onPress={() => setFormData({ ...formData, unionFeeTypeId: t.id })}
                                    >
                                        <Text style={[styles.tagText, formData.unionFeeTypeId === t.id && styles.tagTextSelected]}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Đoàn viên *</Text>
                            <View style={styles.pickerWrap}>
                                <FlatList
                                    data={allMembers}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={[styles.memberOption, formData.unionMemberId === item.id && styles.memberSelected]}
                                            onPress={() => setFormData({ ...formData, unionMemberId: item.id })}
                                        >
                                            <Text style={[styles.memberText, formData.unionMemberId === item.id && styles.memberTextSelected]}>{item.fullName}</Text>
                                            <Text style={styles.memberSubText}>{item.memberCode}</Text>
                                        </TouchableOpacity>
                                    )}
                                    style={{ maxHeight: 200 }}
                                />
                            </View>

                            <Text style={styles.label}>Số tiền (đ)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.amount}
                                onChangeText={t => setFormData({ ...formData, amount: t })}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Năm (Nhiệm kỳ)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.period}
                                onChangeText={t => setFormData({ ...formData, period: t })}
                                keyboardType="numeric"
                            />
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.saveBtn}
                            onPress={() => {
                                if (!formData.unionMemberId) return Alert.alert('Lỗi', 'Vui lòng chọn đoàn viên');
                                handleManualAdd(formData);
                            }}
                        >
                            <Text style={styles.saveBtnText}>Lưu dữ liệu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const VIET_BANKS = [
        { code: 'MB', name: 'MB Bank' },
        { code: 'VCB', name: 'Vietcombank' },
        { code: 'ICB', name: 'VietinBank' },
        { code: 'BIDV', name: 'BIDV' },
        { code: 'VBA', name: 'Agribank' },
        { code: 'TCB', name: 'Techcombank' },
        { code: 'ACB', name: 'ACB' },
        { code: 'VPB', name: 'VPBank' },
        { code: 'STB', name: 'Sacombank' },
        { code: 'HDB', name: 'HDBank' },
        { code: 'TPB', name: 'TPBank' },
        { code: 'VIB', name: 'VIB' },
        { code: 'SHB', name: 'SHB' },
        { code: 'MSB', name: 'MSB' },
    ];

    const BankSettingModal = () => {
        const [tempBank, setTempBank] = useState(bankSetting || {
            bankId: 'MB',
            bankName: 'MB Bank',
            accountNo: '',
            accountName: ''
        });

        useEffect(() => {
            if (bankSetting) setTempBank(bankSetting);
        }, [bankSetting]);

        return (
            <Modal visible={showBankModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cấu hình Ngân hàng nhận</Text>
                            <TouchableOpacity onPress={() => setShowBankModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray600} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Chọn Ngân hàng *</Text>
                            <View style={styles.tagList}>
                                {VIET_BANKS.map(b => (
                                    <TouchableOpacity 
                                        key={b.code}
                                        style={[styles.tag, tempBank.bankId === b.code && styles.tagSelected, { marginBottom: 8 }]}
                                        onPress={() => setTempBank({ ...tempBank, bankId: b.code, bankName: b.name })}
                                    >
                                        <Text style={[styles.tagText, tempBank.bankId === b.code && styles.tagTextSelected]}>{b.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, { marginTop: 10 }]}>Số tài khoản *</Text>
                            <TextInput
                                style={styles.input}
                                value={tempBank.accountNo}
                                onChangeText={t => setTempBank({ ...tempBank, accountNo: t })}
                                keyboardType="numeric"
                                placeholder="VD: 0383123456"
                            />

                            <Text style={styles.label}>Tên chủ tài khoản *</Text>
                            <TextInput
                                style={styles.input}
                                value={tempBank.accountName}
                                onChangeText={t => setTempBank({ ...tempBank, accountName: t.toUpperCase() })}
                                placeholder="VD: DOAN THANH NIEN DTHU"
                            />
                        </ScrollView>
                        <TouchableOpacity 
                            style={[styles.saveBtn, isSavingBank && { opacity: 0.7 }]}
                            onPress={() => handleUpdateBank(tempBank)}
                            disabled={isSavingBank}
                        >
                            {isSavingBank ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Lưu cấu hình</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.tabBar}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'unpaid' && styles.tabActive]}
                        onPress={() => setActiveTab('unpaid')}
                    >
                        <Text style={[styles.tabText, activeTab === 'unpaid' && styles.tabTextActive]}>Chưa nộp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <View style={styles.tabRow}>
                             <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Chờ duyệt</Text>
                             {pendingList.length > 0 && <View style={styles.badgeCount}><Text style={styles.badgeText}>{pendingList.length}</Text></View>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Đã nộp</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.topRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={COLORS.gray400} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm đoàn viên..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.filterBtn, (selectedBranch || selectedCell) && styles.filterBtnActive]}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Ionicons name="filter" size={20} color={(selectedBranch || selectedCell) ? COLORS.white : COLORS.gray500} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.filterBtn, { backgroundColor: '#F3F4F6' }]}
                        onPress={() => setShowBankModal(true)}
                    >
                        <Ionicons name="card" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {showFilters && (
                    <View style={styles.filtersContainer}>
                        <View style={styles.filterRow}>
                             <View style={styles.yearPicker}>
                                <Text style={styles.yearLabel}>Năm: </Text>
                                <TextInput
                                    style={styles.yearInput}
                                    value={selectedPeriod}
                                    onChangeText={setSelectedPeriod}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </View>
                            <TouchableOpacity 
                                style={styles.resetBtn}
                                onPress={() => {
                                    setSelectedBranch(null);
                                    setSelectedCell(null);
                                    setCells([]);
                                    setSelectedPeriod(new Date().getFullYear().toString());
                                    if (feeTypes.length > 0) setSelectedTypeId(feeTypes[0].id);
                                }}
                            >
                                <Text style={styles.resetText}>Đặt lại</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.pickerLabel}>Loại đoàn phí:</Text>
                                <TouchableOpacity style={styles.manageBtn} onPress={() => setShowTypeModal(true)}>
                                    <Ionicons name="settings-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.manageBtnText}> Quản lý</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagList}>
                                {feeTypes.map(t => (
                                    <TouchableOpacity 
                                        key={t.id}
                                        style={[styles.tag, selectedTypeId === t.id && styles.tagSelected]}
                                        onPress={() => setSelectedTypeId(t.id)}
                                    >
                                        <Text style={[styles.tagText, selectedTypeId === t.id && styles.tagTextSelected]}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Liên chi đoàn:</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={[{ id: null, name: 'Tất cả' }, ...branches]}
                                keyExtractor={item => (item.id || 'all').toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[styles.tag, selectedBranch === item.id && styles.tagSelected]}
                                        onPress={() => handleBranchChange(item.id)}
                                    >
                                        <Text style={[styles.tagText, selectedBranch === item.id && styles.tagTextSelected]}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={styles.tagList}
                            />
                        </View>

                        {selectedBranch && (
                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerLabel}>Chi đoàn:</Text>
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={[{ id: null, name: 'Tất cả' }, ...cells]}
                                    keyExtractor={item => (item.id || 'all').toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={[styles.tag, selectedCell === item.id && styles.tagSelected]}
                                            onPress={() => setSelectedCell(item.id)}
                                        >
                                            <Text style={[styles.tagText, selectedCell === item.id && styles.tagTextSelected]}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                    contentContainerStyle={styles.tagList}
                                />
                            </View>
                        )}
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={getFilteredList()}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="card-outline" size={64} color={COLORS.gray200} />
                            <Text style={styles.emptyText}>Dữ liệu trống</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={30} color={COLORS.white} />
            </TouchableOpacity>

            <FeeManualModal />
            <FeeTypeManagerModal />
            <BankSettingModal />

            {/* Evidence Modal */}
            <Modal visible={showEvidenceModal} transparent animationType="fade">
                <View style={styles.evidenceOverlay}>
                    <TouchableOpacity style={styles.closeEvidence} onPress={() => setShowEvidenceModal(false)}>
                        <Ionicons name="close-circle" size={40} color="#FFF" />
                    </TouchableOpacity>
                    {selectedEvidence ? (
                        <View style={styles.evidenceContainer}>
                             <Image 
                                source={{ uri: selectedEvidence }} 
                                style={styles.evidenceImageLarge} 
                                resizeMode="contain" 
                            />
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <Text style={{ color: '#FFF' }}>Không tìm thấy minh chứng</Text>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    tabBar: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: 'bold', color: COLORS.gray500 },
    tabTextActive: { color: COLORS.primary },
    tabRow: { flexDirection: 'row', alignItems: 'center' },
    badgeCount: { backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    topRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
    filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    filterBtnActive: { backgroundColor: COLORS.primary },
    filtersContainer: { marginTop: 16, paddingBottom: 8 },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    yearPicker: { flexDirection: 'row', alignItems: 'center' },
    yearLabel: { fontSize: 14, color: COLORS.gray500, fontWeight: '600' },
    yearInput: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, fontWeight: 'bold', color: COLORS.primary },
    resetBtn: { padding: 4 },
    resetText: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
    pickerContainer: { marginBottom: 12 },
    pickerLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 8, textTransform: 'uppercase' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    manageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    manageBtnText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary },
    tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    tagSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tagText: { fontSize: 13, color: COLORS.gray600 },
    tagTextSelected: { color: COLORS.white, fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 100 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    pendingCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
    cardInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    memberCode: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    cellName: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    amountText: { fontSize: 14, fontWeight: 'bold', color: COLORS.black, marginTop: 4 },
    actionColumn: { alignItems: 'center', gap: 10 },
    actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    evidenceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    evidenceBtnText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, marginLeft: 4 },
    payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    payBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
    deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    modalBody: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: COLORS.gray600, marginTop: 16, marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
    addTypeRow: { flexDirection: 'row', marginBottom: 16 },
    smallAddBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    typeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    typeName: { fontSize: 15, color: COLORS.black, fontWeight: '500' },
    pickerWrap: { backgroundColor: '#F3F4F6', borderRadius: 12, overflow: 'hidden' },
    memberOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    memberSelected: { backgroundColor: COLORS.primary + '10' },
    memberText: { fontSize: 15, color: COLORS.black },
    memberTextSelected: { fontWeight: 'bold', color: COLORS.primary },
    memberSubText: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.gray400, marginTop: 12 },
    evidenceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    closeEvidence: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
    evidenceContainer: { width: '100%', height: '80%' },
    evidenceImageLarge: { width: '100%', height: '100%' }
});
