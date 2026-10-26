import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { useAppTheme } from '../../ThemeProvider';
import { MUSCLE_LABELS } from '../../data/catalog';
import type { MuscleGroup } from '../../data/types';
import type { MuscleWork } from '../../data/analytics';

// Original schematic paths, mirrored around the body axis. Regions convey logged
// movement attribution, not a medical anatomy model or physiological recovery.
const front: { muscle: MuscleGroup; paths: string[] }[] = [
  { muscle: 'chest', paths: ['M89 64 C80 59 66 58 61 64 L60 80 C67 88 81 87 89 80 Z', 'M93 64 C103 59 116 58 121 64 L122 80 C115 88 101 87 93 80 Z'] },
  { muscle: 'shoulders', paths: ['M58 58 C46 58 42 69 42 80 L55 84 60 69 Z', 'M124 58 C136 58 140 69 140 80 L127 84 122 69 Z'] },
  { muscle: 'biceps', paths: ['M43 84 L54 88 51 116 Q43 122 36 113 Z', 'M139 84 L128 88 131 116 Q139 122 146 113 Z'] },
  { muscle: 'forearms', paths: ['M35 119 L48 123 38 151 32 164 23 159 Z', 'M147 119 L134 123 144 151 150 164 159 159 Z'] },
  { muscle: 'abs', paths: ['M80 91 L89 90 89 106 79 106 Z', 'M94 90 L104 91 105 106 94 106 Z', 'M79 111 L89 111 89 127 78 126 Z', 'M94 111 L105 111 106 126 94 127 Z', 'M79 131 L89 132 89 150 Q83 147 79 142 Z', 'M94 132 L106 131 105 142 Q100 147 94 150 Z', 'M64 87 L74 92 72 135 66 129 Z', 'M118 87 L108 92 110 135 116 129 Z'] },
  { muscle: 'quads', paths: ['M64 152 C69 145 82 151 87 159 L82 209 73 219 61 208 58 172 Z', 'M118 152 C113 145 100 151 95 159 L100 209 109 219 121 208 124 172 Z'] },
  { muscle: 'calves', paths: ['M62 228 L77 232 74 258 68 278 58 278 56 253 Z', 'M120 228 L105 232 108 258 114 278 124 278 126 253 Z'] },
];
const back: { muscle: MuscleGroup; paths: string[] }[] = [
  { muscle: 'back', paths: ['M82 47 L89 47 89 79 77 91 64 79 65 61 Z', 'M94 47 L101 47 117 61 118 79 106 91 94 79 Z', 'M62 85 L77 98 88 87 87 124 76 139 68 126 Z', 'M120 85 L105 98 95 87 96 124 107 139 114 126 Z', 'M84 129 L90 123 90 149 80 145 Z', 'M99 129 L93 123 93 149 103 145 Z'] },
  { muscle: 'shoulders', paths: ['M58 57 C46 58 42 70 43 80 L55 84 61 68 Z', 'M124 57 C136 58 140 70 139 80 L127 84 121 68 Z'] },
  { muscle: 'triceps', paths: ['M43 84 L55 88 51 117 42 121 35 113 Z', 'M139 84 L127 88 131 117 140 121 147 113 Z'] },
  { muscle: 'forearms', paths: ['M35 122 L47 127 37 153 31 165 23 159 Z', 'M147 122 L135 127 145 153 151 165 159 159 Z'] },
  { muscle: 'glutes', paths: ['M65 147 Q80 139 89 153 L89 172 Q73 183 61 168 Z', 'M118 147 Q104 139 94 153 L94 172 Q110 183 122 168 Z'] },
  { muscle: 'hamstrings', paths: ['M60 177 Q74 189 87 180 L81 213 71 222 61 214 Z', 'M122 177 Q108 189 95 180 L101 213 111 222 121 214 Z'] },
  { muscle: 'calves', paths: ['M62 229 Q70 223 78 230 L76 252 68 268 60 255 Z', 'M120 229 Q112 223 104 230 L106 252 114 268 122 255 Z'] },
];
const silhouette = 'M81 42 L80 51 C68 53 61 53 52 57 C39 62 38 77 37 89 L28 117 18 154 20 173 29 180 34 171 39 154 52 124 59 101 64 129 58 153 54 184 56 213 58 222 52 251 55 279 51 297 Q60 303 70 297 L74 275 82 253 84 227 90 191 93 191 99 227 101 253 109 275 113 297 Q123 303 131 297 L127 279 130 251 124 222 126 213 128 184 124 153 118 129 123 101 130 124 143 154 148 171 153 180 162 173 164 154 154 117 145 89 C144 77 143 62 130 57 C121 53 114 53 102 51 L101 42 Z';
export function MuscleMap({ work, selected, onSelect }: { work: MuscleWork[]; selected: MuscleGroup | null; onSelect: (muscle: MuscleGroup) => void }) {
  const { theme: t } = useAppTheme();
  const [side, setSide] = useState<'front' | 'back' | 'both'>('both');
  function fill(muscle: MuscleGroup) { const row = work.find(item => item.muscle === muscle); return row && row.direct > 0 ? t.accent : t.raised; }
  function opacity(muscle: MuscleGroup) { const direct = work.find(item => item.muscle === muscle)?.direct ?? 0; return direct >= 10 ? 1 : direct >= 6 ? 0.75 : direct >= 3 ? 0.5 : direct > 0 ? 0.3 : 1; }
  function drawing(which: 'front' | 'back') { return <View key={which} style={{ flex: 1, alignItems: 'center' }}><Svg viewBox="0 0 182 316" width="100%" height={side === 'both' ? 290 : 345}>
    <Path d={silhouette} fill={t.raised + '80'} stroke={t.line} strokeWidth={1} />
    <Ellipse cx={91} cy={25} rx={16} ry={22} fill={t.raised} stroke={t.line} strokeWidth={1} />
    <Path d="M83 45 L99 45 101 53 81 53 Z" fill={t.raised} />
    {(which === 'front' ? front : back).map(region => { const row = work.find(item => item.muscle === region.muscle); const assistingOnly = !row?.direct && !!row?.assisting; return <G key={region.muscle} {...{onClick: Platform.OS === 'web' ? () => onSelect(region.muscle) : undefined, onPress: Platform.OS !== 'web' ? () => onSelect(region.muscle) : undefined}} accessible={Platform.OS === 'web' ? undefined : true} accessibilityRole={Platform.OS === 'web' ? undefined : 'button'} accessibilityLabel={`${MUSCLE_LABELS[region.muscle]}: ${row?.direct ?? 0} direct sets, ${row?.assisting ?? 0} assisting sets`}>
      {region.paths.map((path, index) => <Path key={index} d={path} fill={fill(region.muscle)} fillOpacity={opacity(region.muscle)} stroke={selected === region.muscle ? t.text : assistingOnly ? t.accent : t.line} strokeWidth={selected === region.muscle ? 2 : 1} strokeDasharray={assistingOnly ? '2 2' : undefined} strokeLinejoin="round" />)}
    </G>; })}
    {which === 'front' && <Circle cx={91} cy={132} r={1.5} fill={t.line} />}
  </Svg><Text style={{ color: t.muted, fontSize: 9, letterSpacing: 2 }}>{which.toUpperCase()}</Text></View>; }
  return <View style={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 5, padding: 4, borderRadius: 11, backgroundColor: t.raised, alignSelf: 'center' }}>{(['both', 'front', 'back'] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: side === item }} onPress={() => setSide(item)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: side === item ? t.surface : 'transparent' }}><Text style={{ color: side === item ? t.text : t.muted, fontSize: 11, fontWeight: '600' }}>{item === 'both' ? 'Overview' : item === 'front' ? 'Front' : 'Back'}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', gap: 3 }}>{side !== 'back' && drawing('front')}{side !== 'front' && drawing('back')}</View>
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 13, flexWrap: 'wrap' }}>{[['1–2', 0.3], ['3–5', 0.5], ['6–9', 0.75], ['10+', 1]].map(([label, alpha]) => <View key={label} style={{ alignItems: 'center', gap: 5 }}><View style={{ width: 28, height: 7, borderRadius: 3, backgroundColor: t.accent, opacity: Number(alpha) }} /><Text style={{ color: t.muted, fontSize: 9 }}>{label}</Text></View>)}</View>
    <Text style={{ color: t.muted, fontSize: 10, textAlign: 'center', lineHeight: 16 }}>Completed direct sets · outlined regions assisted{ '\n' }Tap a region or choose a muscle below.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{work.map(row => <Pressable key={row.muscle} accessibilityRole="button" accessibilityLabel={`${MUSCLE_LABELS[row.muscle]}, ${row.direct} direct, ${row.assisting} assisting sets`} accessibilityState={{ selected: selected === row.muscle }} onPress={() => onSelect(row.muscle)} style={{ paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: selected === row.muscle ? t.accent : t.line, backgroundColor: selected === row.muscle ? t.accent + '12' : t.raised }}><Text style={{ color: selected === row.muscle ? t.accent : t.muted, fontSize: 10 }}>{MUSCLE_LABELS[row.muscle]} <Text style={{ fontWeight: '700' }}>{row.direct}</Text></Text></Pressable>)}</View>
  </View>;
}
