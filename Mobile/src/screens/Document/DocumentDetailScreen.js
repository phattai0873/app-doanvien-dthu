import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    Linking,
    Image
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS, SIZES } from '../../constants';
import { documentService } from '../../services/documentService';
import { API_BASE_URL } from '../../services/api';

export const DocumentDetailScreen = ({ route, onBack }) => {
    const { id } = route?.params || {};
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await documentService.getDocumentDetail(id);
                // The service already returns res.data or res
                setDoc(res.data || res);
            } catch (error) {
                console.error("Failed to fetch document detail:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    const handleOpenDocument = async () => {
        if (!doc?.filePath) {
            Alert.alert("Lỗi", "Không tìm thấy đường dẫn tài liệu");
            return;
        }

        try {
            const url = `${API_BASE_URL}${doc.filePath}`;
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Lỗi", "Không thể mở tài liệu này. Vui lòng kiểm tra trình duyệt hoặc ứng dụng đọc PDF.");
            }
        } catch (error) {
            console.error("Error opening document:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi mở tài liệu.");
        }
    };

    const isImage = (path) => {
        if (!path) return false;
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
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
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconWrapper}>
                    {isImage(doc.filePath) ? (
                        <Image 
                            source={{ uri: `${API_BASE_URL}${doc.filePath}` }} 
                            style={styles.previewImage} 
                        />
                    ) : (
                        <Icon
                            name={doc.filePath?.endsWith('.pdf') ? 'FileText' : 'File'}
                            size={64}
                            color={doc.filePath?.endsWith('.pdf') ? '#EF4444' : '#3B82F6'}
                        />
                    )}
                </View>

                <Text style={styles.title}>{doc.title}</Text>

                <View style={styles.infoGroup}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cơ quan ban hành:</Text>
                        <Text style={styles.infoValue}>{doc.issuingAuthority || '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày ban hành:</Text>
                        <Text style={styles.infoValue}>{doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString('vi-VN') : '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái:</Text>
                        <Text style={styles.infoValue}>{doc.status === 'PUBLISH' ? 'Công khai' : 'Nội bộ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Danh mục:</Text>
                        <View style={styles.catBadge}>
                            <Text style={styles.catText}>{doc.DocumentCategory?.name || 'Văn bản'}</Text>
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

                <TouchableOpacity style={styles.mainDownloadBtn} onPress={handleOpenDocument}>
                    <Icon name="ExternalLink" size={20} color="#FFF" />
                    <Text style={styles.mainDownloadBtnText}>XEM TÀI LIỆU</Text>
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
        marginBottom: 24,
        overflow: 'hidden'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
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
