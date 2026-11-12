import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { logoSource, logoStyles } from '@/components/brand-logo';
import { ScienceBackground } from '@/components/science-background';

/** Pantalla de bienvenida animada que se muestra al abrir la app. */
export function LoadingScreen() {
  const logoScale = useAnimatedValue(0.82);
  const logoOpacity = useAnimatedValue(0);
  const fade = useAnimatedValue(1);
  const dotsProgress = useAnimatedValue(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
    const dotsAnimation = Animated.loop(Animated.timing(dotsProgress, { toValue: 3, duration: 1500, useNativeDriver: true }));
    dotsAnimation.start();
    const fadeTimer = setTimeout(() => Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(), 2050);
    return () => {
      dotsAnimation.stop();
      clearTimeout(fadeTimer);
    };
  }, [dotsProgress, fade, logoOpacity, logoScale]);

  const dotOneY = dotsProgress.interpolate({ inputRange: [0, 0.35, 0.7, 1.35, 2, 3], outputRange: [0, -8, 0, 0, 0, 0] });
  const dotTwoY = dotsProgress.interpolate({ inputRange: [0, 0.7, 1.05, 1.4, 2.35, 3], outputRange: [0, 0, -8, 0, 0, 0] });
  const dotThreeY = dotsProgress.interpolate({ inputRange: [0, 1.4, 1.75, 2.1, 2.7, 3], outputRange: [0, 0, -8, 0, 0, 0] });

  return (
    <Animated.View style={[styles.screen, { opacity: fade }]}>
      <ScienceBackground />
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image contentFit="contain" source={logoSource} style={[styles.logo, logoStyles.outline]} />
      </Animated.View>
      <Text style={styles.tagline}>Una asociación que convierte preguntas en experiencias</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotOneY }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotTwoY }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dotThreeY }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, zIndex: 30, backgroundColor: '#FFF9F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 220, height: 224 },
  tagline: { color: '#7D4B4A', fontSize: 13, marginTop: 20, letterSpacing: 0.4 },
  dots: { flexDirection: 'row', marginTop: 32, gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A60E12' },
});
