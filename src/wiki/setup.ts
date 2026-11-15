/**
 * The rest of the tutorial (docs/sandbox-7.wiki), after the country page itself: the flag's
 * category, the country-flag shortcut, the country's category, and the lists. Each step comes
 * with the page to make and the wikitext to paste, with the nation's name already filled in.
 */
import { entries, nameOf } from './infobox';
import type { Country } from './model';

export interface Step {
  id: string;
  title: string;
  /** What to do, in a sentence or two. */
  text: string;
  /** The page on the wiki to create or edit, when the step has one. */
  page?: string;
  /** The wikitext to paste there. */
  wikitext?: string;
}

/** The tutorial's own placeholder, for a country that has no name yet. */
export const PLACEHOLDER = 'REPLACE_THIS_WITH_THE_NATION_NAME';

/** The tutorial's steps after the country page, in its order. */
export function steps(c: Country): Step[] {
  const name = nameOf(c) || PLACEHOLDER;
  const flag = entries(c).find((e) => e.param === 'image_flag')?.value || `Flag of ${name}.png`;
  return [
    {
      id: 'flags',
      title: 'Add the flags',
      text: "The red link to your flag in the infobox opens the image uploader. Upload a PNG or an SVG there, do the same for the arms and the map, and put each image in your country's category with this line in its description.",
      wikitext: `[[Category:${name}]]`,
    },
    {
      id: 'shortcut',
      title: 'Create the country-flag shortcut',
      text: 'This sets up the miniature flag that lists use. Create the page below, paste the wikitext, press "Show preview" to test, then save.',
      page: `Template:Country data ${name}`,
      wikitext: `{{ {{{1<noinclude>|country showdata</noinclude>}}}
| alias = ${name}
| flag alias = ${flag}
| size = {{{size|}}}
| name = {{{name|}}}
| variant = {{{variant|}}}
}}`,
    },
    {
      id: 'flag',
      title: 'Use the shortcut',
      text: "From then on this shows your flag next to your country's name, wherever you paste it.",
      wikitext: `{{flag|${name}}}`,
    },
    {
      id: 'category',
      title: 'Create the country category',
      text: 'One category keeps everything about your country in one place. Create the page below and save it with this wikitext.',
      page: `Category:${name}`,
      wikitext: `{{main|${name}}}\n[[Category:Countries (Eurth)]]`,
    },
    {
      id: 'lists',
      title: 'Add the country to the common lists',
      text: "Add your country to the lists in the category below. Respect each list's rules and keep it sorted: most are in alphabetical order.",
      page: 'Category:Lists of Eurth',
    },
  ];
}
