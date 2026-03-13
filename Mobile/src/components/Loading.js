import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

/**
 * Component Loading
 * @param {boolean} fullScreen - Hiển thị full screen
 * @param {string} size - Kích thước: 'small', 'large'
 */
const Loading = ({ fullScreen = false, size = 'large' }) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <ActivityIndicator size={size} color={COLORS.primary} />
            </View>
        );
    }

    return <ActivityIndicator size={size} color={COLORS.primary} />;
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});

export default Loading;
