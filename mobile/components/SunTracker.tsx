import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { formatDayDateKey, getDaysInMonth } from '@/lib/storage';

const SUN_SIZE = 280;
const SUN_CENTER = SUN_SIZE / 2;
const INNER_RADIUS = 50;
const RAY_BASE = 35;
const RAY_MIN = 20;
const RAY_MAX = 55;
const GOLD = 'rgb(185, 144, 107)';
const GOLD_LIGHT = 'rgb(212, 176, 140)';

type SunRay = {
  day: number;
  dateKey: string;
  hasEntry: boolean;
  isToday: boolean;
  isFuture: boolean;
  contentLength: number;
};

type SunTrackerProps = {
  dayNotes: Record<string, string>;
  viewingYear: number;
  viewingMonth: number;
  currentYear: number;
  currentMonthIndex: number;
  currentDay: number;
  currentStreak: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export default function SunTracker({
  dayNotes,
  viewingYear,
  viewingMonth,
  currentYear,
  currentMonthIndex,
  currentDay,
  currentStreak,
  onPreviousMonth,
  onNextMonth,
}: SunTrackerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isCurrentMonth = viewingMonth === currentMonthIndex && viewingYear === currentYear;

  const viewingMonthAbbr = new Date(viewingYear, viewingMonth, 1)
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();

  const sunRays = useMemo((): SunRay[] => {
    const daysInMonth = getDaysInMonth(viewingYear, viewingMonth);
    const rays: SunRay[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDayDateKey(viewingYear, viewingMonth, day);
      const content = dayNotes[dateKey] || '';
      rays.push({
        day,
        dateKey,
        hasEntry: content.trim().length > 0,
        isToday: isCurrentMonth && day === currentDay,
        isFuture: isCurrentMonth && day > currentDay,
        contentLength: content.trim().length,
      });
    }
    return rays;
  }, [viewingYear, viewingMonth, currentDay, dayNotes, isCurrentMonth]);

  const maxContentLength = useMemo(
    () => Math.max(...sunRays.map((r) => r.contentLength), 100),
    [sunRays]
  );

  const daysLoggedThisMonth = sunRays.filter((r) => r.hasEntry && !r.isFuture).length;

  const getRayStyle = (ray: SunRay, index: number, total: number) => {
    const angle = (index / total) * 360 - 90;
    let length = RAY_BASE;
    let opacity = 0.3;
    let color = GOLD;
    let glowIntensity = 0;

    if (ray.isFuture) {
      length = RAY_MIN;
      opacity = 0.15;
    } else if (ray.hasEntry) {
      const normalized = Math.min(ray.contentLength / maxContentLength, 1);
      length = RAY_BASE + (RAY_MAX - RAY_BASE) * normalized;
      opacity = 0.8 + normalized * 0.2;
      color = GOLD_LIGHT;
      glowIntensity = 0.3 + normalized * 0.7;
    }

    if (ray.isToday) {
      length = Math.max(length, RAY_MAX);
      glowIntensity = 1;
      color = GOLD_LIGHT;
      opacity = 1;
    }

    return { angle, length, opacity, color, glowIntensity };
  };

  return (
    <View style={[styles.wrap, { backgroundColor: 'transparent' }]}>
      <View style={[styles.row, { backgroundColor: 'transparent' }]}>
        <Pressable
          onPress={onPreviousMonth}
          accessibilityLabel="Previous month"
          style={[styles.navButton, { borderColor: colors.gold + '40', backgroundColor: colors.background + 'CC' }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.gold} />
        </Pressable>

        <View style={[styles.sunWrap, { backgroundColor: 'transparent' }]}>
          <View style={styles.halo} />
          <Svg width={SUN_SIZE} height={SUN_SIZE} style={styles.svg}>
            {sunRays.map((ray, index) => {
              const style = getRayStyle(ray, index, sunRays.length);
              const angleRad = (style.angle * Math.PI) / 180;
              const x1 = SUN_CENTER + Math.cos(angleRad) * INNER_RADIUS;
              const y1 = SUN_CENTER + Math.sin(angleRad) * INNER_RADIUS;
              const x2 = SUN_CENTER + Math.cos(angleRad) * (INNER_RADIUS + style.length);
              const y2 = SUN_CENTER + Math.sin(angleRad) * (INNER_RADIUS + style.length);

              return (
                <Fragment key={ray.day}>
                  {style.glowIntensity > 0 ? (
                    <Line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={style.color}
                      strokeWidth={ray.isToday ? 6 : 4}
                      strokeLinecap="round"
                      opacity={style.glowIntensity * 0.35}
                    />
                  ) : null}
                  <Line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={style.color}
                    strokeWidth={ray.isToday ? 3 : 1.5}
                    strokeLinecap="round"
                    opacity={style.opacity}
                  />
                  {ray.isToday ? (
                    <Circle cx={x2} cy={y2} r={4} fill={GOLD_LIGHT} />
                  ) : null}
                </Fragment>
              );
            })}
          </Svg>

          <View
            style={[
              styles.core,
              {
                backgroundColor: colors.backgroundDark,
                borderColor: colors.gold + '80',
              },
            ]}
          >
            <Text style={[styles.monthAbbr, { color: colors.goldLight }]}>{viewingMonthAbbr}</Text>
            {isCurrentMonth && currentStreak > 0 ? (
              <Text style={[styles.streak, { color: colors.gold }]}>✧ {currentStreak}</Text>
            ) : null}
            {!isCurrentMonth ? (
              <Text style={[styles.yearLabel, { color: colors.gold + '73' }]}>{viewingYear}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          accessibilityLabel="Next month"
          style={[
            styles.navButton,
            {
              borderColor: colors.gold + '40',
              backgroundColor: colors.background + 'CC',
              opacity: isCurrentMonth ? 0.25 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
        </Pressable>
      </View>

      <Text style={[styles.entryCount, { color: colors.gold + '73' }]}>
        {daysLoggedThisMonth} {daysLoggedThisMonth === 1 ? 'entry' : 'entries'} this month
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sunWrap: {
    width: SUN_SIZE,
    height: SUN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: SUN_SIZE,
    height: SUN_SIZE,
    borderRadius: SUN_SIZE / 2,
    backgroundColor: 'rgba(185, 144, 107, 0.06)',
  },
  svg: {
    position: 'absolute',
  },
  core: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthAbbr: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
  },
  streak: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  yearLabel: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  entryCount: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
