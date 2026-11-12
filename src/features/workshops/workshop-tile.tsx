import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageSquareIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import type { CatalogWorkshop } from '@/data/workshops';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

/** Tarjeta del catálogo: portada, código del área, título y dato breve. Abre el detalle del taller. */
export function WorkshopTile({ workshop }: { workshop: CatalogWorkshop }) {
  const colors = useColors();
  const coverSource = workshop.cover ?? workshop.images[0];
  const codeColor = workshop.area === 'tecnologia' ? colors.accent2 : colors.accent;
  const meta = workshop.duration && !workshop.duration.includes('confirmar')
    ? workshop.duration.replace('1 sesión de ', '')
    : workshop.audience;

  return (
    <Pressable
      accessibilityLabel={`Abrir ${workshop.title}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/workshop/[id]', params: { id: workshop.id } })}
      style={({ pressed }) => [styles.tile, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && pressedStyle]}
    >
      {coverSource
        ? <Image contentFit="cover" source={coverSource} style={styles.cover} transition={200} />
        : <View style={[styles.cover, styles.fallback, { backgroundColor: colors.soft }]}><ImageSquareIcon color={colors.muted} size={34} weight="duotone" /></View>}
      <View style={styles.body}>
        <Text style={[textStyles.label, { color: codeColor, fontSize: 10 }]}>{workshop.code}</Text>
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{workshop.title}</Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.muted }]}>{meta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: '48%', borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  cover: { width: '100%', height: 112 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 12 },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20, marginTop: 3 },
  meta: { fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
});
