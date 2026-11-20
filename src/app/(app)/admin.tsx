import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { AppScreen } from '@/components/app-screen';
import { StatCard } from '@/components/cards';
import { CalendarPlusIcon, ClockIcon, WhatsappLogoIcon, XCircleIcon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/context/theme-context';
import { ActivityCard } from '@/features/agenda/activity-card';
import { confirmationMessage, fetchUpcoming, sendByWhatsApp, type Activity } from '@/features/agenda/agenda-data';
import { supabase } from '@/lib/supabase';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

// PESTAÑA ADMINISTRACIÓN: solo para admin y agenda_manager.
// La seguridad real de los datos la ponen las políticas RLS de Supabase; esto solo cuida la interfaz.
export default function AdminScreen() {
  const colors = useColors();
  const { isStaff } = useAuth();
  const [upcoming, setUpcoming] = useState<Activity[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Se recarga al entrar a la pestaña (p. ej. al volver de "Agendar taller") y tras cancelar.
  const load = useCallback(() => {
    if (!isStaff) return undefined;
    let active = true;
    fetchUpcoming()
      .then((items) => { if (active) { setUpcoming(items); setFailed(false); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [isStaff]);
  useFocusEffect(load);

  if (!isStaff) return <Redirect href="/" />;

  const now = new Date();
  const thisMonth = upcoming?.filter((item) => {
    const date = new Date(item.starts_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length ?? 0;
  const participants = upcoming?.reduce((sum, item) => sum + (item.student_count ?? 0), 0) ?? 0;

  const cancel = (activity: Activity) => {
    Alert.alert(
      'Cancelar taller',
      `¿Cancelar el taller de ${activity.client_name ?? 'este grupo'} (${activity.code})? Dejará de aparecer en el calendario.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (!supabase) return;
            const { error } = await supabase.from('institutional_activities').update({ status: 'cancelled' }).eq('id', activity.id);
            if (error) Alert.alert('No se pudo cancelar', error.message);
            else load();
          },
        },
      ],
    );
  };

  return (
    <AppScreen section="administración">
      <Text style={[textStyles.label, { color: colors.accent }]}>{'// panel del equipo'}</Text>
      <Text style={[textStyles.pageTitle, styles.title, { color: colors.text }]}>Administración</Text>

      <View style={styles.statsRow}>
        <StatCard label="PRÓXIMOS" value={upcoming ? String(upcoming.length) : '–'} />
        <StatCard label="ESTE MES" value={upcoming ? String(thisMonth) : '–'} />
        <StatCard label="PERSONAS" value={upcoming ? String(participants) : '–'} />
      </View>

      <AnimatedButton
        label="Agendar taller"
        leading={<CalendarPlusIcon color={colors.onAccent} size={20} weight="bold" />}
        onPress={() => router.push('/agenda/nuevo')}
        variant="accent"
      />
      <View style={styles.secondButton}>
        <AnimatedButton
          buttonColor={colors.surface}
          label="Historial y resumen del año"
          leading={<ClockIcon color={colors.text} size={20} weight="bold" />}
          onPress={() => router.push('/agenda/historial')}
          textColor={colors.text}
        />
      </View>

      <Text style={[textStyles.heading, styles.listTitle, { color: colors.text }]}>Próximos talleres</Text>
      {failed ? (
        <Text style={[textStyles.body, { color: colors.muted }]}>No se pudo cargar la agenda. Revisa tu conexión.</Text>
      ) : !upcoming ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : upcoming.length === 0 ? (
        <Text style={[textStyles.body, { color: colors.muted }]}>Aún no hay talleres agendados. Toca “Agendar taller” para registrar el primero.</Text>
      ) : (
        upcoming.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} showDate>
            <SmallButton
              color={colors.success}
              icon={<WhatsappLogoIcon color={colors.success} size={16} weight="fill" />}
              label="WhatsApp"
              onPress={() => sendByWhatsApp(activity.contact_phone, confirmationMessage(activity))}
            />
            <SmallButton
              color={colors.danger}
              icon={<XCircleIcon color={colors.danger} size={16} weight="bold" />}
              label="Cancelar"
              onPress={() => cancel(activity)}
            />
          </ActivityCard>
        ))
      )}
    </AppScreen>
  );
}

function SmallButton({ label, icon, color, onPress }: { label: string; icon: React.ReactNode; color: string; onPress: () => void }) {
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
  title: { marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  secondButton: { marginTop: 10 },
  listTitle: { marginTop: 26, marginBottom: 12 },
  loading: { marginVertical: 16 },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  smallText: { fontFamily: fonts.bodySemi, fontSize: 13 },
});
