import { getSection, validateProfile, type EurthProfile } from '@eurth/profile';
import calderwynFile from '@eurth/profile/examples/calderwyn.eurth.json';
import { decodeState, encodeState } from '@eurth/style';
import { describe as group, expect, it } from 'vitest';
import { examples, teland } from '../src/wiki/examples';
import { FIELDS, GROUPS } from '../src/wiki/fields';
import { describe, entries, fileName, infoboxWikitext, plain, preview, tidyFile, wikiLink, wikiValue } from '../src/wiki/infobox';
import { clean, compact, defaults, formatMoney, formatNumber, isEmpty, parseNumber, roundly } from '../src/wiki/model';
import { SECTIONS, footer, imageLink, lead, linkOnce, pageSkeleton } from '../src/wiki/page';
import { designLink, fromLink, fromProfile, pictures, splitTitle, toProfile } from '../src/wiki/profile';

const SITE = 'https://wiki.eurth.org';
const calderwyn = calderwynFile as unknown as EurthProfile;
const all = examples(SITE);

group('the field list', () => {
  it('has one name, one link key and one parameter per field, none used twice', () => {
    for (const key of ['id', 'key', 'param'] as const) expect(new Set(FIELDS.map((f) => f[key])).size).toBe(FIELDS.length);
  });

  it('puts every field in a group, and leaves no group empty', () => {
    const groups = new Set<string>(GROUPS.map((g) => g.id));
    for (const f of FIELDS) expect(groups.has(f.group)).toBe(true);
    for (const g of GROUPS) expect(FIELDS.some((f) => f.group === g.id)).toBe(true);
  });

  it('gives every field help text that is a sentence', () => {
    for (const f of FIELDS) expect(f.help).toMatch(/^[A-Z].*[.:"”]$/);
  });
});

group('a country in its link', () => {
  it('comes back as it went in', () => {
    for (const { country } of all) expect(clean(decodeState(encodeState(compact(country)))?.value)).toEqual(country);
  });

  it('is empty when nothing is filled in', () => {
    expect(compact(defaults)).toEqual({});
    expect(isEmpty(defaults)).toBe(true);
    expect(isEmpty(teland)).toBe(false);
  });

  it('is checked and cut to length: a link is someone else’s input', () => {
    expect(clean(null)).toEqual(defaults);
    expect(clean([1, 2])).toEqual(defaults);
    expect(clean({ cn: '<b>Orioni</b>', on: 7, dr: 'sideways', zz: 'unknown' })).toEqual({ ...defaults, common: 'b Orioni /b ', official: '7' });
    expect(clean({ cn: 'x'.repeat(500) }).common).toHaveLength(80);
    expect(clean({ cn: 'Tel\nand\u0000' }).common).toBe('Tel and ');
    expect(clean({ dr: 'left' }).drivesOn).toBe('left');
    expect(clean({ __proto__: { cn: 'Sneaky' } }).common).toBe('');
  });

  it('reads the fields’ own names as well as the short keys', () => {
    expect(clean({ common: 'Teland', ca: 'Selunna' })).toMatchObject({ common: 'Teland', capital: 'Selunna' });
  });
});

group('numbers', () => {
  it('are read however they were typed', () => {
    expect(parseNumber('48,200,000')).toBe(48200000);
    expect(parseNumber('48 200 000')).toBe(48200000);
    expect(parseNumber('48.2 million')).toBe(48200000);
    expect(parseNumber('$1.94 trillion')).toBe(1940000000000);
    expect(parseNumber('0')).toBe(0);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('many')).toBeNull();
    expect(parseNumber('12 March 1689')).toBeNull();
  });

  it('are written with commas, and money in words', () => {
    expect(formatNumber(48200000)).toBe('48,200,000');
    expect(formatNumber(84.15, 1)).toBe('84.2');
    expect(formatNumber(512000, 2)).toBe('512,000');
    expect(formatMoney(512000000000)).toBe('$512 billion');
    expect(formatMoney(1940000000000)).toBe('$1.94 trillion');
    expect(formatMoney(41025.6)).toBe('$41,026');
    expect(roundly(48200000)).toBe('48.2 million');
    expect(roundly(512000)).toBe('512,000');
  });
});

group('wikitext values', () => {
  it('turn a loose pipe into {{!}} and leave whole links and templates alone', () => {
    expect(wikiValue('North | South')).toBe('North {{!}} South');
    expect(wikiValue('[[Selunna|the capital]] and {{small|more}}')).toBe('[[Selunna|the capital]] and {{small|more}}');
  });

  it('disarm braces and brackets that don’t pair up', () => {
    expect(wikiValue('Teland}}')).toBe('Teland&#125;&#125;');
    expect(wikiValue('{{Infobox')).toBe('&#123;&#123;Infobox');
    expect(wikiValue('[[Selunna')).toBe('&#91;&#91;Selunna');
    expect(wikiValue('}} | {{')).toBe('&#125;&#125; {{!}} &#123;&#123;');
  });

  it('link a page by its name, once, and never wrap a link in a link', () => {
    expect(wikiLink('Selunna')).toBe('[[Selunna]]');
    expect(wikiLink(' New_Selunna ')).toBe('[[New Selunna]]');
    expect(wikiLink('[[Selunna (city)|Selunna]]')).toBe('[[Selunna (city)|Selunna]]');
    expect(wikiLink('Sel|unna')).toBe('[[Sel unna]]');
    expect(wikiLink('')).toBe('');
  });

  it('read back as plain words', () => {
    expect(plain("[[Selunna (city)|Selunna]], ''the'' '''capital'''")).toBe('Selunna, the capital');
    expect(plain('North {{!}} South')).toBe('North | South');
  });
});

group('image files', () => {
  it('are named as the wiki expects', () => {
    expect(fileName('flag', 'Teland')).toBe('Flag of Teland.svg');
    expect(fileName('arms', 'Teland')).toBe('Coat of arms of Teland.svg');
    expect(fileName('flag', 'Teland', 'png')).toBe('Flag of Teland.png');
    expect(fileName('flag', '')).toBe('');
    expect(fileName('flag', 'A/B: [C]')).toBe('Flag of A B C.svg');
  });

  it('lose a "File:" in front and characters a title can’t hold', () => {
    expect(tidyFile('File:Teland flag.svg')).toBe('Teland flag.svg');
    expect(tidyFile('image: Arms|of#Teland.png')).toBe('Arms of Teland.png');
  });
});

group('the infobox', () => {
  it('is ready to paste, one parameter a line', () => {
    expect(infoboxWikitext(teland)).toBe(`{{Infobox country
| conventional_long_name   = Republic of Teland
| common_name              = Teland
| image_flag               = Flag of Teland.svg
| image_coat               = Coat of arms of Teland.svg
| motto                    = "Steady against the tide"
| capital                  = [[Selunna]]
| largest_city             = capital
| official_languages       = Telandic
| demonym                  = Telandic
| government_type          = Parliamentary republic
| leader_title1            = President
| leader_name1             = Maelin Ostrevin
| leader_title2            = Prime Minister
| leader_name2             = Aerin Kalluna
| legislature              = National Assembly
| sovereignty_type         = Independence
| established_event1       = Founding of Selunna
| established_date1        = 1184
| established_event2       = Republic declared
| established_date2        = 12 March 1871
| area_km2                 = 512,000
| percent_water            = 2.4
| population_estimate      = 48,200,000
| population_estimate_year = 2026
| population_density_km2   = 94.1
| GDP_nominal              = $1.94 trillion
| GDP_nominal_year         = 2026
| GDP_nominal_per_capita   = $40,249
| currency                 = Selun
| currency_code            = TLS
| time_zone                = UTC+1
| date_format              = dd-mm-yyyy
| drives_on                = right
| calling_code             = +42
| cctld                    = .tl
}}`);
  });

  it('leaves out what is empty, and is a valid empty template when everything is', () => {
    expect(infoboxWikitext(defaults)).toBe('{{Infobox country\n}}');
    expect(infoboxWikitext(clean({ common: 'Teland' }))).toBe(`{{Infobox country
| conventional_long_name = Teland
| common_name            = Teland
| image_flag             = Flag of Teland.svg
| image_coat             = Coat of arms of Teland.svg
}}`);
  });

  it('keeps two different cities apart, each linked', () => {
    const text = infoboxWikitext(clean({ common: 'Teland', capital: 'Selunna', largest: 'Port Verity' }));
    expect(text).toContain('| capital                = [[Selunna]]');
    expect(text).toContain('| largest_city           = [[Port Verity]]');
  });

  it('uses the file names that were typed, when there are any', () => {
    const text = infoboxWikitext(clean({ common: 'Teland', flagFile: 'File:Teland flag.png', mapFile: 'Teland on Eurth.png' }));
    expect(text).toContain('| image_flag             = Teland flag.png');
    expect(text).toContain('| image_map              = Teland on Eurth.png');
  });

  it('writes a bare GDP number out in words, and works out the amount per head', () => {
    const list = entries(clean({ common: 'Calderwyn', gdp: '512000000000', population: '12480000' }));
    expect(list.find((e) => e.param === 'GDP_nominal')?.value).toBe('$512 billion');
    expect(list.find((e) => e.param === 'GDP_nominal_per_capita')?.value).toBe('$41,026');
  });

  it('names a leader without a title by the office', () => {
    const text = infoboxWikitext(clean({ common: 'Teland', leaderName1: 'Maelin Ostrevin' }));
    expect(text).toContain('| leader_title1          = Head of state');
  });

  it('can’t be broken out of: every line stays one parameter', () => {
    const hostile = clean({ common: 'Tel}}and', official: 'A | B', capital: ']] [[Evil', motto: '}} {{delete}} | x = y', languages: '{{#invoke:x}}|y' });
    const lines = infoboxWikitext(hostile).split('\n');
    expect(lines[0]).toBe('{{Infobox country');
    expect(lines.at(-1)).toBe('}}');
    for (const text of lines.slice(1, -1)) {
      expect(text).toMatch(/^\| \w+ += \S/);
      const value = text.replace(/^\| \w+ += /, '');
      // No pipe outside a whole link or template, and every brace and bracket pairs up.
      expect(value.replace(/\[\[[^\]]*\]\]|\{\{[^}]*\}\}/g, '')).not.toMatch(/[|{}[\]]/);
    }
  });

  it('adds a line for a country with nobody in it', () => {
    const quiet = clean({ common: 'Emptiness', population: '0' });
    expect(infoboxWikitext(quiet)).toContain('| status                 = very quiet.');
    expect(preview(quiet).rows.at(-1)).toMatchObject({ label: 'Status', shown: 'very quiet.' });
    expect(infoboxWikitext(clean({ common: 'Emptiness' }))).not.toContain('status');
    expect(infoboxWikitext(teland)).not.toContain('status');
  });
});

