import { Alert, Linking } from 'react-native';

import { catalog } from '@/data/workshops';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

// DATOS DE LA AGENDA DE TALLERES
// - Público: solo día + talleres (función agenda_public).
// - Con código: datos completos de UN taller (función agenda_by_code).
// - Administradores: la tabla completa (las políticas RLS de Supabase lo permiten solo al staff).

export type Activity = Database['public']['Tables']['institutional_activities']['Row'];
export type CodeResult = Database['public']['Functions']['agenda_by_code']['Returns'][number];
export type PublicDay = { day: string; workshopKeys: string[] };

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-11-26" de una fecha, en la hora del celular. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** "Jueves 26 de noviembre" */
export function formatLongDate(date: Date) {
  const text = `${DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "10:00 a. m." */
export function formatTime(date: Date) {
  const hours = date.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}

/** "10:00 a. m. – 12:00 p. m." (o solo la hora de inicio). */
export function formatTimeRange(startsAt: string, endsAt: string | null) {
  const start = formatTime(new Date(startsAt));
  return endsAt ? `${start} – ${formatTime(new Date(endsAt))}` : start;
}

/** Nombre y color de cada taller del catálogo, por su id. */
export function workshopInfo(key: string) {
  const workshop = catalog.find((item) => item.id === key);
  return { title: workshop?.title ?? 'Taller', accent: workshop?.accent ?? '#0E7490' };
}

export function workshopTitles(keys: string[]) {
  return keys.map((key) => workshopInfo(key).title).join(', ');
}

/** Primer y último día de un mes (para consultar la agenda). */
export function monthRange(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { from, to };
}

export async function fetchPublicAgenda(month: Date): Promise<PublicDay[]> {
  if (!supabase) return [];
  const { from, to } = monthRange(month);
  const { data, error } = await supabase.rpc('agenda_public', { p_from: dayKey(from), p_to: dayKey(to) });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, workshopKeys: row.workshop_keys }));
}

/** Solo administradores: actividades completas del mes (las canceladas no se muestran). */
export async function fetchStaffAgenda(month: Date): Promise<Activity[]> {
  if (!supabase) return [];
  const { from, to } = monthRange(month);
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const { data, error } = await supabase
    .from('institutional_activities')
    .select('*')
    .gte('starts_at', from.toISOString())
    .lt('starts_at', end.toISOString())
    .eq('status', 'scheduled')
    .order('starts_at');
  if (error) throw error;
  return data ?? [];
}

/** Solo administradores: los próximos talleres agendados, del más cercano al más lejano. */
export async function fetchUpcoming(): Promise<Activity[]> {
  if (!supabase) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('institutional_activities')
    .select('*')
    .gte('starts_at', today.toISOString())
    .eq('status', 'scheduled')
    .order('starts_at')
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function findByCode(code: string): Promise<CodeResult | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('agenda_by_code', { p_code: code });
  if (error) throw error;
  return data?.[0] ?? null;
}

/** Deja solo números y agrega la lada de México (52) si son 10 dígitos. */
export function normalizePhone(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  return digits.length >= 11 ? digits : '';
}

/** Mensaje de confirmación que el administrador manda al cliente. */
export function confirmationMessage(activity: Pick<Activity, 'code' | 'starts_at' | 'ends_at' | 'location' | 'workshop_keys' | 'student_count'>) {
  const lines = [
    '¡Hola! 👋 Su taller con deDivulgadores quedó agendado:',
    '',
    `🔬 ${workshopTitles(activity.workshop_keys)}`,
    `📅 ${formatLongDate(new Date(activity.starts_at))}`,
    `⏰ ${formatTimeRange(activity.starts_at, activity.ends_at)}`,
    `📍 ${activity.location}`,
  ];
  if (activity.student_count) lines.push(`👥 ${activity.student_count} participantes`);
  lines.push(
    '',
    `🔑 Su código: *${activity.code}*`,
    'Escríbalo en la app deDivulgadores (pestaña Inicio → "¿Tienes un código?") para consultar los datos de su taller.',
  );
  return lines.join('\n');
}

/** Abre WhatsApp con el mensaje listo. Sin teléfono, WhatsApp deja elegir el contacto. */
export async function sendByWhatsApp(phone: string | null, message: string) {
  const number = normalizePhone(phone);
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', 'Revisa que WhatsApp esté instalado e intenta de nuevo.');
  }
}
