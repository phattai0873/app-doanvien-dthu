import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const QRScannerModal = ({ visible, onClose, onScan, title = 'Quét mã QR', hint = 'Di chuyển camera tới mã QR để quét' }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible && (!permission || !permission.granted)) {
            requestPermission();
        }
        if (visible) {
            setScanned(false);
        }
    }, [visible, permission]);

    const handleBarcodeScanned = ({ type, data }) => {
        if (!scanned) {
            setScanned(true);
            console.log(`[QRScanner] Scanned type: ${type}, data: ${data}`);
            onScan(data);
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    <Text style={styles.message}>Chúng tôi cần quyền truy cập camera để thực hiện thao tác này.</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.button}>
                        <Text style={styles.buttonText}>Cấp quyền Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
                        <Text style={styles.buttonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={{ width: 30 }} />
                </View>

                <View style={styles.scannerWrapper}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        style={styles.camera}
                    >
                        <View style={styles.overlay}>
                            <View style={styles.unfocusedContainer}></View>
                            <View style={styles.focusedRow}>
                                <View style={styles.unfocusedContainer}></View>
                                <View style={styles.focusedContainer}>
                                    <View style={styles.cornerTopLeft} />
                                    <View style={styles.cornerTopRight} />
                                    <View style={styles.cornerBottomLeft} />
                                    <View style={styles.cornerBottomRight} />
                                </View>
                                <View style={styles.unfocusedContainer}></View>
                            </View>
                            <View style={styles.unfocusedContainer}></View>
                        </View>
                    </CameraView>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.hintText}>{hint}</Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 20,
        color: '#FFF',
        fontSize: 16,
        paddingHorizontal: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        height: 60,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    scannerWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    unfocusedContainer: {
        flex: 1,
    },
    focusedRow: {
        flexDirection: 'row',
        height: 250,
    },
    focusedContainer: {
        width: 250,
        position: 'relative',
        backgroundColor: 'transparent',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: COLORS.primary || '#da251d',
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: COLORS.primary || '#da251d',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: COLORS.primary || '#da251d',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: COLORS.primary || '#da251d',
    },
    footer: {
        padding: 40,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    hintText: {
        color: '#BBB',
        textAlign: 'center',
        fontSize: 14,
    },
    button: {
        backgroundColor: COLORS.primary || '#da251d',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        marginVertical: 10,
        alignSelf: 'center',
    },
    cancelButton: {
        backgroundColor: '#4B5563',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default QRScannerModal;
