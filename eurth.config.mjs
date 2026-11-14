// What this tool is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand the component what it needs as props instead.
import { defineSite } from '@eurth/style/build';

export const site = defineSite({
  // The subdomain, and the tool's id in @eurth/style's tools.json.
  id: 'wiki',
  name: 'Wiki',
  url: 'https://wiki.eurth.org',
  // "<Name>: free online <thing> maker for worldbuilders"
  title: 'Wiki: free online wiki country page maker for worldbuilders',
  description: "A free online wiki country page maker for worldbuilders: fill in your nation's details and copy a ready-to-paste infobox and page skeleton for IIWiki. No account needed.",
  tagline: 'Your country, wiki-ready',
  pages: [
    { href: '/', label: 'Creator' },
    { href: '/examples/', label: 'Examples' },
    { href: '/guide/', label: 'Guide' },
    { href: '/glossary/', label: 'Glossary' },
  ],
  repo: 'https://github.com/eurth-org/eurth-wiki',
  ogAlt: 'Wiki, the wiki country page creator by Eurth, at wiki.eurth.org: the Eurth yurt beside a country infobox and its wikitext.',
});
