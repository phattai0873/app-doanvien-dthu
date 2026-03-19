import React, { useState, useEffect, useRef } from 'react';
import { View, Image as RNImage, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { COLORS, SIZES } from '../constants';

const { width } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 16;
const ITEM_WIDTH = width - (HORIZONTAL_MARGIN * 2);

/**
 * Component Banner carousel với thiết kế Premium
 * @param {array} images - Danh sách URL hình ảnh
 */
const Banner = ({ images = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        if (images.length > 1) {
            const timer = setInterval(() => {
                let nextIndex = activeIndex + 1;
                if (nextIndex >= images.length) {
                    nextIndex = 0;
                }
                
                scrollViewRef.current?.scrollTo({
                    x: nextIndex * (ITEM_WIDTH + 10), // 10 là khoảng cách giữa các slide (gap)
                    animated: true,
                });
            }, 5000); // 5s cho đỡ bị lướt nhanh quá

            return () => clearInterval(timer);
        }
    }, [activeIndex, images.length]);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / ITEM_WIDTH);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    if (images.length === 0) {
        return (
            <View style={styles.placeholderContainer}>
                <View style={styles.placeholder} />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                decelerationRate="fast"
                snapToInterval={ITEM_WIDTH + 10} // Snap theo chiều rộng item + gap
                snapToAlignment="center"
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                {images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                        <RNImage
                            source={{ uri: image }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>
            
            {/* Pagination dots */}
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
    wrapper: {
        position: 'relative',
        marginVertical: 4,
    },
    scrollContent: {
        paddingHorizontal: HORIZONTAL_MARGIN,
        gap: 10,
    },
    imageContainer: {
        width: ITEM_WIDTH,
        height: 180,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        overflow: 'hidden',
        // Shadow cho iOS
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        // Elevation cho Android
        elevation: 5,
    },
    placeholderContainer: {
        height: 180,
        marginHorizontal: HORIZONTAL_MARGIN,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        overflow: 'hidden',
    },
    placeholder: {
        flex: 1,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.white,
        opacity: 0.4,
        marginHorizontal: 3,
    },
    activeDot: {
        opacity: 1,
        width: 18, // Dot dài ra khi active cho hiện đại
        backgroundColor: COLORS.white,
    },
});

export default Banner;
