import { useState, type ComponentType } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';

import { GridBackground } from '@/components/grid-background';
import { useColors } from '@/context/theme-context';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' }>;
type PurposeCardProps = { Icon: IconComponent; label: string; title: string; accent: string; text: string };

/** Tarjeta compacta (Misión, Visión…) que abre el texto completo en una ventana animada. */
export function PurposeCard({ Icon, label, title, accent, text }: PurposeCardProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const modalScale = useAnimatedValue(0.9);
  const modalOpacity = useAnimatedValue(0);

  const open = () => {
    setVisible(true);
    modalScale.setValue(0.9);
    modalOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.9, duration: 160, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  return (
    <>
      <Pressable
        accessibilityHint="Abre el texto completo"
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
      >
        <View style={[styles.cardIcon, { backgroundColor: colors.soft }]}><Icon color={accent} size={22} weight="duotone" /></View>
        <View style={styles.cardCopy}>
          <Text style={[textStyles.label, { color: accent, fontSize: 10 }]}>{label}</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
      </Pressable>
      <Modal transparent visible={visible} onRequestClose={close} animationType="none">
        <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
          <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line, transform: [{ scale: modalScale }] }]}>
            <GridBackground color={colors.grid} size={20} />
            <View style={styles.sheetHeader}>
              <View style={[styles.modalIcon, { backgroundColor: colors.soft }]}><Icon color={accent} size={26} weight="duotone" /></View>
              <View style={styles.cardCopy}>
                <Text style={[textStyles.label, { color: accent }]}>{`// propósito institucional`}</Text>
                <Text style={[textStyles.heading, { color: colors.text }]}>{title}</Text>
              </View>
            </View>
            <View style={[styles.rule, { backgroundColor: accent }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[textStyles.body, { color: colors.text }]}>{text}</Text>
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.close, { backgroundColor: colors.text }, pressed && pressedStyle]}>
              <Text style={[styles.closeText, { color: colors.background }]}>Cerrar</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1 },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 21 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(6, 12, 23, 0.6)' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '78%', borderRadius: 24, borderWidth: 1, padding: 22, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rule: { height: 2, width: 48, borderRadius: 1, marginVertical: 18 },
  close: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  closeText: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
