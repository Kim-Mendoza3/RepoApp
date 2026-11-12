import { Animated, Pressable, StyleSheet, Text, useAnimatedValue } from 'react-native';

import { useColors } from '@/context/theme-context';

type AnimatedButtonProps = {
  label: string;
  onPress: () => void;
  /** Color de fondo; por defecto, el azul del tema. */
  buttonColor?: string;
  disabled?: boolean;
};

/** Botón principal que se encoge un poco al presionarlo. */
export function AnimatedButton({ label, onPress, buttonColor, disabled }: AnimatedButtonProps) {
  const colors = useColors();
  const scale = useAnimatedValue(1);

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, { backgroundColor: buttonColor ?? colors.blue }]}
      >
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 4 },
  text: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
