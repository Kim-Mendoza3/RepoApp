import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { logoSource, logoStyles } from '@/components/brand-logo';
import { GridBackground } from '@/components/grid-background';
import { ScienceBackground } from '@/components/science-background';
import { useColors } from '@/context/theme-context';
import { fonts } from '@/theme/fonts';

/** Pantalla de bienvenida animada que se muestra al abrir la app. */
export function LoadingScreen() {
  const colors = useColors();
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
    <Animated.View style={[styles.screen, { backgroundColor: colors.background, opacity: fade }]}>
      <GridBackground color={colors.grid} />
      <ScienceBackground color={colors.accent} opacity={0.55} />
      <Animated.View style={[styles.logoTile, { borderColor: colors.line, opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image contentFit="contain" source={logoSource} style={[styles.logo, logoStyles.outline]} />
      </Animated.View>
      <Text style={[styles.tagline, { color: colors.muted }]}>{'// una asociación que convierte preguntas en experiencias'}</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.accent, transform: [{ translateY: dotOneY }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.accent, transform: [{ translateY: dotTwoY }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.accent, transform: [{ translateY: dotThreeY }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, zIndex: 30, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoTile: { width: 196, height: 196, borderRadius: 44, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 150, height: 153 },
  tagline: { fontFamily: fonts.mono, fontSize: 12, marginTop: 24, paddingHorizontal: 32, textAlign: 'center' },
  dots: { flexDirection: 'row', marginTop: 28, gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
