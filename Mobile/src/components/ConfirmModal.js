import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Animated
} from 'react-native';
import { Icon } from '../utils/iconMap';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

export const ConfirmModal = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'warning' // 'warning', 'info', 'danger'
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return { name: 'AlertTriangle', color: COLORS.error };
            case 'info': return { name: 'Info', color: COLORS.info };
            default: return { name: 'AlertTriangle', color: COLORS.warning };
        }
    };

    const iconData = getIcon();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.iconContainer, { backgroundColor: iconData.color + '15' }]}>
                        <Icon name={iconData.name} size={32} color={iconData.color} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={onCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelText}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.confirmBtn, { backgroundColor: type === 'danger' ? COLORS.error : COLORS.primary }]} 
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.gray900,
        textAlign: 'center',
        marginBottom: 12
    },
    message: {
        fontSize: 15,
        color: COLORS.gray600,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.gray100,
        alignItems: 'center'
    },
    confirmBtn: {
        flex: 1.5,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    cancelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.gray500
    },
    confirmText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF'
    }
});
