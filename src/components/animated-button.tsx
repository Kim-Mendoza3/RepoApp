import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { useColors } from '@/context/theme-context';
import { fonts } from '@/theme/fonts';

type AnimatedButtonProps = {
  label: string;
  onPress: () => void;
  /** "solid": fondo del color de texto (por defecto) · "accent": fondo cian. */
  variant?: 'solid' | 'accent';
  /** Colores personalizados (p. ej. en el login). */
  buttonColor?: string;
  textColor?: string;
  /** Ícono a la izquierda o derecha del texto. */
  leading?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
};

/** Botón principal que se encoge un poco al presionarlo. */
export function AnimatedButton({ label, onPress, variant = 'solid', buttonColor, textColor, leading, trailing, disabled }: AnimatedButtonProps) {
  const colors = useColors();
  const scale = useAnimatedValue(1);
  const background = buttonColor ?? (variant === 'accent' ? colors.accent : colors.text);
  const foreground = textColor ?? (variant === 'accent' ? colors.onAccent : colors.background);

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, { backgroundColor: background }]}
      >
        <View style={styles.row}>
          {leading}
          <Text style={[styles.text, { color: foreground }]}>{label}</Text>
          {trailing}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 13, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
