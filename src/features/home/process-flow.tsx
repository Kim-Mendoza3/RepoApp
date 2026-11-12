import { useEffect, type ComponentType } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { EyeIcon, FlaskIcon, ShareNetworkIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone'; duotoneColor?: string; duotoneOpacity?: number }>;

const steps: { number: string; title: string; text: string; Icon: IconComponent }[] = [
  { number: '01', title: 'Miramos', text: 'Observamos lo que nos rodea.', Icon: EyeIcon },
  { number: '02', title: 'Experimentamos', text: 'Probamos ideas y hacemos preguntas.', Icon: FlaskIcon },
  { number: '03', title: 'Compartimos', text: 'Convertimos hallazgos en nuevas ideas.', Icon: ShareNetworkIcon },
];

/** Los tres pasos "Miramos → Experimentamos → Compartimos" en tarjetas con íconos animados. */
export function ProcessFlow() {
  const colors = useColors();

  return (
    <View style={styles.row} accessibilityLabel="Proceso de divulgación en tres pasos">
      {steps.map((step, index) => (
        <View key={step.title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[textStyles.label, { color: colors.accent }]}>{step.number}</Text>
          <BouncingIcon delay={index * 240}>
            <step.Icon color={colors.text} duotoneColor={colors.accent} duotoneOpacity={0.35} size={28} weight="duotone" />
          </BouncingIcon>
          {/* adjustsFontSizeToFit achica la letra lo necesario para que la palabra no se corte. */}
          <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[styles.title, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.text, { color: colors.muted }]}>{step.text}</Text>
        </View>
      ))}
    </View>
  );
}

function BouncingIcon({ delay, children }: { delay: number; children: React.ReactNode }) {
  const bounce = useAnimatedValue(0);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(bounce, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 360, useNativeDriver: true }),
      Animated.delay(2200),
    ]));
    animation.start();
    return () => animation.stop();
  }, [bounce, delay]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return <Animated.View style={[styles.icon, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 150 },
  icon: { marginTop: 10, marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 14, lineHeight: 18 },
  text: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, marginTop: 4 },
});
