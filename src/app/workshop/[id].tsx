import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/grid-background';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, GraduationCapIcon, LightbulbIcon, ShieldCheckIcon, UsersIcon } from '@/components/icons';
import { WorkshopCarousel } from '@/components/workshop-carousel';
import { useColors } from '@/context/theme-context';
import { catalog } from '@/data/workshops';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

type IconComponent = ComponentType<{ color?: string; size?: number; weight?: 'duotone' | 'bold' }>;

const AUDIENCE = 'Preescolar, primaria, secundaria, bachillerato y universidad';
const DURATION = '25 min a 1 h';
const CAPACITY = '10 a 25 participantes';

// PANTALLA DETALLE DE TALLER.
export default function WorkshopDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const workshop = catalog.find((item) => item.id === id) ?? catalog.find((item) => item.id === 'robotica');
  const colors = useColors();
  const [carouselGestureActive, setCarouselGestureActive] = useState(false);

  if (!workshop) return null;
  const cover = workshop.cover ?? workshop.images[0];
  const takeaways = workshop.takeaways ?? ['Una experiencia para aprender haciendo', 'Nuevas preguntas para seguir explorando'];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <GridBackground color={colors.grid} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!carouselGestureActive}>
        <Pressable
          accessibilityLabel="Regresar a talleres"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
        >
          <ArrowLeftIcon color={colors.text} size={18} weight="bold" />
          <Text style={[styles.backText, { color: colors.text }]}>Talleres</Text>
        </Pressable>

        {cover ? (
          <View style={[styles.coverFrame, { borderColor: colors.line }]}>
            <Image accessibilityLabel={`Portada de ${workshop.title}`} contentFit="cover" source={cover} style={styles.cover} transition={200} />
            <View style={[styles.codeBadge, { backgroundColor: colors.accent }]}>
              <Text style={[textStyles.label, { color: colors.onAccent }]}>{workshop.code}</Text>
            </View>
          </View>
        ) : null}

        <Text style={[textStyles.label, { color: colors.accent }]}>{`// ${workshop.eyebrow.toLowerCase()}`}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{workshop.title}</Text>
        <Text style={[styles.hook, { color: colors.accent }]}>{workshop.hook ?? 'Una experiencia para descubrir, experimentar y hacer preguntas.'}</Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>{workshop.description}</Text>

        <View style={[styles.audience, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <GraduationCapIcon color={colors.accent} size={24} weight="duotone" />
          <View style={styles.metaCopy}>
            <Text style={[textStyles.label, { color: colors.accent, fontSize: 10 }]}>DIRIGIDO A</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{AUDIENCE}</Text>
            <Text style={[textStyles.small, { color: colors.muted }]}>Se adapta a cualquier edad y grupo.</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <MetaPill Icon={ClockIcon} label="DURACIÓN" value={DURATION} />
          <MetaPill Icon={UsersIcon} label="PARTICIPANTES" value={CAPACITY} />
        </View>

        <Section title="Lo que van a vivir" Icon={CheckCircleIcon} items={workshop.activities} />
        <Section title="Al terminar" Icon={LightbulbIcon} items={takeaways} />

        {workshop.safetyNote ? (
          <View style={[styles.safety, { backgroundColor: colors.soft, borderColor: colors.line }]}>
            <ShieldCheckIcon color={colors.accent} size={24} weight="duotone" />
            <Text style={[styles.safetyText, { color: colors.text }]}>{workshop.safetyNote}</Text>
          </View>
        ) : null}

        {workshop.images.length > 0 ? (
          <WorkshopCarousel
            colors={colors}
            minimal
            onHorizontalGesture={setCarouselGestureActive}
            slides={workshop.images.map((image, imageIndex) => ({ workshopId: workshop.id, title: workshop.title, eyebrow: workshop.eyebrow, accent: colors.accent, image, imageIndex }))}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ Icon, label, value }: { Icon: IconComponent; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.metaPill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Icon color={colors.accent} size={20} weight="duotone" />
      <View style={styles.metaCopy}>
        <Text style={[textStyles.label, { color: colors.accent, fontSize: 10 }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, Icon, items }: { title: string; Icon: IconComponent; items: string[] }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={[textStyles.heading, { color: colors.text, fontSize: 19 }]}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.item}>
          <Icon color={colors.accent} size={20} weight="duotone" />
          <Text style={[styles.itemText, { color: colors.muted }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, maxWidth: 800, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, marginBottom: 16 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  coverFrame: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 18 },
  cover: { width: '100%', height: 210 },
  codeBadge: { position: 'absolute', left: 12, top: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6, marginTop: 6 },
  hook: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24, marginTop: 10, marginBottom: 10 },
  audience: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 20 },
  metaPill: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12 },
  metaCopy: { flex: 1, gap: 2 },
  metaValue: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  section: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 },
  itemText: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20 },
  safetyText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19 },
});
