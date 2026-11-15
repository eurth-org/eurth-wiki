# Wiki

> A friendly note: Wiki is part of Eurth's advent calendar, and its door opens on 23 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Wiki turns a nation's details into a ready-to-paste country page and infobox for [IIWiki](https://iiwiki.com), the wiki Eurth's members use. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at wiki.eurth.org.

It follows Orioni's "Eurth country setup" tutorial, kept here as [docs/sandbox-7.wiki](docs/sandbox-7.wiki): the same infobox fields under the same headings, the same sections in the same order, and the same steps after the page. What's planned and what each release added is in the [roadmap](roadmap.md). The shared rules are in the handbook, `node_modules/@eurth/style/HANDBOOK.md`; on anything the tools share, the handbook wins.

## Use

1. Load your nation's profile file (`<nation>.eurth.json`) if you have one, or start typing. Names, flag, arms, government, numbers, currency and calendar come in from the profile; everything stays editable.
2. Watch the preview build itself, row by row, as the wiki will draw it.
3. Choose "For my sandbox" (no footer navboxes, no category, so a draft stays out of the Eurth tracker) or "For the live page" (with them).
4. Copy the infobox, or the whole page skeleton with the tutorial's prompt under every heading, and paste it into the wiki's editor.
5. Download the flag and the arms under the file names the infobox asks for, and upload them to the wiki.
6. Finish the setup with the snippets under "After the page": the flag's category, the country-flag shortcut, the country category and the lists.

The link holds everything you typed, so copying the link is saving. "Save profile" writes the nation's profile file for the other Eurth tools. Nothing is stored in the browser and nothing is sent anywhere: the tool never contacts the wiki.

## Development

Astro needs Node 22.23 or later (CI runs on Node 26).

```sh
npm install          # then commit package-lock.json
npm run dev          # the site while you work
npm run check        # types, in pages and components
npm run build        # the static site, into dist/
npm test             # the tool's own tests and the suite's checks (they read dist/)
npm run axe          # accessibility: every page, both themes
npm run smoke        # the built site in real Chrome: theme, nothing stored, offline
npm run preview      # the built site with its real headers (wrangler dev)
npm run images       # icons and the sharing image, after changing them
```

- `docs/sandbox-7.wiki`: the tutorial, as pasted. A test reads it and holds the field list and the sections to it, so change the tutorial and the list together.
- `src/wiki/fields.ts`: every infobox field: its parameter, group, label and help. The form, the wikitext, the preview and the link are all driven by it. Never rename a parameter: links read by it.
- `src/wiki/infobox.ts`: from a country to its infobox, as wikitext and as the rows the preview draws. `src/wiki/page.ts`: the page skeleton and the IIWiki conventions (images, links, sandbox or live). `src/wiki/setup.ts`: the steps after the page.
- `src/wiki/profile.ts`: what a profile fills in and what Wiki writes back. Wiki owns the `identity` and `wiki` sections and leaves every other section as it found it.
- `src/wiki/model.ts`: the state, how a link is read back safely, and the number handling. `src/wiki/examples.ts` and `teland.ts`: the example countries.
- `src/ui/Creator.svelte`: the tool itself. `src/pages/`: the creator, the examples, the guide, the glossary and the 404 page.
- `tests/wiki.test.ts`: this tool's own tests. `tests/shell.test.js`: the checks every Eurth tool runs.
- `eurth.config.mjs`: the tool's name, address, title and pages. Build time only. `LAUNCH_AT`: the moment the door opens.

## Deployment

The site runs as a Cloudflare Worker serving static assets on its custom domain (`wrangler.jsonc`). Until the door opens it isn't deployed anywhere. The launch workflow opens the door at the time in `LAUNCH_AT`; after that, GitHub Actions deploys every push to `main` that passes, and a nightly run keeps `@eurth/style` and `@eurth/profile` up to date. Deploying uses the organisation secret `CLOUDFLARE_API_TOKEN`.

## Releasing

1. Move what's done out of "Next" in [roadmap.md](roadmap.md) and add a dated section for the release, newest first.
2. Set the version in `package.json` and run `npm install` so the lockfile follows.
3. `npm run check && npm run build && npm test && npm run axe && npm run smoke`. Commit and push.

## Licence

Made by Orioni for Eurth. Apache 2.0, see [LICENSE](LICENSE).
