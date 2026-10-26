import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import type { Palette } from '../theme';

// Adapted from Projects/UI's native Button contract. Uses native styles instead
// of importing the catalog's NativeWind dependency and hardcoded color classes.
export function Action({ theme, label, onPress, icon, variant = 'primary', disabled = false }: {
  theme: Palette; label: string; onPress: () => void; icon?: ReactNode;
  variant?: 'primary' | 'soft'; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ backgroundColor: variant === 'primary' ? theme.accent : theme.raised, borderRadius: 12, minHeight: 49, paddingHorizontal: 18, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.45 : pressed ? 0.8 : 1 })}>
    <Text style={{ color: variant === 'primary' ? theme.onAccent : theme.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>{icon}
  </Pressable>;
}
