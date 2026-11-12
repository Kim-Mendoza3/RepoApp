import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/context/theme-context';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

/** Tarjeta de información con etiqueta tipo código opcional. */
export function InfoCard({ title, text, label }: { title: string; text: string; label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {label ? <Text style={[textStyles.label, { color: colors.accent, marginBottom: 6 }]}>{label}</Text> : null}
      <Text style={[textStyles.heading, { color: colors.text, fontSize: 18 }]}>{title}</Text>
      <Text style={[textStyles.body, { color: colors.muted, marginTop: 4 }]}>{text}</Text>
    </View>
  );
}

/** Indicador numérico del panel de administración. */
export function StatCard({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={[textStyles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16 },
  statValue: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, marginTop: 6 },
});