group('the preview', () => {
  it('shows what the wikitext holds, in the infobox’s order', () => {
    const p = preview(teland);
    expect(p.title).toBe('Republic of Teland');
    expect(p.flagFile).toBe('Flag of Teland.svg');
    expect(p.armsFile).toBe('Coat of arms of Teland.svg');
    expect(p.top).toEqual([{ label: 'Motto', shown: '"Steady against the tide"', field: 'motto' }]);
    expect(p.rows.map((r) => `${r.label}: ${r.shown}`)).toEqual([
      'Capital and largest city: Selunna',
      'Official languages: Telandic',
      'Demonym: Telandic',
      'Government: Parliamentary republic',
      '• President: Maelin Ostrevin',
      '• Prime Minister: Aerin Kalluna',
      'Legislature: National Assembly',
      'Founding: Independence',
      '• Founding of Selunna: 1184',
      '• Republic declared: 12 March 1871',
      'Area: 512,000 km²',
      '• Water (%): 2.4',
      'Population (2026 estimate): 48,200,000',
      '• Density: 94.1 per km²',
      'GDP (nominal, 2026): $1.94 trillion',
      '• Per head: $40,249',
      'Currency: Selun (TLS)',
      'Time zone: UTC+1',
      'Date format: dd-mm-yyyy',
      'Drives on: right',
      'Calling code: +42',
      'Internet domain: .tl',
    ]);
  });

  it('is empty for an empty form, so it can build itself row by row', () => {
    expect(preview(defaults)).toEqual({ title: '', top: [], rows: [], flagFile: '', armsFile: '' });
    expect(preview(clean({ common: 'Teland', capital: 'Selunna' })).rows).toHaveLength(1);
  });
});

