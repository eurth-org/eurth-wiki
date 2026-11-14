/**
 * The page around the infobox: an opening sentence, the sections a country article has, each
 * with a one-line prompt for what goes in it, and the footer. Two outputs: "for my sandbox"
 * leaves the footer navboxes and the categories out, so a draft stays out of the Eurth tracker;
 * "for the live page" puts them back.
 *
 * PROVISIONAL: the sections, their order and their prompts are to follow User:Orioni/Sandbox 7.
 * Until it is in docs/, these are the sections of a standard country article. The IIWiki
 * conventions below (images, links, the two outputs) are from the brief and are settled.
 */
import { infoboxWikitext, nameOf, pageTitle, plain, wikiLink, wikiValue } from './infobox';
import { parseNumber, roundly, type Country } from './model';

export type Target = 'sandbox' | 'live';

export const TARGETS: readonly { id: Target; label: string; help: string }[] = [
  { id: 'sandbox', label: 'For my sandbox', help: 'No footer navboxes and no categories, so the draft stays out of the Eurth tracker.' },
  { id: 'live', label: 'For the live page', help: 'With the Eurth navbox, your nation\'s own navbox and the categories.' },
];

export interface Section {
  title: string;
  /** What goes in it, in one line. Written into the skeleton as a comment the wiki doesn't show. */
  prompt: string;
  sections?: Section[];
}

/** The sections of a country page, in order. `{name}` is the country's common name. */
export const SECTIONS: readonly Section[] = [
  { title: 'Etymology', prompt: 'Where the name {name} comes from and what it means. Two or three sentences are plenty.' },
  { title: 'History', prompt: 'The story of {name} in order: origins, the turning points, the present day. Link the main events once each.' },
  {
    title: 'Geography',
    prompt: 'Where {name} lies on Eurth, its neighbours, its coasts, mountains and rivers. A map belongs here.',
    sections: [{ title: 'Climate', prompt: 'The climate zones and the seasons, and how they shape daily life.' }],
  },
  {
    title: 'Politics',
    prompt: 'How {name} is governed: the constitution, who holds power and how they get it.',
    sections: [
      { title: 'Administrative divisions', prompt: 'The provinces, states or regions, in a short list or table.' },
      { title: 'Foreign relations', prompt: 'Allies, rivals and the organisations {name} belongs to.' },
      { title: 'Military', prompt: 'The branches of the armed forces, their size and their role.' },
    ],
  },
  {
    title: 'Economy',
    prompt: 'What {name} makes, grows and trades, and how well people live from it.',
    sections: [{ title: 'Infrastructure', prompt: 'Roads, railways, ports, energy and communications.' }],
  },
  {
    title: 'Demographics',
    prompt: 'Who lives in {name}: how many, where, and how that is changing.',
    sections: [
      { title: 'Languages', prompt: 'What is spoken, officially and at home.' },
      { title: 'Religion', prompt: 'The faiths people follow, with rough shares.' },
      { title: 'Education', prompt: 'Schools, universities and literacy.' },
    ],
  },
  {
    title: 'Culture',
    prompt: 'What life in {name} looks, sounds and tastes like: arts, food, holidays, sport.',
  },
  { title: 'See also', prompt: 'A short list of related pages that aren\'t linked above.' },
  { title: 'References', prompt: 'Leave the template below as it is: it lists the notes from the text.' },
];

/**
 * An image as IIWiki takes it. Only "250px" and "thumb" work there, with the picture on the
 * left or the right.
 */
