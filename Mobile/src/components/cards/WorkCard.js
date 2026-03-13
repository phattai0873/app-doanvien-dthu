import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../utils/iconMap';
import { Image } from 'react-native';

export const WorkCard = ({ icon, bg, color, title, desc, table, onPress, isPng, pngIcon }) => (
    <TouchableOpacity style={styles.workCard} onPress={onPress}>
        <View style={[styles.workIconBox, !isPng && { backgroundColor: bg }]}>
            {isPng ? (
                <Image source={pngIcon} style={styles.pngIcon} resizeMode="contain" />
            ) : (
                <Icon name={icon} size={32} color={color} />
            )}
        </View>
        <Text style={styles.workTitle}>{title}</Text>
        <Text style={styles.workDesc}>{desc}</Text>
        <Text style={styles.workTable}>{table}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    workCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2
    },
    workIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    pngIcon: {
        width: 48,
        height: 48
    },
    workTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center'
    },
    workDesc: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8
    },
    workTable: {
        fontSize: 8,
        color: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
});
