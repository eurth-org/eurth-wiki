/**
 * Example countries: one typed in by hand (Teland, from the mock-up) and the three example
 * profiles of @eurth/profile, read exactly as a visitor's own file would be. The Examples page
 * links each into the creator, and the tests hold the wikitext of every one of them to account.
 */
import type { EurthProfile } from '@eurth/profile';
import calderwyn from '@eurth/profile/examples/calderwyn.eurth.json';
import hesperwick from '@eurth/profile/examples/hesperwick.eurth.json';
import vantmoor from '@eurth/profile/examples/vantmoor.eurth.json';
import type { Country } from './model';
import { fromProfile } from './profile';
import { teland } from './teland';

export { teland };

export interface Example {
  id: string;
  name: string;
  /** One line on what the example shows. */
  note: string;
  country: Country;
  /** The profile it was read from, if it came from one. */
  profile?: EurthProfile;
}

/** The examples, in the order the page shows them. `siteUrl` is this tool's own address. */
export function examples(siteUrl: string): Example[] {
  const read = (id: string, note: string, file: unknown): Example => {
    const profile = file as EurthProfile;
    return { id, name: profile.meta.nation, note, country: fromProfile(profile, siteUrl).country, profile };
  };
  return [
    { id: 'teland', name: 'Teland', note: 'Typed in by hand, with every part of the form in use: a full infobox for a mid-sized republic.', country: teland },
    read('calderwyn', 'From a profile that every Eurth tool has written to: a kingdom with a monarch, a parliament, a currency and a calendar.', calderwyn),
    read('vantmoor', 'From a mid-sized profile: names, a flag, a government and the headline numbers. The rest is left for you.', vantmoor),
    read('hesperwick', 'From the smallest profile there is: a name and a flag. Nearly everything is still to fill in.', hesperwick),
  ];
}
