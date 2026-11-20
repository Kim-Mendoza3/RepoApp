import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedButton } from '@/components/animated-button';
import { GridBackground } from '@/components/grid-background';
import { ArrowLeftIcon, CalendarPlusIcon, CheckCircleIcon, KeyIcon, WhatsappLogoIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { catalog } from '@/data/workshops';
import { ActivityCard } from '@/features/agenda/activity-card';
import { confirmationMessage, dayKey, formatLongDate, formatTime, sendByWhatsApp, type Activity } from '@/features/agenda/agenda-data';
import { MonthCalendar } from '@/features/agenda/month-calendar';
import { supabase } from '@/lib/supabase';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const MINUTES = [0, 15, 30, 45];
const DURATIONS: { minutes: number | null; label: string }[] = [
  { minutes: 50, label: '50 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1 h 30' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
  { minutes: null, label: 'Sin definir' },
];

// AGENDAR UN TALLER (solo administradores; la ruta está protegida en _layout.tsx)
// Cuando un taller se concreta por WhatsApp, el administrador lo registra aquí.
// Al guardar, Supabase le asigna un código (p. ej. COMETA-274) y desde aquí mismo
// se le manda al cliente un mensaje de WhatsApp con los datos y el código.
export default function NewActivityScreen() {
  const colors = useColors();
  const today = dayKey(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [client, setClient] = useState('');
  const [workshopKeys, setWorkshopKeys] = useState<string[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState<number | null>(60);
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Activity | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin');
  };

  const toggleWorkshop = (key: string) => {
    setWorkshopKeys((keys) => (keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]));
  };

  const reset = () => {
    setClient(''); setWorkshopKeys([]); setDay(null); setHour(null); setMinute(0); setDuration(60);
    setLocation(''); setPeople(''); setGrade(''); setPhone(''); setNotes(''); setError(''); setSaved(null);
  };

  const save = async () => {
    const count = people.trim() ? Number(people.trim()) : null;
    const phoneDigits = phone.replace(/\D/g, '');
    const problem = !client.trim() ? 'Escribe el nombre de la escuela o grupo.'
      : workshopKeys.length === 0 ? 'Elige al menos un taller.'
      : !day ? 'Elige el día en el calendario.'
      : hour === null ? 'Elige la hora de inicio.'
      : !location.trim() ? 'Escribe el lugar donde será el taller.'
      : count !== null && (!Number.isInteger(count) || count <= 0) ? 'El número de participantes debe ser un número entero.'
      : phoneDigits && phoneDigits.length < 10 ? 'El WhatsApp del contacto debe tener 10 dígitos.'
      : '';
    if (problem) {
      setError(problem);
      return;
    }
    if (!supabase || !day || hour === null) return;

    const start = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), hour, minute);
    const end = duration ? new Date(start.getTime() + duration * 60000) : null;
    setSaving(true);
    setError('');
    const { data, error: insertError } = await supabase
      .from('institutional_activities')
      .insert({
        client_name: client.trim(),
        workshop_keys: workshopKeys,
        starts_at: start.toISOString(),
        ends_at: end ? end.toISOString() : null,
        location: location.trim(),
        student_count: count,
        school_grade: grade.trim() || null,
        contact_phone: phoneDigits || null,
        notes: notes.trim() || null,
      })
      .select('*')
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError(`No se pudo guardar: ${insertError?.message ?? 'intenta de nuevo.'}`);
      return;
    }
    setSaved(data);
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.background }];

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GridBackground color={colors.grid} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
          >
            <ArrowLeftIcon color={colors.text} size={18} weight="bold" />
            <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
          </Pressable>

          {saved ? (
            // ---------- GUARDADO: código + WhatsApp ----------
            <View>
              <View style={styles.successHeader}>
                <CheckCircleIcon color={colors.success} size={44} weight="duotone" />
                <Text style={[textStyles.pageTitle, styles.centerText, { color: colors.text }]}>¡Taller agendado!</Text>
                <Text style={[textStyles.body, styles.centerText, { color: colors.muted }]}>Este es su código. Mándalo al cliente para que consulte sus datos en la app.</Text>
              </View>
              <View style={[styles.bigCode, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
                <KeyIcon color={colors.accent} size={22} weight="duotone" />
                <Text selectable style={[styles.bigCodeText, { color: colors.text }]}>{saved.code}</Text>
              </View>
              <ActivityCard activity={saved} showDate />
              <View style={styles.buttons}>
                <AnimatedButton
                  label={saved.contact_phone ? 'Enviar al cliente por WhatsApp' : 'Enviar por WhatsApp'}
                  leading={<WhatsappLogoIcon color={colors.onAccent} size={22} weight="fill" />}
                  onPress={() => sendByWhatsApp(saved.contact_phone, confirmationMessage(saved))}
                  variant="accent"
                />
                {!saved.contact_phone ? (
                  <Text style={[textStyles.small, styles.centerText, { color: colors.muted }]}>Sin teléfono: WhatsApp te dejará elegir el contacto.</Text>
                ) : null}
                <AnimatedButton label="Agendar otro taller" onPress={reset} />
                <AnimatedButton buttonColor={colors.soft} label="Listo" onPress={goBack} textColor={colors.text} />
              </View>
            </View>
          ) : (
            // ---------- FORMULARIO ----------
            <View>
              <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: colors.soft, borderColor: colors.accent }]}>
                  <CalendarPlusIcon color={colors.accent} size={26} weight="duotone" />
                </View>
                <View style={styles.flex}>
                  <Text style={[textStyles.label, { color: colors.accent }]}>{'// administración'}</Text>
                  <Text style={[textStyles.pageTitle, { color: colors.text, fontSize: 28, lineHeight: 32 }]}>Agendar taller</Text>
                </View>
              </View>
              <Text style={[textStyles.body, styles.intro, { color: colors.muted }]}>
                Registra un taller ya confirmado. En el calendario público solo se verá el día y el taller; los demás datos, con el código.
              </Text>

              <Field label="Escuela o grupo *">
                <TextInput onChangeText={setClient} placeholder="Ej. Primaria Benito Juárez, 4° A" placeholderTextColor={colors.muted} style={inputStyle} value={client} />
              </Field>

              <Field label={`Talleres * ${workshopKeys.length ? `· ${workshopKeys.length} elegido${workshopKeys.length > 1 ? 's' : ''}` : '· puedes elegir varios'}`}>
                <View style={styles.chips}>
                  {catalog.map((workshop) => {
                    const active = workshopKeys.includes(workshop.id);
                    return (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: active }}
                        key={workshop.id}
                        onPress={() => toggleWorkshop(workshop.id)}
                        style={({ pressed }) => [
                          styles.chip,
                          { borderColor: active ? workshop.accent : colors.line, backgroundColor: active ? workshop.accent : colors.surface },
                          pressed && pressedStyle,
                        ]}
                      >
                        {!active ? <View style={[styles.chipDot, { backgroundColor: workshop.accent }]} /> : null}
                        <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]}>{workshop.title.replace(/^Taller (de )?/, '')}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label={`Día * ${day ? `· ${formatLongDate(new Date(`${day}T12:00:00`))}` : ''}`}>
                <MonthCalendar minDay={today} month={month} onChangeMonth={setMonth} onSelect={setDay} selected={day} />
              </Field>

              <Field label={`Hora de inicio * ${hour !== null ? `· ${formatTime(new Date(2000, 0, 1, hour, minute))}` : ''}`}>
                <View style={styles.chips}>
                  {HOURS.map((value) => (
                    <OptionChip active={hour === value} key={value} label={formatTime(new Date(2000, 0, 1, value, 0)).replace(':00', '')} onPress={() => setHour(value)} />
                  ))}
                </View>
                <View style={[styles.chips, styles.chipsGap]}>
                  {MINUTES.map((value) => (
                    <OptionChip active={minute === value} key={value} label={`:${String(value).padStart(2, '0')}`} onPress={() => setMinute(value)} />
                  ))}
                </View>
              </Field>

              <Field label="Duración">
                <View style={styles.chips}>
                  {DURATIONS.map((option) => (
                    <OptionChip active={duration === option.minutes} key={option.label} label={option.label} onPress={() => setDuration(option.minutes)} />
                  ))}
                </View>
              </Field>

              <Field label="Lugar *">
                <TextInput multiline onChangeText={setLocation} placeholder="Dirección o nombre del lugar" placeholderTextColor={colors.muted} style={[inputStyle, styles.multiline]} value={location} />
              </Field>

              <View style={styles.twoCols}>
                <View style={styles.flex}>
                  <Field label="Participantes">
                    <TextInput keyboardType="number-pad" onChangeText={setPeople} placeholder="Ej. 25" placeholderTextColor={colors.muted} style={inputStyle} value={people} />
                  </Field>
                </View>
                <View style={styles.flex}>
                  <Field label="Grado o edades">
                    <TextInput onChangeText={setGrade} placeholder="Ej. 4° primaria" placeholderTextColor={colors.muted} style={inputStyle} value={grade} />
                  </Field>
                </View>
              </View>

              <Field label="WhatsApp del contacto" hint="Para mandarle la confirmación. No se muestra con el código.">
                <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder="10 dígitos" placeholderTextColor={colors.muted} style={inputStyle} value={phone} />
              </Field>

              <Field label="Notas internas" hint="Solo las ven los administradores (material, quién lo da, etc.).">
                <TextInput multiline onChangeText={setNotes} placeholder="Ej. Llevar microscopios" placeholderTextColor={colors.muted} style={[inputStyle, styles.multiline]} value={notes} />
              </Field>

              {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
              <View style={styles.saveButton}>
                <AnimatedButton disabled={saving} label={saving ? 'Guardando...' : 'Guardar y generar código'} onPress={save} variant="accent" />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {hint ? <Text style={[textStyles.small, styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function OptionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: active ? colors.text : colors.line, backgroundColor: active ? colors.text : colors.surface },
        pressed && pressedStyle,
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.background : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 22, paddingBottom: 48, width: '100%', maxWidth: 560, alignSelf: 'center' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, marginBottom: 18 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  intro: { marginTop: 10, marginBottom: 6 },
  field: { marginTop: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, marginBottom: 8 },
  hint: { marginTop: -4, marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, fontFamily: fonts.body, fontSize: 15 },
  multiline: { minHeight: 76, paddingTop: 13, paddingBottom: 13, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsGap: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  twoCols: { flexDirection: 'row', gap: 12 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, marginTop: 18 },
  successHeader: { alignItems: 'center', gap: 8, marginBottom: 18 },
  centerText: { textAlign: 'center' },
  bigCode: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderRadius: 18, paddingVertical: 16, marginBottom: 14 },
  bigCodeText: { fontFamily: fonts.mono, fontSize: 26, letterSpacing: 2 },
  buttons: { gap: 10, marginTop: 8 },
  saveButton: { marginTop: 24 },
});
