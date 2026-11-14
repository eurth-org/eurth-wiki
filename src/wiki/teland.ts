/**
 * Teland, the example the creator's "Show an example" button fills in: typed by hand, with every
 * group of the form in use. It lives apart from examples.ts so that the browser gets this one
 * small country and not the three example profile files.
 */
import { clean, type Country } from './model';

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
