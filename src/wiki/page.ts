/**
 * The page around the infobox, as docs/sandbox-7.wiki lays it out: the "under construction"
 * notice, the opening sentence, a prompt for each of the three opening paragraphs, then the
 * tutorial's sections in its order, each with its prompt, and the references.
 *
 * Two outputs. "For my sandbox" leaves the footer navboxes and the category out, so a draft
 * stays out of the Eurth tracker; "for the live page" puts them back.
 *
 * The prompts are the tutorial's own words, with a few slips of the pen put right. They are
 * written as the tutorial writes them, in brackets in the text, to be replaced as you go.
 */
import { infoboxWikitext, nameOf, pageTitle, plain, wikiLink, wikiValue, type InfoboxOptions } from './infobox';
import { parseNumber, roundly, type Country } from './model';

export type Target = 'sandbox' | 'live';

export const TARGETS: readonly { id: Target; label: string; help: string }[] = [
  { id: 'sandbox', label: 'For my sandbox', help: 'No footer navboxes and no category, so the draft stays out of the Eurth tracker.' },
  { id: 'live', label: 'For the live page', help: "With the Eurth navbox, your nation's own navbox if you name one, and the category." },
];

export interface Section {
  title: string;
  /** What goes in it: the tutorial's prompt. */
  prompt: string;
}

/** The prompts for the three opening paragraphs. */
export const OPENING: readonly string[] = [
  '(1st paragraph. Name. Location. Borders. Approx population and size. Capital city.)',
  '(2nd paragraph. Political system. Short history in 1 sentence. Link with present in 1 sentence. Head of state.)',
  '(3rd paragraph. Economy in 2 sentences. International relations in 1 sentence.)',
];

/** The tutorial's sections, in its order. */
export const SECTIONS: readonly Section[] = [
  {
    title: 'Etymology',
    prompt:
      "(WIP. Where does your country's name come from? Most RL national names come from a small variety of choice. Some examples: land of a tribe (ex. France, Persia, Mongolia, Russia), characteristic geography (ex. Netherlands, India, Morocco), an old ruler or religious figure (ex. Philippines, San Marino, Europa, Saudi Arabia), the Latin description of a place (ex. Australia, Argentina, Liberia). How is the name pronounced? How is the name translated into other languages?)",
  },
  {
    title: 'Geography',
    prompt:
      '(WIP. Landscape. Climate. Where exactly is your country compared to others on the global map? Describe the landscape, plants, and animals. Which mountains and rivers are important to include? What are the climate and seasons like? How does geography determine where people live? Are there areas separated from one another? How about cities? This will greatly help you with the next part of history.)',
  },
  {
    title: 'History',
    prompt: "(WIP. How did your current country come to be? What were the country's previous incarnations? Was the country part of a union with a neighbour? Which events shaped the way the country is today?)",
  },
  {
    title: 'Politics',
    prompt:
      '(WIP. Government. Separation of powers. Who rules, how, and for how long? Political parties. What levels of government exist? How about the local level? Who makes the laws? Who deals out your justice? Which government services exist? What is the name of your police? How are the armed forces organised? Foreign affairs, alliances, membership of international organisations.)',
  },
  { title: 'Economy', prompt: '(WIP. Employment. Exports and imports. International partners. Currency. Energy. Transportation. Science & technology. Unemployment numbers. Tourism. Media.)' },
  { title: 'Demographics', prompt: '(WIP. Demographics. Ethnic groups. Social classes. Language. Education. Marriage. Religion. Healthcare. Diseases.)' },
  {
    title: 'Culture',
    prompt:
      '(WIP. Cuisine. Literature. Visual arts. Architecture. Entertainment. Music & radio. Television. Local customs. Clothing. Morality. Sports. Stereotypes. Your national symbols such as the flag and national anthem. Public holidays and festivities.)',
  },
];

/** The tutorial's gallery under Geography: five pictures to swap for your own. */
export const GALLERY = `<gallery>
Example.jpg|A stereotypical landscape.
Example.jpg|A wild landscape.
Example.jpg|Close-up of a plant.
Example.jpg|A herbivorous animal.
Example.jpg|A carnivorous animal.
</gallery>`;

