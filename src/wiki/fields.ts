/**
 * Every field the creator asks for: what it is called, which group it sits in, the help under
 * it, and the parameter of {{Infobox country}} it fills. The form, the wikitext, the preview
 * and the link are all driven by this one list.
 *
 * PROVISIONAL. The fields, their groups, their order and the help text are to follow
 * User:Orioni/Sandbox 7 ("Eurth country setup"), which isn't in docs/ yet. Until it is, this
 * list is the mock-up's fields plus the usual parameters of {{Infobox country}}. When Sandbox 7
 * arrives, change this file; nothing else needs to know. Never reuse or change a `key`: old
 * links read by it.
 */

export const GROUPS = [
  { id: 'names', label: 'Names', help: 'What the country is called, formally and day to day.' },
  { id: 'symbols', label: 'Flag, arms and map', help: 'The names of the image files on the wiki. Upload the files there under exactly these names.' },
  { id: 'place', label: 'Capital and people', help: 'Where the government sits and who lives there.' },
  { id: 'government', label: 'Government', help: 'The form of government and who leads it.' },
  { id: 'history', label: 'Establishment', help: 'How the country came to be, in one or two dated events.' },
  { id: 'numbers', label: 'Area and population', help: 'Whole numbers. Commas and spaces are fine; the wiki works out the density.' },
  { id: 'economy', label: 'Economy', help: 'The size of the economy and the money.' },
  { id: 'other', label: 'Everyday details', help: 'The small print at the foot of an infobox.' },
] as const;

export type GroupId = (typeof GROUPS)[number]['id'];

export interface Field {
  /** The name in the state. */
  id: string;
  /** The short name in a link. Never changes, never reused. */
  key: string;
  /** The parameter of {{Infobox country}}. */
  param: string;
  label: string;
  group: GroupId;
  help: string;
  placeholder?: string;
  /** text: as typed. number: a count, written with commas. choice: one of `choices`. */
  kind: 'text' | 'number' | 'choice';
  /** Longest value kept, in characters. */
  max: number;
  /** Written as a link to the wiki page of that name: [[Selunna]]. */
  link?: boolean;
  choices?: readonly { value: string; label: string }[];
  /** Two fields that sit side by side in the form share a pair name. */
  pair?: string;
}

const field = <const T extends Field>(f: T): T => f;