group('the description', () => {
  it('says the country in plain sentences', () => {
    expect(describe(teland)).toBe(
      'Teland, officially the Republic of Teland. Capital and largest city: Selunna. Government: Parliamentary republic. Led by President Maelin Ostrevin and Prime Minister Aerin Kalluna. Population: 48.2 million. Area: 512,000 km². Currency: Selun (TLS). Drives on the right. Motto: “Steady against the tide”.',
    );
  });

  it('has something to say about an empty form and an empty country', () => {
    expect(describe(defaults)).toBe('A country page that is still empty: no name, no capital, no numbers yet.');
    expect(describe(clean({ common: 'Emptiness', population: '0' }))).toBe('Emptiness. Population: none. Very quiet.');
  });
});

group('the page skeleton', () => {
  const sandbox = pageSkeleton(teland, { target: 'sandbox' });
  const live = pageSkeleton(teland, { target: 'live' });

  it('opens with the infobox and a sentence that links each page once', () => {
    expect(sandbox.startsWith('{{Infobox country\n')).toBe(true);
    expect(lead(teland)).toBe("'''Teland''', officially the '''Republic of Teland''', is a parliamentary republic on [[Eurth]]. Its capital and largest city is [[Selunna]]. About 48.2 million people live there.");
    expect(lead(clean({ common: 'Teland', capital: 'Selunna', largest: 'Port Verity' }))).toBe("'''Teland''' is a country on [[Eurth]]. Its capital is [[Selunna]], and its largest city is [[Port Verity]].");
    expect(lead(defaults)).toMatch(/^<!-- .* -->$/);
  });

  it('has every section in order, each with its one-line prompt', () => {
    const titles = (list: typeof SECTIONS): string[] => list.flatMap((s) => [s.title, ...titles(s.sections ?? [])]);
    const headings = [...sandbox.matchAll(/^(=+) (.+) \1$/gm)].map((m) => m[2]);
    expect(headings).toEqual(titles(SECTIONS));
    expect(sandbox).toContain('== Etymology ==\n<!-- Where the name Teland comes from and what it means.');
    expect(sandbox).toContain('=== Climate ===\n<!-- ');
    expect(sandbox).toContain('== References ==\n<!-- Leave the template below as it is: it lists the notes from the text. -->\n{{reflist}}');
    expect(sandbox).not.toContain('{name}');
  });

  it('for the sandbox, leaves out the navboxes and the categories', () => {
    expect(sandbox).not.toContain('{{Eurth}}');
    expect(sandbox).not.toContain('[[Category:');
    expect(sandbox).toContain('Sandbox draft');
  });

  it('for the live page, puts them back', () => {
    expect(live.endsWith('{{Eurth}}\n{{Teland}}\n\n[[Category:Teland]]\n[[Category:Eurth]]\n')).toBe(true);
    expect(live).not.toContain('Sandbox draft');
    expect(footer(defaults)).toBe('{{Eurth}}\n\n[[Category:Eurth]]');
  });

  it('can go without the infobox', () => {
    expect(pageSkeleton(teland, { infobox: false }).startsWith("'''Teland'''")).toBe(true);
  });

  it('keeps comments whole, whatever the name', () => {
    const odd = pageSkeleton(clean({ common: 'A--B-->C' }));
    for (const found of odd.matchAll(/<!--([\s\S]*?)-->/g)) expect(found[1]).not.toContain('--');
  });
});

