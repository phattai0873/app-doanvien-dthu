import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { COLORS } from '../../constants/colors';

export const HomeFAB = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={styles.fab}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <Icon name="Grid" size={28} color={COLORS.white} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    iconContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
