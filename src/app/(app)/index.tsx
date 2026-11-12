import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { AppScreen } from '@/components/app-screen';
import { WorkshopCarousel } from '@/components/workshop-carousel';
import { useColors } from '@/context/theme-context';
import { mixedWorkshopSlides } from '@/data/workshops';
import { ProcessFlow } from '@/features/home/process-flow';
import { glassStyles, textStyles } from '@/theme/common-styles';

// PESTAÑA INICIO: presentación de la asociación y experiencias destacadas.
export default function HomeScreen() {
  const colors = useColors();
  // Mientras se desliza el carrusel bloqueamos el scroll vertical para que no "pelee" con el gesto.
  const [carouselGestureActive, setCarouselGestureActive] = useState(false);

  return (
    <AppScreen title="Inicio" watermarkOpacity={0.09} scrollEnabled={!carouselGestureActive}>
      <View style={[styles.hero, glassStyles.surface, { backgroundColor: `${colors.surface}D9`, borderColor: `${colors.line}B8` }]}>
        <Text style={[textStyles.eyebrow, { color: colors.blue }]}>ASOCIACIÓN DE DIVULGACIÓN CIENTÍFICA</Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Somos deDivulgadores</Text>
        <Text style={[textStyles.body, { color: colors.muted }]}>Acercamos la ciencia, la tecnología, el arte y la cultura a todas las personas mediante experiencias claras, participativas y llenas de curiosidad.</Text>
        <View style={styles.signature}>
          <MaterialCommunityIcons color={colors.blue} name="account-heart-outline" size={20} />
          <Text style={[styles.signatureText, { color: colors.text }]}>Creamos espacios para preguntar, experimentar y aprender en comunidad.</Text>
        </View>
      </View>

      <View style={[styles.intro, glassStyles.surface, { backgroundColor: `${colors.blue}12`, borderColor: `${colors.blue}55` }]}>
        <Text style={[textStyles.heading, { color: colors.text }]}>Así hacemos que la ciencia cobre vida</Text>
        <ProcessFlow />
      </View>

      <WorkshopCarousel
        colors={colors}
        compact
        onHorizontalGesture={setCarouselGestureActive}
        onSelectWorkshop={(workshopId) => router.push({ pathname: '/workshop/[id]', params: { id: workshopId } })}
        slides={mixedWorkshopSlides}
      />

      <View style={[styles.featured, glassStyles.surface, { backgroundColor: `${colors.blue}18`, borderColor: `${colors.blue}70` }]}>
        <View style={styles.featuredHeader}>
          <View style={[styles.featuredIcon, { backgroundColor: `${colors.blue}2E` }]}><MaterialCommunityIcons color={colors.blue} name="calendar-star" size={27} /></View>
          <View style={styles.featuredCopy}>
            <Text style={[textStyles.eyebrow, { color: colors.blue }]}>PRÓXIMO TALLER</Text>
            <Text style={[styles.featuredTitle, { color: colors.text }]}>Laboratorio de curiosidad</Text>
          </View>
        </View>
        <Text style={[textStyles.body, { color: colors.muted }]}>Una experiencia práctica para descubrir, experimentar y hacer preguntas.</Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.text }]}><MaterialCommunityIcons color={colors.blue} name="calendar-outline" size={15} /> Fecha por confirmar</Text>
          <Text style={[styles.metaText, { color: colors.text }]}><MaterialCommunityIcons color={colors.blue} name="account-group-outline" size={15} /> Familias y escuelas</Text>
        </View>
        <AnimatedButton label="Ver taller" onPress={() => router.navigate('/talleres')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, borderWidth: 1, padding: 24, marginBottom: 28 },
  heroTitle: { fontSize: 28, lineHeight: 32, fontWeight: '900', marginBottom: 12 },
  signature: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18 },
  signatureText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  intro: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 28 },
  featured: { borderRadius: 25, borderWidth: 1, padding: 22, marginBottom: 28 },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  featuredIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  featuredCopy: { flex: 1 },
  featuredTitle: { fontSize: 21, fontWeight: '800', marginTop: -5 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, marginBottom: 18 },
  metaText: { fontSize: 12, fontWeight: '700' },
});
