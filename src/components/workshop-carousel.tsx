import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Workshop } from '@/data/workshops';

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
  blue: string;
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
  const motion = useRef(new Animated.Value(0)).current;
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

  const swipeResponder = useRef(PanResponder.create({
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
  })).current;

  if (!activeSlide) return null;

  const translateX = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: [-34, 0, 34] });
  const rotate = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-1.5deg', '0deg', '1.5deg'] });
  const scale = motion.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.985, 1, 0.985] });

  return (
    <View style={[styles.shell, compact && styles.shellCompact, { backgroundColor: colors.surface, borderColor: `${activeSlide.accent}70` }]}>
      <View style={[styles.colorRail, { backgroundColor: activeSlide.accent }]} />
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          {!minimal && <Text style={[styles.kicker, { color: activeSlide.accent }]}>{compact ? 'EXPERIENCIAS DESTACADAS' : 'GALERIA DEL TALLER'}</Text>}
          <Text style={[styles.heading, { color: colors.text }]}>{compact ? 'Ciencia en accion' : minimal ? 'Galeria del taller' : activeSlide.title}</Text>
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
          <MaterialCommunityIcons color="#FFFFFF" name="arrow-up-right" size={18} />
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
  shell: { borderWidth: 1, borderRadius: 26, padding: 16, marginBottom: 28, overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 5 },
  shellCompact: { padding: 14 },
  colorRail: { position: 'absolute', top: 0, left: 0, width: 5, height: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingLeft: 4, marginBottom: 14 },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  heading: { fontSize: 21, fontWeight: '900' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  counterText: { fontSize: 11, fontWeight: '900' },
  counterDivider: { fontSize: 11, fontWeight: '700' },
  imageFrame: { height: 248, borderRadius: 20, overflow: 'hidden', backgroundColor: '#CBD5E1' },
  image: { width: '100%', height: '100%' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 15, 28, 0.24)' },
  imageCaption: { position: 'absolute', left: 16, right: 118, bottom: 16 },
  captionKicker: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 4 },
  captionTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  captionMeta: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '700', marginTop: 4 },
  openButton: { position: 'absolute', right: 14, bottom: 14, minHeight: 42, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  openButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14 },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  dot: { width: 7, height: 4, borderRadius: 3 },
  dotActive: { width: 22 },
  swipeHint: { fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
