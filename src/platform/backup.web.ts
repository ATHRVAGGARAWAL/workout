const MAX_BYTES = 20_000_000;
export async function exportBackup(text: string): Promise<void> {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `workout-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export function pickBackup(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json'; input.style.display = 'none';
    let settled = false;
    const finish = (text: string | null, error?: unknown) => {
      if (settled) return; settled = true; input.remove();
      if (error) reject(error); else resolve(text);
    };
    input.addEventListener('cancel', () => finish(null), { once: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) { finish(null); return; }
      if (file.size > MAX_BYTES) { finish(null, new Error('Choose a workout backup smaller than 20 MB.')); return; }
      try { finish(await file.text()); } catch { finish(null, new Error('This file could not be read.')); }
    }, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
