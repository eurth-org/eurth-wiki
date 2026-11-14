/**
 * The tool's own logic, free of the page: its state, how a link is read back safely, the
 * written description, and the picture. Everything here runs the same in the browser, at build
 * time and in tests.
 *
 * Replace this with your tool's model. Keep the four habits: defaults, clean(), describe() and
 * a picture that takes its colours from the tokens.
 */
import { resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json';

export interface Plate {
  nation: string;
  motto: string;
  /** 0 (a shrug) to 100 (carved in granite). */
  gravitas: number;
  style: 'plain' | 'grand';
}

export const STYLES = [
  { id: 'plain', name: 'Plain' },
  { id: 'grand', name: 'Grand' },
] as const;

export const defaults: Plate = { nation: '', motto: 'Onwards, mostly', gravitas: 50, style: 'plain' };

/** Plain text, no markup or control characters, cut to length. */
function text(value: unknown, max: number, fallback: string): string {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trimStart().slice(0, max) : fallback;
}

/**
 * A plate from anything: a link is someone else's input, so every value is checked and clamped
 * before it is used. Unknown keys are dropped; missing ones get their defaults.
 */
export function clean(value: unknown): Plate {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const gravitas = typeof v.g === 'number' && Number.isFinite(v.g) ? Math.round(Math.min(100, Math.max(0, v.g))) : defaults.gravitas;
  return {
    nation: text(v.n, 60, defaults.nation),
    motto: text(v.m, 80, defaults.motto),
    gravitas,
    style: v.s === 'grand' ? 'grand' : 'plain',
  };
}

/** The plate as it goes into the link: short keys, and only what differs from the defaults. */
export function compact(plate: Plate): Record<string, unknown> {
  return {
    ...(plate.nation !== defaults.nation && { n: plate.nation }),
    ...(plate.motto !== defaults.motto && { m: plate.motto }),
    ...(plate.gravitas !== defaults.gravitas && { g: plate.gravitas }),
    ...(plate.style !== defaults.style && { s: plate.style }),
  };
}

const weight = (gravitas: number): string => (gravitas < 25 ? 'lightly held' : gravitas < 50 ? 'sincerely meant' : gravitas < 75 ? 'solemnly sworn' : 'carved in granite');

/** The result in words: for screen readers, for "Copy description", for sharing. */
export function describe(plate: Plate): string {
  const whose = plate.nation ? `The motto of ${plate.nation}` : 'A national motto';
  const motto = plate.motto ? `“${plate.motto}”` : 'still to be written';
  return `${whose}: ${motto}. A ${plate.style} plate, ${weight(plate.gravitas)} (gravitas ${plate.gravitas} out of 100).`;
}

const xml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The plate as a picture: an SVG that carries everything it shows, so it can be downloaded,
 * copied and turned into a PNG. Exports can't use the stylesheet's custom properties, so the
 * colours are read from the same tokens, as plain values. 1200 by 630: the link-preview shape.
 */
export function plateSvg(plate: Plate): string {
  const c = resolveColors(tokens, 'dark');
  const grand = plate.style === 'grand';
  const border = 4 + Math.round(plate.gravitas / 10);
  const nation = plate.nation || 'Your nation';
  const motto = plate.motto || '…';
  const size = motto.length > 44 ? 44 : motto.length > 28 ? 58 : 72;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${xml(describe(plate))}">
<rect width="1200" height="630" fill="${c.surface}"/>
<rect x="${40 + border / 2}" y="${40 + border / 2}" width="${1120 - border}" height="${550 - border}" rx="12" fill="${c['surface-raised']}" stroke="${c['accent-fill']}" stroke-width="${border}"/>
${grand ? `<rect x="72" y="72" width="1056" height="486" rx="6" fill="none" stroke="${c['line-strong']}" stroke-width="2"/>` : ''}
<text x="600" y="210" text-anchor="middle" font-family="${xml(tokens.type.families.sans)}" font-size="34" font-weight="700" letter-spacing="${grand ? 6 : 2}" fill="${c['ink-muted']}">${xml(nation.toUpperCase())}</text>
<text x="600" y="350" text-anchor="middle" font-family="${xml(tokens.type.families.sans)}" font-size="${size}" font-weight="700" fill="${c.ink}">${xml(motto)}</text>
<text x="600" y="500" text-anchor="middle" font-family="${xml(tokens.type.families.mono)}" font-size="24" fill="${c['ink-muted']}">gravitas ${plate.gravitas}/100</text>
</svg>`;
}

/** Ready-made plates: the Templates page links each one into the maker. */
export const templates: { id: string; name: string; note: string; plate: Plate }[] = [
  { id: 'steady', name: 'Steady as she goes', note: 'A calm maritime republic that has seen worse.', plate: { nation: 'Port Verity', motto: 'Steady as she goes', gravitas: 62, style: 'plain' } },
  { id: 'granite', name: 'Carved in granite', note: 'An old mountain kingdom, fond of its own echo.', plate: { nation: 'Hohenfels', motto: 'We were here first', gravitas: 96, style: 'grand' } },
  { id: 'shrug', name: 'A national shrug', note: 'A young federation that hasn’t quite decided.', plate: { nation: 'The Loose Isles', motto: 'It seemed a good idea', gravitas: 12, style: 'plain' } },
];

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;

/** A plate out of the hat. */
export function random(): Plate {
  const mottos = ['Onwards, mostly', 'Strength in drizzle', 'Ask us again tomorrow', 'By land, by sea, by committee', 'Never knowingly invaded', 'Unity, more or less'];
  const nations = ['Port Verity', 'Hohenfels', 'The Loose Isles', 'Saint Morrow', 'Upper Brack', 'Vellamere'];
  return { nation: pick(nations), motto: pick(mottos), gravitas: Math.floor(Math.random() * 101), style: pick(STYLES).id };
}