export function imageLink(file: string, caption: string, side: 'left' | 'right' = 'right'): string {
  const name = pageTitle(file.replace(/^\s*(file|image)\s*:/i, ''));
  if (!name) return '';
  const text = wikiValue(caption);
  return `[[File:${name}|250px|thumb|${side}${text ? `|${text}` : ''}]]`;
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Links each page once in a section: its first mention becomes a link, later ones stay plain.
 * A page the section already links is left alone, and text inside an existing link, a template
 * or a comment is never touched. Call it once per section: the rule is "once at the start of
 * every section it appears in, never twice in one section".
 */
export function linkOnce(section: string, pages: readonly string[]): string {
  let text = section;
  // Longest names first, so "New Selunna" isn't caught by "Selunna".
  const names = [...new Set(pages.map(pageTitle).filter(Boolean))].sort((a, b) => b.length - a.length);
  for (const name of names) {
    const linked = new RegExp(`\\[\\[\\s*${escapeRegExp(name)}\\s*(\\||\\]\\])`, 'i');
    if (linked.test(text)) continue;
    // Split out what must not change; link the first whole-word mention in what's left.
    const parts = text.split(/(\[\[[^\]]*\]\]|\{\{[^}]*\}\}|<!--[\s\S]*?-->)/);
    const mention = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(name)})(?![\\p{L}\\p{N}])`, 'u');
    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i]!;
      if (mention.test(part)) {
        parts[i] = part.replace(mention, (_all, before: string, found: string) => `${before}[[${found}]]`);
        break;
      }
    }
    text = parts.join('');
  }
  return text;
}

const fill = (prompt: string, name: string): string => prompt.replaceAll('{name}', name || 'your country');

/** A comment the wiki doesn't show. A comment can't hold "--", so dashes are thinned out. */
const comment = (text: string): string => `<!-- ${text.replace(/-{2,}/g, '-')} -->`;

/** The opening lines of the article, from what the form holds. */
export function lead(c: Country): string {
  const name = nameOf(c);
  if (!name) return comment('Open with one sentence that says what and where your country is.');
  const official = pageTitle(c.official);
  const government = plain(wikiValue(c.government));
  const article = /^[aeiou]/i.test(government) ? 'an' : 'a';
  let text = `'''${name}'''`;
  if (official && official.toLowerCase() !== name.toLowerCase()) text += `, officially the '''${official.replace(/^the\s+/i, '')}''',`;
  text += ` is ${government ? `${article} ${government.charAt(0).toLowerCase()}${government.slice(1)}` : 'a country'} on Eurth.`;
  const capital = plain(wikiLink(c.capital));
  const largest = plain(wikiLink(c.largest));
  if (capital) {
    text += capital.toLowerCase() === largest.toLowerCase() ? ` Its capital and largest city is ${capital}.` : ` Its capital is ${capital}${largest ? `, and its largest city is ${largest}` : ''}.`;
  }
  const population = parseNumber(c.population);
  if (population !== null && population > 0) text += ` About ${roundly(population)} people live there.`;
  // Each page linked once, at its first mention.
  return linkOnce(text, ['Eurth', capital, largest]);
}

const heading = (title: string, level: number): string => `${'='.repeat(level)} ${title} ${'='.repeat(level)}`;

function sections(list: readonly Section[], name: string, level: number): string[] {
  const out: string[] = [];
  for (const s of list) {
    out.push(heading(s.title, level), comment(fill(s.prompt, name)));
    if (s.title === 'References') out.push('{{reflist}}');
    out.push('');
    if (s.sections) out.push(...sections(s.sections, name, level + 1));
  }
  return out;
}

/** The footer of a live page: the Eurth navbox, the nation's own, and the categories. */
export function footer(c: Country): string {
  const name = nameOf(c);
  return ['{{Eurth}}', ...(name ? [`{{${name}}}`] : []), '', ...(name ? [`[[Category:${name}]]`] : []), '[[Category:Eurth]]'].join('\n');
}

export interface PageOptions {
  target?: Target;
  /** Put the infobox at the top of the page (default: yes). */
  infobox?: boolean;
}

/** The whole page as wikitext: infobox, opening, sections with their prompts, and the footer if it is for the live page. */
export function pageSkeleton(c: Country, { target = 'sandbox', infobox = true }: PageOptions = {}): string {
  const name = nameOf(c);
  const out: string[] = [];
  if (infobox) out.push(infoboxWikitext(c));
  out.push(lead(c), '');
  out.push(comment('Pictures: only this form works on IIWiki, on the left or the right: [[File:Example.png|250px|thumb|right|Caption]]'));
  out.push(comment('Links: link a page once at the start of each section it appears in, never twice in one section.'), '');
  out.push(...sections(SECTIONS, name, 2));
  if (target === 'live') out.push(footer(c));
  else out.push(comment('Sandbox draft: the footer navboxes and categories are left out on purpose. Switch to "For the live page" when you move it.'));
  return `${out.join('\n').trimEnd()}\n`;
}
