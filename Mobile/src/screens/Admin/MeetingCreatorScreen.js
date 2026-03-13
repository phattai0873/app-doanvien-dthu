import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
// import { meetingService } from '../../services/meetingService';

export const MeetingCreatorScreen = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [time, setTime] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title || !location || !time) {
            Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tiêu đề, địa điểm và thời gian');
            return;
        }

        setLoading(true);
        try {
            // Logic call meetingService here
            Alert.alert('Thành công', 'Đã tạo lịch họp mới');
            if (onBack) onBack();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo lịch họp');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.formCard}>
                    <Text style={styles.label}>Tiêu đề cuộc họp</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ví dụ: Sinh hoạt tháng 2"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Địa điểm</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ví dụ: Hội trường A"
                        value={location}
                        onChangeText={setLocation}
                    />

                    <Text style={styles.label}>Thời gian</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ví dụ: 2026-02-25 14:00"
                        value={time}
                        onChangeText={setTime}
                    />

                    <Text style={styles.label}>Nội dung / Chương trình</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Chi tiết buổi sinh hoạt..."
                        multiline
                        numberOfLines={5}
                        value={content}
                        onChangeText={setContent}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        <Text style={styles.submitText}>
                            {loading ? 'Đang xử lý...' : 'Tạo lịch ngay'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: SIZES.md },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.lg,
        elevation: 2,
    },
    label: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.black, marginBottom: SIZES.xs, marginTop: SIZES.md },
    input: {
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        fontSize: SIZES.fontMd,
        backgroundColor: '#FCFCFC',
    },
    textArea: { height: 120, textAlignVertical: 'top' },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        marginTop: SIZES.xxl,
    },
    disabledButton: { opacity: 0.7 },
    submitText: { color: COLORS.white, fontSize: SIZES.fontLarge, fontWeight: 'bold' },
});
