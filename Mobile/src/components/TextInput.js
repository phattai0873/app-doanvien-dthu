import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

/**
 * Component TextInput tùy chỉnh
 * @param {string} label - Nhãn của input
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Giá trị hiện tại
 * @param {function} onChangeText - Hàm xử lý khi thay đổi text
 * @param {boolean} secureTextEntry - Ẩn text (cho password)
 * @param {string} iconName - Tên icon từ Ionicons
 * @param {string} error - Thông báo lỗi
 * @param {object} style - Custom style
 */
const TextInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    iconName,
    error,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={SIZES.iconSm}
                        color={isFocused ? COLORS.primary : COLORS.gray}
                        style={styles.icon}
                    />
                )}
                <RNTextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={SIZES.iconSm}
                            color={COLORS.gray}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.md,
    },
    label: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SIZES.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        paddingHorizontal: SIZES.md,
        minHeight: 52,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    inputContainerError: {
        borderColor: COLORS.error,
    },
    icon: {
        marginRight: SIZES.sm,
    },
    input: {
        flex: 1,
        fontSize: SIZES.fontMd,
        color: COLORS.textPrimary,
        paddingVertical: SIZES.sm,
    },
    eyeIcon: {
        padding: SIZES.xs,
    },
    errorText: {
        fontSize: SIZES.fontSm,
        color: COLORS.error,
        marginTop: SIZES.xs,
        marginLeft: SIZES.xs,
    },
});

export default TextInput;
