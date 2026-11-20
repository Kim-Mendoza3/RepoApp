import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { useColors } from '@/context/theme-context';
import { fonts } from '@/theme/fonts';

// SELECTOR DE RUEDA (estilo iOS), igual en iPhone y Android.
// Cada columna es un ScrollView que se "imanta" a cada opción (snapToInterval).
// Los números se desvanecen y encogen al alejarse del centro, con animación nativa.

const ITEM = 38;
const VISIBLE = 5; // filas visibles: 2 arriba, la elegida, 2 abajo
const PAD = ITEM * Math.floor(VISIBLE / 2);

export type WheelOption<T> = { value: T; label: string };

/** Caja con la franja central resaltada; adentro van una o varias WheelColumn. */
export function WheelPicker({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View pointerEvents="none" style={[styles.band, { backgroundColor: colors.soft }]} />
      <View style={styles.columns}>{children}</View>
    </View>
  );
}

type WheelColumnProps<T> = {
  options: WheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre para lectores de pantalla, p. ej. "Hora". */
  label: string;
  width?: number;
  align?: 'center' | 'left' | 'right';
};

export function WheelColumn<T extends string | number>({ options, value, onChange, label, width = 60, align = 'center' }: WheelColumnProps<T>) {
  const colors = useColors();
  const scrollRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const scrollY = useAnimatedValue(0);
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const settledIndex = useRef(index);

  // Si el valor cambia desde fuera (p. ej. el día 31 pasa a 30 al cambiar de mes), movemos la rueda.
  useEffect(() => {
    if (settledIndex.current !== index) {
      settledIndex.current = index;
      scrollRef.current?.scrollTo({ y: index * ITEM, animated: true });
    }
  }, [index]);

  const select = (next: number) => {
    const clamped = Math.min(options.length - 1, Math.max(0, next));
    if (clamped !== settledIndex.current) {
      settledIndex.current = clamped;
      onChange(options[clamped].value);
    }
    return clamped;
  };

  const settle = (y: number) => select(Math.round(y / ITEM));

  const goTo = (next: number) => {
    const clamped = select(next);
    scrollRef.current?.scrollTo({ y: clamped * ITEM, animated: true });
  };

  const textAlign = align;

  return (
    <View
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityValue={{ text: options[index]?.label }}
      accessible
      onAccessibilityAction={(event) => goTo(index + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={{ width, height: ITEM * VISIBLE }}
    >
      <Animated.ScrollView
        contentContainerStyle={{ paddingVertical: PAD }}
        contentOffset={{ x: 0, y: index * ITEM }}
        decelerationRate="fast"
        nestedScrollEnabled
        onLayout={() => scrollRef.current?.scrollTo({ y: index * ITEM, animated: false })}
        onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.y)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        onScrollEndDrag={(event) => settle(event.nativeEvent.contentOffset.y)}
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
      >
        {options.map((option, i) => {
          const center = i * ITEM;
          const inputRange = [center - 2 * ITEM, center - ITEM, center, center + ITEM, center + 2 * ITEM];
          const opacity = scrollY.interpolate({ inputRange, outputRange: [0.25, 0.5, 1, 0.5, 0.25], extrapolate: 'clamp' });
          const scale = scrollY.interpolate({ inputRange, outputRange: [0.82, 0.92, 1, 0.92, 0.82], extrapolate: 'clamp' });
          return (
            <Pressable importantForAccessibility="no" key={String(option.value)} onPress={() => goTo(i)}>
              <Animated.View style={[styles.item, { opacity, transform: [{ scale }] }]}>
                <Text numberOfLines={1} style={[styles.itemText, { color: colors.text, textAlign }]}>{option.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 8, overflow: 'hidden' },
  band: { position: 'absolute', left: 8, right: 8, top: PAD, height: ITEM, borderRadius: 12 },
  columns: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  item: { height: ITEM, justifyContent: 'center' },
  itemText: { fontFamily: fonts.bodySemi, fontSize: 19, width: '100%' },
});
