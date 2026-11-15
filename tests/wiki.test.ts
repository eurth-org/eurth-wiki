import { getSection, validateProfile, type EurthProfile } from '@eurth/profile';
import calderwynFile from '@eurth/profile/examples/calderwyn.eurth.json';
import { decodeState, encodeState } from '@eurth/style';
import { readFileSync } from 'node:fs';
import { describe as group, expect, it } from 'vitest';
import { examples, teland } from '../src/wiki/examples';
import { FIELDS, GROUPS, fieldsOf } from '../src/wiki/fields';
import { autos, describe, entries, fileName, infoboxWikitext, plain, preview, tidyFile, wikiLink, wikiValue } from '../src/wiki/infobox';
import { clean, compact, defaults, formatMoney, formatNumber, isEmpty, parseNumber, roundly } from '../src/wiki/model';
import { GALLERY, OPENING, SECTIONS, footer, imageLink, lead, leaders, linkOnce, pageSkeleton } from '../src/wiki/page';
import { designLink, fromLink, fromProfile, pictures, splitTitle, toProfile } from '../src/wiki/profile';
import { PLACEHOLDER, steps } from '../src/wiki/setup';

const SITE = 'https://wiki.eurth.org';
const calderwyn = calderwynFile as unknown as EurthProfile;
const all = examples(SITE);
const tutorial = readFileSync(new URL('../docs/sandbox-7.wiki', import.meta.url), 'utf8');
/** The tutorial's own template: from "{{Infobox country" to the "}}" that closes it. */
const template = tutorial.slice(tutorial.indexOf('{{Infobox country'), tutorial.indexOf('{{Under construction}}'));

