import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { AppScreen } from '@/components/app-screen';
import { InfoCard, StatCard } from '@/components/cards';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/context/theme-context';
import { textStyles } from '@/theme/common-styles';

// PESTAÑA ADMINISTRACIÓN: solo para admin y agenda_manager.
// La seguridad real de los datos la ponen las políticas RLS de Supabase; esto solo cuida la interfaz.
// Los números todavía son de ejemplo; en el paso 5 se leerán de Supabase.
export default function AdminScreen() {
  const colors = useColors();
  const { isStaff } = useAuth();

  if (!isStaff) return <Redirect href="/" />;

  return (
    <AppScreen section="administración">
      <Text style={[textStyles.label, { color: colors.accent }]}>{'// panel · datos de ejemplo'}</Text>
      <Text style={[textStyles.pageTitle, styles.title, { color: colors.text }]}>Administración</Text>
      <View style={styles.statsRow}>
        <StatCard label="TALLERES" value="14" />
        <StatCard label="REGISTROS" value="86" />
      </View>
      <InfoCard label="// este mes" title="Resumen del mes" text="3 talleres activos, 2 por iniciar." />
      <AnimatedButton label="Registrar taller" onPress={() => {}} variant="accent" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
});
