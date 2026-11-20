import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ClockIcon, KeyIcon, MapPinIcon, UsersIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { formatLongDate, formatTimeRange, workshopInfo, type Activity } from '@/features/agenda/agenda-data';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type ActivityDetails = Pick<Activity, 'code' | 'starts_at' | 'ends_at' | 'location' | 'client_name' | 'workshop_keys' | 'student_count' | 'school_grade'> & {
  notes?: string | null;
};

/** Tarjeta con TODOS los datos de un taller agendado (para administradores o con código). */
export function ActivityCard({ activity, showDate = false, children }: { activity: ActivityDetails; showDate?: boolean; children?: ReactNode }) {
  const colors = useColors();
  const people = [activity.student_count ? `${activity.student_count} participantes` : null, activity.school_grade].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.topRow}>
        <Text style={[textStyles.label, { color: colors.accent, flex: 1 }]}>
          {showDate ? formatLongDate(new Date(activity.starts_at)).toUpperCase() : '// taller agendado'}
        </Text>
        <View style={[styles.codeChip, { backgroundColor: colors.soft, borderColor: colors.line }]}>
          <KeyIcon color={colors.accent} size={12} weight="bold" />
          <Text style={[styles.codeText, { color: colors.text }]}>{activity.code}</Text>
        </View>
      </View>

      {activity.client_name ? <Text style={[textStyles.cardTitle, styles.client, { color: colors.text }]}>{activity.client_name}</Text> : null}

      <View style={styles.workshops}>
        {activity.workshop_keys.map((key) => {
          const info = workshopInfo(key);
          return (
            <View key={key} style={[styles.workshopChip, { borderColor: info.accent }]}>
              <View style={[styles.workshopDot, { backgroundColor: info.accent }]} />
              <Text style={[styles.workshopText, { color: colors.text }]}>{info.title}</Text>
            </View>
          );
        })}
      </View>

      <DetailRow icon={<ClockIcon color={colors.muted} size={16} weight="bold" />} text={formatTimeRange(activity.starts_at, activity.ends_at)} />
      <DetailRow icon={<MapPinIcon color={colors.muted} size={16} weight="bold" />} text={activity.location} />
      {people ? <DetailRow icon={<UsersIcon color={colors.muted} size={16} weight="bold" />} text={people} /> : null}
      {activity.notes ? (
        <Text style={[textStyles.small, styles.notes, { color: colors.muted, borderColor: colors.line }]}>{`Nota interna: ${activity.notes}`}</Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

function DetailRow({ icon, text }: { icon: ReactNode; text: string }) {
  const colors = useColors();
  return (
    <View style={styles.detail}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={[styles.detailText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  codeText: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.5 },
  client: { marginTop: 8 },
  workshops: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 6 },
  workshopChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  workshopDot: { width: 7, height: 7, borderRadius: 4 },
  workshopText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  detailIcon: { marginTop: 2 },
  detailText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  notes: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
