// Renders PWA PNG icons from the brand mark using headless Chromium (Playwright).
// Usage: node scripts/generate-icons.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const mark = (size, { padding = 0, radius = 0.25 } = {}) => {
  const inner = size - padding * 2;
  return `<!doctype html><html><body style="margin:0;background:transparent">
  <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${padding ? '#5969E8' : 'transparent'}">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${inner}" height="${inner}">
      <rect width="64" height="64" rx="${padding ? 0 : 64 * radius}" fill="#5969E8"/>
      <path d="M20 18h22v6H27v5h13v6H27v5h15v6H20z" fill="#fff"/>
      <circle cx="48" cy="44" r="5" fill="#16B8A6"/>
    </svg>
  </div></body></html>`;
};

const icons = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  // Maskable icons need the artwork inside the central 80% safe zone on a full-bleed background.
  { file: 'pwa-maskable-512.png', size: 512, padding: 64 },
  { file: 'apple-touch-icon.png', size: 180, padding: 18 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, padding } of icons) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(mark(size, { padding }));
  await page.screenshot({ path: out(file), omitBackground: !padding, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', file);
}
await browser.close();
