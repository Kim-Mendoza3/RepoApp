import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import { useColors } from '@/context/theme-context';
import { dayKey, MONTHS } from '@/features/agenda/agenda-data';
import { pressedStyle, textStyles } from '@/theme/common-styles';
import { fonts } from '@/theme/fonts';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type MonthCalendarProps = {
  /** Cualquier fecha del mes que se muestra. */
  month: Date;
  onChangeMonth: (month: Date) => void;
  /** Día elegido, como "2026-11-26". */
  selected: string | null;
  onSelect: (day: string) => void;
  /** Colores de los puntitos de cada día con taller: { "2026-11-26": ["#087F68", ...] }. */
  marks?: Record<string, string[]>;
  /** Días anteriores a este no se pueden tocar (p. ej. al agendar, no se agenda en el pasado). */
  minDay?: string;
};

/** Calendario de un mes, la semana empieza en lunes. Los días con taller llevan puntitos de color. */
export function MonthCalendar({ month, onChangeMonth, selected, onSelect, marks = {}, minDay }: MonthCalendarProps) {
  const colors = useColors();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const today = dayKey(new Date());
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // lunes = 0
  const cells: (number | null)[] = [...Array.from({ length: leading }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const minMonth = minDay ? new Date(Number(minDay.slice(0, 4)), Number(minDay.slice(5, 7)) - 1, 1) : null;
  const canGoBack = !minMonth || new Date(year, monthIndex, 1) > minMonth;
  const shift = (delta: number) => onChangeMonth(new Date(year, monthIndex + delta, 1));

  return (
    <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Mes anterior"
          accessibilityRole="button"
          disabled={!canGoBack}
          hitSlop={8}
          onPress={() => shift(-1)}
          style={({ pressed }) => [styles.arrow, { borderColor: colors.line, opacity: canGoBack ? 1 : 0.3 }, pressed && pressedStyle]}
        >
          <CaretLeftIcon color={colors.text} size={18} weight="bold" />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.monthTitle, { color: colors.text }]}>
          {`${MONTHS[monthIndex].charAt(0).toUpperCase()}${MONTHS[monthIndex].slice(1)} ${year}`}
        </Text>
        <Pressable
          accessibilityLabel="Mes siguiente"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => shift(1)}
          style={({ pressed }) => [styles.arrow, { borderColor: colors.line }, pressed && pressedStyle]}
        >
          <CaretRightIcon color={colors.text} size={18} weight="bold" />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((label, i) => (
          <Text key={i} style={[textStyles.label, styles.weekday, { color: colors.muted }]}>{label}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={styles.row}>
          {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const key = dayKey(new Date(year, monthIndex, day));
            const dots = marks[key] ?? [];
            const isSelected = key === selected;
            const isToday = key === today;
            const disabled = Boolean(minDay && key < minDay);
            return (
              <Pressable
                accessibilityLabel={`${day} de ${MONTHS[monthIndex]}${dots.length ? `, ${dots.length} ${dots.length === 1 ? 'taller' : 'talleres'}` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                disabled={disabled}
                key={i}
                onPress={() => onSelect(key)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && !isSelected && { borderColor: colors.accent, borderWidth: 1.5 },
                    isSelected && { backgroundColor: colors.accent },
                    !isSelected && dots.length > 0 && { backgroundColor: colors.soft },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? colors.onAccent : colors.text, opacity: disabled ? 0.3 : 1 },
                      dots.length > 0 && styles.dayTextMarked,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dots.slice(0, 3).map((color, d) => <View key={d} style={[styles.dot, { backgroundColor: color }]} />)}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 20, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  arrow: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontFamily: fonts.display, fontSize: 18 },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3, minHeight: 46 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.body, fontSize: 14 },
  dayTextMarked: { fontFamily: fonts.bodySemi },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
