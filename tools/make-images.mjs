// Makes the pictures that aren't drawn by hand, with the Chrome on this machine: the favicon,
// the home-screen icons and the sharing image. Run it after changing the logo or the sharing
// image, and commit what it writes to public/:  npm run images
import { makeImages, sharingImage } from '@eurth/style/images';
import { createServer } from 'vite';
import { site } from '../eurth.config.mjs';

// The picture on the sharing image comes from the same code as the site (Vite reads TypeScript).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { infoboxArt } = await vite.ssrLoadModule('/src/wiki/art.ts');
  const { teland } = await vite.ssrLoadModule('/src/wiki/teland.ts');
  const made = await makeImages({ sharing: [{ file: 'og.png', html: sharingImage({ site, art: infoboxArt(teland) }) }] });
  console.log(`Made ${made.map((file) => `public/${file}`).join(', ')}`);
} finally {
  await vite.close();
}
