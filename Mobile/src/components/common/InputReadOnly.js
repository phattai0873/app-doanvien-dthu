import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const InputReadOnly = ({ label, value }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputValueBox}>
            <Text style={styles.inputValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    inputGroup: { marginBottom: 12 },
    inputLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 6
    },
    inputValueBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    inputValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500'
    },
});
