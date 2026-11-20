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

/**
 * Deja solo números y agrega la lada de México para WhatsApp.
 * Ojo: WhatsApp identifica los celulares mexicanos como 52 + 1 + 10 dígitos (el "1" antiguo).
 * Con solo "52" a veces dice que el número "no está en WhatsApp" aunque sí lo esté.
 */
export function normalizePhone(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `521${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `521${digits.slice(2)}`;
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

// ---------- HISTORIAL (solo administradores) ----------

/** Meses que se guarda el teléfono del contacto después del taller (luego se borra). */
export const CONTACT_RETENTION_MONTHS = 3;

/** Todos los talleres de un año (agendados, realizados y cancelados), del más reciente al más antiguo. */
export async function fetchYear(year: number): Promise<Activity[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('institutional_activities')
    .select('*')
    .gte('starts_at', new Date(year, 0, 1).toISOString())
    .lt('starts_at', new Date(year + 1, 0, 1).toISOString())
    .order('starts_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Un taller cuenta como REALIZADO cuando ya pasó su fecha y no se canceló (no hay que marcarlo a mano). */
export function isDone(activity: Pick<Activity, 'starts_at' | 'status'>, now: Date) {
  return activity.status !== 'cancelled' && new Date(activity.starts_at) < now;
}

export async function setActivityStatus(id: string, status: Activity['status']) {
  if (!supabase) return;
  const { error } = await supabase.from('institutional_activities').update({ status }).eq('id', id);
  if (error) throw error;
}

/**
 * Privacidad: borra el teléfono del contacto de los talleres que pasaron hace más de
 * CONTACT_RETENTION_MONTHS meses. El resto del historial se conserva. Se ejecuta cada vez
 * que un administrador abre el historial.
 */
export async function purgeOldContactPhones() {
  if (!supabase) return;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - CONTACT_RETENTION_MONTHS);
  await supabase
    .from('institutional_activities')
    .update({ contact_phone: null })
    .lt('starts_at', cutoff.toISOString())
    .not('contact_phone', 'is', null);
}
