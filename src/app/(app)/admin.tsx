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
    <AppScreen title="Administración" watermarkOpacity={0.075}>
      <Text style={[textStyles.pageTitle, { color: colors.text }]}>Panel de administración</Text>
      <View style={styles.statsRow}>
        <StatCard label="Talleres" value="14" />
        <StatCard label="Registros" value="86" />
      </View>
      <InfoCard title="Resumen del mes" text="3 talleres activos, 2 por iniciar." />
      <AnimatedButton label="Registrar taller" onPress={() => {}} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
});
