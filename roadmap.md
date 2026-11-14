# Roadmap

Wiki turns a nation's details into a ready-to-paste country page and infobox for IIWiki, at wiki.eurth.org. It is door 14 of Eurth's 2026 advent calendar and opens on 23 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** The brief is saved as CLAUDE.md and the repository exists (step 1 and 2 of the brief's working order). Nothing is built and there is no plan yet.

The next step is step 3 of the working order, and it is waiting on Stijn:

1. **Stijn pastes the wikitext of User:Orioni/Sandbox 7** ("Eurth country setup"). Save it, unchanged, as `docs/sandbox-7.wiki`. Don't try to fetch it: iiwiki.com blocks automated requests.
2. Read HANDBOOK.md in eurth-org/eurth-style if it exists by then, and the profile schema again in case it moved.
3. Write the plan into "Next" below and show it to Stijn before building anything.

Waiting on others:

- **Sandbox 7.** The fields, their groups, the help text, the article sections and their order all come from it. The mock-up's fields are placeholders.
- **@eurth/style 1.0.0** is not released: on GitHub the repository holds only its brief, with no HANDBOOK.md, starter template or tag. The site can't start until it is. Check `gh release list -R eurth-org/eurth-style`. Until the handbook is written, its rules are the "handbook" part of that repository's CLAUDE.md.
- **@eurth/profile 1.0.0** is written but not tagged, so it can't be installed by version yet (`github:eurth-org/eurth-profile#semver:^1`).

## What the profile gives Wiki today

Read from eurth-org/eurth-profile on 14 November 2026 (schema 1).

- **Wiki writes two sections:** `wiki` and `identity` (Card may edit `identity` too). It reads the rest and leaves every other key as it found it.
- **`identity`:** `commonName`, `officialName`, `capital`, `demonym`, `motto`, `languages`.
- **`wiki`:** only `drivesOn` (`left` or `right`) so far. Calling code, time zone and whatever else Sandbox 7 asks for aren't in the schema. Sections allow extra keys, so Wiki can keep them there from the start; ask Foundations to add them to the schema, which is a minor release.
- **To read for "Fill from a profile":** `flag.svg`, `arms.svg`, `government` (`form`, `headOfState`, `headOfGovernment`, `legislature`), `seats` (`chamber`, `total`), `stats` (`population`, `areaKm2`, `gdpUsd`), `bank` (`currency`, `code`), `calendar` (`name`, `era`), `dynasty` (`monarch`, `house`), and also `cities.list` (the largest city) and `anthem.title`.
- **Rules that shape the preview:** a profile's SVG only ever goes in an `<img>` (`svgDataUrl`), and its text is shown as text, never as markup.
- **Examples to test against:** Hesperwick (a flag only), Vantmoor (mid-sized) and Calderwyn (every section).

## Next

The plan goes here once Sandbox 7 is in. The brief's outline, for now:

- **The engine and the words** (plain TypeScript and tests, needs nothing from @eurth/style): the field list from Sandbox 7, profile to fields, fields to infobox wikitext, the page skeleton, the sandbox and live-page outputs, the wiki file names for the flag and arms, the description, the guide, the field help and the glossary.
- **The site** (once @eurth/style 1.0.0 is out, from its starter template): the Creator, Guide and Glossary pages, the live preview that builds row by row, the exports, and the handbook's checklist.
- **The check:** the wikitext for each example profile pastes into IIWiki and renders without errors. Stijn checks the first one.

## Releases

None yet.

## Not planned

- **Fetching from or posting to IIWiki.** It blocks automated requests, and the tools make no third-party requests of any kind. Wiki hands over wikitext to paste and images to upload by hand.
- **Browser storage, accounts or a server.** As everywhere in the suite: a page lives in its link and in the profile file.
