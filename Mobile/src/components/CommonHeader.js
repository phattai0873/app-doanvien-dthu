import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useNavigation } from '@react-navigation/native';

const CommonHeader = ({ 
    title, 
    showBack = false, 
    rightIcon, 
    onRightPress, 
    backgroundColor = COLORS.white 
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();



    return (
        <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <View style={styles.headerContent}>
                <View style={styles.left}>
                    {showBack ? (
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={styles.iconBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={28} color={COLORS.gray900} />
                        </TouchableOpacity>
                    ) : null}
                </View>
                
                <View style={styles.center}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                </View>

                <View style={styles.right}>
                    {rightIcon && (
                        <TouchableOpacity 
                            onPress={onRightPress}
                            style={styles.iconBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={rightIcon} size={24} color={COLORS.gray900} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        ...COLORS.shadowSmall,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        paddingBottom: 4,
    },
    left: {
        width: 44,
        alignItems: 'flex-start',
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    right: {
        width: 44,
        alignItems: 'flex-end',
    },
    title: {
        color: COLORS.gray900,
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default CommonHeader;
