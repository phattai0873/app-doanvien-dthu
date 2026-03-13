import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';
import { MOCK_DB } from '../../constants/mockData';

export const PoliticalTheoryScreen = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulating service call
        setTimeout(() => {
            setCourses(MOCK_DB.political_studies || []);
            setLoading(false);
        }, 500);
    }, []);

    const renderProgressBar = (progress) => (
        <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Lớp học bồi dưỡng</Text>
                <Text style={styles.headerSubtitle}>Danh sách các khóa đào tạo chính trị được giao cho đồng chí.</Text>
            </View>

            {courses.map(course => (
                <TouchableOpacity key={course.id} style={styles.courseCard}>
                    <Image source={{ uri: course.thumbnail }} style={styles.courseThumb} />
                    <View style={styles.courseContent}>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                        <Text style={styles.courseTeacher}>Giảng viên: {course.teacher}</Text>
                        <View style={styles.courseMeta}>
                            <Icon name="Time" size={14} color="#9CA3AF" />
                            <Text style={styles.metaText}>{course.duration}</Text>
                        </View>
                        {renderProgressBar(course.progress)}
                    </View>
                </TouchableOpacity>
            ))}

            <View style={styles.theoryNote}>
                <Icon name="Information" size={20} color={COLORS.primary} />
                <Text style={styles.noteText}>
                    Hoàn thành 100% các khóa học bắt buộc để đủ điều kiện xét thăng cấp, khen thưởng định kỳ.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerInfo: { marginBottom: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
    courseCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
    },
    courseThumb: { width: '100%', height: 160, backgroundColor: '#E5E7EB' },
    courseContent: { padding: 16 },
    courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    courseTeacher: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    courseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    metaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
    progressBarBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
    progressText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', minWidth: 35, textAlign: 'right' },
    theoryNote: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    noteText: { flex: 1, fontSize: 12, color: '#DC2626', marginLeft: 12, lineHeight: 18 }
});