/** The tutorial's pair of portraits under Politics, captioned with the leaders when they are known. */
export function leaders(c: Country): string {
  const caption = (n: 1 | 2, fallback: string): string => {
    const name = plain(wikiValue(c[`leader_name${n}`] ?? ''));
    const title = plain(wikiValue(c[`leader_title${n}`] ?? ''));
    const text = name ? `${title ? `${title} ` : ''}${name}` : fallback;
    // Inside a template a caption can't hold a loose pipe, brace, bracket or equals sign.
    return `${text.replace(/[|={}[\]<>]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '')}.`;
  };
  return `{{multiple image
 | align = right
 | total_width = 300
 | image_style = border:none;
 | title =
 | perrow = 2/2
 | caption_align = center
 | image1 = Man Silhouette2.jpg
 | caption1 = ${caption(1, 'Head of State')}
 | image2 = Man Silhouette2.jpg
 | caption2 = ${caption(2, 'Head of Government')}
}}`;
}

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

/** A comment the wiki doesn't show. A comment can't hold "--", so dashes are thinned out. */
const comment = (text: string): string => `<!-- ${text.replace(/-{2,}/g, '-')} -->`;

/**
 * The opening sentence, as the tutorial writes it, with what the form knows filled in. The
 * words in capitals are the tutorial's own placeholders, for you to replace.
 */
export function lead(c: Country): string {
  const name = nameOf(c) || 'COUNTRYNAME';
  const official = pageTitle(c.conventional_long_name ?? '');
  const formal = official && official.toLowerCase() !== name.toLowerCase() ? official.replace(/^the\s+/i, '') : `NATIONTYPE of ${name}`;
  let text = `'''${name}''', officially known as the ${formal}, is a sovereign state in [[CONTINENT]] on [[Eurth]]. It is bordered by NEIGHBOURINGNATION to the north, NEIGHBOURINGNATION in the east, NEIGHBOURINGNATION to the south, and NEIGHBOURINGNATION in the west.`;
  const capital = plain(wikiLink(c.capital ?? ''));
  const population = parseNumber(c.population_estimate ?? '');
  if (capital) text += ` Its capital is ${capital}.`;
  if (population !== null && population > 0) text += ` About ${roundly(population)} people live there.`;
  // Each page linked once, at its first mention.
  return linkOnce(text, [capital]);
}

const heading = (title: string): string => `== ${title} ==`;

export interface PageOptions extends InfoboxOptions {
  target?: Target;
  /** Put the infobox at the top of the page (default: yes). */
  infobox?: boolean;
  /** The name of the nation's own navbox template, if it has one. Only used on the live page. */
  navbox?: string;
}

/** The footer of a live page: the Eurth navbox, the nation's own if it has one, and the category. */
export function footer(c: Country, navbox = ''): string {
  const name = nameOf(c);
  const own = pageTitle(navbox.replace(/^\s*template\s*:/i, ''));
  return ['{{Template:Eurth topics}}', ...(own ? [`{{${own}}}`] : []), ...(name ? [`[[Category:${name}]]`] : [])].join('\n');
}

/**
 * The whole page as wikitext: infobox, opening, the tutorial's sections with their prompts, the
 * references, and the footer if it is for the live page.
 */
export function pageSkeleton(c: Country, { target = 'sandbox', infobox = true, navbox = '', blanks = false }: PageOptions = {}): string {
  const out: string[] = [];
  if (infobox) out.push(infoboxWikitext(c, { blanks }), '');
  out.push('{{Under construction}}', '', lead(c), '');
  for (const prompt of OPENING) out.push(prompt, '');
  out.push(comment('Pictures in the text: only this form works on IIWiki, on the left or the right: [[File:Example.png|250px|thumb|right|Caption]]'));
  out.push(comment('Links: link a page once at the start of each section it appears in, never twice in one section.'), '');
  for (const s of SECTIONS) {
    out.push(heading(s.title), '');
    if (s.title === 'Politics') out.push(leaders(c), '');
    out.push(s.prompt, '');
    if (s.title === 'Geography') out.push(GALLERY, '');
  }
  out.push(heading('References'), '', '{{Reflist}}');
  if (target === 'live') out.push(footer(c, navbox));
  else out.push(comment('Sandbox draft: the footer navboxes and the category are left out on purpose. Switch to "For the live page" when you move it.'));
  return `${out.join('\n').trimEnd()}\n`;
}