group('IIWiki conventions', () => {
  it('images: only 250px and thumb, left or right', () => {
    expect(imageLink('Map of Teland.png', 'Teland on Eurth.')).toBe('[[File:Map of Teland.png|250px|thumb|right|Teland on Eurth.]]');
    expect(imageLink('File:Selunna.jpg', '', 'left')).toBe('[[File:Selunna.jpg|250px|thumb|left]]');
    expect(imageLink('', 'Nothing')).toBe('');
  });

  it('links: a page is linked at its first mention in a section, and never twice', () => {
    expect(linkOnce('Selunna is old. Selunna is also large.', ['Selunna'])).toBe('[[Selunna]] is old. Selunna is also large.');
    expect(linkOnce('See [[Selunna]]. Selunna is large.', ['Selunna'])).toBe('See [[Selunna]]. Selunna is large.');
    expect(linkOnce('See [[Selunna (city)|the capital]], then Selunna.', ['Selunna'])).toBe('See [[Selunna (city)|the capital]], then [[Selunna]].');
  });

  it('links: whole names only, the longer name first, and nothing inside a template or a comment', () => {
    expect(linkOnce('New Selunna and Selunna.', ['Selunna', 'New Selunna'])).toBe('[[New Selunna]] and [[Selunna]].');
    expect(linkOnce('Selunnan ships left Selunna.', ['Selunna'])).toBe('Selunnan ships left [[Selunna]].');
    expect(linkOnce('{{main|Selunna}} <!-- Selunna --> Selunna', ['Selunna'])).toBe('{{main|Selunna}} <!-- Selunna --> [[Selunna]]');
  });
});

