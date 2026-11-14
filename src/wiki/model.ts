/**
 * The creator's state: one line of text per field. Also how a state is read back safely from a
 * link or a file, how it is packed into a link, and the number handling the rest relies on.
 * Free of the page: it runs the same in the browser, at build time and in tests.
 */
import { FIELDS, type FieldId } from './fields';

/** Everything the creator knows about a country: every field, as the text that was typed. */
export type Country = Record<FieldId, string>;

/** An empty form. */
export const defaults: Country = Object.freeze(Object.fromEntries(FIELDS.map((f) => [f.id, ''])) as Country);

/** The version of the link's shape. Raise it when a key changes meaning, and keep reading the old ones. */
export const LINK_VERSION = 1;

/**
 * One line of plain text: no control characters, no line breaks, no runs of spaces, cut to
 * length. Angle brackets go too, so nothing typed or loaded can become markup, here or on the wiki.
 */
export function line(value: unknown, max: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, max);
}

/**
 * A country from anything: a link or a file is someone else's input, so every value is checked
 * and cut to length before it is used. Takes the link's short keys or the fields' own names;
 * unknown keys are dropped and missing ones stay empty.
 */
export function clean(value: unknown): Country {
  const v = (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
  const country = { ...defaults };
  for (const f of FIELDS) {
    const text = line(Object.hasOwn(v, f.key) ? v[f.key] : Object.hasOwn(v, f.id) ? v[f.id] : '', f.max);
    country[f.id] = f.kind === 'choice' ? (f.choices?.some((c) => c.value === text) ? text : '') : text;
  }
  return country;
}

/** The country as it goes into the link: short keys, and only the fields that are filled in. */
export function compact(country: Country): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of FIELDS) {
    const text = country[f.id].trim();
    if (text) out[f.key] = text;
  }
  return out;
}

/** True when nothing is filled in. */
export const isEmpty = (country: Country): boolean => FIELDS.every((f) => !country[f.id].trim());

const WORDS: Record<string, number> = { thousand: 1e3, k: 1e3, million: 1e6, m: 1e6, mn: 1e6, billion: 1e9, bn: 1e9, b: 1e9, trillion: 1e12, tn: 1e12, t: 1e12 };

/**
 * The number in what someone typed: "48,200,000", "48 200 000", "48.2 million", "$1.94 trillion".
 * Null when there is no number in it, or more than one.
 */
export function parseNumber(text: string): number | null {
  const found = /^[^\d.-]*(-?\d[\d,\s\u00a0'’]*(?:\.\d+)?|\.\d+)\s*([a-z]+)?[^\d]*$/i.exec(text.trim());
  if (!found) return null;
  const digits = found[1]!.replace(/[,\s\u00a0'’]/g, '');
  const scale = found[2] ? WORDS[found[2].toLowerCase()] : 1;
  const number = Number(digits) * (scale ?? Number.NaN);
  return Number.isFinite(number) ? number : null;
}

/** 48200000 as "48,200,000". Up to `decimals` digits after the point, without trailing zeros. */
export function formatNumber(value: number, decimals = 0): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole = '0', fraction = ''] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const tail = fraction.replace(/0+$/, '');
  return `${value < 0 ? '-' : ''}${grouped}${tail ? `.${tail}` : ''}`;
}

/** A sum of dollars as an encyclopedia writes it: "$512 billion", "$1.94 trillion", "$41,026". */
export function formatMoney(value: number): string {
  const steps: [number, string][] = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
  ];
  for (const [size, word] of steps) {
    if (Math.abs(value) >= size) return `$${formatNumber(Number((value / size).toPrecision(3)), 2)} ${word}`;
  }
  return `$${formatNumber(Math.round(value))}`;
}

/** A count in words a reader can hold: "48.2 million", "512,000". */
export function roundly(value: number): string {
  if (Math.abs(value) >= 1e9) return `${formatNumber(Number((value / 1e9).toPrecision(3)), 2)} billion`;
  if (Math.abs(value) >= 1e6) return `${formatNumber(Number((value / 1e6).toPrecision(3)), 2)} million`;
  return formatNumber(Math.round(value));
}
