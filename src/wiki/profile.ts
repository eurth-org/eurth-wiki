/**
 * The nation profile and the creator: what a loaded profile fills in, and what Wiki writes back.
 *
 * Wiki owns two sections, `identity` and `wiki`. It reads flag, arms, government, seats, stats,
 * bank, calendar, dynasty, cities and anthem, and leaves every section it doesn't own exactly
 * as it found it.
 */
import { createProfile, getSection, setSection, type EurthProfile } from '@eurth/profile';
import { decodeState, stateLink } from '@eurth/style';
import { FIELD } from './fields';
import { describe, fileName, nameOf } from './infobox';
import { LINK_VERSION, clean, compact, defaults, line, type Country } from './model';

/** Titles a head of state or government goes by, longest first, to tell "Queen" from "Ysolde III". */
const TITLES = [
  'President of the Republic', 'Prime Minister', 'First Minister', 'Chief Minister', 'Minister-President', 'Minister President', 'Grand Duchess', 'Grand Duke', 'Grand Prince', 'Grand Princess',
  'Lord Protector', 'Governor-General', 'Governor General', 'Secretary-General', 'Secretary General', 'General Secretary', 'High Chancellor', 'Supreme Leader', 'Head of State', 'State Elder',
  'Vice President', 'President', 'Chancellor', 'Premier', 'Emperor', 'Empress', 'King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Sultan', 'Sultana', 'Emir', 'Shah', 'Tsar', 'Tsarina',
  'Kaiser', 'Doge', 'Consul', 'Archon', 'Regent', 'Chairman', 'Chairwoman', 'Chair', 'Speaker', 'Governor', 'Taoiseach', 'Pope', 'Patriarch', 'Khan', 'Raja', 'Rani', 'Maharaja', 'Negus', 'Pharaoh', 'Chief',
].sort((a, b) => b.length - a.length);

/** "Queen Ysolde III" as a title and a name. A name with no title we know keeps the title empty. */
export function splitTitle(text: string): { title: string; name: string } {
  const value = text.trim();
  const lower = value.toLowerCase();
  for (const title of TITLES) {
    if (lower.startsWith(`${title.toLowerCase()} `) && value.length > title.length + 1) return { title, name: value.slice(title.length + 1).trim() };
  }
  return { title: '', name: value };
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown): string => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const record = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

/**
 * The fields Wiki keeps in its own `wiki` section, beside `drivesOn`: the everyday details the
 * profile holds nowhere else. Infobox parameter on the left, the profile's key on the right.
 */
export const WIKI_KEYS: Readonly<Record<string, string>> = { calling_code: 'callingCode', time_zone: 'timeZone', utc_offset: 'utcOffset', cctld: 'internetDomain', date_format: 'dateFormat' };

/**
 * The country a design link holds, if the link is one of ours: the profile's `wiki.link` may
 * point anywhere, and a design is only ever loaded from a link to this tool.
 */
export function fromLink(link: unknown, siteUrl: string): Country | null {
  if (typeof link !== 'string' || !link.startsWith(`${siteUrl.replace(/\/+$/, '')}/`)) return null;
  try {
    const arrived = decodeState(new URL(link).searchParams.get('d'));
    return arrived ? clean(arrived.value) : null;
  } catch {
    return null;
  }
}

/** The flag and the arms a profile carries, as SVG text. Only ever shown through an <img>. */
export function pictures(profile: EurthProfile | null): { flag: string; arms: string } {
  const svg = (name: string): string => {
    const value = record(getSection(profile, name)).svg;
    return typeof value === 'string' && /<svg[\s>]/i.test(value) ? value : '';
  };
  return { flag: svg('flag'), arms: svg('arms') };
}

/**
 * What a profile fills in. Wiki's own earlier work (the design in `wiki.link`) is the base;
 * on top of it comes what the other tools say today, since their sections are theirs to
 * decide: a new population from Stats replaces the one typed here last month.
 * Returns the country and the names of the sections that filled something in.
 */
