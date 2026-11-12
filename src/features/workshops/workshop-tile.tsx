import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/context/theme-context';
import type { Workshop } from '@/data/workshops';

/** Cuadro del catálogo con la portada del taller; al tocarlo abre su detalle. */
export function WorkshopTile({ workshop }: { workshop: Workshop }) {
  const colors = useColors();
  const coverSource = workshop.cover ?? workshop.images[0];
  const hasCover = Boolean(coverSource);

  return (
    <Pressable
      accessibilityLabel={`Abrir ${workshop.title}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/workshop/[id]', params: { id: workshop.id } })}
      style={({ pressed }) => [styles.tile, { borderColor: `${workshop.accent}70`, opacity: pressed ? 0.82 : 1 }]}
    >
      {hasCover
        ? <Image contentFit="cover" source={coverSource} style={StyleSheet.absoluteFill} />
        : <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: `${workshop.accent}24` }]}>
          <MaterialCommunityIcons color={workshop.accent} name="image-plus-outline" size={42} />
          <Text style={[styles.pending, { color: workshop.accent }]}>Portada pendiente</Text>
        </View>}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: hasCover ? `${workshop.accent}B8` : `${workshop.accent}18` }]} />
      <View style={styles.content}>
        <Text style={[styles.eyebrow, !hasCover && { color: workshop.accent }]}>{workshop.eyebrow}</Text>
        <Text style={[styles.title, !hasCover && { color: colors.text }]}>{workshop.title}</Text>
        <View style={styles.action}>
          <Text style={[styles.actionText, !hasCover && { color: workshop.accent }]}>Ver taller</Text>
          <MaterialCommunityIcons color={hasCover ? '#FFFFFF' : workshop.accent} name="arrow-right" size={17} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: '47%', aspectRatio: 1, borderRadius: 20, borderWidth: 1, overflow: 'hidden', backgroundColor: '#CBD5E1' },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  pending: { fontSize: 11, fontWeight: '800' },
  content: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  eyebrow: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  title: { color: '#FFFFFF', fontSize: 20, lineHeight: 23, fontWeight: '900' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
