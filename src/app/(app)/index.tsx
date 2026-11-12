import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { AppScreen } from '@/components/app-screen';
import { ArrowRightIcon } from '@/components/icons';
import { prepareTabTransition } from '@/components/tab-transition';
import { WorkshopCarousel } from '@/components/workshop-carousel';
import { useColors } from '@/context/theme-context';
import { mixedWorkshopSlides } from '@/data/workshops';
import { ProcessFlow } from '@/features/home/process-flow';
import { textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const featuredCover = require('@/assets/images/talleres/portadas/astronomia.jpg');

// PESTAÑA INICIO: presentación de la asociación y experiencias destacadas.
export default function HomeScreen() {
  const colors = useColors();
  // Mientras se desliza el carrusel bloqueamos el scroll vertical para que no "pelee" con el gesto.
  const [carouselGestureActive, setCarouselGestureActive] = useState(false);

  const goToWorkshops = () => {
    prepareTabTransition('index', 'talleres');
    router.navigate('/talleres');
  };

  return (
    <AppScreen section="inicio" scrollEnabled={!carouselGestureActive}>
      <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={[styles.chipDot, { backgroundColor: colors.accent }]} />
        <Text style={[textStyles.label, { color: colors.accent }]}>DIVULGACIÓN CIENTÍFICA</Text>
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Somos deDivulgadores</Text>
      <Text style={[textStyles.body, styles.heroText, { color: colors.muted }]}>
        Acercamos la ciencia, la tecnología, el arte y la cultura a todas las personas mediante experiencias claras, participativas y llenas de curiosidad.
      </Text>

      <ProcessFlow />

      <View style={styles.spacer} />
      <WorkshopCarousel
        colors={colors}
        compact
        onHorizontalGesture={setCarouselGestureActive}
        onSelectWorkshop={(workshopId) => router.push({ pathname: '/workshop/[id]', params: { id: workshopId } })}
        slides={mixedWorkshopSlides}
      />

      <View style={[styles.featured, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View>
          <Image accessibilityLabel="Ilustración de telescopio y cielo estrellado" contentFit="cover" source={featuredCover} style={styles.featuredImage} />
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[textStyles.label, { color: colors.onAccent }]}>PRÓXIMO</Text>
          </View>
        </View>
        <View style={styles.featuredBody}>
          <Text style={[textStyles.heading, { color: colors.text }]}>Laboratorio de curiosidad</Text>
          <Text style={[textStyles.label, styles.featuredMeta, { color: colors.muted }]}>fecha: por confirmar · familias y escuelas</Text>
          <AnimatedButton label="Ver talleres" onPress={goToWorkshops} trailing={<ArrowRightIcon color={colors.background} size={18} weight="bold" />} />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  heroTitle: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, letterSpacing: -0.8, marginTop: 16 },
  heroText: { marginTop: 12, marginBottom: 24 },
  spacer: { height: 22 },
  featured: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  featuredImage: { width: '100%', height: 150 },
  badge: { position: 'absolute', left: 12, top: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  featuredBody: { padding: 16 },
  featuredMeta: { fontSize: 12, marginTop: 6, marginBottom: 14 },
});