export function fromProfile(profile: EurthProfile, siteUrl: string): { country: Country; used: string[] } {
  const section = (name: string) => record(getSection(profile, name));
  const wiki = section('wiki');
  const country: Country = { ...(fromLink(wiki.link, siteUrl) ?? defaults) };
  const used = new Set<string>();
  const set = (param: string, value: string, from: string) => {
    const text = line(value, FIELD[param]?.max ?? 200).trim();
    if (!text) return;
    country[param] = text;
    used.add(from);
  };

  // Wiki's own sections.
  const identity = section('identity');
  set('common_name', str(identity.commonName) || str(record(profile.meta).nation), 'identity');
  set('conventional_long_name', str(identity.officialName), 'identity');
  set('capital', str(identity.capital), 'identity');
  set('demonym', str(identity.demonym), 'identity');
  set('national_motto', str(identity.motto), 'identity');
  if (Array.isArray(identity.languages)) set('official_languages', identity.languages.filter((l) => typeof l === 'string' && l.trim()).join(', '), 'identity');
  if (wiki.drivesOn === 'left' || wiki.drivesOn === 'right') set('drives_on', wiki.drivesOn, 'wiki');
  for (const [param, key] of Object.entries(WIKI_KEYS)) set(param, str(wiki[key]), 'wiki');

  // What the other tools know.
  const government = section('government');
  const dynasty = section('dynasty');
  const seats = section('seats');
  set('government_type', str(government.form), 'government');
  const state = str(government.headOfState);
  const head = splitTitle(state || str(dynasty.monarch));
  if (head.name) {
    set('leader_name1', head.name, state ? 'government' : 'dynasty');
    country.leader_title1 = line(head.title || (state ? '' : 'Monarch'), 80);
  }
  const second = str(government.headOfGovernment);
  if (second && second.trim().toLowerCase() !== state.trim().toLowerCase()) {
    const leader = splitTitle(second);
    set('leader_name2', leader.name, 'government');
    country.leader_title2 = line(leader.title, 80);
  }
  set('legislature', str(government.legislature) || str(seats.chamber), str(government.legislature) ? 'government' : 'seats');

  const stats = section('stats');
  set('population_estimate', num(stats.population), 'stats');
  set('area_km2', num(stats.areaKm2), 'stats');
  set('GDP_nominal', num(stats.gdpUsd), 'stats');

  const bank = section('bank');
  set('currency', str(bank.currency), 'bank');
  set('currency_code', str(bank.code), 'bank');

  const calendar = section('calendar');
  if (str(calendar.name) && !country.date_format) set('date_format', `${str(calendar.name)}${str(calendar.era) ? ` (${str(calendar.era)})` : ''}`, 'calendar');

  const cities = section('cities');
  if (Array.isArray(cities.list)) {
    const list = cities.list.map(record).filter((city) => str(city.name));
    const largest = list.reduce<Record<string, unknown> | null>((best, city) => (best === null || (typeof city.population === 'number' && city.population > (typeof best.population === 'number' ? best.population : -1)) ? city : best), null);
    if (largest) set('largest_city', str(largest.name), 'cities');
    const capital = list.find((city) => city.capital === true);
    if (capital && !country.capital) set('capital', str(capital.name), 'cities');
  }

  set('national_anthem', str(section('anthem').title), 'anthem');

  // A profile brings its flag and arms as SVG, so the infobox asks for SVG files; the "for the
  // wiki" downloads then carry exactly these names.
  const name = nameOf(country);
  const images = pictures(profile);
  if (name && images.flag && !country.image_flag) set('image_flag', fileName('flag', name, 'svg'), 'flag');
  if (name && images.arms && !country.image_coat) set('image_coat', fileName('arms', name, 'svg'), 'arms');

  return { country: clean(country), used: [...used] };
}

/** The design's link as the profile keeps it: always this tool's own https address. */
export function designLink(country: Country, siteUrl: string): string {
  return stateLink(compact(country), { version: LINK_VERSION, base: `${siteUrl.replace(/\/+$/, '')}/` });
}

const cut = (text: string | undefined, max: number): string => (text ?? '').trim().slice(0, max).trim();

/**
 * The profile to save: the one that was loaded (or a new one), with Wiki's two sections brought
 * up to date. Every other section, and every key Wiki doesn't know, comes out as it went in.
 * Null while the country has no name: a profile needs one.
 */
export function toProfile(profile: EurthProfile | null, country: Country, siteUrl: string, options: { now?: Date } = {}): EurthProfile | null {
  const name = nameOf(country);
  if (!name) return null;
  let next = profile ?? createProfile(name, options);

  const identity: Record<string, unknown> = { ...record(getSection(next, 'identity')) };
  const put = (target: Record<string, unknown>, key: string, value: string | undefined, max: number) => {
    const text = cut(value, max);
    if (text) target[key] = text;
    else delete target[key];
  };
  put(identity, 'commonName', country.common_name || name, 80);
  put(identity, 'officialName', country.conventional_long_name, 80);
  put(identity, 'capital', country.capital, 80);
  put(identity, 'demonym', country.demonym, 80);
  put(identity, 'motto', country.national_motto, 200);
  const languages = (country.official_languages ?? '').split(/[,;]/).map((l) => cut(l, 80)).filter(Boolean).slice(0, 20);
  if (languages.length) identity.languages = languages;
  else delete identity.languages;
  next = setSection(next, 'identity', identity, options);

  const wiki: Record<string, unknown> = { ...record(getSection(next, 'wiki')) };
  const link = designLink(country, siteUrl);
  // The profile takes https links of at most 4,000 characters; a longer design goes without.
  if (/^https:\/\/[!-~]+$/.test(link) && link.length <= 4000) wiki.link = link;
  else delete wiki.link;
  put(wiki, 'summary', describe(country), 600);
  if (country.drives_on === 'left' || country.drives_on === 'right') wiki.drivesOn = country.drives_on;
  else delete wiki.drivesOn;
  for (const [param, key] of Object.entries(WIKI_KEYS)) put(wiki, key, country[param], 80);
  return setSection(next, 'wiki', wiki, options);
}
