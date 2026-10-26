export type Palette = {
  id: string; name: string; description: string;
  background: string; surface: string; raised: string; line: string;
  text: string; muted: string; accent: string; onAccent: string;
};

// Original colors; semantic roles follow the user's UI library token pattern.
// All themes are dark, independently of the device appearance setting.
export const DEFAULT_THEME_ID = 'volt';

export const palettes: Palette[] = [
  { id: 'chalk', name: 'Chalk', description: 'Pure charcoal + soft white', background: '#0E0E0F', surface: '#1A1A1C', raised: '#29292C', line: '#404045', text: '#F5F5F4', muted: '#ADADB3', accent: '#E9E9E7', onAccent: '#19191B' },
  { id: 'volt', name: 'Volt', description: 'Charcoal + electric lime', background: '#0C0F0D', surface: '#171C18', raised: '#232B25', line: '#323E35', text: '#F2F5EF', muted: '#A2AEA4', accent: '#D4FF63', onAccent: '#182108' },
  { id: 'cobalt', name: 'Cobalt', description: 'Deep navy + electric blue', background: '#0C101C', surface: '#161E32', raised: '#222E46', line: '#354664', text: '#EFF3FF', muted: '#A4B2CE', accent: '#8CAAFF', onAccent: '#101F47' },
  { id: 'amber', name: 'Amber', description: 'Carbon + warm orange', background: '#13100E', surface: '#211A16', raised: '#30261F', line: '#4A3B31', text: '#FAF1E9', muted: '#BBA99C', accent: '#FFB17A', onAccent: '#351C0C' },
  { id: 'solar', name: 'Solar', description: 'Warm graphite + gold', background: '#13120C', surface: '#222015', raised: '#322F20', line: '#4C4730', text: '#FAF6E8', muted: '#BDB69B', accent: '#FFD76A', onAccent: '#322608' },
];

export function resolveThemeId(saved: string | null) {
  const id = saved === 'ember' ? 'amber' : saved;
  return palettes.some(theme => theme.id === id) ? id! : DEFAULT_THEME_ID;
}
