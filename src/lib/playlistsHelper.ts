import { selectPlaylistById } from '../redux/playlists';
import type { RootState } from '../redux/store';

export const hasDeletedComponent = (state: RootState, playlistId: string): boolean => {
  const playlist = selectPlaylistById(state, playlistId);
  if (!playlist) {
    return true;
  }

  const checked = new Set<string>();
  const queue = new Array(...playlist.componentPlaylistIds);
  while (queue.length > 0) {
    const toCheckId = queue.pop() as string;
    if (checked.has(toCheckId)) {
      continue;
    }
    const toCheck = selectPlaylistById(state, toCheckId);
    if (!toCheck || (toCheck.deletedOnSpotify && toCheck.componentPlaylistIds.length === 0)) {
      return true;
    }
    checked.add(toCheckId);
    queue.push(...toCheck.componentPlaylistIds);
  }

  return false;
};

/**
 * Performs postorder traversals of all of the component playlists of the playlistsToSync,
 * preserving only playlists that need sync. Duplicate removing is done at the end because
 * the last occurence of the initial traversal is the one that needs to be retained, not the first occurence.
 */
export const makeSyncOrder = (state: RootState, playlistsToSync: string[]): Array<string> => {
  let toCheck = new Array<string>(...playlistsToSync);
  const results = new Array<string>();

  while (toCheck.length !== 0) {
    const cId = toCheck.pop();
    if (cId === undefined) {
      continue;
    }
    const c = selectPlaylistById(state, cId);
    if (c === undefined) {
      continue;
    }

    if (c.needsSync) {
      results.push(cId);
    }

    toCheck = toCheck.concat(c.componentPlaylistIds);
  }

  const seen = new Set<string>();
  return results.reverse().filter((f) => {
    if (seen.has(f)) {
      return false;
    }

    seen.add(f);
    return true;
  });
};
