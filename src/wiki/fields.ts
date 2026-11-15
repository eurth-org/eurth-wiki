/**
 * Every field the creator asks for. The list follows docs/sandbox-7.wiki, Orioni's "Eurth
 * country setup" tutorial on IIWiki: every parameter of its {{Infobox country}}, in its order,
 * under its eight headings, with help text drawn from its comments.
 *
 * The form, the wikitext, the preview and the link are all driven by this one list. A field is
 * known by its parameter name everywhere, the link included, so never rename one: old links
 * read by it. Adding a field is always safe.
 */

/** The tutorial's headings, in its order. */
export const GROUPS = [
  { id: 'names', label: 'Names', help: 'What the country is called, formally and day to day.' },
  { id: 'symbols', label: 'Symbols', help: 'Flag, arms, motto and anthem. Upload the images to the wiki under exactly the file names given here.' },
  { id: 'geography', label: 'Geography', help: 'The map, the capital and the largest city.' },
  { id: 'demographics', label: 'Demographics', help: 'Languages, peoples, faiths, and what the people are called.' },
  { id: 'politics', label: 'Politics', help: 'The form of government, who leads it and who makes the laws.' },
  { id: 'history', label: 'History', help: 'How the country came to be, in one or two dated events.' },
  { id: 'statistics', label: 'Statistics', help: 'Area, population, the economy and the everyday details at the foot of an infobox.' },
  { id: 'footnotes', label: 'Footnotes', help: 'Notes for anything marked with a small letter above.' },
] as const;

export type GroupId = (typeof GROUPS)[number]['id'];

export interface Field {
  /** The parameter of {{Infobox country}}: the field's name everywhere, the link included. */
  param: string;
  label: string;
  group: GroupId;
  help: string;
  /** text: as typed. number: a count, written with commas. choice: one of `choices`. */
  kind: 'text' | 'number' | 'choice';
  /** Longest value kept, in characters. */
  max: number;
  /** Rarely needed: tucked under "More fields" in its group. */
  more?: boolean;
  placeholder?: string;
  choices?: readonly { value: string; label: string }[];
  /** Where the drawn infobox shows it. Without this it is in the wikitext only. */
  show?: 'title' | 'top' | 'row' | 'sub';
  /** Its label in the drawn infobox, when that differs from the form's. */
  row?: string;
}

type Options = Partial<Pick<Field, 'kind' | 'max' | 'more' | 'placeholder' | 'choices' | 'show' | 'row'>>;