export const FIELDS = [
  // Names
  field({ id: 'official', key: 'on', param: 'conventional_long_name', label: 'Official name', group: 'names', kind: 'text', max: 80, placeholder: 'Republic of Teland', help: 'The full, formal name. It becomes the title of the infobox.' }),
  field({ id: 'common', key: 'cn', param: 'common_name', label: 'Common name', group: 'names', kind: 'text', max: 80, placeholder: 'Teland', help: 'The short, everyday name. The page and the image files are named after it.' }),
  field({ id: 'native', key: 'nn', param: 'native_name', label: 'Name in its own language', group: 'names', kind: 'text', max: 80, help: 'Only if it differs from the official name. Leave it empty otherwise.' }),
  field({ id: 'motto', key: 'mo', param: 'motto', label: 'Motto', group: 'names', kind: 'text', max: 200, placeholder: 'Steady against the tide', help: 'Without quotation marks: they are added for you.' }),
  field({ id: 'mottoEnglish', key: 'me', param: 'englishmotto', label: 'Motto in English', group: 'names', kind: 'text', max: 200, help: 'Only if the motto is in another language.' }),
  field({ id: 'anthem', key: 'an', param: 'anthem', label: 'Anthem', group: 'names', kind: 'text', max: 80, placeholder: 'Lanterns on the Water', help: 'The title only. It is set in italics for you.' }),

  // Flag, arms and map
  field({ id: 'flagFile', key: 'ff', param: 'image_flag', label: 'Flag file', group: 'symbols', kind: 'text', max: 120, help: 'Left empty, it is "Flag of" and the common name, as the wiki expects.' }),
  field({ id: 'armsFile', key: 'af', param: 'image_coat', label: 'Coat of arms file', group: 'symbols', kind: 'text', max: 120, help: 'Left empty, it is "Coat of arms of" and the common name.' }),
  field({ id: 'mapFile', key: 'mp', param: 'image_map', label: 'Map file', group: 'symbols', kind: 'text', max: 120, placeholder: 'Map of Teland.png', help: 'A map that shows where the country lies. Leave it empty if you have none yet.' }),

  // Capital and people
  field({ id: 'capital', key: 'ca', param: 'capital', label: 'Capital', group: 'place', kind: 'text', max: 80, link: true, placeholder: 'Selunna', help: 'Linked to its own page for you.', pair: 'cities' }),
  field({ id: 'largest', key: 'lc', param: 'largest_city', label: 'Largest city', group: 'place', kind: 'text', max: 80, link: true, help: 'If it is the capital, type the same name: the infobox then says "Capital and largest city".', pair: 'cities' }),
  field({ id: 'languages', key: 'la', param: 'official_languages', label: 'Official languages', group: 'place', kind: 'text', max: 400, placeholder: 'Telandic, Low Eskish', help: 'Most used first, with commas between them.' }),
  field({ id: 'demonym', key: 'de', param: 'demonym', label: 'Demonym', group: 'place', kind: 'text', max: 80, placeholder: 'Telandic', help: 'What the people are called.' }),

  // Government
  field({ id: 'government', key: 'go', param: 'government_type', label: 'Form of government', group: 'government', kind: 'text', max: 120, placeholder: 'Parliamentary republic', help: 'A few words, as an encyclopedia would put it.' }),
  field({ id: 'leaderTitle1', key: 't1', param: 'leader_title1', label: 'Head of state: title', group: 'government', kind: 'text', max: 80, placeholder: 'President', help: 'The office, not the person.', pair: 'leader1' }),
  field({ id: 'leaderName1', key: 'l1', param: 'leader_name1', label: 'Head of state: name', group: 'government', kind: 'text', max: 80, placeholder: 'Maelin Ostrevin', help: 'Who holds the office now.', pair: 'leader1' }),
  field({ id: 'leaderTitle2', key: 't2', param: 'leader_title2', label: 'Head of government: title', group: 'government', kind: 'text', max: 80, placeholder: 'Prime Minister', help: 'Leave both empty if the head of state also governs.', pair: 'leader2' }),
  field({ id: 'leaderName2', key: 'l2', param: 'leader_name2', label: 'Head of government: name', group: 'government', kind: 'text', max: 80, help: 'Who holds the office now.', pair: 'leader2' }),
  field({ id: 'legislature', key: 'le', param: 'legislature', label: 'Legislature', group: 'government', kind: 'text', max: 80, placeholder: 'National Assembly', help: 'The name of the body that makes the laws.' }),

  // Establishment
  field({ id: 'sovereignty', key: 'sv', param: 'sovereignty_type', label: 'Kind of founding', group: 'history', kind: 'text', max: 80, placeholder: 'Independence', help: 'The heading over the events: Independence, Formation, Unification.' }),
  field({ id: 'event1', key: 'e1', param: 'established_event1', label: 'First event', group: 'history', kind: 'text', max: 120, placeholder: 'Founding of Selunna', help: 'What happened.', pair: 'event1' }),
  field({ id: 'date1', key: 'd1', param: 'established_date1', label: 'First event: date', group: 'history', kind: 'text', max: 40, placeholder: '1184', help: 'A year or a full date.', pair: 'event1' }),
  field({ id: 'event2', key: 'e2', param: 'established_event2', label: 'Second event', group: 'history', kind: 'text', max: 120, placeholder: 'Current constitution', help: 'What happened.', pair: 'event2' }),
  field({ id: 'date2', key: 'd2', param: 'established_date2', label: 'Second event: date', group: 'history', kind: 'text', max: 40, help: 'A year or a full date.', pair: 'event2' }),

  // Area and population
  field({ id: 'area', key: 'ar', param: 'area_km2', label: 'Area (km²)', group: 'numbers', kind: 'number', max: 24, placeholder: '512,000', help: 'Land and inland water together, in square kilometres.', pair: 'area' }),
  field({ id: 'water', key: 'wa', param: 'percent_water', label: 'Water (%)', group: 'numbers', kind: 'text', max: 12, placeholder: '2.4', help: 'The share of the area that is lakes and rivers.', pair: 'area' }),
  field({ id: 'population', key: 'po', param: 'population_estimate', label: 'Population', group: 'numbers', kind: 'number', max: 24, placeholder: '48,200,000', help: 'The latest estimate.', pair: 'population' }),
  field({ id: 'populationYear', key: 'py', param: 'population_estimate_year', label: 'Year of the estimate', group: 'numbers', kind: 'text', max: 20, placeholder: '2026', help: 'So readers know how fresh the number is.', pair: 'population' }),

  // Economy
  field({ id: 'gdp', key: 'gd', param: 'GDP_nominal', label: 'GDP (nominal)', group: 'economy', kind: 'text', max: 40, placeholder: '$1.94 trillion', help: 'In US dollars. A plain number is written out for you: 512000000000 becomes $512 billion.', pair: 'gdp' }),
  field({ id: 'gdpYear', key: 'gy', param: 'GDP_nominal_year', label: 'Year of the GDP figure', group: 'economy', kind: 'text', max: 20, placeholder: '2026', help: 'The year the figure is for.', pair: 'gdp' }),
  field({ id: 'currency', key: 'cu', param: 'currency', label: 'Currency', group: 'economy', kind: 'text', max: 80, placeholder: 'Selun', help: 'The name of the money.', pair: 'currency' }),
  field({ id: 'currencyCode', key: 'cc', param: 'currency_code', label: 'Currency code', group: 'economy', kind: 'text', max: 10, placeholder: 'TLS', help: 'Three letters, as on an exchange board.', pair: 'currency' }),

  // Everyday details
  field({ id: 'timeZone', key: 'tz', param: 'time_zone', label: 'Time zone', group: 'other', kind: 'text', max: 40, placeholder: 'UTC+1', help: 'As an offset from UTC, or the zone\'s own name.', pair: 'time' }),
  field({ id: 'dateFormat', key: 'df', param: 'date_format', label: 'Date format', group: 'other', kind: 'text', max: 80, placeholder: 'dd-mm-yyyy', help: 'How dates are written, and in which calendar.', pair: 'time' }),
  field({
    id: 'drivesOn',
    key: 'dr',
    param: 'drives_on',
    label: 'Drives on',
    group: 'other',
    kind: 'choice',
    max: 5,
    help: 'The side of the road.',
    choices: [
      { value: '', label: 'Not stated' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
  }),
  field({ id: 'callingCode', key: 'ph', param: 'calling_code', label: 'Calling code', group: 'other', kind: 'text', max: 20, placeholder: '+32', help: 'The country code for phone calls from abroad.', pair: 'codes' }),
  field({ id: 'tld', key: 'tl', param: 'cctld', label: 'Internet domain', group: 'other', kind: 'text', max: 20, placeholder: '.tl', help: 'The country\'s ending for web addresses.', pair: 'codes' }),
] as const satisfies readonly Field[];

export type FieldId = (typeof FIELDS)[number]['id'];

/** A field by its name. */
export const FIELD: Readonly<Record<FieldId, Field>> = Object.fromEntries(FIELDS.map((f) => [f.id, f])) as Record<FieldId, Field>;

/** The fields of one group, in order. */
export const fieldsOf = (group: GroupId): Field[] => FIELDS.filter((f) => f.group === group);
