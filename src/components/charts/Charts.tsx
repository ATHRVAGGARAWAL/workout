import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../../ThemeProvider';
import { formatNumber, type ActivityDay } from '../../data/analytics';

export type ChartPoint = { key: string; label: string; value: number };
export function LineChart({ points, unit, label }: { points: ChartPoint[]; unit: string; label: string }) {
  const { theme: t } = useAppTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = points.find(point => point.key === selectedKey) ?? points[points.length - 1];
  const geometry = useMemo(() => {
    if (!points.length) return null;
    const values = points.map(point => point.value), low = Math.min(...values), high = Math.max(...values);
    const spread = high - low || Math.max(high * 0.15, 1), min = Math.max(0, low - spread * 0.15), max = high + spread * 0.15;
    const plot = points.map((point, i) => ({ ...point, x: points.length === 1 ? 172 : 43 + i * 279 / (points.length - 1), y: 156 - (point.value - min) / (max - min) * 126 }));
    return { plot, min, max, d: plot.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ') };
  }, [points]);
  if (!geometry || !selected) return <View style={{ paddingVertical: 30, gap: 8 }}><Text style={{ color: t.muted, textAlign: 'center', fontSize: 13 }}>Your first entry starts this chart.</Text></View>;
  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}><View><Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.8 }}>{formatNumber(selected.value)} <Text style={{ color: t.muted, fontSize: 13 }}>{unit}</Text></Text><Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>{selected.label}</Text></View><Text style={{ color: t.muted, fontSize: 10, flexShrink: 1, textAlign: 'right' }}>{label}</Text></View>
    <Svg viewBox="0 0 340 190" width="100%" height={190} accessible={Platform.OS === 'web' ? undefined : true} accessibilityLabel={`${label}. ${points.map(p => `${p.label}: ${formatNumber(p.value)} ${unit}`).join('. ')}`}>
      {[0, 0.5, 1].map(fraction => { const y = 156 - fraction * 126; return <ViewlessGrid key={fraction} y={y} value={geometry.min + (geometry.max - geometry.min) * fraction} color={t.line} textColor={t.muted} />; })}
      {geometry.plot.length > 1 && <Path d={`${geometry.d} L${geometry.plot[geometry.plot.length - 1].x},156 L${geometry.plot[0].x},156 Z`} fill={t.accent + '0D'} />}
      <Path d={geometry.d} fill="none" stroke={t.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {geometry.plot.map(point => <Circle key={point.key} cx={point.x} cy={point.y} r={point.key === selected.key ? 5 : 3.5} fill={point.key === selected.key ? t.accent : t.surface} stroke={t.accent} strokeWidth={2} {...(Platform.OS === 'web' ? {onClick: () => setSelectedKey(point.key)} : {onPress: () => setSelectedKey(point.key)})} />)}
      <SvgText x={43} y={180} fill={t.muted} fontSize={9}>{points[0].label}</SvgText><SvgText x={322} y={180} textAnchor="end" fill={t.muted} fontSize={9}>{points[points.length - 1].label}</SvgText>
    </Svg>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{points.slice(-8).map(point => <Pressable key={point.key} accessibilityRole="button" accessibilityLabel={`${point.label}, ${formatNumber(point.value)} ${unit}`} accessibilityState={{ selected: point.key === selected.key }} onPress={() => setSelectedKey(point.key)} style={{ backgroundColor: point.key === selected.key ? t.raised : 'transparent', borderColor: point.key === selected.key ? t.line : 'transparent', borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 9 }}><Text style={{ color: point.key === selected.key ? t.text : t.muted, fontSize: 10 }}>{point.label}</Text></Pressable>)}</View>
  </View>;
}
function ViewlessGrid({ y, value, color, textColor }: { y: number; value: number; color: string; textColor: string }) { return <><Line x1={43} x2={322} y1={y} y2={y} stroke={color} strokeDasharray="3 5" /><SvgText x={34} y={y + 3} textAnchor="end" fill={textColor} fontSize={9}>{value >= 10000 ? `${Math.round(value / 1000)}k` : formatNumber(value, value >= 100 ? 0 : 1)}</SvgText></>; }

export function GoalRing({ value, goal }: { value: number; goal: number }) {
  const { theme: t } = useAppTheme(), size = 92, radius = 37, circumference = 2 * Math.PI * radius;
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: goal, now: Math.min(value, goal), text: `${value} of ${goal} training days` }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={{ position: 'absolute' }}><Circle cx={46} cy={46} r={radius} stroke={t.raised} strokeWidth={7} fill="none" /><Circle cx={46} cy={46} r={radius} stroke={t.accent} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - Math.min(value / Math.max(goal, 1), 1))} transform="rotate(-90 46 46)" /></Svg>
    <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>{value}<Text style={{ color: t.muted, fontSize: 13 }}>/{goal}</Text></Text><Text style={{ color: t.muted, fontSize: 9, marginTop: 3 }}>DAYS</Text>
  </View>;
}

export function Heatmap({ days, selected, onSelect }: { days: ActivityDay[]; selected: string | null; onSelect: (key: string) => void }) {
  const { theme: t } = useAppTheme();
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', gap: 6 }}><View style={{ width: 22, gap: 5, paddingTop: 20 }}>{['M', '', 'W', '', 'F', '', 'S'].map((day, i) => <Text key={i} style={{ height: 18, fontSize: 9, color: t.muted, textAlign: 'center' }}>{day}</Text>)}</View><View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>{weeks.map((week, index) => <View key={week[0].key} style={{ flex: 1, gap: 5 }}><Text numberOfLines={1} style={{ height: 15, color: t.muted, fontSize: 8 }}>{index === 0 || week[0].key.slice(0, 7) !== weeks[index - 1][0].key.slice(0, 7) ? new Date(`${week[0].key}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }) : ''}</Text>{week.map(day => <Pressable key={day.key} accessibilityRole="button" accessibilityLabel={`${day.key}: ${day.count} workout${day.count === 1 ? '' : 's'}`} accessibilityState={{ selected: selected === day.key, disabled: day.future }} disabled={day.future} onPress={() => onSelect(day.key)} style={{ height: 18, borderRadius: 4, borderWidth: 1, borderColor: selected === day.key ? t.text : day.future ? t.line : 'transparent', backgroundColor: day.count ? t.accent : t.raised, opacity: day.future ? 0.18 : day.count === 1 ? 0.55 : 1 }} />)}</View>)}</View></View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: t.muted, fontSize: 10 }}>Tap a day to see your training</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text style={{ color: t.muted, fontSize: 9 }}>Less</Text>{[0, 0.55, 1].map(value => <View key={value} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: value ? t.accent : t.raised, opacity: value || 1 }} />)}<Text style={{ color: t.muted, fontSize: 9 }}>More</Text></View></View>
  </View>;
}
