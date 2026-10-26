import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Moon, X } from 'lucide-react-native';
import { palettes } from '../theme';
import { useAppTheme } from '../ThemeProvider';
import { Action } from './Action';

export function Appearance({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme, select, loaded, storageError } = useAppTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <SafeAreaView style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss appearance" accessibilityRole="button" />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.line }]}>
        <View style={styles.heading}>
          <View style={{ flex: 1 }}><Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Appearance</Text><Text style={[styles.subtitle, { color: theme.muted }]}>Make this space yours.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close appearance" onPress={onClose} style={[styles.close, { backgroundColor: theme.raised }]}><X size={20} color={theme.text} /></Pressable>
        </View>
        <View style={[styles.mode, { backgroundColor: theme.surface }]}><Moon size={17} color={theme.accent} /><Text style={[styles.modeLabel, { color: theme.text }]}>Dark theme</Text><Text style={{ color: theme.muted, fontSize: 12 }}>Always on</Text></View>
        <Text style={[styles.label, { color: theme.muted }]}>COLOR THEME</Text>
        <ScrollView contentContainerStyle={styles.options}>
          {palettes.map(option => {
            const active = theme.id === option.id;
            return <Pressable key={option.id} accessibilityRole="radio" aria-checked={active} accessibilityLabel={`${option.name} theme`} accessibilityState={{ checked: active, disabled: !loaded }} disabled={!loaded} onPress={() => select(option.id)} style={({ pressed }) => [styles.option, { backgroundColor: active ? theme.raised : theme.surface, borderColor: active ? theme.accent : theme.line, opacity: pressed ? 0.8 : 1 }]}>
              <View style={[styles.swatch, { backgroundColor: option.background, borderColor: option.line }]}><View style={[styles.accent, { backgroundColor: option.accent }]} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.name, { color: theme.text }]}>{option.name}</Text><Text style={[styles.description, { color: theme.muted }]}>{option.description}</Text></View>
              <View style={[styles.check, { borderColor: active ? theme.accent : theme.muted, backgroundColor: active ? theme.accent : 'transparent' }]}>{active && <Check size={13} color={theme.onAccent} strokeWidth={3} />}</View>
            </Pressable>;
          })}
        </ScrollView>
        <Text accessibilityLiveRegion="polite" style={[styles.saved, { color: storageError ? '#FFB17A' : theme.muted }]}>{storageError ? 'Could not save your choice. Tap a theme to retry.' : 'Applied instantly. Remembered on this device.'}</Text>
        <Action theme={theme} label="Done" onPress={onClose} />
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 440, maxHeight: '100%', padding: 20, borderRadius: 24, borderWidth: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 }, title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 }, subtitle: { fontSize: 13, marginTop: 5 }, close: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mode: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 12 }, modeLabel: { fontSize: 13, fontWeight: '600', flex: 1 }, label: { fontSize: 10, letterSpacing: 1.5, marginTop: 23, marginBottom: 12 },
  options: { gap: 8 }, option: { minHeight: 70, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 13 }, swatch: { width: 36, height: 39, borderWidth: 1, borderRadius: 9, padding: 5, justifyContent: 'flex-end' }, accent: { height: 10, borderRadius: 3 }, name: { fontSize: 14, fontWeight: '600' }, description: { fontSize: 10, marginTop: 4 }, check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, saved: { fontSize: 11, textAlign: 'center', marginVertical: 17, lineHeight: 17 },
});