group('filling from a profile', () => {
  it('tells a title from a name', () => {
    expect(splitTitle('Queen Ysolde III')).toEqual({ title: 'Queen', name: 'Ysolde III' });
    expect(splitTitle('First Minister Corin Ashdale')).toEqual({ title: 'First Minister', name: 'Corin Ashdale' });
    expect(splitTitle('Ines Tarrow')).toEqual({ title: '', name: 'Ines Tarrow' });
    expect(splitTitle('King')).toEqual({ title: '', name: 'King' });
  });

  it('maps every section it reads onto fields', () => {
    const { country, used } = fromProfile(calderwyn, SITE);
    expect(country).toMatchObject({
      common: 'Calderwyn',
      official: 'Kingdom of Calderwyn',
      capital: 'Haldermouth',
      largest: 'Haldermouth',
      demonym: 'Calderwynian',
      motto: 'By tide and by lantern',
      languages: 'Calderwynian, Low Eskish',
      anthem: 'Lanterns on the Water',
      government: 'Parliamentary constitutional monarchy',
      leaderTitle1: 'Queen',
      leaderName1: 'Ysolde III',
      leaderTitle2: 'First Minister',
      leaderName2: 'Corin Ashdale',
      legislature: 'The Moot',
      population: '12480000',
      area: '148300',
      gdp: '512000000000',
      currency: 'Calder mark',
      currencyCode: 'CWM',
      dateFormat: 'Lantern Reckoning (LR)',
      drivesOn: 'left',
    });
    expect(used.sort()).toEqual(['anthem', 'bank', 'calendar', 'cities', 'government', 'identity', 'stats', 'wiki']);
  });

  it('leaves alone what the profile lacks', () => {
    const [, , vantmoor, hesperwick] = all;
    expect(hesperwick!.country).toEqual({ ...defaults, common: 'Hesperwick' });
    // One person holds both offices: named once.
    expect(vantmoor!.country).toMatchObject({ leaderTitle1: 'President', leaderName1: 'Ines Tarrow', leaderTitle2: '', leaderName2: '' });
  });

  it('falls back on the dynasty for a head of state, and on the seats for a legislature', () => {
    const profile = { meta: calderwyn.meta, dynasty: { monarch: 'Queen Ysolde III' }, seats: { chamber: 'The Moot' } } as unknown as EurthProfile;
    expect(fromProfile(profile, SITE).country).toMatchObject({ leaderTitle1: 'Queen', leaderName1: 'Ysolde III', legislature: 'The Moot' });
  });

  it('finds the flag and the arms, and only takes SVG', () => {
    expect(pictures(calderwyn).flag).toMatch(/^<svg/);
    expect(pictures(calderwyn).arms).toMatch(/^<svg/);
    expect(pictures(null)).toEqual({ flag: '', arms: '' });
    expect(pictures({ meta: calderwyn.meta, flag: { svg: 'javascript:alert(1)' } } as unknown as EurthProfile).flag).toBe('');
  });

  it('survives a profile full of the wrong kinds of thing', () => {
    const odd = { meta: { schema: 1, nation: 7, updated: 'never' }, identity: 'no', stats: { population: 'lots' }, cities: { list: [null, 3, { name: 5 }] }, wiki: { drivesOn: 'up', link: 12 } } as unknown as EurthProfile;
    expect(fromProfile(odd, SITE).country).toEqual(defaults);
  });
});

