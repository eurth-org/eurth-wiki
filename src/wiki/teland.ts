/**
 * Teland, the example the creator's "Show an example" button fills in: typed by hand, with
 * something in every group of the form but the footnotes. It lives apart from examples.ts so
 * that the browser gets this one small country and not the three example profile files.
 */
import { clean, type Country } from './model';

export const teland: Country = clean({
  conventional_long_name: 'Republic of Teland',
  common_name: 'Teland',
  national_motto: 'Steady against the tide',
  capital: 'Selunna',
  largest_city: 'Selunna',
  official_languages: 'Telandic',
  demonym: 'Telandic',
  government_type: 'Parliamentary republic',
  leader_title1: 'President',
  leader_name1: 'Maelin Ostrevin',
  leader_title2: 'Prime Minister',
  leader_name2: 'Aerin Kalluna',
  legislature: 'National Assembly',
  sovereignty_type: 'Independence',
  established_event1: 'Founding of Selunna',
  established_date1: '1184',
  established_event2: 'Republic declared',
  established_date2: '12 March 1871',
  area_km2: '512,000',
  percent_water: '2.4',
  population_estimate: '48,200,000',
  population_estimate_year: '2026',
  GDP_nominal: '$1.94 trillion',
  GDP_nominal_year: '2026',
  currency: 'Selun',
  currency_code: 'TLS',
  utc_offset: '+1',
  date_format: 'dd-mm-yyyy',
  drives_on: 'right',
  cctld: '.tl',
  calling_code: '+42',
});
