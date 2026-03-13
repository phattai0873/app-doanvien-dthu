import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants';

/**
 * Component Card cho tin tức
 * @param {string} image - URL hình ảnh
 * @param {string} title - Tiêu đề
 * @param {string} description - Mô tả
 * @param {number} likes - Số lượt thích
 * @param {string} date - Ngày đăng
 * @param {function} onPress - Hàm xử lý khi nhấn
 */
const Card = ({ image, title, description, likes, date, onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            {image && (
                <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                />
            )}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                {description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {description}
                    </Text>
                )}
                <View style={styles.footer}>
                    <View style={styles.stats}>
                        {likes !== undefined && (
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>❤️</Text>
                                <Text style={styles.statText}>{likes}</Text>
                            </View>
                        )}
                        {date && (
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>📅</Text>
                                <Text style={styles.statText}>{date}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg, // Bo góc mạnh hơn cho cảm giác hiện đại
        marginBottom: SIZES.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.gray100, // Viền nhẹ tạo chiều sâu
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    image: {
        width: '100%',
        height: 190,
        backgroundColor: COLORS.gray100,
    },
    content: {
        padding: SIZES.lg,
    },
    title: {
        fontSize: SIZES.fontLg,
        lineHeight: 24, // Tăng lineHeight cho dễ đọc
        fontWeight: '700', // Đậm hơn
        color: COLORS.textPrimary,
        marginBottom: SIZES.sm,
    },
    description: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: SIZES.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SIZES.sm,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: SIZES.lg,
        backgroundColor: COLORS.gray100, // Badge-like look
        paddingHorizontal: SIZES.sm,
        paddingVertical: 4,
        borderRadius: SIZES.radiusSm,
    },
    statIcon: {
        fontSize: 12, // Nhỏ lại tinh tế hơn
        marginRight: 4,
    },
    statText: {
        fontSize: SIZES.fontXs,
        fontWeight: '600',
        color: COLORS.gray600,
    },
});

export default Card;
