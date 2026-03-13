import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

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
                        color={isFocused ? COLORS.primary : COLORS.gray400} // fixed gray -> gray400
                        style={styles.icon}
                    />
                )}
                <RNTextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.gray400}
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
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: SIZES.lg },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray700,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1.5,
        borderColor: COLORS.gray100,
        paddingHorizontal: 16,
        minHeight: 56,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    inputContainerError: {
        borderColor: COLORS.error,
        backgroundColor: '#FFF1F2',
    },
    icon: { marginRight: 12 },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.gray900,
        fontWeight: '500',
    },
    eyeIcon: { padding: 8 },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 6,
        marginLeft: 8,
        fontWeight: '600',
    },
});

export default TextInput;
