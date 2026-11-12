import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { pressedStyle } from '@/theme/common-styles';

const agendaWhatsAppUrl = 'https://wa.me/529531753907?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20sobre%20visitas%20escolares%2C%20talleres%20o%20charlas%20itinerantes.';

async function openAgendaWhatsApp() {
  try {
    const canOpen = await Linking.canOpenURL(agendaWhatsAppUrl);
    if (!canOpen) {
      Alert.alert('WhatsApp no disponible', 'No se pudo abrir el contacto de agenda en este dispositivo.');
      return;
    }
    await Linking.openURL(agendaWhatsAppUrl);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', 'Intenta nuevamente o contacta a la asociación por otro medio.');
  }
}

/** Botón verde para pedir una visita o taller al encargado de agenda. */
export function AgendaWhatsAppButton() {
  return (
    <Pressable
      accessibilityLabel="Contactar por WhatsApp al encargado de agenda"
      accessibilityRole="button"
      onPress={openAgendaWhatsApp}
      style={({ pressed }) => [styles.button, pressed && pressedStyle]}
    >
      <MaterialCommunityIcons color="#FFFFFF" name="whatsapp" size={52} />
      <View style={styles.copy}>
        <Text style={styles.title}>Solicita una visita o taller</Text>
        <Text style={styles.text}>Contacta al encargado de agenda por WhatsApp.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20, backgroundColor: '#25D366', shadowColor: '#128C7E', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  copy: { alignItems: 'center', marginTop: 12 },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  text: { color: '#F0FFF4', fontSize: 12, lineHeight: 17, marginTop: 4, textAlign: 'center' },
});