const fields: Field[] = [];
let group: GroupId = 'names';
const add = (param: string, label: string, help: string, options: Options = {}): void => {
  fields.push({ param, label, group, help, kind: 'text', max: 200, ...options });
};
const yesNo = [
  { value: '', label: 'Not stated' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

// NAMES
group = 'names';
add('conventional_long_name', 'Official name', 'The full, formal name, such as "Republic of Teland". It becomes the title of the infobox.', { max: 80, placeholder: 'Republic of Teland', show: 'title' });
add('native_name', 'Native name', "The country's name, usually the full one, in its own language. It is set in italics for you.", { max: 120, show: 'top' });
add('common_name', 'Common name', 'The short, everyday name. On the wiki it is the title of the page, and the image files are named after it.', { max: 80, placeholder: 'Teland' });

// SYMBOLS
group = 'symbols';
add('image_flag', 'Flag file', 'The name of the flag file on the wiki. Left empty, it is "Flag of" and the common name, as the tutorial has it. PNG and SVG make the prettiest images.', { max: 120 });
add('alt_flag', 'Flag: text for screen readers', 'What the flag shows, for readers who can\'t see it. Left empty, it is "Flag of" and the common name.', { more: true });
add('flag_border', 'Border around the flag', 'The wiki draws a thin border around the flag. Choose "No border" for a flag that isn\'t a rectangle.', {
  kind: 'choice',
  max: 3,
  more: true,
  choices: [
    { value: '', label: 'With a border' },
    { value: 'no', label: 'No border' },
  ],
});
add('image_coat', 'Coat of arms file', 'The name of the arms file on the wiki. Left empty, it is "Coat of arms of" and the common name.', { max: 120 });
add('alt_coat', 'Arms: text for screen readers', 'What the arms show, for readers who can\'t see them. Left empty, it is "Coat of arms of" and the common name.', { more: true });
add('symbol_type', 'Kind of symbol', 'Emblem, seal and so on, if it is not a coat of arms.', { max: 40, more: true, placeholder: 'Coat of arms' });
add('symbol_footnote', 'Symbol: footnote', "An optional reference or footnote for the symbol's caption.", { more: true });
add('national_motto', 'National motto', 'Without quotation marks: the inverted commas are added for you. Link it yourself if the motto has a page.', { placeholder: 'Steady against the tide', show: 'top', row: 'Motto' });
add('englishmotto', 'Motto in English', 'The English version, if the motto is in another language.', { show: 'top' });
add('national_anthem', 'National anthem', 'The title only: the inverted commas are added for you.', { max: 120, placeholder: 'Lanterns on the Water', show: 'top', row: 'Anthem' });
add('royal_anthem', 'Royal anthem', 'For a monarchy with an anthem of its own for the sovereign.', { max: 120, more: true, show: 'top' });
add('other_symbol_type', 'Another symbol: its kind', 'Use if a further symbol exists, such as a hymn.', { max: 40, more: true });
add('other_symbol', 'Another symbol', 'The further symbol itself.', { more: true, show: 'top' });

// GEOGRAPHY
group = 'geography';
add('image_map', 'Map file', 'The name of the map file on the wiki. Left empty, it is "Map of" and the common name.', { max: 120 });
add('map_width', 'Map width', 'How wide the map is drawn. The tutorial uses 275px.', { max: 12, more: true, placeholder: '275px' });
add('alt_map', 'Map: text for screen readers', 'Left empty, it is "Map of" and the common name.', { more: true });
add('map_caption', 'Map caption', 'The line under the map. Left empty, it is "Map of" and the common name.', { more: true });
add('capital', 'Capital', "The name of the capital. It is linked to the city's own page for you.", { max: 80, placeholder: 'Selunna', show: 'row' });
add('largest_city', 'Largest city', 'If it is the capital, type the same name or the word "capital": the infobox then says "Capital and largest city".', { max: 80, show: 'row' });
add('largest_settlement_type', 'Kind of largest settlement', 'The kind of settlement, if the largest one is not a city.', { max: 40, more: true, placeholder: 'town' });
add('largest_settlement', 'Largest settlement', 'The name of that largest settlement.', { max: 80, more: true, show: 'row' });

// DEMOGRAPHICS
group = 'demographics';
add('official_languages', 'Official languages', 'The languages recognised in legislation, the constitution and so on. Most used first, with commas between them.', { max: 400, placeholder: 'Telandic, Low Eskish', show: 'row' });
add('national_languages', 'National languages', 'Languages recognised across the country, but not necessarily in its law.', { max: 400, more: true, show: 'row' });
add('regional_languages', 'Regional languages', 'Languages recognised in, or associated with, particular regions.', { max: 400, more: true, show: 'row' });
add('languages_type', 'A further kind of language', 'Names a further kind of language, if not official, national or regional.', { max: 60, more: true, placeholder: 'Minority languages' });
add('languages', 'Languages of that kind', 'The languages of the further kind.', { max: 400, more: true, show: 'row' });
add('languages_sub', 'Is it a sub-item?', 'Whether the further kind is listed as a sub-item of the kind above it.', { kind: 'choice', max: 3, more: true, choices: yesNo });
add('languages2_type', 'A second further kind', 'Another further kind of language.', { max: 60, more: true });
add('languages2', 'Languages of the second kind', 'The languages of this second further kind.', { max: 400, more: true, show: 'row' });
add('languages2_sub', 'Is the second a sub-item?', 'Whether the second further kind is listed as a sub-item of the kind above it.', { kind: 'choice', max: 3, more: true, choices: yesNo });
add('ethnic_groups', 'Ethnic groups', 'A list or breakdown of the ethnic groups within the country.', { max: 400, show: 'row' });
add('ethnic_groups_year', 'Ethnic groups: year', 'The year of the ethnic groups data, if you give one.', { max: 20, more: true });
add('ethnic_groups_ref', 'Ethnic groups: reference', 'Any reference to go with the ethnic groups data.', { max: 400, more: true });
add('religion', 'Religion', 'The religions people follow, with rough shares if you have them.', { max: 400, show: 'row' });
add('religion_year', 'Religion: year', 'The year of the religion data, if you give one.', { max: 20, more: true });
add('religion_ref', 'Religion: reference', 'Any reference to go with the religion data.', { max: 400, more: true });
add('demonym', 'Demonym', 'The word for the people of the country: "Belgian" for Belgium.', { max: 80, placeholder: 'Telandic', show: 'row' });

// POLITICS
group = 'politics';
add('government_type', 'Government', 'Often a compound term, such as "Federal semi-presidential constitutional republic".', { placeholder: 'Parliamentary republic', show: 'row' });
add('leader_title1', 'First leader: title', "For a country, usually the head of state's title: President, Monarch.", { max: 80, placeholder: 'President' });
add('leader_name1', 'First leader: name', 'Who holds that office now.', { max: 80, placeholder: 'Maelin Ostrevin', show: 'sub' });
add('leader_title2', 'Second leader: title', 'Could be Vice President; otherwise Prime Minister and so on.', { max: 80, placeholder: 'Prime Minister' });
add('leader_name2', 'Second leader: name', 'Who holds that office now.', { max: 80, show: 'sub' });
add('legislature', 'Legislature', "The name of the country's governing body: Parliament, Congress.", { max: 80, placeholder: 'National Assembly', show: 'row' });
add('upper_house', 'Upper house', 'The name of its upper house, if it has one: Senate.', { max: 80, more: true, show: 'sub' });
add('lower_house', 'Lower house', 'The name of its lower house, if it has one: Chamber of Deputies.', { max: 80, more: true, show: 'sub' });

// HISTORY
group = 'history';
add('sovereignty_type', 'Status', 'A brief description of the country\'s status: "Independence from…", "Autonomous province of…".', { max: 120, placeholder: 'Independence', show: 'row' });
add('sovereignty_note', 'Status: note', 'A short note beside the status.', { max: 120, more: true });
add('established_event1', 'First key event', "The first key event in the history of the country's status or formation.", { max: 120, placeholder: 'Founding of Selunna' });
add('established_date1', 'First key event: date', 'The date of the first key event.', { max: 40, placeholder: '1184', show: 'sub' });
add('established_event2', 'Second key event', 'The second key event.', { max: 120, placeholder: 'Republic declared' });
add('established_date2', 'Second key event: date', 'The date of the second key event.', { max: 40, show: 'sub' });

// STATISTICS
group = 'statistics';
add('area_rank', 'Area: rank', 'Where the country stands among others by area.', { max: 20, more: true });
add('area', 'Area, with conversion', 'The area written with the convert template, square kilometres or square miles first. Most pages only need "Area (km²)".', { max: 120, more: true });
add('area_km2', 'Area (km²)', 'The area in square kilometres, as a number.', { kind: 'number', max: 24, placeholder: '512,000', show: 'row', row: 'Area' });
add('area_sq_mi', 'Area (sq mi)', 'The area in square miles. It needs the area in square kilometres too.', { kind: 'number', max: 24, more: true });
add('area_footnote', 'Area: footnote', 'An optional footnote for the area.', { more: true });
add('percent_water', 'Water (%)', 'The share of the area that is lakes and rivers.', { max: 12, placeholder: '2.4', show: 'sub' });
add('area_label', 'Area: label', 'The label under "Area". The default is "Total".', { max: 60, more: true });
add('area_label2', 'Area: second label', 'A label below the first, if you need one.', { max: 60, more: true });
add('area_data2', 'Area: second figure', 'The text after the second label.', { max: 60, more: true });
add('population_estimate', 'Population estimate', 'The latest estimate of the number of people.', { kind: 'number', max: 24, placeholder: '48,200,000', show: 'row', row: 'Population' });
add('population_estimate_rank', 'Population estimate: rank', 'Where the country stands among others by population.', { max: 20, more: true });
add('population_estimate_year', 'Population estimate: year', 'The year of the estimate.', { max: 20, placeholder: '2026' });
add('population_census', 'Population census', 'The count at the last census.', { kind: 'number', max: 24, more: true, show: 'sub' });
add('population_census_year', 'Population census: year', 'The year of that census.', { max: 20, more: true });
add('population_density_km2', 'Density (per km²)', 'Left empty, it is worked out from the population and the area.', { max: 20, more: true, show: 'sub', row: 'Density' });
add('population_density_sq_mi', 'Density (per sq mi)', 'People per square mile.', { max: 20, more: true });
add('population_density_rank', 'Density: rank', 'Where the country stands among others by density.', { max: 20, more: true });
add('nummembers', 'Number of members', 'An alternative to population, for a micronation.', { kind: 'number', max: 24, more: true, show: 'row', row: 'Membership' });
add('GDP_PPP', 'GDP (PPP)', 'Gross domestic product at purchasing power parity. A plain number is written out for you.', { max: 60, more: true, show: 'row' });
add('GDP_PPP_rank', 'GDP (PPP): rank', 'Where the country stands among others.', { max: 20, more: true });
add('GDP_PPP_year', 'GDP (PPP): year', 'The year the figure is for.', { max: 20, more: true });
add('GDP_PPP_per_capita', 'GDP (PPP) per head', 'The same figure divided by the population.', { max: 60, more: true, show: 'sub', row: 'Per capita' });
add('GDP_PPP_per_capita_rank', 'GDP (PPP) per head: rank', 'Where the country stands among others.', { max: 20, more: true });
add('GDP_nominal', 'GDP (nominal)', 'Gross domestic product at current prices, in US dollars. A plain number is written out for you: 512000000000 becomes $512 billion.', { max: 60, placeholder: '$1.94 trillion', show: 'row' });
add('GDP_nominal_rank', 'GDP (nominal): rank', 'Where the country stands among others.', { max: 20, more: true });
add('GDP_nominal_year', 'GDP (nominal): year', 'The year the figure is for.', { max: 20, placeholder: '2026' });
add('GDP_nominal_per_capita', 'GDP (nominal) per head', 'Left empty, it is worked out from the GDP and the population.', { max: 60, more: true, show: 'sub', row: 'Per capita' });
add('GDP_nominal_per_capita_rank', 'GDP (nominal) per head: rank', 'Where the country stands among others.', { max: 20, more: true });
add('Gini', 'Gini', 'The Gini measure of income inequality: a number only, between 0 and 100.', { max: 8, placeholder: '31.4', show: 'row' });
add('Gini_ref', 'Gini: reference', 'Any reference to go with the Gini number.', { max: 400, more: true });
add('Gini_rank', 'Gini: rank', 'Where the country stands among others.', { max: 20, more: true });
add('Gini_year', 'Gini: year', 'The year the number is for.', { max: 20, more: true });
add('HDI_year', 'HDI: year', 'The year the data refers to, not the year it was published.', { max: 20, more: true });
add('HDI', 'HDI', 'The Human Development Index: a number only, between 0 and 1.', { max: 8, placeholder: '0.861', show: 'row' });
add('HDI_change', 'HDI: change', 'Whether the rank rose, fell or held steady since the year before.', {
  kind: 'choice',
  max: 8,
  more: true,
  choices: [
    { value: '', label: 'Not stated' },
    { value: 'increase', label: 'Increase' },
    { value: 'decrease', label: 'Decrease' },
    { value: 'steady', label: 'Steady' },
  ],
});
add('HDI_rank', 'HDI: rank', 'Where the country stands among others.', { max: 20, more: true });
add('HDI_ref', 'HDI: reference', 'Any reference to go with the HDI number.', { max: 400, more: true });
add('currency', 'Currency', 'The name of the currency used in the country.', { max: 80, placeholder: 'Selun', show: 'row' });
add('currency_code', 'Currency code', 'Its ISO 4217 code: usually three capital letters.', { max: 10, placeholder: 'TLS' });
add('time_zone', 'Time zone', 'The name of the zone, such as GMT or AST. Link it yourself if it has a page.', { max: 80, show: 'row' });
add('utc_offset', 'UTC offset', 'In the form "+N", where N is the number of hours of offset.', { max: 12, placeholder: '+1' });
add('time_zone_DST', 'Summer time zone', 'The daylight saving time zone, if the country uses one. Otherwise leave it empty.', { max: 80, more: true, show: 'sub', row: 'Summer (DST)' });
add('utc_offset_DST', 'Summer UTC offset', 'In the form "+N", where N is the number of hours of offset.', { max: 12, more: true });
add('DST_note', 'Summer time: note', 'An optional note on the use of daylight saving time.', { more: true });
add('antipodes', 'Antipodes', 'The place or places exactly on the opposite side of the world.', { max: 120, more: true, show: 'row' });
add('date_format', 'Date format', 'The all-numeric date format and the era, such as "yyyy-mm-dd (CE)".', { max: 120, placeholder: 'dd-mm-yyyy', show: 'row' });
add('drives_on', 'Drives on', 'The side of the road.', {
  kind: 'choice',
  max: 5,
  show: 'row',
  row: 'Driving side',
  choices: [
    { value: '', label: 'Not stated' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
  ],
});
add('cctld', 'Internet domain', "The country's top-level domain, such as .be.", { max: 20, placeholder: '.tl', show: 'row', row: 'Internet TLD' });
add('iso3166code', 'ISO 3166 code', 'Overrides the code the infobox takes from the common name. Type "omit" to leave it out.', { max: 12, more: true, show: 'row' });
add('calling_code', 'Calling code', 'The code for phone calls from abroad, such as +32.', { max: 20, placeholder: '+42', show: 'row' });
add('patron_saint', 'Patron saint', 'For one patron saint.', { max: 120, more: true, show: 'row' });
add('image_map3', 'Third map file', 'An optional third map, for use with the footnotes below it.', { max: 120, more: true });
add('alt_map3', 'Third map: text for screen readers', 'What the third map shows.', { more: true });

// FOOTNOTES
group = 'footnotes';
add('footnote_a', 'Footnote a', 'For any footnote marked with a small "a" above.', { max: 400 });
add('footnote_b', 'Footnote b', 'For any footnote marked with a small "b" above.', { max: 400 });

export const FIELDS: readonly Field[] = fields;

/** A field by its parameter. */
export const FIELD: Readonly<Record<string, Field>> = Object.fromEntries(FIELDS.map((f) => [f.param, f]));

/** The fields of one group, in the tutorial's order. */
export const fieldsOf = (id: GroupId): Field[] => FIELDS.filter((f) => f.group === id);
