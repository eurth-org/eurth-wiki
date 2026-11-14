/**
 * The infobox as a small picture, for the sharing image: a light, bordered box with a title, a
 * flag and a few rows, as a wiki draws it. A picture can't use the stylesheet's custom
 * properties, so the colours are read from the same tokens, as plain values.
 */
import { resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json';
import { preview } from './infobox';
import type { Country } from './model';

const xml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function infoboxArt(country: Country, rows = 7): string {
  const c = resolveColors(tokens, 'light');
  const box = preview(country);
  const list = box.rows.filter((row) => !row.sub).slice(0, rows);
  const sans = xml(tokens.type.families.sans);
  const height = 250 + list.length * 40;
  const lines = list
    .map((row, i) => {
      const y = 232 + i * 40;
      const shown = row.shown.length > 20 ? `${row.shown.slice(0, 19)}…` : row.shown;
      return `<text x="24" y="${y}" font-size="19" font-weight="700" fill="${c.ink}">${xml(row.label.split(' (')[0]!.replace('Capital and largest city', 'Capital'))}</text><text x="186" y="${y}" font-size="19" fill="${c.ink}">${xml(shown)}</text>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 ${height}" width="416" height="${height}" font-family="${sans}" role="img" aria-label="An infobox for ${xml(box.title)}">
<rect x="1" y="1" width="414" height="${height - 2}" rx="2" fill="${c['surface-raised']}" stroke="${c['line-strong']}" stroke-width="2"/>
<text x="208" y="44" text-anchor="middle" font-size="24" font-weight="700" fill="${c.ink}">${xml(box.title)}</text>
<g transform="translate(118 64)"><rect width="180" height="120" fill="${c.paper}"/><rect width="180" height="40" fill="${c['eurth-blue-deep']}"/><rect y="80" width="180" height="40" fill="${c['eurth-blue-deep']}"/><circle cx="90" cy="60" r="13" fill="${c['cat-amber']}"/><rect width="180" height="120" fill="none" stroke="${c['line-strong']}"/></g>
${lines}
</svg>`;
}
