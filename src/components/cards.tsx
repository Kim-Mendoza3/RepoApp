import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/context/theme-context';
import { glassStyles, textStyles } from '@/theme/common-styles';

export function InfoCard({ title, text, badge }: { title: string; text: string; badge?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.infoCard, glassStyles.surface, { backgroundColor: `${colors.surface}CC`, borderColor: `${colors.line}A8` }]}>
      <Text style={[textStyles.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[textStyles.body, { color: colors.muted }]}>{text}</Text>
      {badge && <Text style={[styles.badge, { color: colors.green, backgroundColor: `${colors.greenSoft}D9` }]}>Inscripción abierta</Text>}
    </View>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, glassStyles.surface, { backgroundColor: `${colors.surface}CC`, borderColor: `${colors.line}A8` }]}>
      <Text style={[textStyles.cardSubtitle, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.blue }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: { borderRadius: 22, borderWidth: 1, padding: 22, marginBottom: 16 },
  badge: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 12, fontSize: 12, fontWeight: '700' },
  statCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 18, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', marginTop: 4 },
});