group('the field list follows Sandbox 7', () => {
  const inTutorial = [...template.matchAll(/^ \| (\w+) =/gm)].map((m) => m[1]!);

  it('has every parameter of the tutorial’s infobox, in the tutorial’s order, and no others', () => {
    expect(inTutorial.length).toBeGreaterThan(100);
    expect(FIELDS.map((f) => f.param)).toEqual(inTutorial);
  });

  it('groups them under the tutorial’s headings', () => {
    const headings = [...template.matchAll(/^<!-- ([A-Z]+) -->$/gm)].map((m) => m[1]!);
    // The tutorial misspells one heading ("GEOGRAHY"); the tool spells it out.
    expect(GROUPS.map((g) => g.label.toUpperCase())).toEqual(headings.map((h) => (h === 'GEOGRAHY' ? 'GEOGRAPHY' : h)));
    let current = '';
    const groupOf = new Map<string, string>();
    for (const text of template.split('\n')) {
      const heading = /^<!-- ([A-Z]+) -->$/.exec(text);
      if (heading) current = heading[1] === 'GEOGRAHY' ? 'GEOGRAPHY' : heading[1]!;
      const param = /^ \| (\w+) =/.exec(text);
      if (param) groupOf.set(param[1]!, current);
    }
    for (const f of FIELDS) expect(GROUPS.find((g) => g.id === f.group)!.label.toUpperCase()).toBe(groupOf.get(f.param));
  });

  it('gives every field a label and help text that is a sentence, and every group something to show at once', () => {
    for (const f of FIELDS) {
      expect(f.label.length).toBeGreaterThan(2);
      expect(f.help).toMatch(/^[A-Z"].*[.:"”]$/);
    }
    for (const g of GROUPS) expect(fieldsOf(g.id).some((f) => !f.more)).toBe(true);
  });

  it('has the tutorial’s sections in the tutorial’s order', () => {
    const page = tutorial.slice(tutorial.indexOf('{{Under construction}}'), tutorial.indexOf('{{hidden end}}'));
    const headings = [...page.matchAll(/^== (.+) ==$/gm)].map((m) => m[1]);
    expect([...SECTIONS.map((s) => s.title), 'References']).toEqual(headings);
    for (const prompt of OPENING) expect(page).toContain(prompt);
    expect(page).toContain(GALLERY);
    // The prompts are the tutorial's words; two were tidied (a slip in Geography, a repeat in Culture).
    for (const s of SECTIONS.filter((s) => !['Geography', 'Culture'].includes(s.title))) expect(page).toContain(s.prompt);
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
    expect(clean({ common_name: 'Orioni', conventional_long_name: 7, drives_on: 'sideways', unknown: 'dropped' })).toEqual({ ...defaults, common_name: 'Orioni', conventional_long_name: '7' });
    expect(clean({ common_name: 'x'.repeat(500) }).common_name).toHaveLength(80);
    expect(clean({ common_name: 'Tel\nand\u0000' }).common_name).toBe('Tel and ');
    expect(clean({ drives_on: 'left' }).drives_on).toBe('left');
    expect(clean(JSON.parse('{"__proto__":{"common_name":"Sneaky"}}')).common_name).toBe('');
    expect(Object.keys(clean({ status: 'x', toString: 'y' }))).toEqual(FIELDS.map((f) => f.param));
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
  it('turn a loose pipe into {{!}} and leave whole links, templates and references alone', () => {
    expect(wikiValue('North | South')).toBe('North {{!}} South');
    expect(wikiValue('[[Selunna|the capital]] and {{small|more}}')).toBe('[[Selunna|the capital]] and {{small|more}}');
    expect(wikiValue('71%<ref>Census of 2025</ref>')).toBe('71%<ref>Census of 2025</ref>');
    expect(wikiValue('Text<ref name="c" /> and <sup>a</sup>')).toBe('Text<ref name="c" /> and <sup>a</sup>');
  });

  it('disarm braces, brackets and tags that don’t pair up', () => {
    expect(wikiValue('Teland}}')).toBe('Teland&#125;&#125;');
    expect(wikiValue('{{Infobox')).toBe('&#123;&#123;Infobox');
    expect(wikiValue('[[Selunna')).toBe('&#91;&#91;Selunna');
    expect(wikiValue('}} | {{')).toBe('&#125;&#125; {{!}} &#123;&#123;');
    expect(wikiValue('gone <!-- and so is the rest')).toBe('gone &lt;!-- and so is the rest');
    expect(wikiValue('<nowiki>never closed')).toBe('&lt;nowiki>never closed');
    expect(wikiValue('<ref>never closed')).toBe('&lt;ref>never closed');
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
    expect(plain('71%<ref>Census of 2025</ref> <sup>a</sup>')).toBe('71% a');
    expect(plain('{{abbr|yyyy|year}}-{{abbr|mm|month}} ([[Anno Domini|AD]])')).toBe('yyyy-mm (AD)');
  });
});

group('image files', () => {
  it('are named as the tutorial names them', () => {
    expect(fileName('flag', 'Teland')).toBe('Flag of Teland.png');
    expect(fileName('arms', 'Teland')).toBe('Coat of arms of Teland.png');
    expect(fileName('map', 'Teland')).toBe('Map of Teland.png');
    expect(fileName('flag', 'Teland', 'svg')).toBe('Flag of Teland.svg');
    expect(fileName('flag', '')).toBe('');
    expect(fileName('flag', 'A/B: [C]')).toBe('Flag of A B C.png');
  });

  it('lose a "File:" in front and characters a title can’t hold', () => {
    expect(tidyFile('File:Teland flag.svg')).toBe('Teland flag.svg');
    expect(tidyFile('image: Arms|of#Teland.png')).toBe('Arms of Teland.png');
  });
});

group('the infobox', () => {
  it('is ready to paste: one parameter a line, under the tutorial’s headings', () => {
    expect(infoboxWikitext(teland)).toBe(`{{Infobox country
<!-- NAMES -->
| conventional_long_name   = Republic of Teland
| common_name              = Teland
<!-- SYMBOLS -->
| image_flag               = Flag of Teland.png
| alt_flag                 = Flag of Teland
| image_coat               = Coat of arms of Teland.png
| alt_coat                 = Coat of arms of Teland
| symbol_type              = Coat of arms
| national_motto           = "Steady against the tide"
<!-- GEOGRAPHY -->
| image_map                = Map of Teland.png
| map_width                = 275px
| alt_map                  = Map of Teland
| map_caption              = Map of Teland
| capital                  = [[Selunna]]
| largest_city             = capital
<!-- DEMOGRAPHICS -->
| official_languages       = Telandic
| demonym                  = Telandic
<!-- POLITICS -->
| government_type          = Parliamentary republic
| leader_title1            = President
| leader_name1             = Maelin Ostrevin
| leader_title2            = Prime Minister
| leader_name2             = Aerin Kalluna
| legislature              = National Assembly
<!-- HISTORY -->
| sovereignty_type         = Independence
| established_event1       = Founding of Selunna
| established_date1        = 1184
| established_event2       = Republic declared
| established_date2        = 12 March 1871
<!-- STATISTICS -->
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
| utc_offset               = +1
| date_format              = dd-mm-yyyy
| drives_on                = right
| cctld                    = .tl
| calling_code             = +42
}}`);
  });

  it('fills in what the tutorial’s template fills in with the page’s name, and says which lines those are', () => {
    expect(autos(clean({ common_name: 'Teland' }))).toEqual({
      conventional_long_name: 'Teland',
      common_name: 'Teland',
      image_flag: 'Flag of Teland.png',
      alt_flag: 'Flag of Teland',
      image_coat: 'Coat of arms of Teland.png',
      alt_coat: 'Coat of arms of Teland',
      symbol_type: 'Coat of arms',
      image_map: 'Map of Teland.png',
      map_width: '275px',
      alt_map: 'Map of Teland',
      map_caption: 'Map of Teland',
    });
    expect(autos(defaults)).toEqual({});
    const list = entries(clean({ common_name: 'Teland', image_flag: 'Teland flag.svg' }));
    expect(list.find((e) => e.param === 'image_flag')).toMatchObject({ value: 'Teland flag.svg', auto: false });
    expect(list.find((e) => e.param === 'image_coat')).toMatchObject({ value: 'Coat of arms of Teland.png', auto: true });
  });

  it('leaves out what is empty, and is a valid empty template when everything is', () => {
    expect(infoboxWikitext(defaults)).toBe('{{Infobox country\n}}');
    expect(infoboxWikitext(clean({ capital: 'Selunna' }))).toBe('{{Infobox country\n<!-- GEOGRAPHY -->\n| capital = [[Selunna]]\n}}');
  });

  it('can keep every parameter of the tutorial, to fill in on the wiki later', () => {
    const lines = infoboxWikitext(teland, { blanks: true }).split('\n');
    expect(lines.filter((l) => l.startsWith('| ')).map((l) => /^\| (\w+)/.exec(l)![1])).toEqual(FIELDS.map((f) => f.param));
    expect(lines).toContain('| native_name                 =');
    expect(lines).toContain('| capital                     = [[Selunna]]');
    expect(lines.filter((l) => l.startsWith('<!-- '))).toHaveLength(GROUPS.length);
    for (const l of lines) expect(l).toBe(l.trimEnd());
  });

  it('keeps two different cities apart, each linked, and reads the tutorial’s word "capital"', () => {
    const two = infoboxWikitext(clean({ capital: 'Selunna', largest_city: 'Port Verity' }));
    expect(two).toContain('| capital      = [[Selunna]]');
    expect(two).toContain('| largest_city = [[Port Verity]]');
    expect(infoboxWikitext(clean({ capital: 'Selunna', largest_city: 'Capital' }))).toContain('| largest_city = capital');
    expect(preview(clean({ capital: 'Selunna', largest_city: 'capital' })).rows).toEqual([{ label: 'Capital and largest city', shown: 'Selunna', sub: false, param: 'capital' }]);
  });

  it('puts mottoes and anthems in inverted commas and the native name in italics, as the tutorial asks', () => {
    const text = infoboxWikitext(clean({ common_name: 'Teland', native_name: 'Telandë', national_motto: '"Steady against the tide"', national_anthem: '[[Lanterns on the Water]]' }));
    expect(text).toContain("| native_name            = ''Telandë''");
    expect(text).toContain('| national_motto         = "Steady against the tide"');
    expect(text).toContain('| national_anthem        = "[[Lanterns on the Water]]"');
  });

  it('writes a bare GDP number out in words, and works out the amount per head and the density', () => {
    const list = entries(clean({ common_name: 'Calderwyn', GDP_nominal: '512000000000', population_estimate: '12480000', area_km2: '148300' }));
    const value = (param: string) => list.find((e) => e.param === param)?.value;
    expect(value('GDP_nominal')).toBe('$512 billion');
    expect(value('GDP_nominal_per_capita')).toBe('$41,026');
    expect(value('population_density_km2')).toBe('84.2');
    // What was typed wins over what was worked out.
    expect(entries(clean({ population_estimate: '100', area_km2: '10', population_density_km2: 'about ten' })).find((e) => e.param === 'population_density_km2')).toMatchObject({ value: 'about ten', auto: false });
  });

  it('names a leader without a title by the office', () => {
    expect(infoboxWikitext(clean({ leader_name1: 'Maelin Ostrevin', leader_name2: 'Aerin Kalluna' }))).toBe(
      '{{Infobox country\n<!-- POLITICS -->\n| leader_title1 = Head of state\n| leader_name1  = Maelin Ostrevin\n| leader_title2 = Head of government\n| leader_name2  = Aerin Kalluna\n}}',
    );
  });

  it('can’t be broken out of: every line stays one parameter', () => {
    const hostile = clean({
      common_name: 'Tel}}and',
      conventional_long_name: 'A | B',
      capital: ']] [[Evil',
      national_motto: '}} {{delete}} | x = y',
      official_languages: '{{#invoke:x}}|y',
      religion: 'None <!-- eats the rest',
      footnote_a: '<nowiki>',
      image_flag: 'File:x.png|link=Evil]]',
    });
    const lines = infoboxWikitext(hostile).split('\n');
    expect(lines[0]).toBe('{{Infobox country');
    expect(lines.at(-1)).toBe('}}');
    for (const text of lines.slice(1, -1)) {
      if (/^<!-- [A-Z]+ -->$/.test(text)) continue;
      expect(text).toMatch(/^\| \w+ += \S/);
      const value = text.replace(/^\| \w+ += /, '');
      // No pipe outside a whole link or template, every brace and bracket pairs up, no open tag.
      expect(value.replace(/\[\[[^\]]*\]\]|\{\{[^}]*\}\}/g, '')).not.toMatch(/[|{}[\]]/);
      expect(value).not.toMatch(/<!--|<nowiki/);
    }
  });

  it('adds a line for a country with nobody in it', () => {
    const quiet = clean({ common_name: 'Emptiness', population_estimate: '0' });
    expect(infoboxWikitext(quiet)).toContain('| population_estimate    = 0\n| status                 = very quiet.');
    expect(preview(quiet).rows.at(-1)).toMatchObject({ label: 'Status', shown: 'very quiet.' });
    expect(infoboxWikitext(quiet, { blanks: true })).toContain('= very quiet.');
    expect(infoboxWikitext(clean({ common_name: 'Emptiness' }))).not.toContain('status');
    expect(infoboxWikitext(teland)).not.toContain('status');
  });
});

