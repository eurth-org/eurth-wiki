# Roadmap

Wiki turns a nation's details into a ready-to-paste country page and infobox for IIWiki, at wiki.eurth.org. It is door 14 of Eurth's 2026 advent calendar and opens on 23 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned. Points from reviews are in the [feedback log](docs/feedback-log.md).

## Where to pick up

**15 November 2026.** The tool is built and follows Sandbox 7 (`docs/sandbox-7.wiki`). `npm run check`, `npm run build`, `npm test` (125 tests), `npm run axe` and `npm run smoke` all pass on @eurth/style 1.2.0 and @eurth/profile 1.0.1, which the nightly run brought in. The smoke test (the built site in real Chrome) and the component type check (`svelte-check`) are new in the handbook since 1.1.0 and are in `package.json`. It is not deployed and won't be until its door: the launch workflow does that on 22 December at 22:30 UTC.

The paste test is done. On 15 November 2026 Stijn pasted the whole page of all four examples (Teland, Calderwyn, Vantmoor, Hesperwick) into a sandbox on IIWiki, and each renders fine; Teland's live-page output previews fine too, with the `{{Template:Eurth topics}}` navbox. With the handbook's checks passing, that is the brief's "done". What's left is the two open questions below and what's under "Next".

On this machine Astro needs Homebrew's Node: put `/opt/homebrew/bin` first on `PATH`. To look at the built site: `npx wrangler dev --port 8823`.

Waiting on others:

- **Stijn, two answers** (see "Open questions").
- **@eurth/profile, new fields for the `wiki` section.** Wiki keeps five everyday details there that the schema doesn't describe yet: `callingCode`, `timeZone`, `utcOffset`, `internetDomain` and `dateFormat`, each a text of at most 80 characters. The profile keeps unknown keys, so this works today. Asked for on 16 November 2026 in [eurth-org/eurth-profile#3](https://github.com/eurth-org/eurth-profile/issues/3): a minor release there, and nothing in Wiki has to change when it lands.

## Open questions

1. **The nation's own navbox.** The brief says the live page adds it; Sandbox 7 has none. For now it is a text box on the live page, empty by default, so no page gets a red link. Is there a naming rule (such as "Teland topics") that would let Wiki fill it in?
2. **"Under construction".** Sandbox 7 puts the notice on every new page, so both outputs carry it. Should the live page drop it?

## Next

- **Examples with their pictures:** an example opened from the Examples page comes without its flag and arms, because a link holds text only. Offer the example profiles as files to load, once the hub is live.
- **Languages as links:** official languages go out as plain text. Sandbox 7 doesn't say whether to link them.
- **More than two leaders and events:** the form has two of each, as Sandbox 7 does; the template takes more.
- **Lighthouse on the real address** after the door opens, and delete the launch workflow once the site is live.

## 15 November 2026: 0.1.0

The first build. Not launched: the door opens on 23 December 2026.

- **The creator:** a form with every field of Sandbox 7's infobox, 109 of them, under its eight headings (names, symbols, geography, demographics, politics, history, statistics, footnotes), with help text drawn from the tutorial's comments. The rarer fields sit under "More fields".
- **The infobox as wikitext:** one parameter a line under the tutorial's headings, with what the tutorial fills in from the page's name filled in from the form (image file names, their texts for screen readers, the map's width), mottoes and anthems in inverted commas, the native name in italics, "capital" for a largest city that is the capital, and the density and GDP per head worked out. Optionally with every empty line kept, to fill in on the wiki later.
- **A live preview** that looks like a wiki infobox, light in either theme, and builds itself row by row as fields fill in: the signature touch.
- **The page skeleton:** the tutorial's page, with its notice, opening sentence, three paragraphs to write, seven sections with their prompts, the gallery, the two leader portraits (captioned from the form) and the references.
- **Two outputs:** "for my sandbox" without the footer navboxes and the category, "for the live page" with them.
- **The rest of the setup:** the flag's category line, the country-flag shortcut, the country category and the lists, each with its wikitext and the nation's name filled in.
- **Fill from a profile:** identity, flag, arms, government, seats, stats, bank, calendar, dynasty, cities and anthem all map onto fields; Wiki writes `identity` and `wiki` and leaves every other section untouched.
- **Exports:** Copy wikitext, Copy page skeleton, the flag and arms from the profile under their wiki names (SVG, or PNG if the file name says so), Copy description, Copy link and the share dialog.
- **IIWiki conventions:** images only as `|250px|thumb|` on the left or right; a page linked once per section.
- **Safe wikitext:** whatever is typed or arrives in a link stays inside its own parameter: loose pipes, unpaired braces and brackets, and unclosed comments and tags are disarmed.
- **Pages:** Creator, Examples (four invented nations), Guide (the tutorial, rewritten for the web) and Glossary, on the shared shell from @eurth/style.
- **Easter egg:** a population of zero adds the infobox line "Status: very quiet."
- **Checked on IIWiki:** the whole page, sandbox output, of all four examples, pasted into a sandbox on 15 November 2026: each renders fine. That covers 43 infobox parameters, numbers written with commas ("512,000"), flag and arms named as `.png` and as `.svg`, and a nearly empty infobox (Hesperwick). Teland's live-page output, tried with "Show preview": fine as well, so the footer keeps Sandbox 7's `{{Template:Eurth topics}}` and not the brief's `{{Eurth}}`.

## Not planned

- **Fetching from or posting to IIWiki.** It blocks automated requests, and the tools make no third-party requests of any kind. Wiki hands over wikitext to paste and images to upload by hand.
- **Browser storage, accounts or a server.** As everywhere in the suite: a page lives in its link and in the profile file.
- **Drawing templates in the preview.** The preview shows the infobox's rows in plain words. It doesn't run wiki templates typed into a field (`{{flag|…}}`, `{{convert|…}}`); the wiki does that.
- **Writing the article.** The skeleton asks the questions; the answers are the nation's author's.
