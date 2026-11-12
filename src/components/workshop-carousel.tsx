import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { ArrowRightIcon } from '@/components/icons';
import type { Workshop } from '@/data/workshops';
import { fonts } from '@/theme/fonts';

type WorkshopSlide = {
  workshopId: string;
  title: string;
  eyebrow: string;
  accent: string;
  image: Workshop['images'][number];
  imageIndex: number;
};

type CarouselColors = {
  surface: string;
  text: string;
  muted: string;
  line: string;
  background: string;
};

type WorkshopCarouselProps = {
  colors: CarouselColors;
  slides: WorkshopSlide[];
  onSelectWorkshop?: (workshopId: string) => void;
  onHorizontalGesture?: (locked: boolean) => void;
  compact?: boolean;
  minimal?: boolean;
};

export function WorkshopCarousel({ colors, slides, onSelectWorkshop, onHorizontalGesture, compact = false, minimal = false }: WorkshopCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const motion = useAnimatedValue(0);
  const transitioning = useRef(false);
  const activeIndexRef = useRef(0);
  const activeSlide = slides[activeIndex];

  const moveTo = (nextIndex: number, direction: 1 | -1) => {
    if (transitioning.current || slides.length < 2) return;
    transitioning.current = true;
    Animated.timing(motion, { toValue: -direction, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      motion.setValue(direction);
      Animated.spring(motion, { toValue: 0, useNativeDriver: true, speed: 27, bounciness: 5 }).start(() => {
        transitioning.current = false;
      });
    });
  };

  useEffect(() => {
    const timer = setInterval(() => moveTo((activeIndex + 1) % slides.length, 1), 5200);
    return () => clearInterval(timer);
  }, [activeIndex, slides.length]);

  // useState con función inicial crea el PanResponder una sola vez (recrearlo a mitad de un
  // gesto lo cortaría). Los refs solo se leen dentro de los manejadores del gesto, no al dibujar,
  // así que el aviso de la regla react-hooks/refs aquí es un falso positivo.
  // eslint-disable-next-line react-hooks/refs
  const [swipeResponder] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => slides.length > 1 && Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25,
    onPanResponderGrant: () => onHorizontalGesture?.(true),
    onPanResponderRelease: (_, gestureState) => {
      onHorizontalGesture?.(false);
      if (Math.abs(gestureState.dx) < 24 || Math.abs(gestureState.dx) < Math.abs(gestureState.dy) * 1.1) return;
      const direction: 1 | -1 = gestureState.dx < 0 ? 1 : -1;
      const nextIndex = (activeIndexRef.current + direction + slides.length) % slides.length;
      moveTo(nextIndex, direction);
    },
    onPanResponderTerminate: () => onHorizontalGesture?.(false),
  }));

  if (!activeSlide) return null;

  const translateX = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: [-34, 0, 34] });
  const rotate = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-1.5deg', '0deg', '1.5deg'] });
  const scale = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.985, 1, 0.985] });

  return (
    <View style={[styles.shell, compact && styles.shellCompact, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          {!minimal && <Text style={[styles.kicker, { color: activeSlide.accent }]}>{compact ? '// experiencias destacadas' : '// galería del taller'}</Text>}
          <Text style={[styles.heading, { color: colors.text }]}>{compact ? 'Ciencia en acción' : minimal ? 'Galería del taller' : activeSlide.title}</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: `${activeSlide.accent}18` }]}>
          <Text style={[styles.counterText, { color: activeSlide.accent }]}>{String(activeIndex + 1).padStart(2, '0')}</Text>
          <Text style={[styles.counterDivider, { color: colors.muted }]}>/</Text>
          <Text style={[styles.counterText, { color: colors.muted }]}>{String(slides.length).padStart(2, '0')}</Text>
        </View>
      </View>
      <Animated.View
        {...swipeResponder.panHandlers}
        onTouchCancel={() => onHorizontalGesture?.(false)}
        onTouchEnd={() => onHorizontalGesture?.(false)}
        onTouchStart={() => onHorizontalGesture?.(true)}
        style={[styles.imageFrame, { transform: [{ translateX }, { rotate }, { scale }] }]}
      >
        <Image accessibilityLabel={activeSlide.title} contentFit="cover" source={activeSlide.image} style={styles.image} transition={180} />
        {!minimal && <View style={styles.imageShade} />}
        {!minimal && <View style={styles.imageCaption}>
          <Text style={styles.captionKicker}>{activeSlide.eyebrow}</Text>
          <Text style={styles.captionTitle}>{activeSlide.title}</Text>
          <Text style={styles.captionMeta}>Imagen {activeSlide.imageIndex + 1} del taller</Text>
        </View>}
        {!minimal && <Pressable
          accessibilityLabel={`Abrir ${activeSlide.title}`}
          accessibilityRole="button"
          onPress={() => onSelectWorkshop?.(activeSlide.workshopId)}
          style={({ pressed }) => [styles.openButton, { backgroundColor: activeSlide.accent }, pressed && styles.pressed]}
        >
          <Text style={styles.openButtonText}>{compact ? 'Explorar' : 'Ver taller'}</Text>
          <ArrowRightIcon color="#FFFFFF" size={17} weight="bold" />
        </Pressable>}
      </Animated.View>
      <View style={styles.footerRow}>
        <View style={styles.dots}>
          {slides.map((slide, index) => <View key={`${slide.workshopId}-${slide.imageIndex}`} style={[styles.dot, { backgroundColor: index === activeIndex ? activeSlide.accent : colors.line }, index === activeIndex && styles.dotActive]} />)}
        </View>
        <Text style={[styles.swipeHint, { color: colors.muted }]}>Desliza para explorar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 22, overflow: 'hidden' },
  shellCompact: { padding: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  headerCopy: { flex: 1 },
  kicker: { fontFamily: fonts.mono, fontSize: 11, marginBottom: 4 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  counterText: { fontFamily: fonts.mono, fontSize: 11 },
  counterDivider: { fontFamily: fonts.mono, fontSize: 11 },
  imageFrame: { height: 236, borderRadius: 14, overflow: 'hidden', backgroundColor: '#CBD5E1' },
  image: { width: '100%', height: '100%' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6, 12, 23, 0.3)' },
  imageCaption: { position: 'absolute', left: 14, right: 118, bottom: 14 },
  captionKicker: { color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 10, marginBottom: 4 },
  captionTitle: { color: '#FFFFFF', fontFamily: fonts.display, fontSize: 21, lineHeight: 25 },
  captionMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  openButton: { position: 'absolute', right: 12, bottom: 12, minHeight: 44, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  openButtonText: { color: '#FFFFFF', fontFamily: fonts.bodySemi, fontSize: 13 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12 },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  dot: { width: 7, height: 4, borderRadius: 3 },
  dotActive: { width: 22 },
  swipeHint: { fontFamily: fonts.mono, fontSize: 10 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