group('the preview', () => {
  it('shows what the wikitext holds, in the infobox’s order', () => {
    const p = preview(teland);
    expect(p.title).toBe('Republic of Teland');
    expect([p.flagFile, p.armsFile, p.mapFile]).toEqual(['Flag of Teland.png', 'Coat of arms of Teland.png', 'Map of Teland.png']);
    expect(p.top).toEqual([{ label: 'Motto', shown: '"Steady against the tide"', param: 'national_motto' }]);
    expect(p.rows.map((r) => `${r.label}: ${r.shown}`)).toEqual([
      'Capital and largest city: Selunna',
      'Official languages: Telandic',
      'Demonym: Telandic',
      'Government: Parliamentary republic',
      '• President: Maelin Ostrevin',
      '• Prime Minister: Aerin Kalluna',
      'Legislature: National Assembly',
      'Status: Independence',
      '• Founding of Selunna: 1184',
      '• Republic declared: 12 March 1871',
      'Area: 512,000 km²',
      '• Water (%): 2.4',
      'Population (2026 estimate): 48,200,000',
      '• Density: 94.1 per km²',
      'GDP (nominal), 2026: $1.94 trillion',
      '• Per capita: $40,249',
      'Currency: Selun (TLS)',
      'Time zone: UTC+1',
      'Date format: dd-mm-yyyy',
      'Driving side: right',
      'Internet TLD: .tl',
      'Calling code: +42',
    ]);
  });

  it('labels the rarer rows from their own fields', () => {
    const rows = preview(
      clean({
        largest_settlement_type: 'town',
        largest_settlement: 'Marrow',
        languages_type: 'Minority languages',
        languages: 'Low Eskish',
        religion: '71% Lanternist<ref>Census</ref>',
        religion_year: '2025',
        legislature: 'The Moot',
        upper_house: 'House of Elders',
        population_census: '12000000',
        population_census_year: '2020',
        time_zone: 'Calder Time',
        utc_offset: '+0',
      }),
    ).rows.map((r) => `${r.label}: ${r.shown}`);
    expect(rows).toEqual(['Largest town: Marrow', 'Minority languages: Low Eskish', 'Religion (2025): 71% Lanternist', 'Legislature: The Moot', '• Upper house: House of Elders', '• 2020 census: 12,000,000', 'Time zone: Calder Time (UTC+0)']);
  });

  it('is empty for an empty form, so it can build itself row by row', () => {
    expect(preview(defaults)).toEqual({ title: '', top: [], rows: [], flagFile: '', armsFile: '', mapFile: '' });
    expect(preview(clean({ common_name: 'Teland', capital: 'Selunna' })).rows).toHaveLength(1);
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
    expect(describe(clean({ common_name: 'Emptiness', population_estimate: '0' }))).toBe('Emptiness. Population: none. Very quiet.');
  });
});

