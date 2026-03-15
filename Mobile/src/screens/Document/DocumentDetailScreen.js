import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { documentService } from '../../services/documentService';

export const DocumentDetailScreen = ({ route, onBack }) => {
    const { id } = route?.params || {};
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const docs = await documentService.getDocuments();
                const found = docs.find(item => item.id == id);
                setDoc(found);
            } catch (error) {
                console.error("Failed to fetch document detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id]);

    const handleDownload = () => {
        Alert.alert(
            "Tải tài liệu",
            `Bạn có muốn tải xuống "${doc.title}"?`,
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Tải xuống", 
                    onPress: () => {
                        // Mock download progress
                        Alert.alert("Thông báo", "Đang bắt đầu tải tài liệu...");
                        setTimeout(() => {
                            Alert.alert("Thành công", "Đã tải tài liệu vào thư mục Downloads của bạn.");
                        }, 2000);
                    } 
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!doc) {
        return (
            <View style={styles.center}>
                <Icon name="AlertTriangle" size={48} color={COLORS.gray300} />
                <Text style={styles.errorText}>Không tìm thấy tài liệu</Text>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backIcon}>
                    <Icon name="ArrowLeft" size={24} color={COLORS.gray700} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Thông tin tài liệu</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconWrapper}>
                    <Icon 
                        name={doc.file_type === 'pdf' ? 'FileText' : 'BookOpen'} 
                        size={64} 
                        color={doc.file_type === 'pdf' ? '#EF4444' : '#3B82F6'} 
                    />
                </View>

                <Text style={styles.title}>{doc.title}</Text>
                
                <View style={styles.infoGroup}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Định dạng:</Text>
                        <Text style={styles.infoValue}>{doc.file_type.toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày ban hành:</Text>
                        <Text style={styles.infoValue}>{doc.created_at}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Dung lượng:</Text>
                        <Text style={styles.infoValue}>~ 2.4 MB</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Danh mục:</Text>
                        <View style={styles.catBadge}>
                            <Text style={styles.catText}>Văn bản Đoàn</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.descriptionBox}>
                    <Text style={styles.descTitle}>Mô tả chi tiết</Text>
                    <Text style={styles.descText}>
                        Tài liệu này được phổ biến rộng rãi trong toàn bộ tổ chức Đoàn trường. 
                        Yêu cầu các Bí thư chi đoàn nghiên cứu kỹ và thực hiện đúng tinh thần của văn bản.
                    </Text>
                </View>

                <TouchableOpacity style={styles.mainDownloadBtn} onPress={handleDownload}>
                    <Icon name="Download" size={20} color="#FFF" />
                    <Text style={styles.mainDownloadBtnText}>TẢI VỀ MÁY</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'ios' ? 50 : 20, 
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, flex: 1, textAlign: 'center' },
    backIcon: { padding: 4 },
    content: { padding: 24, alignItems: 'center' },
    iconWrapper: { 
        width: 120, 
        height: 120, 
        borderRadius: 20, 
        backgroundColor: '#FFF', 
        alignItems: 'center', 
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 24
    },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, textAlign: 'center', lineHeight: 28, marginBottom: 30 },
    infoGroup: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 24 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    infoLabel: { fontSize: 14, color: COLORS.gray500 },
    infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.gray800 },
    catBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    catText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
    descriptionBox: { width: '100%', marginBottom: 30 },
    descTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray700, marginBottom: 10 },
    descText: { fontSize: 14, color: COLORS.gray500, lineHeight: 22 },
    mainDownloadBtn: { 
        width: '100%', 
        backgroundColor: COLORS.primary, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 16, 
        borderRadius: 12,
        gap: 10,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    mainDownloadBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
    errorText: { marginTop: 15, color: COLORS.gray500, fontSize: 16 },
    backBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: 'bold' },
});
