import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorkshopCarousel } from '@/components/workshop-carousel';
import { useAppTheme } from '@/context/theme-context';
import { workshops } from '@/data/workshops';

const palette = {
  light: { background: '#F7FAFC', surface: '#FFFFFF', text: '#17202A', muted: '#718096', line: '#E2E8F0' },
  dark: { background: '#171923', surface: '#2D3748', text: '#F7FAFC', muted: '#E2E8F0', line: '#718096' },
} as const;

const darkModeAccents: Record<string, string> = {
  '#087F68': '#5DE0BF',
  '#2463A5': '#8CCFFF',
  '#A85B00': '#FFBE72',
  '#6941A5': '#C4B5FD',
  '#4F7C3A': '#A9D77B',
  '#168A70': '#65E0BF',
  '#C04A78': '#FF9CC1',
  '#315A8A': '#91C7FF',
  '#B54708': '#FFB36B',
  '#A60E12': '#FF8F8A',
  '#7A4EAB': '#CFB2FF',
  '#5C6F35': '#C7E47B',
  '#8B5E3C': '#E1AA7B',
};

function getWorkshopAccent(accent: string, mode: keyof typeof palette) {
  return mode === 'dark' ? darkModeAccents[accent] ?? accent : accent;
}

// PANTALLA DETALLE DE TALLER.
export default function WorkshopDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const workshop = workshops.find((item) => item.id === id) ?? workshops.find((item) => item.id === 'robotica');
  const { mode } = useAppTheme();
  const colors = palette[mode];
  const accent = getWorkshopAccent(workshop?.accent ?? '#2463A5', mode);
  const audienceText = 'Preescolar, primaria, secundaria, bachillerato y universidad';
  const durationText = '25 min a 1 h';
  const capacityText = '10 a 25 participantes';
  const backgroundSource = workshop?.cover ?? workshop?.images[0];
  const hasBackground = Boolean(backgroundSource);
  const [carouselGestureActive, setCarouselGestureActive] = useState(false);

  if (!workshop) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {hasBackground && <Image contentFit="cover" source={backgroundSource} style={styles.backgroundImage} />}
      {hasBackground && <View pointerEvents="none" style={[styles.backgroundShade, { backgroundColor: mode === 'dark' ? 'rgba(23,25,35,0.72)' : 'rgba(247,250,252,0.72)' }]} />}
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!carouselGestureActive}>
        <Pressable accessibilityLabel="Regresar" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons color={colors.text} name="arrow-left" size={23} />
          <Text style={[styles.backText, { color: colors.text }]}>Talleres</Text>
        </Pressable>
        <View style={[styles.header, { borderBottomColor: `${accent}70` }]}>
          <Text style={[styles.eyebrow, { color: accent }]}>{workshop.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{workshop.title}</Text>
          <Text style={[styles.hook, { color: accent }]}>{workshop.hook ?? 'Una experiencia para descubrir, experimentar y hacer preguntas.'}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{workshop.description}</Text>
          <View style={[styles.audienceCard, { backgroundColor: `${accent}18`, borderColor: `${accent}65` }]}>
            <MaterialCommunityIcons color={accent} name="school-outline" size={21} />
            <View style={styles.metaCopy}><Text style={[styles.metaLabel, { color: accent }]}>DIRIGIDO A</Text><Text style={[styles.audience, { color: colors.text }]}>{audienceText}</Text><Text style={[styles.metaHint, { color: colors.muted }]}>Se adapta a cualquier edad y grupo.</Text></View>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: `${accent}22`, borderColor: `${accent}45` }]}><MaterialCommunityIcons color={accent} name="clock-outline" size={17} /><View style={styles.metaCopy}><Text style={[styles.metaLabel, { color: accent }]}>DURACIÓN</Text><Text style={[styles.metaPillText, { color: colors.text }]}>{durationText}</Text></View></View>
            <View style={[styles.metaPill, { backgroundColor: `${accent}22`, borderColor: `${accent}45` }]}><MaterialCommunityIcons color={accent} name="account-multiple-outline" size={17} /><View style={styles.metaCopy}><Text style={[styles.metaLabel, { color: accent }]}>PARTICIPANTES</Text><Text style={[styles.metaPillText, { color: colors.text }]}>{capacityText}</Text></View></View>
          </View>
        </View>
        <View style={[styles.infoSection, { backgroundColor: `${colors.surface}E8`, borderColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lo que van a vivir</Text>
          {workshop.activities.map((activity) => <View key={activity} style={styles.activity}><MaterialCommunityIcons color={accent} name="check-circle-outline" size={19} /><Text style={[styles.activityText, { color: colors.muted }]}>{activity}</Text></View>)}
        </View>
        <View style={[styles.infoSection, { backgroundColor: `${accent}18`, borderColor: `${accent}70` }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Al terminar</Text>
          {(workshop.takeaways ?? ['Una experiencia para aprender haciendo', 'Nuevas preguntas para seguir explorando']).map((takeaway) => <View key={takeaway} style={styles.activity}><MaterialCommunityIcons color={accent} name="lightbulb-on-outline" size={19} /><Text style={[styles.activityText, { color: colors.muted }]}>{takeaway}</Text></View>)}
        </View>
        {workshop.safetyNote && <View style={[styles.safetyNote, { backgroundColor: `${accent}18`, borderColor: `${accent}70` }]}><MaterialCommunityIcons color={accent} name="shield-check-outline" size={22} /><Text style={[styles.safetyText, { color: colors.text }]}>{workshop.safetyNote}</Text></View>}
        <WorkshopCarousel colors={{ ...colors, surface: `${colors.surface}E8`, blue: accent }} minimal onHorizontalGesture={setCarouselGestureActive} slides={workshop.images.map((image, imageIndex) => ({ workshopId: workshop.id, title: workshop.title, eyebrow: workshop.eyebrow, accent, image, imageIndex }))} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundImage: { ...StyleSheet.absoluteFill, opacity: 1 },
  backgroundShade: { ...StyleSheet.absoluteFill },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginBottom: 22 },
  backText: { fontSize: 15, fontWeight: '800' },
  header: { borderBottomWidth: 1, paddingBottom: 22, marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '900', marginBottom: 10 },
  hook: { fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 24 },
  audienceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 17 },
  audience: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  metaCopy: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metaHint: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metaPill: { flex: 1, minWidth: 145, flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderWidth: 1, borderRadius: 16, padding: 11 },
  metaPillText: { fontSize: 12, fontWeight: '800', lineHeight: 17 },
  infoSection: { borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 14 },
  activity: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 10 },
  activityText: { flex: 1, fontSize: 15, lineHeight: 21 },
  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 25 },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  galleryTitle: { marginBottom: 13 },
  mosaic: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mosaicImage: { width: '48.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#CBD5E1' },
});