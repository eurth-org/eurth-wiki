/**
 * From a country to its infobox: the parameters of {{Infobox country}} in order, each with the
 * wikitext that goes to the wiki and the plain words the preview and the description show. One
 * list feeds all three, so the preview can't promise what the wikitext doesn't hold.
 *
 * PROVISIONAL, with fields.ts: the parameter names are Wikipedia's {{Infobox country}}, which
 * the mock-up uses too. Sandbox 7 and a paste into IIWiki have the last word.
 */
import { FIELD, type FieldId } from './fields';
import { formatMoney, formatNumber, parseNumber, roundly, type Country } from './model';

/** One line of the infobox. */
export interface Entry {
  /** The parameter of {{Infobox country}}. */
  param: string;
  /** Its value as wikitext. */
  value: string;
  /** The label of its row in the rendered infobox. */
  label: string;
  /** Its value as the rendered infobox shows it, in plain words. */
  shown: string;
  /** Where the rendered infobox puts it. */
  place: 'title' | 'top' | 'row' | 'subrow' | 'hidden';
  /** The field it comes from, if it comes from one. */
  field?: FieldId;
}

/** The page of the wiki a name points to: no characters a title can't hold. */
export function pageTitle(name: string): string {
  return name
    .replace(/[#<>[\]{}|]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The file name the wiki expects for a nation's flag or arms: "Flag of Teland.svg". */
export function fileName(kind: 'flag' | 'arms' | 'map', nation: string, extension = kind === 'map' ? 'png' : 'svg'): string {
  const name = pageTitle(nation).replace(/[/\\:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name) return '';
  const prefix = kind === 'flag' ? 'Flag of' : kind === 'arms' ? 'Coat of arms of' : 'Map of';
  return `${prefix} ${name}.${extension}`;
}

/** A file name as typed, made fit for the wiki: no "File:" in front, no characters a title can't hold. */
export function tidyFile(name: string): string {
  return pageTitle(name.replace(/^\s*(file|image)\s*:/i, '')).replace(/[/\\:]/g, ' ').replace(/\s+/g, ' ').trim();
}

const balanced = (text: string, open: string, close: string): boolean => {
  let depth = 0;
  for (let i = 0; i < text.length - 1; i++) {
    const two = text.slice(i, i + 2);
    if (two === open) {
      depth++;
      i++;
    } else if (two === close) {
      if (--depth < 0) return false;
      i++;
    }
  }
  return depth === 0;
};

/**
 * Text made safe as the value of a template parameter. A pipe outside a link or a template would
 * end the parameter early, so it becomes {{!}}; braces and brackets that don't pair up would
 * break the template around them, so they are written as character codes. Links and templates
 * that are whole are left as typed: people who know wikitext may use it.
 */
export function wikiValue(text: string): string {
  let value = text.replace(/\s+/g, ' ').trim();
  if (!balanced(value, '{{', '}}')) value = value.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
  if (!balanced(value, '[[', ']]')) value = value.replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
  let out = '';
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    const two = value.slice(i, i + 2);
    if (two === '[[' || two === '{{') {
      depth++;
      out += two;
      i++;
    } else if (two === ']]' || two === '}}') {
      depth--;
      out += two;
      i++;
    } else if (value[i] === '|' && depth === 0) {
      out += '{{!}}';
    } else {
      out += value[i];
    }
  }
  return out;
}

/** A link to the page of that name, unless the text already carries wikitext of its own. */
export function wikiLink(text: string): string {
  const value = text.trim();
  if (!value) return '';
  if (/\[\[|\{\{/.test(value)) return wikiValue(value);
  const title = pageTitle(value);
  return title ? `[[${title}]]` : '';
}

/** What a reader sees of a piece of wikitext: links by their label, no quote marks for bold or italics. */
export function plain(wikitext: string): string {
  return wikitext
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{!\}\}/g, '|')
    .replace(/'{2,}/g, '')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .trim();
}

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== '';

/** The name the page goes by: the common name, or the official one when that is all there is. */
export const nameOf = (c: Country): string => pageTitle(c.common) || pageTitle(c.official);

/**
 * The infobox, line by line and in the infobox's own order. Empty fields leave no line. Two
 * lines are worked out rather than typed: the density, and GDP per head.
 */
export function entries(c: Country): Entry[] {
  const out: Entry[] = [];
  const text = (id: FieldId): string => c[id].trim();
  const add = (param: string, value: string, label: string, shown: string, place: Entry['place'], field?: FieldId) => {
    if (value) out.push({ param, value, label, shown: shown || plain(value), place, ...(field && { field }) });
  };
  const typed = (id: FieldId, label: string, place: Entry['place'] = 'row') => add(FIELD[id].param, FIELD[id].link ? wikiLink(text(id)) : wikiValue(text(id)), label, '', place, id);

  const name = nameOf(c);

  // Names
  add('conventional_long_name', wikiValue(text('official') || text('common')), 'Title', '', 'title', text('official') ? 'official' : 'common');
  typed('common', 'Common name', 'hidden');
  typed('native', 'Name in its own language', 'top');

  // Flag, arms and map: the names the files have on the wiki.
  const flag = tidyFile(text('flagFile')) || fileName('flag', name);
  const arms = tidyFile(text('armsFile')) || fileName('arms', name);
  add('image_flag', flag, 'Flag', flag, 'hidden', 'flagFile');
  add('image_coat', arms, 'Coat of arms', arms, 'hidden', 'armsFile');

  if (text('motto')) add('motto', `"${wikiValue(text('motto')).replace(/^["“”']+|["“”']+$/g, '')}"`, 'Motto', '', 'top', 'motto');
  typed('mottoEnglish', 'Motto in English', 'top');
  if (text('anthem')) add('anthem', `''${wikiValue(text('anthem')).replace(/^'+|'+$/g, '')}''`, 'Anthem', '', 'top', 'anthem');

  const map = tidyFile(text('mapFile'));
  add('image_map', map, 'Map', map, 'hidden', 'mapFile');

  // Capital and people
  const capitalIsLargest = same(c.capital, c.largest);
  add('capital', wikiLink(text('capital')), capitalIsLargest ? 'Capital and largest city' : 'Capital', '', 'row', 'capital');
  // {{Infobox country}} reads the word "capital" here as "the same city" and joins the two rows.
  if (capitalIsLargest) add('largest_city', 'capital', 'Largest city', plain(wikiLink(text('capital'))), 'hidden', 'largest');
  else typed('largest', 'Largest city');
  typed('languages', 'Official languages');
  typed('demonym', 'Demonym');

  // Government
  typed('government', 'Government');
  for (const n of [1, 2] as const) {
    const title = text(`leaderTitle${n}`);
    const who = text(`leaderName${n}`);
    if (!who) continue;
    const office = title || (n === 1 ? 'Head of state' : 'Head of government');
    add(`leader_title${n}`, wikiValue(office), `Leader ${n}: title`, '', 'hidden', `leaderTitle${n}`);
    add(`leader_name${n}`, wikiValue(who), `• ${plain(wikiValue(office))}`, '', 'subrow', `leaderName${n}`);
  }
  typed('legislature', 'Legislature');

  // Establishment
  const events = ([1, 2] as const).filter((n) => text(`event${n}`));
  if (events.length) add('sovereignty_type', wikiValue(text('sovereignty') || 'Establishment'), 'Founding', '', 'row', 'sovereignty');
  for (const n of events) {
    add(`established_event${n}`, wikiValue(text(`event${n}`)), `Event ${n}`, '', 'hidden', `event${n}`);
    add(`established_date${n}`, wikiValue(text(`date${n}`)) || 'date unknown', `• ${plain(wikiValue(text(`event${n}`)))}`, '', 'subrow', `date${n}`);
  }

  // Area and population
  const area = parseNumber(text('area'));
  const population = parseNumber(text('population'));
  if (area !== null && area > 0) add('area_km2', formatNumber(area, 2), 'Area', `${formatNumber(area, 2)} km²`, 'row', 'area');
  if (text('water')) add('percent_water', wikiValue(text('water')), '• Water (%)', '', 'subrow', 'water');
  if (population !== null && population >= 0) {
    const year = plain(wikiValue(text('populationYear')));
    add('population_estimate', formatNumber(Math.round(population)), year ? `Population (${year} estimate)` : 'Population', '', 'row', 'population');
    typed('populationYear', 'Year of the estimate', 'hidden');
    if (area !== null && area > 0 && population > 0) add('population_density_km2', formatNumber(population / area, 1), '• Density', `${formatNumber(population / area, 1)} per km²`, 'subrow');
  }

  // Economy
  const gdpTyped = text('gdp');
  const gdp = parseNumber(gdpTyped);
  // A bare number is written out; anything with words in it ("$1.94 trillion") stays as typed.
  const gdpValue = gdp !== null && /^[\d,.\s]+$/.test(gdpTyped) ? formatMoney(gdp) : wikiValue(gdpTyped);
  if (gdpValue) {
    const year = plain(wikiValue(text('gdpYear')));
    add('GDP_nominal', gdpValue, year ? `GDP (nominal, ${year})` : 'GDP (nominal)', '', 'row', 'gdp');
    typed('gdpYear', 'Year of the GDP figure', 'hidden');
    if (gdp !== null && population !== null && population > 0 && gdp > 0) add('GDP_nominal_per_capita', formatMoney(gdp / population), '• Per head', '', 'subrow');
  }
  const code = plain(wikiValue(text('currencyCode')));
  if (text('currency')) {
    add('currency', wikiValue(text('currency')), 'Currency', code ? `${plain(wikiValue(text('currency')))} (${code})` : '', 'row', 'currency');
    typed('currencyCode', 'Currency code', 'hidden');
  }

  // Everyday details
  typed('timeZone', 'Time zone');
  typed('dateFormat', 'Date format');
  typed('drivesOn', 'Drives on');
  typed('callingCode', 'Calling code');
  typed('tld', 'Internet domain');

  // The easter egg: a country with nobody in it.
  if (population === 0) add('status', 'very quiet.', 'Status', '', 'row');

  return out;
}

/** The infobox as wikitext, ready to paste: one parameter a line, the equals signs in a column. */
export function infoboxWikitext(c: Country): string {
  const list = entries(c);
  if (!list.length) return '{{Infobox country\n}}';
  const width = Math.max(...list.map((e) => e.param.length));
  return ['{{Infobox country', ...list.map((e) => `| ${e.param.padEnd(width)} = ${e.value}`), '}}'].join('\n');
}

/** What the preview draws, in the order a wiki draws it. */
export interface Preview {
  title: string;
  /** Lines under the title, above the rows: native name, motto, anthem. */
  top: { label: string; shown: string; field?: FieldId }[];
  rows: { label: string; shown: string; sub: boolean; field?: FieldId; param: string }[];
  flagFile: string;
  armsFile: string;
}

export function preview(c: Country): Preview {
  const list = entries(c);
  const find = (param: string): string => list.find((e) => e.param === param)?.shown ?? '';
  return {
    title: find('conventional_long_name'),
    top: list.filter((e) => e.place === 'top').map((e) => ({ label: e.label, shown: e.shown, ...(e.field && { field: e.field }) })),
    rows: list.filter((e) => e.place === 'row' || e.place === 'subrow').map((e) => ({ label: e.label, shown: e.shown, sub: e.place === 'subrow', param: e.param, ...(e.field && { field: e.field }) })),
    flagFile: find('image_flag'),
    armsFile: find('image_coat'),
  };
}

/** The country in a few plain sentences: for screen readers, for "Copy description", for sharing. */
export function describe(c: Country): string {
  const name = nameOf(c);
  if (!name) return 'A country page that is still empty: no name, no capital, no numbers yet.';
  const official = pageTitle(c.official);
  const parts: string[] = [official && !same(official, name) ? `${name}, officially the ${official.replace(/^the\s+/i, '')}.` : `${name}.`];
  const say = (sentence: string) => parts.push(sentence);
  const shown = (id: FieldId): string => plain(FIELD[id].link ? wikiLink(c[id]) : wikiValue(c[id]));

  if (shown('capital')) say(same(c.capital, c.largest) ? `Capital and largest city: ${shown('capital')}.` : `Capital: ${shown('capital')}.${shown('largest') ? ` Largest city: ${shown('largest')}.` : ''}`);
  if (shown('government')) say(`Government: ${shown('government')}.`);
  const leaders = ([1, 2] as const).filter((n) => shown(`leaderName${n}`)).map((n) => `${shown(`leaderTitle${n}`) || (n === 1 ? 'Head of state' : 'Head of government')} ${shown(`leaderName${n}`)}`);
  if (leaders.length) say(`Led by ${leaders.join(' and ')}.`);
  const population = parseNumber(c.population);
  const area = parseNumber(c.area);
  if (population !== null && population >= 0) say(population === 0 ? 'Population: none. Very quiet.' : `Population: ${roundly(population)}.`);
  if (area !== null && area > 0) say(`Area: ${formatNumber(area, 2)} km².`);
  if (shown('currency')) say(`Currency: ${shown('currency')}${shown('currencyCode') ? ` (${shown('currencyCode')})` : ''}.`);
  if (c.drivesOn) say(`Drives on the ${c.drivesOn}.`);
  if (shown('motto')) say(`Motto: “${shown('motto').replace(/^["“”']+|["“”']+$/g, '')}”.`);
  return parts.join(' ');
}
