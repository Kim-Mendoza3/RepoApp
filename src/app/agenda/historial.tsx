import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatCard } from '@/components/cards';
import { GridBackground } from '@/components/grid-background';
import { ArrowClockwiseIcon, ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, ClockIcon, LockKeyIcon, XCircleIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { ActivityCard } from '@/features/agenda/activity-card';
import {
  CONTACT_RETENTION_MONTHS, fetchYear, isDone, purgeOldContactPhones, setActivityStatus, workshopInfo, type Activity,
} from '@/features/agenda/agenda-data';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const THIS_YEAR = new Date().getFullYear();

type Filter = 'done' | 'cancelled';
type Loaded = { year: number; items: Activity[]; now: Date; failed: boolean };

// HISTORIAL DE TALLERES (solo administradores; ruta protegida en _layout.tsx)
// - Un taller cuenta como REALIZADO solo con que pase su fecha (nadie tiene que marcarlo).
//   Si al final no se dio, se marca "No se realizó" y pasa a cancelados.
// - Resumen del año: talleres realizados, personas alcanzadas y talleres más pedidos.
// - Privacidad: al abrir esta pantalla se borran los teléfonos de contacto con más de
//   CONTACT_RETENTION_MONTHS meses; el resto del historial se conserva.
export default function HistoryScreen() {
  const colors = useColors();
  const [year, setYear] = useState(THIS_YEAR);
  const [filter, setFilter] = useState<Filter>('done');
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const load = useCallback(() => {
    let active = true;
    purgeOldContactPhones()
      .catch(() => undefined)
      .then(() => fetchYear(year))
      .then((items) => { if (active) setLoaded({ year, items, now: new Date(), failed: false }); })
      .catch(() => { if (active) setLoaded({ year, items: [], now: new Date(), failed: true }); });
    return () => { active = false; };
  }, [year]);
  useFocusEffect(load);

  const current = loaded?.year === year ? loaded : null;
  const done = current ? current.items.filter((item) => isDone(item, current.now)) : [];
  const cancelled = current ? current.items.filter((item) => item.status === 'cancelled') : [];
  const people = done.reduce((sum, item) => sum + (item.student_count ?? 0), 0);

  // Talleres más pedidos (entre los realizados): cuántas veces se dio cada uno.
  const counts = new Map<string, number>();
  done.forEach((item) => item.workshop_keys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1)));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = top[0]?.[1] ?? 1;

  const shown = filter === 'done' ? done : cancelled;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin');
  };

  const changeStatus = (activity: Activity, status: Activity['status'], question: string) => {
    Alert.alert(status === 'cancelled' ? 'No se realizó' : 'Restaurar taller', question, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: () => {
          setActivityStatus(activity.id, status)
            .then(load)
            .catch((error: Error) => Alert.alert('No se pudo guardar', error.message));
        },
      },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <GridBackground color={colors.grid} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
          >
            <ArrowLeftIcon color={colors.text} size={18} weight="bold" />
            <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
          </Pressable>

          <Text style={[textStyles.label, { color: colors.accent }]}>{'// administración'}</Text>
          <View style={styles.titleRow}>
            <Text style={[textStyles.pageTitle, styles.flex, { color: colors.text }]}>Historial</Text>
            {/* Selector de año */}
            <View style={styles.yearRow}>
              <YearArrow label="Año anterior" onPress={() => setYear((y) => y - 1)}>
                <CaretLeftIcon color={colors.text} size={16} weight="bold" />
              </YearArrow>
              <Text style={[styles.yearText, { color: colors.text }]}>{year}</Text>
              <YearArrow disabled={year >= THIS_YEAR} label="Año siguiente" onPress={() => setYear((y) => y + 1)}>
                <CaretRightIcon color={colors.text} size={16} weight="bold" />
              </YearArrow>
            </View>
          </View>

          {!current ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : current.failed ? (
            <Text style={[textStyles.body, { color: colors.muted }]}>No se pudo cargar el historial. Revisa tu conexión.</Text>
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatCard label="REALIZADOS" value={String(done.length)} />
                <StatCard label="PERSONAS" value={String(people)} />
                <StatCard label="CANCELADOS" value={String(cancelled.length)} />
              </View>

              {top.length > 0 ? (
                <View style={[styles.topBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <Text style={[textStyles.label, { color: colors.accent }]}>{`// más pedidos en ${year}`}</Text>
                  {top.map(([key, count]) => {
                    const info = workshopInfo(key);
                    return (
                      <View key={key} style={styles.topRow}>
                        <View style={styles.topLabelRow}>
                          <Text numberOfLines={1} style={[styles.topName, { color: colors.text }]}>{info.title}</Text>
                          <Text style={[styles.topCount, { color: colors.muted }]}>{`${count} ${count === 1 ? 'vez' : 'veces'}`}</Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: colors.soft }]}>
                          <View style={[styles.bar, { backgroundColor: info.accent, width: `${(count / maxCount) * 100}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Filtro: realizados / cancelados */}
              <View style={styles.filters}>
                {([['done', `Realizados · ${done.length}`], ['cancelled', `Cancelados · ${cancelled.length}`]] as const).map(([id, label]) => {
                  const active = filter === id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={id}
                      onPress={() => setFilter(id)}
                      style={[styles.filter, { borderColor: active ? colors.text : colors.line, backgroundColor: active ? colors.text : colors.surface }]}
                    >
                      <Text style={[styles.filterText, { color: active ? colors.background : colors.text }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {shown.length === 0 ? (
                <Text style={[textStyles.body, { color: colors.muted }]}>
                  {filter === 'done' ? `Todavía no hay talleres realizados en ${year}.` : `No hay talleres cancelados en ${year}.`}
                </Text>
              ) : (
                shown.map((activity) => (
                  <ActivityCard activity={activity} key={activity.id} showDate>
                    {filter === 'done' ? (
                      <SmallAction
                        color={colors.danger}
                        icon={<XCircleIcon color={colors.danger} size={16} weight="bold" />}
                        label="No se realizó"
                        onPress={() => changeStatus(activity, 'cancelled', `¿Marcar el taller de ${activity.client_name ?? 'este grupo'} como no realizado? Pasará a cancelados.`)}
                      />
                    ) : (
                      <SmallAction
                        color={colors.accent}
                        icon={<ArrowClockwiseIcon color={colors.accent} size={16} weight="bold" />}
                        label={isDone({ ...activity, status: 'scheduled' }, current.now) ? 'Sí se realizó' : 'Volver a agendar'}
                        onPress={() => changeStatus(activity, 'scheduled', `¿Restaurar el taller de ${activity.client_name ?? 'este grupo'}?`)}
                      />
                    )}
                  </ActivityCard>
                ))
              )}

              <View style={styles.note}>
                <LockKeyIcon color={colors.muted} size={14} weight="bold" />
                <Text style={[textStyles.small, styles.flex, { color: colors.muted }]}>
                  {`Por privacidad, el teléfono del contacto se borra solo ${CONTACT_RETENTION_MONTHS} meses después del taller. El resto del historial se conserva.`}
                </Text>
              </View>
              <View style={styles.note}>
                <ClockIcon color={colors.muted} size={14} weight="bold" />
                <Text style={[textStyles.small, styles.flex, { color: colors.muted }]}>
                  Un taller cuenta como realizado en cuanto pasa su fecha. Si no se dio, márcalo como “No se realizó”.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function YearArrow({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled?: boolean; children: ReactNode }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.yearArrow, { borderColor: colors.line, backgroundColor: colors.surface, opacity: disabled ? 0.3 : 1 }, pressed && pressedStyle]}
    >
      {children}
    </Pressable>
  );
}

function SmallAction({ label, icon, color, onPress }: { label: string; icon: ReactNode; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.smallButton, { borderColor: color, backgroundColor: colors.background }, pressed && pressedStyle]}
    >
      {icon}
      <Text style={[styles.smallText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 22, paddingBottom: 48, width: '100%', maxWidth: 560, alignSelf: 'center' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, marginBottom: 18 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 18 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearArrow: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  yearText: { fontFamily: fonts.display, fontSize: 18, minWidth: 48, textAlign: 'center' },
  loading: { marginVertical: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  topBox: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 16 },
  topRow: { gap: 5 },
  topLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  topName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14 },
  topCount: { fontFamily: fonts.mono, fontSize: 12 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filter: { height: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: 15, justifyContent: 'center' },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  smallText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 14 },
});
