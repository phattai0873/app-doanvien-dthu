import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';

const PlaceholderScreen = ({ name }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{name} Page</Text>
            <Text style={styles.subtitle}>Đang cập nhật nội dung...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 8,
    },
});

export default PlaceholderScreen;