group('the page skeleton', () => {
  const sandbox = pageSkeleton(teland, { target: 'sandbox' });
  const live = pageSkeleton(teland, { target: 'live' });

  it('opens as the tutorial does: infobox, notice, the opening sentence and three paragraphs to write', () => {
    expect(sandbox.startsWith('{{Infobox country\n')).toBe(true);
    expect(sandbox).toContain('}}\n\n{{Under construction}}\n\n\'\'\'Teland\'\'\', officially known as the Republic of Teland, is a sovereign state in [[CONTINENT]] on [[Eurth]].');
    expect(lead(teland)).toBe(
      "'''Teland''', officially known as the Republic of Teland, is a sovereign state in [[CONTINENT]] on [[Eurth]]. It is bordered by NEIGHBOURINGNATION to the north, NEIGHBOURINGNATION in the east, NEIGHBOURINGNATION to the south, and NEIGHBOURINGNATION in the west. Its capital is [[Selunna]]. About 48.2 million people live there.",
    );
    expect(lead(clean({ common_name: 'Teland' }))).toContain("'''Teland''', officially known as the NATIONTYPE of Teland, is a sovereign state");
    expect(lead(defaults)).toContain("'''COUNTRYNAME'''");
    for (const prompt of OPENING) expect(sandbox).toContain(`\n\n${prompt}\n\n`);
  });

  it('has every section in the tutorial’s order, each with its prompt', () => {
    const headings = [...sandbox.matchAll(/^== (.+) ==$/gm)].map((m) => m[1]);
    expect(headings).toEqual([...SECTIONS.map((s) => s.title), 'References']);
    for (const s of SECTIONS) expect(sandbox).toContain(`== ${s.title} ==\n\n`);
    for (const s of SECTIONS) expect(sandbox).toContain(`${s.prompt}\n\n`);
    expect(sandbox).toContain(`${GALLERY}\n\n== History ==`);
    expect(sandbox).toContain('== References ==\n\n{{Reflist}}\n');
  });

  it('captions the two portraits under Politics with the leaders it knows', () => {
    expect(leaders(teland)).toContain(' | caption1 = President Maelin Ostrevin.\n');
    expect(leaders(teland)).toContain(' | caption2 = Prime Minister Aerin Kalluna.\n');
    expect(leaders(defaults)).toContain(' | caption1 = Head of State.\n');
    expect(leaders(defaults)).toContain(' | caption2 = Head of Government.\n');
    expect(leaders(clean({ leader_name1: 'A|B}} =x' }))).toContain(' | caption1 = A B x.\n');
    expect(sandbox).toContain(`== Politics ==\n\n${leaders(teland)}\n\n(WIP. Government.`);
  });

  it('for the sandbox, leaves out the navboxes and the category', () => {
    expect(sandbox).not.toContain('Eurth topics');
    expect(sandbox).not.toContain('[[Category:');
    expect(sandbox.endsWith('{{Reflist}}\n<!-- Sandbox draft: the footer navboxes and the category are left out on purpose. Switch to "For the live page" when you move it. -->\n')).toBe(true);
  });

  it('for the live page, puts them back as the tutorial has them', () => {
    expect(live.endsWith('== References ==\n\n{{Reflist}}\n{{Template:Eurth topics}}\n[[Category:Teland]]\n')).toBe(true);
    expect(live).not.toContain('Sandbox draft');
    expect(footer(teland, 'Template:Teland topics')).toBe('{{Template:Eurth topics}}\n{{Teland topics}}\n[[Category:Teland]]');
    expect(footer(teland, 'x}}{{y|z')).toBe('{{Template:Eurth topics}}\n{{x y z}}\n[[Category:Teland]]');
    expect(footer(defaults)).toBe('{{Template:Eurth topics}}');
  });

  it('can go without the infobox, or keep its empty lines', () => {
    expect(pageSkeleton(teland, { infobox: false }).startsWith('{{Under construction}}')).toBe(true);
    expect(pageSkeleton(teland, { blanks: true })).toContain('| native_name                 =\n');
  });

  it('keeps comments whole, whatever the name', () => {
    const odd = pageSkeleton(clean({ common_name: 'A--B-->C' }));
    expect(odd.split('<!--').length).toBe(odd.split('-->').length);
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

group('the rest of the setup', () => {
  it('gives the tutorial’s other steps with the name filled in', () => {
    const list = steps(teland);
    expect(list.map((s) => s.id)).toEqual(['flags', 'shortcut', 'flag', 'category', 'lists']);
    const by = Object.fromEntries(list.map((s) => [s.id, s]));
    expect(by.flags!.wikitext).toBe('[[Category:Teland]]');
    expect(by.shortcut!.page).toBe('Template:Country data Teland');
    expect(by.shortcut!.wikitext).toBe('{{ {{{1<noinclude>|country showdata</noinclude>}}}\n| alias = Teland\n| flag alias = Flag of Teland.png\n| size = {{{size|}}}\n| name = {{{name|}}}\n| variant = {{{variant|}}}\n}}');
    expect(by.flag!.wikitext).toBe('{{flag|Teland}}');
    expect(by.category).toMatchObject({ page: 'Category:Teland', wikitext: '{{main|Teland}}\n[[Category:Countries (Eurth)]]' });
    expect(by.lists!.page).toBe('Category:Lists of Eurth');
  });

  it('matches the tutorial’s own snippets, and uses the flag file the infobox uses', () => {
    const blank = Object.fromEntries(steps(defaults).map((s) => [s.id, s]));
    expect(tutorial).toContain(`<pre>${blank.flags!.wikitext}</pre>`);
    expect(tutorial).toContain(`<pre>${blank.flag!.wikitext}</pre>`);
    expect(tutorial).toContain(`<pre>${blank.category!.wikitext}</pre>`);
    expect(blank.shortcut!.page).toBe(`Template:Country data ${PLACEHOLDER}`);
    expect(steps(clean({ common_name: 'Teland', image_flag: 'Flag of Teland.svg' })).find((s) => s.id === 'shortcut')!.wikitext).toContain('| flag alias = Flag of Teland.svg\n');
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
    expect(compact(country)).toEqual({
      conventional_long_name: 'Kingdom of Calderwyn',
      common_name: 'Calderwyn',
      image_flag: 'Flag of Calderwyn.svg',
      image_coat: 'Coat of arms of Calderwyn.svg',
      national_motto: 'By tide and by lantern',
      national_anthem: 'Lanterns on the Water',
      capital: 'Haldermouth',
      largest_city: 'Haldermouth',
      official_languages: 'Calderwynian, Low Eskish',
      demonym: 'Calderwynian',
      government_type: 'Parliamentary constitutional monarchy',
      leader_title1: 'Queen',
      leader_name1: 'Ysolde III',
      leader_title2: 'First Minister',
      leader_name2: 'Corin Ashdale',
      legislature: 'The Moot',
      area_km2: '148300',
      population_estimate: '12480000',
      GDP_nominal: '512000000000',
      currency: 'Calder mark',
      currency_code: 'CWM',
      date_format: 'Lantern Reckoning (LR)',
      drives_on: 'left',
    });
    expect(used.sort()).toEqual(['anthem', 'arms', 'bank', 'calendar', 'cities', 'flag', 'government', 'identity', 'stats', 'wiki']);
  });

  it('leaves alone what the profile lacks', () => {
    const [, , vantmoor, hesperwick] = all;
    expect(compact(hesperwick!.country)).toMatchObject({ common_name: 'Hesperwick' });
    expect(Object.keys(compact(hesperwick!.country)).filter((k) => !k.startsWith('image_'))).toEqual(['common_name']);
    // One person holds both offices: named once.
    expect(vantmoor!.country).toMatchObject({ leader_title1: 'President', leader_name1: 'Ines Tarrow', leader_title2: '', leader_name2: '' });
  });

  it('falls back on the dynasty for a head of state, and on the seats for a legislature', () => {
    const profile = { meta: calderwyn.meta, dynasty: { monarch: 'Queen Ysolde III' }, seats: { chamber: 'The Moot' } } as unknown as EurthProfile;
    expect(fromProfile(profile, SITE).country).toMatchObject({ leader_title1: 'Queen', leader_name1: 'Ysolde III', legislature: 'The Moot' });
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
    const saved = toProfile(calderwyn, { ...country, calling_code: '+47', time_zone: 'Calder Time', utc_offset: '+0', cctld: '.cw' }, SITE, { now })!;
    for (const key of Object.keys(calderwyn)) {
      if (!['meta', 'identity', 'wiki'].includes(key)) expect(saved[key]).toBe(calderwyn[key]);
    }
    expect(getSection(saved, 'identity')).toMatchObject({ commonName: 'Calderwyn', officialName: 'Kingdom of Calderwyn', capital: 'Haldermouth', motto: 'By tide and by lantern', languages: ['Calderwynian', 'Low Eskish'] });
    expect(getSection(saved, 'wiki')).toMatchObject({ drivesOn: 'left', callingCode: '+47', timeZone: 'Calder Time', utcOffset: '+0', internetDomain: '.cw', dateFormat: 'Lantern Reckoning (LR)', updated: '2026-11-14T22:00:00.000Z' });
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
    const full = clean({ ...teland, religion: '71% Lanternist<ref>Census of 2025</ref>', footnote_a: 'Estimate.', HDI: '0.861' });
    const saved = toProfile(null, full, SITE, { now })!;
    expect(fromProfile(saved, SITE).country).toEqual(full);
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
    const long = clean({ common_name: 'Teland', official_languages: Array.from({ length: 30 }, (_, i) => `Language ${i}`).join(', ') });
    const saved = toProfile(null, long, SITE, { now })!;
    expect(validateProfile(saved).ok).toBe(true);
    expect((getSection(saved, 'identity') as { languages: string[] }).languages.length).toBeLessThanOrEqual(20);
    // A form filled to the brim makes a link too long for the profile: it is saved without one.
    const brim = clean(Object.fromEntries(FIELDS.filter((f) => f.kind !== 'choice').map((f) => [f.param, 'x'.repeat(f.max)])));
    const heavy = toProfile(null, brim, SITE, { now })!;
    expect(validateProfile(heavy).ok).toBe(true);
    expect(getSection(heavy, 'wiki')).not.toHaveProperty('link');
  });
});

group('every example', () => {
  it.each(all.map((e) => [e.name, e] as const))('%s: wikitext that a wiki can read', (_name, example) => {
    for (const target of ['sandbox', 'live'] as const) {
      for (const blanks of [false, true]) {
        const text = pageSkeleton(example.country, { target, blanks });
        // Braces, brackets, comments and the gallery all pair up.
        expect(text.split('{{').length).toBe(text.split('}}').length);
        expect(text.split('[[').length).toBe(text.split(']]').length);
        expect(text.split('<!--').length).toBe(text.split('-->').length);
        expect(text.split('<gallery>').length).toBe(text.split('</gallery>').length);
        expect(text).not.toMatch(/undefined|null|NaN|\[object/);
      }
    }
    const box = infoboxWikitext(example.country).split('\n');
    for (const text of box.slice(1, -1)) expect(text).toMatch(/^\| \w+ += \S|^<!-- [A-Z]+ -->$/);
    expect(describe(example.country)).toMatch(/\.$/);
    for (const step of steps(example.country)) expect(step.wikitext ?? '').not.toContain(PLACEHOLDER);
  });

  it('a saved profile of each still passes the schema', () => {
    for (const example of all) {
      const saved = toProfile(example.profile ?? null, example.country, SITE);
      expect(saved && validateProfile(saved).ok).toBe(true);
    }
  });
});
