import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { InfoCard } from '@/components/cards';
import { GlobeIcon, TargetIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { catalog, workshopAreas, type WorkshopArea } from '@/data/workshops';
import { AgendaWhatsAppButton } from '@/features/workshops/agenda-whatsapp-button';
import { PurposeCard } from '@/features/workshops/purpose-card';
import { WorkshopTile } from '@/features/workshops/workshop-tile';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const MISSION = 'La divulgación, difusión y comunicación pública y privada de las ciencias, tecnología, humanidades, arte, historia y cultura en general, a través de diversos formatos de comunicación, a públicos especializados y no especializados, procurando la transición hacia una sociedad del conocimiento.';
const VISION = 'Proyectarse como un grupo consolidado en las actividades de divulgación, que sirva como referente para otros divulgadores y actores sociales; en el ámbito local y global.';

// PESTAÑA TALLERES: propósito institucional y catálogo filtrable por área.
export default function WorkshopsScreen() {
  const colors = useColors();
  const [area, setArea] = useState<WorkshopArea | 'todos'>('todos');
  const visible = area === 'todos' ? catalog : catalog.filter((workshop) => workshop.area === area);
  const filters: { id: WorkshopArea | 'todos'; label: string }[] = [{ id: 'todos', label: 'Todos' }, ...workshopAreas];

  return (
    <AppScreen section="talleres">
      <Text style={[textStyles.label, { color: colors.accent }]}>{`// catálogo · ${catalog.length} talleres`}</Text>
      <Text style={[textStyles.pageTitle, styles.title, { color: colors.text }]}>Talleres</Text>
      <Text style={[textStyles.body, { color: colors.muted }]}>Experiencias para escuelas, familias e instituciones.</Text>

      <View style={styles.purposeRow}>
        <PurposeCard Icon={TargetIcon} label="PROPÓSITO" title="Misión" accent={colors.accent} text={MISSION} />
        <PurposeCard Icon={GlobeIcon} label="PROPÓSITO" title="Visión" accent={colors.accent2} text={VISION} />
      </View>

      {/* Filtros por área: un scroll horizontal para que quepan en pantallas angostas. */}
      <ScrollView contentContainerStyle={styles.filters} horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {filters.map((filter) => {
          const active = filter.id === area;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={filter.id}
              onPress={() => setArea(filter.id)}
              style={[styles.filter, { borderColor: active ? colors.text : colors.line, backgroundColor: active ? colors.text : colors.surface }]}
            >
              <Text style={[styles.filterText, { color: active ? colors.background : colors.text }]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        {visible.map((workshop) => <WorkshopTile key={workshop.id} workshop={workshop} />)}
      </View>

      <InfoCard label="// formación" title="Capacitación" text="Formación para docentes y familias." />
      <AgendaWhatsAppButton />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 4, marginBottom: 6 },
  purposeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  filtersScroll: { marginTop: 20, marginHorizontal: -22 },
  filters: { gap: 8, paddingHorizontal: 22 },
  filter: { height: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: 15, justifyContent: 'center' },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, marginBottom: 20 },
});
