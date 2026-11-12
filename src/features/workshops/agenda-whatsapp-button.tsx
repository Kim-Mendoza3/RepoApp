import { Alert, Linking } from 'react-native';

import { AnimatedButton } from '@/components/animated-button';
import { WhatsappLogoIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';

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

/** Botón para pedir una visita o taller al encargado de agenda por WhatsApp. */
export function AgendaWhatsAppButton() {
  const colors = useColors();
  return (
    <AnimatedButton
      label="Solicitar una visita por WhatsApp"
      leading={<WhatsappLogoIcon color={colors.onAccent} size={22} weight="fill" />}
      onPress={openAgendaWhatsApp}
      variant="accent"
    />
  );
}
