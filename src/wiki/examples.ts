/**
 * Example countries: one typed in by hand (Teland, from the mock-up) and the three example
 * profiles of @eurth/profile, read exactly as a visitor's own file would be. The Examples page
 * links each into the creator, and the tests hold the wikitext of every one of them to account.
 */
import type { EurthProfile } from '@eurth/profile';
import calderwyn from '@eurth/profile/examples/calderwyn.eurth.json';
import hesperwick from '@eurth/profile/examples/hesperwick.eurth.json';
import vantmoor from '@eurth/profile/examples/vantmoor.eurth.json';
import { clean, type Country } from './model';
import { fromProfile } from './profile';

export interface Example {
  id: string;
  name: string;
  /** One line on what the example shows. */
  note: string;
  country: Country;
  /** The profile it was read from, if it came from one. */
  profile?: EurthProfile;
}

/** Teland, filled in by hand: every group of the form has something in it. */
export const teland: Country = clean({
  official: 'Republic of Teland',
  common: 'Teland',
  motto: 'Steady against the tide',
  capital: 'Selunna',
  largest: 'Selunna',
  languages: 'Telandic',
  demonym: 'Telandic',
  government: 'Parliamentary republic',
  leaderTitle1: 'President',
  leaderName1: 'Maelin Ostrevin',
  leaderTitle2: 'Prime Minister',
  leaderName2: 'Aerin Kalluna',
  legislature: 'National Assembly',
  sovereignty: 'Independence',
  event1: 'Founding of Selunna',
  date1: '1184',
  event2: 'Republic declared',
  date2: '12 March 1871',
  area: '512,000',
  water: '2.4',
  population: '48,200,000',
  populationYear: '2026',
  gdp: '$1.94 trillion',
  gdpYear: '2026',
  currency: 'Selun',
  currencyCode: 'TLS',
  timeZone: 'UTC+1',
  dateFormat: 'dd-mm-yyyy',
  drivesOn: 'right',
  callingCode: '+42',
  tld: '.tl',
});

/** The examples, in the order the page shows them. `siteUrl` is this tool's own address. */
export function examples(siteUrl: string): Example[] {
  const read = (id: string, note: string, file: unknown): Example => {
    const profile = file as EurthProfile;
    return { id, name: profile.meta.nation, note, country: fromProfile(profile, siteUrl).country, profile };
  };
  return [
    { id: 'teland', name: 'Teland', note: 'Typed in by hand, with every part of the form in use: a full infobox for a mid-sized republic.', country: teland },
    read('calderwyn', 'From a profile that every Eurth tool has written to: a kingdom with a monarch, a parliament, a currency and a calendar.', calderwyn),
    read('vantmoor', 'From a mid-sized profile: names, a flag, a government and the headline numbers. The rest is left for you.', vantmoor),
    read('hesperwick', 'From the smallest profile there is: a name and a flag. Nearly everything is still to fill in.', hesperwick),
  ];
}
