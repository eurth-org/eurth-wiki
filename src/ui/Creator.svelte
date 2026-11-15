<script lang="ts">
  /*
   * The creator: a form on one side, and on the other the infobox as the wiki will draw it,
   * next to the wikitext to paste. The form follows docs/sandbox-7.wiki through src/wiki/fields.ts.
   *   - the state lives in the link (?d=…), read safely on arrival and kept in step after;
   *   - nothing is stored: "save" is a link, the copied wikitext or the nation's profile file;
   *   - a loaded profile fills in what it knows, and its flag and arms are only ever shown
   *     through an <img>;
   *   - only tokens and eu- classes. The preview is a frame in the light theme
   *     (data-theme="light"), which is what makes it look like a wiki in either theme.
   * The signature touch: the preview builds itself row by row as fields fill in.
   */
  import { faCheck, faCopy, faDownload, faRotateLeft, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
  import { svgDataUrl, type EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { copyText, download, stateFromLocation, stateLink, stateToLocation, svgToPicture, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import ShareButtons from '@eurth/style/components/ShareButtons.svelte';
  import { onMount } from 'svelte';
  import { GROUPS, fieldsOf, type Field, type GroupId } from '../wiki/fields';
  import { autos, describe, infoboxWikitext, nameOf, preview } from '../wiki/infobox';
  import { LINK_VERSION, clean, compact, defaults, isEmpty, parseNumber, type Country } from '../wiki/model';
  import { TARGETS, pageSkeleton, type Target } from '../wiki/page';
  import { fromProfile, pictures, toProfile } from '../wiki/profile';
  import { steps } from '../wiki/setup';

  // Passed in by the page: browser code never imports eurth.config.mjs (see the note there).
  let { siteName, siteUrl, sample }: { siteName: string; siteUrl: string; sample: Record<string, string> } = $props();

  let country = $state<Country>({ ...defaults });
  let profile = $state.raw<EurthProfile | null>(null);
  let target = $state<Target>('sandbox');
  let view = $state<'infobox' | 'page'>('infobox');
  let blanks = $state(false);
  let navbox = $state('');
  let ready = $state(false);
  let copied = $state<string | null>(null);

  const box = $derived(preview(country));
  const filledIn = $derived(autos(country));
  const infobox = $derived(infoboxWikitext(country, { blanks }));
  const page = $derived(pageSkeleton(country, { target, blanks, navbox }));
  const description = $derived(describe(country));
  const name = $derived(nameOf(country));
  const todo = $derived(steps(country));
  const images = $derived(pictures(profile));
  const flag = $derived(svgDataUrl(images.flag));
  const arms = $derived(svgDataUrl(images.arms));
  // Before the page has loaded there is no address to read: the site's own, then.
  const link = $derived(stateLink(compact(country), { version: LINK_VERSION, base: ready ? location.href : `${siteUrl}/` }));
  const saved = $derived(toProfile(profile, country, siteUrl));
  const filled = $derived(Object.fromEntries(GROUPS.map((g) => [g.id, fieldsOf(g.id).filter((f) => (country[f.param] ?? '').trim()).length])) as Record<GroupId, number>);

  onMount(() => {
    // A link is someone else's input: decodeState never throws, and clean() checks every value.
    const arrived = stateFromLocation();
    if (arrived) country = clean(arrived.value);
    ready = true;
  });

  // The address bar follows the form, so the link can be copied from there too.
  $effect(() => {
    const state = compact(country);
    if (ready) stateToLocation(state, { version: LINK_VERSION });
  });

  // This tool's own easter egg: a country with nobody in it.
  let quiet = false;
  $effect(() => {
    const empty = parseNumber(country.population_estimate ?? '') === 0;
    if (ready && empty && !quiet) toast('Nobody home. The infobox says so.');
    quiet = empty;
  });

  function startAgain() {
    country = { ...defaults };
    profile = null;
    navbox = '';
    toast('A blank page. The best kind and the worst kind.');
  }

  function showExample() {
    country = clean(sample);
    profile = null;
    toast('Meet Teland. Change anything you like.');
  }

  function loaded(next: EurthProfile) {
    profile = next;
    // Read what the other tools wrote; never change their sections.
    const got = fromProfile(next, siteUrl);
    country = got.country;
    const count = got.used.length;
    toast(`${next.meta.nation || 'Your nation'} is loaded${count ? `: ${count} ${count === 1 ? 'section' : 'sections'} filled in` : ''}.`);
  }

  async function copy(what: string, text: string, said: string) {
    const ok = await copyText(text);
    toast(ok ? said : "That didn't copy. Your browser may not allow it here.");
    if (!ok) return;
    copied = what;
    setTimeout(() => (copied = null), 2000);
  }

  const pageSaid = $derived(target === 'sandbox' ? 'Page copied, ready for your sandbox.' : 'Page copied, navbox and category included.');

  // A picture from the profile, saved under the name the infobox asks for: as it is when that
  // name ends in .svg, drawn as a PNG otherwise.
  async function save(svg: string, file: string) {
    if (/\.svg$/i.test(file)) return download(svg, file, 'image/svg+xml');
    const found = /viewBox="\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(svg);
    const ratio = found ? Number(found[2]) / Number(found[1]) : 2 / 3;
    try {
      download(await svgToPicture(svg, { width: 1200, height: Math.max(1, Math.round(1200 * (Number.isFinite(ratio) && ratio > 0 ? ratio : 2 / 3))) }), file.replace(/\.[a-z0-9]+$/i, '.png'));
    } catch {
      toast("That picture couldn't be drawn. Try the SVG: end the file name in .svg.");
    }
  }

  // The rows arrive one after another; the delay is capped so a full infobox still lands in under half a second.
  const delay = (index: number): string => `${Math.min(index * 20, 280)}ms`;
</script>

{#snippet control(f: Field)}
  <label class="eu-field">
    <span class="eu-label">{f.label}</span>
    {#if f.kind === 'choice'}
      <select class="eu-select" bind:value={country[f.param]} aria-describedby="help-{f.param}">
        {#each f.choices ?? [] as choice (choice.value)}
          <option value={choice.value}>{choice.label}</option>
        {/each}
      </select>
    {:else}
      <input
        class="eu-input"
        class:eu-input--data={f.kind === 'number'}
        bind:value={country[f.param]}
        maxlength={f.max}
        inputmode={f.kind === 'number' ? 'decimal' : undefined}
        autocomplete="off"
        placeholder={filledIn[f.param] ?? f.placeholder}
        aria-describedby="help-{f.param}"
      />
    {/if}
    <span class="eu-help" id="help-{f.param}">{f.help}</span>
  </label>
{/snippet}

<div class="creator">
  <form class="eu-card form" onsubmit={(e) => e.preventDefault()}>
    <h2 class="eu-visually-hidden">Your country's details</h2>
    <div class="eu-row">
      <ProfileButtons profile={saved} onload={loaded} onerror={(errors) => toast(errors[0]?.message ?? "That file isn't a nation profile. Pick one that ends in .eurth.json.")} />
    </div>
    <div class="eu-row">
      <button type="button" class="eu-btn" data-click="tumble" onclick={showExample}><Icon icon={faWandMagicSparkles} /> Show an example</button>
      <button type="button" class="eu-btn" data-click="spin" onclick={startAgain} disabled={isEmpty(country) && !profile}><Icon icon={faRotateLeft} /> Start again</button>
    </div>
    <p class="eu-help">
      A profile file fills in what your other Eurth tools already know: names, flag, government, numbers, currency. Everything stays editable, and nothing is kept in this browser.
    </p>

    {#each GROUPS as group, g (group.id)}
      {@const more = fieldsOf(group.id).filter((f) => f.more)}
      <details class="group" open={g < 3}>
        <summary>
          <span class="group-name">{group.label}</span>
          <span class="eu-muted count">{filled[group.id]} of {fieldsOf(group.id).length} filled in</span>
        </summary>
        <div class="eu-stack group-body">
          <p class="eu-help">{group.help}</p>
          <div class="fields">
            {#each fieldsOf(group.id).filter((f) => !f.more) as f (f.param)}
              {@render control(f)}
            {/each}
          </div>
          {#if more.length}
            <details class="more">
              <summary><span class="eu-label">More fields</span> <span class="eu-muted count">{more.length} that few pages need</span></summary>
              <div class="fields">
                {#each more as f (f.param)}
                  {@render control(f)}
                {/each}
              </div>
            </details>
          {/if}
        </div>
      </details>
    {/each}
  </form>

  <section class="result" aria-labelledby="preview-title">
    <div class="eu-card preview">
      <div class="eu-row heading">
        <h2 id="preview-title" class="eu-kicker">Preview, as the wiki draws it</h2>
        <span class="eu-data eu-muted">Infobox country</span>
      </div>

      <div class="wikibox" data-theme="light">
        {#if box.title}
          <p class="title">{box.title}</p>
          {#each box.top.filter((item) => item.param === 'native_name') as item (item.param)}
            <p class="top"><i>{item.shown}</i></p>
          {/each}
          {#if flag || arms}
            <div class="symbols">
              {#if flag}<img src={flag} alt="Flag of {name}" class="flag" />{/if}
              {#if arms}<img src={arms} alt="Coat of arms of {name}" class="arms" />{/if}
            </div>
          {/if}
          <p class="files">
            {#if flag && arms}
              Flag and arms from your profile
            {:else}
              To upload: {[flag ? '' : box.flagFile, arms ? '' : box.armsFile].filter(Boolean).join(', ')}
            {/if}
          </p>
          {#each box.top.filter((item) => item.param !== 'native_name') as item (item.param)}
            <p class="top"><b>{item.label}:</b> {item.shown}</p>
          {/each}
          {#if box.rows.length}
            <table>
              <tbody>
                {#each box.rows as row, i (row.param)}
                  <tr class:sub={row.sub} style:--delay={delay(i)}>
                    <th scope="row">{row.label}</th>
                    <td>{row.shown}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        {:else}
          <p class="empty">Your infobox builds itself here, row by row, as you fill in the form. Start with the name.</p>
        {/if}
      </div>
      <p class="eu-visually-hidden" aria-live="polite">{description}</p>
    </div>

    <div class="eu-card wikitext">
      <div class="eu-row heading">
        <h2 class="eu-kicker">Wikitext</h2>
        <fieldset class="options across">
          <legend class="eu-visually-hidden">What to show</legend>
          <label class="eu-pill"><input type="radio" name="view" value="infobox" bind:group={view} /><span class="eu-check"><Icon icon={faCheck} /></span> Infobox</label>
          <label class="eu-pill"><input type="radio" name="view" value="page" bind:group={view} /><span class="eu-check"><Icon icon={faCheck} /></span> Whole page</label>
        </fieldset>
      </div>

      <!-- Focusable, so the keyboard can scroll it. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="eu-data eu-scroll code" tabindex="0" aria-label={view === 'infobox' ? 'The infobox as wikitext' : 'The whole page as wikitext'}>{view === 'infobox' ? infobox : page}</pre>

      <fieldset class="options">
        <legend class="eu-label">The page is</legend>
        <div class="eu-row">
          {#each TARGETS as t (t.id)}
            <label class="eu-pill"><input type="radio" name="target" value={t.id} bind:group={target} /><span class="eu-check"><Icon icon={faCheck} /></span> {t.label}</label>
          {/each}
        </div>
        <p class="eu-help">{TARGETS.find((t) => t.id === target)?.help}</p>
      </fieldset>

      {#if target === 'live'}
        <label class="eu-field">
          <span class="eu-label">Your nation's own navbox</span>
          <input class="eu-input" bind:value={navbox} maxlength="80" autocomplete="off" placeholder={name ? `${name} topics` : 'Teland topics'} aria-describedby="help-navbox" />
          <span class="eu-help" id="help-navbox">The name of its template, if your nation has one. Left empty, only the Eurth navbox is added.</span>
        </label>
      {/if}

      <label class="eu-pill keep">
        <input type="checkbox" bind:checked={blanks} /><span class="eu-check"><Icon icon={faCheck} /></span> Keep the empty fields
      </label>
      <p class="eu-help">With the empty fields kept, the infobox has every line of the tutorial's template, so you can fill in the rest on the wiki later.</p>

      <div class="eu-row">
        <button type="button" class="eu-btn eu-btn--primary" data-click="bounce" onclick={() => copy('infobox', infobox, 'Infobox copied. Paste it at the top of your page.')}>
          <Icon icon={copied === 'infobox' ? faCheck : faCopy} />
          {copied === 'infobox' ? 'Copied' : 'Copy wikitext'}
        </button>
        <button type="button" class="eu-btn" data-click="bounce" onclick={() => copy('page', page, pageSaid)}>
          <Icon icon={copied === 'page' ? faCheck : faCopy} />
          {copied === 'page' ? 'Copied' : 'Copy page skeleton'}
        </button>
      </div>

      <div class="eu-row">
        <button type="button" class="eu-btn" data-click="bounce" disabled={!images.flag || !box.flagFile} onclick={() => save(images.flag, box.flagFile)}>
          <Icon icon={faDownload} /> Flag for the wiki
        </button>
        <button type="button" class="eu-btn" data-click="bounce" disabled={!images.arms || !box.armsFile} onclick={() => save(images.arms, box.armsFile)}>
          <Icon icon={faDownload} /> Arms for the wiki
        </button>
      </div>
      <p class="eu-help">
        {#if images.flag || images.arms}
          The downloads carry the names the infobox asks for{images.flag && box.flagFile ? `, such as “${box.flagFile}”` : ''}. Upload them to the wiki as they are.
        {:else}
          Load a profile that carries a flag or a coat of arms, and they download here under the names the infobox asks for.
        {/if}
      </p>
    </div>

    <details class="eu-card after">
      <summary><span class="group-name">After the page: the rest of the setup</span> <span class="eu-muted count">{todo.length} steps</span></summary>
      <ol class="steps">
        {#each todo as step (step.id)}
          <li>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {#if step.page}<p class="eu-data where">{step.page}</p>{/if}
            {#if step.wikitext}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <pre class="eu-data eu-scroll code" tabindex="0" aria-label="Wikitext for: {step.title}">{step.wikitext}</pre>
              <button type="button" class="eu-btn" data-click="bounce" onclick={() => copy(step.id, step.wikitext ?? '', 'Copied. One step nearer.')}>
                <Icon icon={copied === step.id ? faCheck : faCopy} />
                {copied === step.id ? 'Copied' : 'Copy'}<span class="eu-visually-hidden">: {step.title}</span>
              </button>
            {/if}
          </li>
        {/each}
      </ol>
    </details>

    <ShareButtons
      url={link}
      title={name ? `${name} on the wiki` : 'A wiki country page'}
      text={`${description} Made with ${siteName}.`}
      description={() => description}
      heading={name ? `Share ${name}` : 'Share your country page'}
      said={{ link: 'Link copied: the whole form is in it.' }}
    />
    <p class="eu-help">The link holds everything you typed. The profile file carries your nation from one Eurth tool to the next.</p>
  </section>
</div>

<style>
  .creator {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: var(--space-6);
    align-items: start;
  }

  .form {
    gap: var(--space-4);
  }

  .group {
    border-top: 1px solid var(--line-strong);
  }

  summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1) var(--space-3);
    min-height: var(--size-target);
    padding: var(--space-2) 0;
    cursor: pointer;
  }

  .group-name {
    font: var(--type-heading);
  }

  .count {
    font: var(--type-note);
  }

  .group-body {
    gap: var(--space-3);
    padding-bottom: var(--space-4);
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4) var(--space-3);
    align-items: start;
  }

  .more .fields {
    padding-top: var(--space-2);
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .heading {
    justify-content: space-between;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .options.across {
    flex-flow: row wrap;
  }

  .keep {
    align-self: flex-start;
  }

  /* The infobox, as a wiki draws it: a light, bordered box, whatever the theme around it. */
  .wikibox {
    width: 100%;
    max-width: 340px;
    padding: var(--space-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-raised);
    font: var(--type-note);
  }

  .wikibox p {
    margin: 0;
  }

  .title {
    padding: var(--space-1) 0 var(--space-2);
    font: var(--type-heading);
    text-align: center;
  }

  .symbols {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding-bottom: var(--space-2);
  }

  .flag {
    width: auto;
    max-width: 55%;
    height: 64px;
    border: 1px solid var(--line);
  }

  .arms {
    width: auto;
    max-width: 30%;
    height: 64px;
  }

  .files,
  .top {
    padding-bottom: var(--space-1);
    text-align: center;
    overflow-wrap: anywhere;
  }

  .files {
    color: var(--ink-muted);
  }

  .empty {
    padding: var(--space-4) var(--space-2);
    color: var(--ink-muted);
    text-align: center;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: var(--space-1) 0;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    width: 45%;
    padding-right: var(--space-2);
    font-weight: 700;
  }

  tr.sub th {
    font-weight: 400;
  }

  /* The signature touch: each row slides into place as its field fills in. */
  tr {
    animation: row-in 200ms ease-out both;
    animation-delay: var(--delay, 0ms);
  }

  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--space-2)));
    }
  }

  .code {
    max-height: 420px;
    margin: 0;
    padding: var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
    overflow: auto;
    white-space: pre;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin: 0;
    padding: var(--space-2) 0 0 var(--space-5);
  }

  .steps li {
    min-width: 0;
  }

  .steps li > * + * {
    margin-top: var(--space-2);
  }

  .steps h3 {
    font: var(--type-heading);
  }

  .where {
    overflow-wrap: anywhere;
  }

  @media (max-width: 900px) {
    .creator {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 480px) {
    .fields {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
