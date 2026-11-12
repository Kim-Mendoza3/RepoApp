import { useEffect, type ComponentType } from 'react';
import { Animated, StyleSheet, useAnimatedValue, View } from 'react-native';

import { AtomIcon, BugIcon, DnaIcon, FlaskIcon, MicroscopeIcon, PlanetIcon, RobotIcon, RocketIcon } from '@/components/icons';

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' }>;

const scienceIcons: IconComponent[] = [MicroscopeIcon, PlanetIcon, AtomIcon, BugIcon, RobotIcon, DnaIcon, FlaskIcon, RocketIcon];

/** Íconos de ciencia que flotan y se desvanecen detrás del contenido. */
export function ScienceBackground({ opacity = 1, color = '#A60E12' }: { opacity?: number; color?: string }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {scienceIcons.map((Icon, index) => <FloatingIcon key={index} Icon={Icon} color={color} index={index} />)}
    </View>
  );
}

function FloatingIcon({ Icon, color, index }: { Icon: IconComponent; color: string; index: number }) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 3600 + index * 280, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [index, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [45, -90] });
  const opacity = progress.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 0.75, 0.5, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '18deg'] });

  return (
    <Animated.View style={[styles.icon, positions[index], { opacity, transform: [{ translateY }, { rotate }] }]}>
      <Icon color={color} size={34} weight="duotone" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'absolute' },
  one: { left: '10%', top: '24%' },
  two: { left: '72%', top: '19%' },
  three: { left: '22%', top: '68%' },
  four: { left: '78%', top: '67%' },
  five: { left: '8%', top: '48%' },
  six: { left: '60%', top: '76%' },
  seven: { left: '42%', top: '13%' },
  eight: { left: '45%', top: '84%' },
});

const positions = [styles.one, styles.two, styles.three, styles.four, styles.five, styles.six, styles.seven, styles.eight];
