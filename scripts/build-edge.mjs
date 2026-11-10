/* Oyun motorunu Supabase Edge Function'ın kullanabileceği tek dosyaya paketler. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(import.meta.dirname, '..');
export const EDGE_FILES = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
export const EDGE_OUT = path.join(root, 'supabase/functions/verify-day/game.js');
/** Paket metnini bellekte üretir (dosyaya yazmaz); testler güncelliği bununla karşılaştırır. */
export function buildEdgeBundle() {
  let out = '// OTOMATİK ÜRETİLİR: node scripts/build-edge.mjs — elle düzenleme.\nconst window = globalThis;\nglobalThis.window = globalThis;\n';
  for (const f of EDGE_FILES) out += `\n// ---- js/${f}.js ----\n` + fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8') + '\n';
  out += '\nexport const GAME = globalThis.KE;\n';
  return out;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = buildEdgeBundle();
  fs.writeFileSync(EDGE_OUT, out);
  console.log('verify-day/game.js', (out.length / 1024).toFixed(0) + ' KB');
}
