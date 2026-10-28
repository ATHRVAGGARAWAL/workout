import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { Play, Timer, X } from 'lucide-react-native';
import { useAppTheme } from '../ThemeProvider';
import type { WorkoutSession } from '../data/types';
import { durationSeconds, formatDuration } from '../data/workout';
import { IconButton, u } from './ui';

function useCurrentTime() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    const listener = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(interval); listener.remove(); };
  }, []);
  return now;
}

export function WorkoutClock({ active }: { active: WorkoutSession }) {
  const { theme: t } = useAppTheme();
  const now = useCurrentTime();
  return <Text style={{ color: t.accent, fontSize: 23, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatDuration(durationSeconds(active, now))}</Text>;
}

export function RestTimerControl({ restEndsAt, defaultSeconds, onOptions, onToggle }: { restEndsAt: number | null; defaultSeconds: number; onOptions: () => void; onToggle: (resting: boolean) => void }) {
  const { theme: t } = useAppTheme();
  const now = useCurrentTime();
  const rest = Math.max(0, Math.ceil(((restEndsAt ?? 0) - now) / 1000));
  return <View style={u.row}>
    <Pressable accessibilityRole="button" accessibilityLabel="Rest timer options" onPress={onOptions} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
      <Timer size={19} color={t.accent} />
      <Text style={{ color: t.text, fontSize: 12 }}>{rest > 0 ? 'Rest timer' : 'Rest between sets'}</Text>
      <Text style={{ color: t.accent, fontWeight: '700', fontSize: 20, marginLeft: 'auto', fontVariant: ['tabular-nums'] }}>{formatDuration(rest > 0 ? rest : defaultSeconds)}</Text>
    </Pressable>
    <IconButton label={rest > 0 ? 'Skip rest' : 'Start rest'} onPress={() => onToggle(rest > 0)}>{rest > 0 ? <X size={17} color={t.text} /> : <Play size={17} color={t.text} />}</IconButton>
  </View>;
}
