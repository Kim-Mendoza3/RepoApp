import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, View, type ViewStyle } from 'react-native';

import { useColors } from '@/context/theme-context';
import { glassStyles, pressedStyle } from '@/theme/common-styles';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type PurposeCardProps = { icon: IconName; title: string; accent: string; text: string };

/** Tarjeta compacta (Misión, Visión…) que abre el texto completo en una ventana animada. */
export function PurposeCard({ icon, title, accent, text }: PurposeCardProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardScale = useAnimatedValue(1);
  const modalScale = useAnimatedValue(0.82);
  const modalOpacity = useAnimatedValue(0);

  const open = () => {
    setVisible(true);
    setClosing(false);
    modalScale.setValue(0.82);
    modalOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 0.98, useNativeDriver: true, speed: 22, bounciness: 4 }),
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    setClosing(true);
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.82, duration: 180, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 4 }),
    ]).start(() => {
      setVisible(false);
      setClosing(false);
    });
  };

  return (
    <>
      <Animated.View style={[styles.item, { transform: [{ scale: cardScale }] }]}>
        <Pressable
          accessibilityRole="button"
          onPress={open}
          style={({ pressed }) => [styles.card, glassStyles.surface, { backgroundColor: `${accent}18`, borderColor: `${accent}A8`, shadowColor: accent, shadowOpacity: 0.2, opacity: pressed ? 0.82 : 1 }, pressed && pressedStyle]}
        >
          <View style={styles.cardContent}>
            <View style={[styles.cardIcon, { backgroundColor: `${accent}35` }]}><MaterialCommunityIcons color={accent} name={icon} size={21} /></View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          </View>
          <View style={[styles.accentLine, { backgroundColor: accent }]} />
        </Pressable>
      </Animated.View>
      <Modal transparent visible={visible} onRequestClose={close} animationType="none">
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: modalOpacity }]}><FloatingIcons accent={accent} /></Animated.View>
          <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: accent, opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <View style={styles.sheetHeader}>
              <View style={[styles.modalIcon, { backgroundColor: `${accent}22` }]}><MaterialCommunityIcons color={accent} name={icon} size={25} /></View>
              <View style={styles.headingCopy}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.modalLabel, { color: accent }]}>PROPÓSITO INSTITUCIONAL</Text>
              </View>
            </View>
            <View style={[styles.rule, { backgroundColor: accent }]} />
            <ScrollView showsVerticalScrollIndicator={false}><Text style={[styles.modalText, { color: colors.text }]}>{text}</Text></ScrollView>
            <Pressable accessibilityRole="button" onPress={close} style={[styles.closeAction, { backgroundColor: accent }]}>
              <Text style={styles.closeActionText}>{closing ? 'Cerrando…' : 'Cerrar'}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function FloatingIcons({ accent }: { accent: string }) {
  const icons: { name: IconName; style: ViewStyle; delay: number; size: number }[] = [
    { name: 'atom', style: motionStyles.one, delay: 0, size: 128 },
    { name: 'microscope', style: motionStyles.two, delay: 420, size: 42 },
    { name: 'telescope', style: motionStyles.three, delay: 760, size: 38 },
    { name: 'flask-outline', style: motionStyles.four, delay: 980, size: 34 },
    { name: 'dna', style: motionStyles.five, delay: 260, size: 40 },
    { name: 'chart-bubble', style: motionStyles.six, delay: 640, size: 36 },
    { name: 'robot', style: motionStyles.seven, delay: 860, size: 35 },
    { name: 'rocket-launch-outline', style: motionStyles.eight, delay: 1120, size: 34 },
  ];
  return <View pointerEvents="none" style={motionStyles.field}>{icons.map((item) => <FloatingIcon key={item.name} accent={accent} {...item} />)}</View>;
}

function FloatingIcon({ accent, name, style, delay, size }: { accent: string; name: IconName; style: ViewStyle; delay: number; size: number }) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    const timer = setTimeout(() => {
      animation = Animated.loop(Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 3000 + delay, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 3000 + delay, useNativeDriver: true }),
      ]));
      animation.start();
    }, delay);
    return () => {
      clearTimeout(timer);
      animation?.stop();
    };
  }, [delay, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [22, -22] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const opacity = progress.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0.08, 0.2, 0.16, 0.08] });
  return (
    <Animated.View style={[motionStyles.icon, style, { opacity, transform: [{ translateY }, { rotate }] }]}>
      <MaterialCommunityIcons color={accent} name={name} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { flex: 1, minWidth: 240 },
  card: { borderRadius: 20, borderWidth: 1, padding: 14 },
  cardContent: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  accentLine: { height: 3, borderRadius: 2, marginBottom: 10 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.62)' },
  backdrop: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '78%', borderRadius: 30, borderWidth: 2, padding: 24, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  rule: { height: 3, borderRadius: 2, marginVertical: 20 },
  modalText: { fontSize: 15, lineHeight: 23 },
  closeAction: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  closeActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

const motionStyles = StyleSheet.create({
  field: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  icon: { position: 'absolute' },
  one: { left: '38%', top: '26%' },
  two: { left: '8%', top: '22%' },
  three: { right: '8%', top: '17%' },
  four: { left: '12%', bottom: '19%' },
  five: { right: '13%', bottom: '25%' },
  six: { left: '22%', top: '72%' },
  seven: { right: '21%', top: '69%' },
  eight: { left: '73%', bottom: '10%' },
});
