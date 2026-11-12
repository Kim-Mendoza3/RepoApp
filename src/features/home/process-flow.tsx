import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, type ComponentProps } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { useColors } from '@/context/theme-context';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Los tres pasos "Miramos → Experimentamos → Compartimos" con íconos animados. */
export function ProcessFlow() {
  const colors = useColors();
  const steps: { icon: IconName; title: string; text: string; color: string; delay: number }[] = [
    { icon: 'eye-circle-outline', title: 'MIRAMOS', text: 'Observamos lo que nos rodea.', color: colors.green, delay: 0 },
    { icon: 'flask-outline', title: 'EXPERIMENTAMOS', text: 'Probamos ideas y hacemos preguntas.', color: colors.orange, delay: 240 },
    { icon: 'share-variant-outline', title: 'COMPARTIMOS', text: 'Convertimos hallazgos en nuevas ideas.', color: colors.purple, delay: 480 },
  ];

  return (
    <View style={styles.flow} accessibilityLabel="Proceso de divulgación en tres pasos">
      {steps.map((step, index) => (
        <View key={step.title} style={styles.stepGroup}>
          <View style={[styles.step, { backgroundColor: `${step.color}16`, borderColor: `${step.color}65` }]}>
            <View style={[styles.number, { backgroundColor: step.color }]}><Text style={styles.numberText}>{index + 1}</Text></View>
            <BouncingIcon icon={step.icon} color={step.color} backgroundColor={`${step.color}25`} delay={step.delay} />
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
              <Text style={[styles.text, { color: colors.muted }]}>{step.text}</Text>
            </View>
          </View>
          {index < steps.length - 1 && <PulsingArrow color={step.color} delay={step.delay + 160} />}
        </View>
      ))}
    </View>
  );
}

function BouncingIcon({ icon, color, backgroundColor, delay }: { icon: IconName; color: string; backgroundColor: string; delay: number }) {
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
  return (
    <Animated.View style={[styles.icon, { backgroundColor, transform: [{ translateY }] }]}>
      <MaterialCommunityIcons color={color} name={icon} size={23} />
    </Animated.View>
  );
}

function PulsingArrow({ color, delay }: { color: string; delay: number }) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.delay(1800),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-2, 5] });
  const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] });
  return (
    <Animated.View style={[styles.arrow, { opacity, transform: [{ translateY }] }]}>
      <MaterialCommunityIcons color={color} name="arrow-down-bold" size={21} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flow: { alignItems: 'stretch', marginTop: 4 },
  stepGroup: { width: '100%', alignItems: 'stretch' },
  step: { minHeight: 88, borderRadius: 18, borderWidth: 1, padding: 10, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  number: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  copy: { flex: 1, paddingRight: 16 },
  title: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  text: { fontSize: 12, lineHeight: 16, marginTop: 3 },
  arrow: { height: 22, alignItems: 'center', justifyContent: 'center' },
});
