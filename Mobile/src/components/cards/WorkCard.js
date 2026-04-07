import { TouchableOpacity, View, Text, StyleSheet, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

export const WorkCard = ({ icon, bg, color, title, desc, onPress, isPng, pngIcon }) => (
    <TouchableOpacity style={styles.workCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.workIconBox, { backgroundColor: isPng ? 'transparent' : (bg || COLORS.primaryLight) }]}>
            {isPng ? (
                <RNImage source={pngIcon} style={styles.pngIcon} resizeMode="contain" />
            ) : (
                <Ionicons name={icon} size={28} color={color || COLORS.primary} />
            )}
        </View>
        <View style={styles.textContent}>
            <Text style={styles.workTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.workDesc} numberOfLines={2}>{desc}</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    workCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        ...COLORS.shadowDark,
        minHeight: 160,
        justifyContent: 'center',
    },
    workIconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    pngIcon: {
        width: 48,
        height: 48
    },
    textContent: {
        alignItems: 'center',
    },
    workTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.gray900,
        textAlign: 'center',
    },
    workDesc: {
        fontSize: 11,
        color: COLORS.gray500,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 16,
        paddingHorizontal: 4,
    },
});
