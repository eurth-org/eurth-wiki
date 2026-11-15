/**
 * From a country to its infobox: the parameters of {{Infobox country}} in the tutorial's order
 * (docs/sandbox-7.wiki), each with the wikitext that goes to the wiki and the plain words the
 * preview and the description show. One list feeds all three, so the preview can't promise what
 * the wikitext doesn't hold.
 */
import { FIELDS, GROUPS, type Field, type GroupId } from './fields';
import { formatMoney, formatNumber, parseNumber, roundly, type Country } from './model';

/** One line of the infobox. */
export interface Entry {
  /** The parameter of {{Infobox country}}. */
  param: string;
  /** Its value as wikitext. */
  value: string;
  /** The label of its row in the drawn infobox. */
  label: string;
  /** Its value as the drawn infobox shows it, in plain words. */
  shown: string;
  /** Where the drawn infobox puts it. */
  place: 'title' | 'top' | 'row' | 'sub' | 'hidden';
  group: GroupId;
  /** Filled in for you, not typed. */
  auto: boolean;
}

/** The page of the wiki a name points to: no characters a title can't hold. */
export function pageTitle(name: string): string {
  return name
    .replace(/[#<>[\]{}|]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The file name the tutorial gives a nation's flag, arms and map: "Flag of Teland.png". The
 * extension is PNG as in the tutorial; a profile that brings its flag as SVG says so itself.
 */
export function fileName(kind: 'flag' | 'arms' | 'map', nation: string, extension = 'png'): string {
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

/** Tags that swallow everything after them when they are left open. */
const HUNGRY = ['nowiki', 'pre', 'ref', 'gallery', 'math', 'includeonly', 'noinclude', 'onlyinclude', 'syntaxhighlight', 'source'];

const count = (text: string, pattern: RegExp): number => text.match(pattern)?.length ?? 0;

/** True when every comment and every swallowing tag that opens also closes. */
function tagsClosed(text: string): boolean {
  if (count(text, /<!--/g) !== count(text, /-->/g)) return false;
  return HUNGRY.every((tag) => count(text, new RegExp(`<${tag}(?:\\s[^>]*)?(?<!/)>`, 'gi')) === count(text, new RegExp(`</${tag}\\s*>`, 'gi')));
}

/**
 * Text made safe as the value of a template parameter. A pipe outside a link or a template would
 * end the parameter early, so it becomes {{!}}; braces, brackets and tags that don't pair up
 * would break the template around them, so they are written as character codes. Links,
 * templates and references that are whole are left as typed: people who know wikitext may use it.
 */
export function wikiValue(text: string): string {
  let value = text.replace(/\s+/g, ' ').trim();
  if (!tagsClosed(value)) value = value.replace(/</g, '&lt;').replace(/-->/g, '--&gt;');
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
  if (/\[\[|\{\{|</.test(value)) return wikiValue(value);
  const title = pageTitle(value);
  return title ? `[[${title}]]` : '';
}

/**
 * What a reader sees of a piece of wikitext: links by their label, no quote marks for bold or
 * italics, no references or tags. Templates the preview can't work out are left as typed.
 */
export function plain(wikitext: string): string {
  return wikitext
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{!\}\}/g, '|')
    .replace(/\{\{(?:abbr|nowrap|flag|flagicon|small|lang\|[^|}]*)\|([^|}]*)(?:\|[^}]*)?\}\}/gi, '$1')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/\s+/g, ' ')
    .trim();
}

const text = (c: Country, param: string): string => (c[param] ?? '').trim();
const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== '';
const unquote = (value: string): string => value.replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim();

/** The name the page goes by: the common name, or the official one when that is all there is. */
export const nameOf = (c: Country): string => pageTitle(text(c, 'common_name')) || pageTitle(text(c, 'conventional_long_name'));

/** True when the largest city is the capital, typed as its name or as the tutorial's word "capital". */
const capitalIsLargest = (c: Country): boolean => text(c, 'capital') !== '' && (same(text(c, 'capital'), text(c, 'largest_city')) || text(c, 'largest_city').toLowerCase() === 'capital');

/**
 * What the creator fills in when a field is left empty, as the tutorial's template does with
 * {{PAGENAME}}: the names of the image files, their texts for screen readers, the map's width,
 * and the two figures that follow from others (density, GDP per head). The form shows these as
 * placeholders, so nothing appears in the wikitext unannounced.
 */
export function autos(c: Country): Record<string, string> {
  const out: Record<string, string> = {};
  const name = nameOf(c);
  if (name) {
    out.conventional_long_name = name;
    out.common_name = name;
    out.image_flag = fileName('flag', name);
    out.alt_flag = `Flag of ${name}`;
    out.image_coat = fileName('arms', name);
    out.alt_coat = `Coat of arms of ${name}`;
    out.symbol_type = 'Coat of arms';
    out.image_map = fileName('map', name);
    out.map_width = '275px';
    out.alt_map = `Map of ${name}`;
    out.map_caption = `Map of ${name}`;
  }
  if (text(c, 'leader_name1')) out.leader_title1 = 'Head of state';
  if (text(c, 'leader_name2')) out.leader_title2 = 'Head of government';
  const area = parseNumber(text(c, 'area_km2'));
  const population = parseNumber(text(c, 'population_estimate'));
  if (area !== null && area > 0 && population !== null && population > 0) out.population_density_km2 = formatNumber(population / area, 1);
  const gdp = parseNumber(text(c, 'GDP_nominal'));
  if (gdp !== null && gdp > 0 && population !== null && population > 0) out.GDP_nominal_per_capita = formatMoney(gdp / population);
  return out;
}

const QUOTED = new Set(['national_motto', 'national_anthem', 'royal_anthem']);
const FILES = new Set(['image_flag', 'image_coat', 'image_map', 'image_map3']);
const MONEY = new Set(['GDP_PPP', 'GDP_PPP_per_capita', 'GDP_nominal', 'GDP_nominal_per_capita']);

/** A typed value as wikitext, in the form the tutorial asks of that parameter. */
function wikitextOf(field: Field, raw: string, c: Country): string {
  const param = field.param;
  if (param === 'capital') return wikiLink(raw);
  // The tutorial: use "capital" (without quotation marks) if it's the capital.
  if (param === 'largest_city') return capitalIsLargest(c) ? 'capital' : wikiLink(raw);
  if (FILES.has(param)) return tidyFile(raw);
  // The tutorial: in inverted commas.
  if (QUOTED.has(param)) return `"${unquote(wikiValue(raw))}"`;
  // The tutorial: in its native language, hence in italics.
  if (param === 'native_name') return `''${wikiValue(raw).replace(/^'+|'+$/g, '')}''`;
  const number = parseNumber(raw);
  if (field.kind === 'number' && number !== null) return formatNumber(number, 2);
  // A bare number is written out; anything with words in it ("$1.94 trillion") stays as typed.
  if (MONEY.has(param) && number !== null && /^[\d,.\s]+$/.test(raw)) return formatMoney(number);
  return wikiValue(raw);
}

const withYear = (label: string, year: string, note = ''): string => (year ? `${label} (${year}${note ? ` ${note}` : ''})` : label);

/**
 * The infobox, line by line, in the tutorial's order. Empty fields leave no line, unless the
 * creator fills them in itself (see autos).
 */
export function entries(c: Country): Entry[] {
  const filled = autos(c);
  const out: Entry[] = [];
  const shownOf = (param: string): string => plain(wikiValue(text(c, param) || filled[param] || ''));
  const merged = capitalIsLargest(c);
  const population = parseNumber(text(c, 'population_estimate'));

  for (const field of FIELDS) {
    const param = field.param;
    const raw = text(c, param);
    const auto = !raw && Boolean(filled[param]);
    const value = raw ? wikitextOf(field, raw, c) : (filled[param] ?? '');
    if (!value) continue;

    let label = field.row ?? field.label;
    let shown = plain(value);
    let place: Entry['place'] = field.show ?? 'hidden';

    switch (param) {
      case 'capital':
        if (merged) label = 'Capital and largest city';
        break;
      case 'largest_city':
        if (merged) place = 'hidden';
        break;
      case 'largest_settlement':
        label = `Largest ${shownOf('largest_settlement_type') || 'settlement'}`;
        break;
      case 'languages':
        label = shownOf('languages_type') || 'Other languages';
        break;
      case 'languages2':
        label = shownOf('languages2_type') || 'Other languages';
        break;
      case 'ethnic_groups':
        label = withYear(label, shownOf('ethnic_groups_year'));
        break;
      case 'religion':
        label = withYear(label, shownOf('religion_year'));
        break;
      case 'leader_name1':
        label = shownOf('leader_title1');
        break;
      case 'leader_name2':
        label = shownOf('leader_title2');
        break;
      case 'established_date1':
        label = shownOf('established_event1') || 'First key event';
        break;
      case 'established_date2':
        label = shownOf('established_event2') || 'Second key event';
        break;
      case 'other_symbol':
        label = shownOf('other_symbol_type') || 'Other symbol';
        break;
      case 'area_km2':
        shown = `${shown} km²`;
        break;
      case 'population_estimate':
        label = withYear(label, shownOf('population_estimate_year'), 'estimate');
        break;
      case 'population_census':
        label = `${shownOf('population_census_year')} census`.trim();
        break;
      case 'population_density_km2':
        if (/^[\d,.]+$/.test(shown)) shown = `${shown} per km²`;
        break;
      case 'GDP_PPP':
        if (shownOf('GDP_PPP_year')) label = `${label}, ${shownOf('GDP_PPP_year')}`;
        break;
      case 'GDP_nominal':
        if (shownOf('GDP_nominal_year')) label = `${label}, ${shownOf('GDP_nominal_year')}`;
        break;
      case 'Gini':
        label = withYear(label, shownOf('Gini_year'));
        break;
      case 'HDI':
        label = withYear(label, shownOf('HDI_year'));
        break;
      case 'currency':
        if (shownOf('currency_code')) shown = `${shown} (${shownOf('currency_code')})`;
        break;
      case 'time_zone':
        if (shownOf('utc_offset')) shown = `${shown} (UTC${shownOf('utc_offset')})`;
        break;
      case 'utc_offset':
        // With no zone named, the offset is the row.
        if (!text(c, 'time_zone')) {
          place = 'row';
          label = 'Time zone';
          shown = `UTC${shown}`;
        }
        break;
      case 'time_zone_DST':
        if (shownOf('utc_offset_DST')) shown = `${shown} (UTC${shownOf('utc_offset_DST')})`;
        break;
    }
    if (place === 'sub') label = `• ${label}`;
    if (!shown) place = 'hidden';
    out.push({ param, value, label, shown, place, group: field.group, auto });

    // The easter egg: a country with nobody in it.
    if (param === 'population_estimate' && population === 0) out.push({ param: 'status', value: 'very quiet.', label: 'Status', shown: 'very quiet.', place: 'row', group: field.group, auto: true });
  }
  return out;
}

export interface InfoboxOptions {
  /**
   * Keep every parameter of the tutorial's template, the empty ones too, so the rest can be
   * filled in on the wiki later (default: only what is filled in).
   */
  blanks?: boolean;
}

/**
 * The infobox as wikitext, ready to paste: one parameter a line under the tutorial's headings,
 * the equals signs in a column.
 */
export function infoboxWikitext(c: Country, { blanks = false }: InfoboxOptions = {}): string {
  const list = entries(c);
  const byParam = new Map(list.map((e) => [e.param, e]));
  const lines: { group: GroupId; param: string; value: string }[] = blanks
    ? FIELDS.flatMap((f) => [{ group: f.group, param: f.param, value: byParam.get(f.param)?.value ?? '' }, ...(f.param === 'population_estimate' && byParam.has('status') ? [{ group: f.group, param: 'status', value: byParam.get('status')!.value }] : [])])
    : list.map((e) => ({ group: e.group, param: e.param, value: e.value }));
  if (!lines.length) return '{{Infobox country\n}}';
  const width = Math.max(...lines.map((l) => l.param.length));
  const out = ['{{Infobox country'];
  for (const g of GROUPS) {
    const mine = lines.filter((l) => l.group === g.id);
    if (!mine.length) continue;
    out.push(`<!-- ${g.label.toUpperCase()} -->`);
    for (const l of mine) out.push(`| ${l.param.padEnd(width)} =${l.value ? ` ${l.value}` : ''}`);
  }
  out.push('}}');
  return out.join('\n');
}

/** What the preview draws, in the order a wiki draws it. */
export interface Preview {
  title: string;
  /** Lines under the title, above the rows: native name, motto, anthem. */
  top: { label: string; shown: string; param: string }[];
  rows: { label: string; shown: string; sub: boolean; param: string }[];
  flagFile: string;
  armsFile: string;
  mapFile: string;
}

export function preview(c: Country): Preview {
  const list = entries(c);
  const find = (param: string): string => list.find((e) => e.param === param)?.shown ?? '';
  return {
    title: find('conventional_long_name'),
    top: list.filter((e) => e.place === 'top').map((e) => ({ label: e.label, shown: e.shown, param: e.param })),
    rows: list.filter((e) => e.place === 'row' || e.place === 'sub').map((e) => ({ label: e.label, shown: e.shown, sub: e.place === 'sub', param: e.param })),
    flagFile: find('image_flag'),
    armsFile: find('image_coat'),
    mapFile: find('image_map'),
  };
}

/** The country in a few plain sentences: for screen readers, for "Copy description", for sharing. */
export function describe(c: Country): string {
  const name = nameOf(c);
  if (!name) return 'A country page that is still empty: no name, no capital, no numbers yet.';
  const list = entries(c);
  const shown = (param: string): string => list.find((e) => e.param === param)?.shown ?? '';
  const official = shown('conventional_long_name');
  const parts: string[] = [official && !same(official, name) ? `${name}, officially the ${official.replace(/^the\s+/i, '')}.` : `${name}.`];
  const say = (sentence: string) => parts.push(sentence);

  if (shown('capital')) say(capitalIsLargest(c) ? `Capital and largest city: ${shown('capital')}.` : `Capital: ${shown('capital')}.${shown('largest_city') ? ` Largest city: ${shown('largest_city')}.` : ''}`);
  if (shown('government_type')) say(`Government: ${shown('government_type')}.`);
  const leaders = [1, 2].filter((n) => shown(`leader_name${n}`)).map((n) => `${shown(`leader_title${n}`)} ${shown(`leader_name${n}`)}`);
  if (leaders.length) say(`Led by ${leaders.join(' and ')}.`);
  const population = parseNumber(text(c, 'population_estimate'));
  const area = parseNumber(text(c, 'area_km2'));
  if (population !== null && population >= 0) say(population === 0 ? 'Population: none. Very quiet.' : `Population: ${roundly(population)}.`);
  if (area !== null && area > 0) say(`Area: ${formatNumber(area, 2)} km².`);
  if (shown('currency')) say(`Currency: ${shown('currency')}.`);
  if (text(c, 'drives_on')) say(`Drives on the ${text(c, 'drives_on')}.`);
  if (shown('national_motto')) say(`Motto: “${unquote(shown('national_motto'))}”.`);
  return parts.join(' ');
}
