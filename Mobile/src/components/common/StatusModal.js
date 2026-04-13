import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Pressable,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

const { width } = Dimensions.get('window');

const StatusModal = ({
    visible,
    type = 'success', // success, error, warning
    title,
    message,
    buttonText = 'Đóng',
    onAttemptClose
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle', color: '#10B981' };
            case 'error':
                return { name: 'close-circle', color: '#EF4444' };
            case 'warning':
                return { name: 'warning', color: '#F59E0B' };
            default:
                return { name: 'information-circle', color: COLORS.primary };
        }
    };

    const icon = getIcon();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onAttemptClose}
        >
            <Pressable 
                style={styles.overlay} 
                onPress={() => onAttemptClose?.()}
            >
                <Pressable style={styles.modalContainer} onPress={(e) => {}}>
                    <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                        <Ionicons name={icon.name} size={64} color={icon.color} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: icon.color }]}
                        onPress={onAttemptClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.gray900,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

export default StatusModal;
