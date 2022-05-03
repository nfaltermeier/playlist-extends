import type { NamedTrack } from '../redux/playlists';

export interface SyncCheckResult {
  name: string,
  uri: string,
  added: boolean,
  removed: boolean,
  reordered: boolean,
}

export default function checkSync(oldTracks: NamedTrack[], newTracks: NamedTrack[]): SyncCheckResult[] {
  const removed = new Array(...oldTracks);
  const added = new Array(...newTracks);
  let common = new Array<NamedTrack>();

  for (let i = 0; i < removed.length; i += 1) {
    const n = added.findIndex((e) => e.uri === removed[i].uri);
    if (n !== -1) {
      common = common.concat(removed.splice(i, 1));
      added.splice(n, 1);
      i -= 1;
    }
  }

  const result: Array<SyncCheckResult> = removed.map((r) => ({
    uri: r.uri, name: r.name, removed: true, added: false, reordered: false,
  }));

  return result.concat(newTracks.map((n) => {
    if (added.findIndex((e) => e.uri === n.uri) !== -1) {
      return {
        uri: n.uri, name: n.name, added: true, removed: false, reordered: false,
      };
    }

    return {
      uri: n.uri, name: n.name, reordered: false, removed: false, added: false,
    };
  }));
}
