import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { KeyIcon, LockKeyIcon, MagnifyingGlassIcon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/context/theme-context';
import { ActivityCard } from '@/features/agenda/activity-card';
import {
  dayKey, fetchPublicAgenda, fetchStaffAgenda, findByCode, formatLongDate, workshopInfo,
  type Activity, type CodeResult, type PublicDay,
} from '@/features/agenda/agenda-data';
import { MonthCalendar } from '@/features/agenda/month-calendar';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type Loaded = { key: string; publicDays: PublicDay[]; staff: Activity[]; failed: boolean };

// AGENDA EN INICIO
// Todos ven qué días hay taller y cuál. Los administradores (que también son quienes dan los
// talleres) ven además escuela, hora, lugar y participantes. Con su código, cada escuela o
// familia ve los datos de su propio taller.
export function HomeAgenda() {
  const colors = useColors();
  const { isStaff } = useAuth();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const requestKey = `${dayKey(month)}|${isStaff ? 'staff' : 'public'}`;

  // Se vuelve a consultar cada vez que la pantalla aparece (p. ej. al regresar de agendar).
  useFocusEffect(useCallback(() => {
    let active = true;
    const request = isStaff
      ? fetchStaffAgenda(month).then((staff) => ({ publicDays: [], staff }))
      : fetchPublicAgenda(month).then((publicDays) => ({ publicDays, staff: [] }));
    request
      .then((result) => { if (active) setLoaded({ key: requestKey, ...result, failed: false }); })
      .catch(() => { if (active) setLoaded({ key: requestKey, publicDays: [], staff: [], failed: true }); });
    return () => { active = false; };
  }, [isStaff, month, requestKey]));

  const current = loaded?.key === requestKey ? loaded : null;

  // Días marcados: un puntito con el color de cada taller.
  const marks: Record<string, string[]> = {};
  const addMark = (day: string, keys: string[]) => {
    marks[day] = [...(marks[day] ?? []), ...keys.map((key) => workshopInfo(key).accent)];
  };
  current?.publicDays.forEach((entry) => addMark(entry.day, entry.workshopKeys));
  current?.staff.forEach((activity) => addMark(dayKey(new Date(activity.starts_at)), activity.workshop_keys));

  // Si no se ha tocado un día, mostramos el próximo día con taller de este mes.
  const today = dayKey(new Date());
  const upcoming = Object.keys(marks).filter((day) => day >= today).sort()[0];
  const shownDay = selected ?? upcoming ?? null;
  const dayPublic = current?.publicDays.filter((entry) => entry.day === shownDay) ?? [];
  const dayStaff = current?.staff.filter((activity) => dayKey(new Date(activity.starts_at)) === shownDay) ?? [];
  const total = isStaff ? current?.staff.length ?? 0 : current?.publicDays.length ?? 0;

  const changeMonth = (next: Date) => {
    setMonth(next);
    setSelected(null);
  };

  return (
    <View style={styles.section}>
      <Text style={[textStyles.label, { color: colors.accent }]}>
        {isStaff ? '// agenda · vista de administrador' : `// agenda · ${total} ${total === 1 ? 'taller' : 'talleres'} este mes`}
      </Text>
      <Text style={[textStyles.heading, styles.title, { color: colors.text }]}>Próximos talleres</Text>

      <MonthCalendar marks={marks} month={month} onChangeMonth={changeMonth} onSelect={setSelected} selected={shownDay} />

      <View style={styles.dayPanel}>
        {!current ? (
          <ActivityIndicator color={colors.accent} style={styles.loading} />
        ) : current.failed ? (
          <Text style={[textStyles.body, { color: colors.muted }]}>No se pudo cargar la agenda. Revisa tu conexión.</Text>
        ) : !shownDay ? (
          <Text style={[textStyles.body, { color: colors.muted }]}>No hay talleres agendados este mes.</Text>
        ) : (
          <>
            <Text style={[styles.dayTitle, { color: colors.text }]}>{formatLongDate(new Date(`${shownDay}T12:00:00`))}</Text>
            {isStaff ? (
              dayStaff.length ? dayStaff.map((activity) => <ActivityCard activity={activity} key={activity.id} />)
                : <Text style={[textStyles.body, { color: colors.muted }]}>Sin talleres este día.</Text>
            ) : dayPublic.length ? (
              <>
                {dayPublic.map((entry, i) => (
                  <View key={i} style={[styles.publicItem, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                    {entry.workshopKeys.map((key) => {
                      const info = workshopInfo(key);
                      return (
                        <View key={key} style={styles.publicRow}>
                          <View style={[styles.publicDot, { backgroundColor: info.accent }]} />
                          <Text style={[styles.publicText, { color: colors.text }]}>{info.title}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
                <View style={styles.privateNote}>
                  <LockKeyIcon color={colors.muted} size={14} weight="bold" />
                  <Text style={[textStyles.small, { color: colors.muted, flex: 1 }]}>
                    Por la seguridad de los niños, la hora y el lugar solo se ven con el código del taller.
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[textStyles.body, { color: colors.muted }]}>Sin talleres este día.</Text>
            )}
          </>
        )}
      </View>

      {!isStaff ? <CodeLookup /> : null}
    </View>
  );
}

/** "¿Tienes un código?": la escuela o familia consulta los datos de su taller. */
function CodeLookup() {
  const colors = useColors();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  const [message, setMessage] = useState('');

  const search = async () => {
    if (code.trim().length < 4) {
      setMessage('Escribe el código completo, por ejemplo COMETA-274.');
      return;
    }
    setSearching(true);
    setMessage('');
    setResult(null);
    try {
      const found = await findByCode(code);
      if (found) setResult(found);
      else setMessage('No encontramos ese código. Revisa que esté bien escrito o pregúntanos por WhatsApp.');
    } catch {
      setMessage('No se pudo buscar. Revisa tu conexión e intenta de nuevo.');
    }
    setSearching(false);
  };

  return (
    <View style={[styles.lookup, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.lookupHeader}>
        <View style={[styles.lookupIcon, { backgroundColor: colors.soft, borderColor: colors.accent }]}>
          <KeyIcon color={colors.accent} size={22} weight="duotone" />
        </View>
        <View style={styles.flex}>
          <Text style={[textStyles.cardTitle, { color: colors.text }]}>¿Tienes un código?</Text>
          <Text style={[textStyles.small, { color: colors.muted }]}>Si ya agendaste un taller, escribe el código que te enviamos por WhatsApp.</Text>
        </View>
      </View>
      <TextInput
        accessibilityLabel="Código del taller"
        autoCapitalize="characters"
        autoCorrect={false}
        onChangeText={(value) => { setCode(value); setMessage(''); }}
        onSubmitEditing={search}
        placeholder="COMETA-274"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.background }]}
        value={code}
      />
      <AnimatedButton
        disabled={searching}
        label={searching ? 'Buscando...' : 'Buscar mi taller'}
        leading={<MagnifyingGlassIcon color={colors.onAccent} size={18} weight="bold" />}
        onPress={search}
        variant="accent"
      />
      {message ? <Text accessibilityLiveRegion="polite" style={[textStyles.small, styles.message, { color: colors.danger }]}>{message}</Text> : null}
      {result ? (
        <View style={styles.result}>
          {result.status === 'cancelled' ? (
            <Text style={[textStyles.small, styles.message, { color: colors.danger }]}>Este taller fue cancelado. Escríbenos por WhatsApp para reagendarlo.</Text>
          ) : null}
          <ActivityCard activity={result} showDate />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  title: { marginTop: 4, marginBottom: 12 },
  dayPanel: { marginTop: 14, minHeight: 40 },
  loading: { marginVertical: 12 },
  dayTitle: { fontFamily: fonts.bodySemi, fontSize: 15, marginBottom: 8 },
  publicItem: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 6, marginBottom: 8 },
  publicRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  publicDot: { width: 10, height: 10, borderRadius: 5 },
  publicText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  privateNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  lookup: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 },
  lookupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  lookupIcon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  input: { height: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, marginBottom: 12, fontFamily: fonts.mono, fontSize: 16, letterSpacing: 1 },
  message: { marginTop: 10 },
  result: { marginTop: 12 },
});
