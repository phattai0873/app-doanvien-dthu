import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants';

const { width } = Dimensions.get('window');

/**
 * Component Banner carousel
 * @param {array} images - Danh sách URL hình ảnh
 */
const Banner = ({ images = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    if (images.length === 0) {
        return (
            <View style={styles.placeholderContainer}>
                <View style={styles.placeholder} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {images.map((image, index) => (
                    <Image
                        key={index}
                        source={{ uri: image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>
            <View style={styles.pagination}>
                {images.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeIndex === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        position: 'relative',
    },
    placeholderContainer: {
        height: 200,
        backgroundColor: COLORS.lightGray,
    },
    placeholder: {
        flex: 1,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    image: {
        width: width,
        height: 200,
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: SIZES.md,
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.white,
        opacity: 0.5,
        marginHorizontal: 4,
    },
    activeDot: {
        opacity: 1,
        backgroundColor: COLORS.secondary,
    },
});

export default Banner;
