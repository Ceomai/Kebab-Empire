/* Oyun motorunu Supabase Edge Function'ın kullanabileceği tek dosyaya paketler. */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
let out = '// OTOMATİK ÜRETİLİR: node scripts/build-edge.mjs — elle düzenleme.\nconst window = globalThis;\nglobalThis.window = globalThis;\n';
for (const f of files) out += `\n// ---- js/${f}.js ----\n` + fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8') + '\n';
out += '\nexport const GAME = globalThis.KE;\n';
fs.writeFileSync(path.join(root, 'supabase/functions/verify-day/game.js'), out);
console.log('verify-day/game.js', (out.length / 1024).toFixed(0) + ' KB');
