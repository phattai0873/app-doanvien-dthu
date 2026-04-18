import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Component Button tùy chỉnh
 */
const Button = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    gradientColors, // New prop for custom gradient colors
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary': return styles.secondaryButton;
            case 'outline': return styles.outlineButton;
            case 'gradient': return styles.gradientButton;
            default: return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline': return styles.outlineText;
            default: return styles.buttonText;
        }
    };

    const renderContent = () => (
        loading ? (
            <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
        ) : (
            <Text style={[styles.text, getTextStyle(), disabled && styles.disabledText]}>
                {title}
            </Text>
        )
    );

    if (variant === 'gradient' || gradientColors) {
        const colors = gradientColors || COLORS.gradientPrimary || ['#2563EB', '#4F46E5'];
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[styles.buttonContainer, style]}
            >
                <LinearGradient
                    colors={disabled ? [COLORS.gray300, COLORS.gray400] : colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, styles.gradientButton]}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: SIZES.lg,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: COLORS.secondary,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    gradientButton: {
        width: '100%',
        height: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonContainer: {
        width: '100%',
        minHeight: 52,
    },
    disabledButton: {
        backgroundColor: COLORS.gray200,
        borderColor: COLORS.gray200,
    },
    text: { fontSize: SIZES.fontLg, fontWeight: '700', letterSpacing: 0.3 },
    buttonText: { color: COLORS.white },
    outlineText: { color: COLORS.primary },
    disabledText: { color: COLORS.gray400 },
});

export default Button;
