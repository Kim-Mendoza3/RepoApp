import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, type ComponentProps } from 'react';
import { Animated, StyleSheet, useAnimatedValue, View } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const scienceIcons: IconName[] = ['microscope', 'telescope', 'chart-bubble', 'bug-outline', 'robot', 'dna', 'flask-outline', 'rocket-launch'];

/** Íconos de ciencia que flotan y se desvanecen detrás del contenido. */
export function ScienceBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {scienceIcons.map((icon, index) => <FloatingScienceIcon key={`${icon}-${index}`} icon={icon} index={index} />)}
    </View>
  );
}

function FloatingScienceIcon({ icon, index }: { icon: IconName; index: number }) {
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
      <MaterialCommunityIcons color="#A60E12" name={icon} size={34} />
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
