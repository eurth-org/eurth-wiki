You're building Wiki (wiki.eurth.org), which turns a nation's details into a ready-to-paste wiki country page and infobox for IIWiki (iiwiki.com), the wiki Eurth's members use. One of Eurth's free worldbuilding tools; Eurth (eurth.org) is a worldbuilding and roleplay community since 2004. The attached repo is eurth-org/eurth-wiki.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Ask me to paste the wikitext of User:Orioni/Sandbox 7, my "Eurth country setup" tutorial: it is the source for the fields, sections and order this tool follows. iiwiki.com blocks automated requests, so don't try to fetch it. Save what I paste as docs/sandbox-7.wiki. Then read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile (they may still be in progress), write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, field help, examples). None of that needs eurth-style.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile; look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared. Then write a plan and show it to me before you build.

Mock-up: the "wiki.eurth.org, wiki country page creator" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6. Its fields are placeholders until Sandbox 7 says otherwise.

Pages: Creator, Guide (the tutorial, rewritten for the web with my permission), Glossary.

The creator, v1
- A form that follows Sandbox 7: every infobox field it uses, grouped as it groups them, with help text from the tutorial.
- Fill from a profile: identity, flag, arms, government, seats, stats, bank (currency), calendar and dynasty (head of state) all map onto fields; anything the profile lacks stays editable.
- A live preview that looks like an IIWiki infobox (light, wiki style), next to the wikitext.
- A page skeleton: the article sections Sandbox 7 recommends, each with a one-line prompt for what goes in it.

IIWiki conventions (from how I work there)
- Images: only |250px|thumb| works on IIWiki, aligned left or right.
- Internal links: link each relevant page once at the start of every section it appears in, never twice in one section.
- Two outputs: "for my sandbox" leaves out the footer navboxes ({{Eurth}} and the nation's own) and categories so the draft stays out of the Eurth tracker; "for the live page" adds them back.

Profile section "wiki": extra fields the profile doesn't hold elsewhere (calling code, time zone, drives on, and so on).

Exports: Copy wikitext (infobox), Copy page skeleton, download the flag and arms images named for the wiki ("Flag of Teland.svg"), Copy description.

Signature touch: the preview builds itself row by row as fields fill in. Easter egg: a population of zero adds the infobox line "Status: very quiet."

Done when the handbook's checklist passes and the wikitext for each example profile pastes into IIWiki and renders without errors (I'll check the first one with you).
