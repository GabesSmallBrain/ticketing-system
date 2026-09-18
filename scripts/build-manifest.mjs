import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const files = ['public.css', 'public.js', 'home.css', 'mobile-nav.css'];
const hashes = Object.fromEntries(await Promise.all(files.map(async (name) => {
  const content = await readFile(new URL(`../dist/web/${name}`, import.meta.url));
  return [name, createHash('sha256').update(content).digest('hex')];
})));
const build = createHash('sha256').update(JSON.stringify(hashes)).digest('hex').slice(0, 16);
await writeFile(new URL('../dist/deployment-manifest.json', import.meta.url), `${JSON.stringify({ build, builtAt: new Date().toISOString(), startup: 'npm run start', staticAssets: hashes }, null, 2)}\n`);
