import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { InfoCard } from '@/components/cards';
import { useColors } from '@/context/theme-context';
import { workshops } from '@/data/workshops';
import { AgendaWhatsAppButton } from '@/features/workshops/agenda-whatsapp-button';
import { PurposeCard } from '@/features/workshops/purpose-card';
import { WorkshopTile } from '@/features/workshops/workshop-tile';
import { textStyles } from '@/theme/common-styles';

const MISSION = 'La divulgación, difusión y comunicación pública y privada de las ciencias, tecnología, humanidades, arte, historia y cultura en general, a través de diversos formatos de comunicación, a públicos especializados y no especializados, procurando la transición hacia una sociedad del conocimiento.';
const VISION = 'Proyectarse como un grupo consolidado en las actividades de divulgación, que sirva como referente para otros divulgadores y actores sociales; en el ámbito local y global.';

// PESTAÑA TALLERES: información institucional y catálogo de talleres.
export default function WorkshopsScreen() {
  const colors = useColors();

  return (
    <AppScreen title="Talleres" watermarkOpacity={0.11}>
      <Text style={[textStyles.eyebrow, { color: colors.blue }]}>INSTITUCIONAL</Text>
      <Text style={[textStyles.pageTitle, { color: colors.text }]}>Divulgación científica transformadora</Text>
      <View style={styles.purposeRow}>
        <PurposeCard icon="target" title="Misión" accent={colors.blue} text={MISSION} />
        <PurposeCard icon="earth" title="Visión" accent={colors.purple} text={VISION} />
      </View>
      <Text style={[textStyles.heading, { color: colors.text }]}>Talleres disponibles</Text>
      <Text style={[textStyles.body, styles.intro, { color: colors.muted }]}>Explora cada experiencia para conocer sus actividades y fotografías.</Text>
      <View style={styles.grid}>
        {workshops.map((workshop) => <WorkshopTile key={workshop.id} workshop={workshop} />)}
      </View>
      <InfoCard title="Capacitación" text="Formación para docentes y familias." />
      <AgendaWhatsAppButton />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  purposeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  intro: { marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
});