group('saving to a profile', () => {
  const now = new Date('2026-11-14T22:00:00Z');

  it('writes identity and wiki, and leaves every other section exactly as it was', () => {
    const { country } = fromProfile(calderwyn, SITE);
    const saved = toProfile(calderwyn, { ...country, callingCode: '+47', timeZone: 'UTC+0', tld: '.cw' }, SITE, { now })!;
    for (const key of Object.keys(calderwyn)) {
      if (!['meta', 'identity', 'wiki'].includes(key)) expect(saved[key]).toBe(calderwyn[key]);
    }
    expect(getSection(saved, 'identity')).toMatchObject({ commonName: 'Calderwyn', officialName: 'Kingdom of Calderwyn', capital: 'Haldermouth', languages: ['Calderwynian', 'Low Eskish'] });
    expect(getSection(saved, 'wiki')).toMatchObject({ drivesOn: 'left', callingCode: '+47', timeZone: 'UTC+0', internetDomain: '.cw', updated: '2026-11-14T22:00:00.000Z' });
    expect(validateProfile(saved).ok).toBe(true);
  });

  it('keeps keys in its own sections that it doesn’t know', () => {
    const profile = { ...calderwyn, wiki: { ...(calderwyn.wiki as object), futureField: 'kept' } } as EurthProfile;
    expect(getSection(toProfile(profile, fromProfile(profile, SITE).country, SITE, { now })!, 'wiki')).toMatchObject({ futureField: 'kept' });
  });

  it('starts a new profile when there is none, and none at all without a name', () => {
    const saved = toProfile(null, teland, SITE, { now })!;
    expect(saved.meta.nation).toBe('Teland');
    expect(Object.keys(saved)).toEqual(['meta', 'identity', 'wiki']);
    expect(validateProfile(saved).ok).toBe(true);
    expect(toProfile(null, defaults, SITE)).toBeNull();
  });

  it('brings the whole design back from the profile it saved', () => {
    const saved = toProfile(null, teland, SITE, { now })!;
    expect(fromProfile(saved, SITE).country).toEqual(teland);
  });

  it('only ever loads a design from a link to this tool', () => {
    const link = designLink(teland, SITE);
    expect(link.startsWith('https://wiki.eurth.org/?d=1.')).toBe(true);
    expect(fromLink(link, SITE)).toEqual(teland);
    expect(fromLink(link.replace('wiki.eurth.org', 'wiki.eurth.org.example.com'), SITE)).toBeNull();
    expect(fromLink('https://wiki.eurth.org/?d=nonsense', SITE)).toBeNull();
    expect(fromLink(42, SITE)).toBeNull();
  });

  it('drops what the profile can’t hold rather than save a file that won’t load', () => {
    const long = clean({ common: 'Teland', languages: Array.from({ length: 30 }, (_, i) => `Language ${i}`).join(', ') });
    const saved = toProfile(null, long, SITE, { now })!;
    expect(validateProfile(saved).ok).toBe(true);
    expect((getSection(saved, 'identity') as { languages: string[] }).languages.length).toBeLessThanOrEqual(20);
  });
});

group('every example', () => {
  it.each(all.map((e) => [e.name, e] as const))('%s: wikitext that a wiki can read', (_name, example) => {
    for (const target of ['sandbox', 'live'] as const) {
      const text = pageSkeleton(example.country, { target });
      // Braces, brackets and comments all pair up.
      expect(text.split('{{').length).toBe(text.split('}}').length);
      expect(text.split('[[').length).toBe(text.split(']]').length);
      expect(text.split('<!--').length).toBe(text.split('-->').length);
      expect(text).not.toMatch(/undefined|null|NaN|\[object/);
    }
    const box = infoboxWikitext(example.country).split('\n');
    for (const text of box.slice(1, -1)) expect(text).toMatch(/^\| \w+ += \S/);
    expect(describe(example.country)).toMatch(/\.$/);
  });

  it('a saved profile of each still passes the schema', () => {
    for (const example of all) {
      const saved = toProfile(example.profile ?? null, example.country, SITE);
      expect(saved && validateProfile(saved).ok).toBe(true);
    }
  });
});
