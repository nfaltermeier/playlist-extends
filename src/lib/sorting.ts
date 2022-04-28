import { NamedTrack } from '../redux/playlists';
import { getTracksWithFields } from './api';

interface Track extends SpotifyApi.TrackObjectFull {
  spotifyPlaylistIndex: number
}
type TrackComparareFn = (a: Track, b: Track) => number;

const sortParts = [
  { key: 'trackNumber', name: 'Song number in album', defaultOrder: 'a' },
  { key: 'albumDate', name: 'Album release date', defaultOrder: 'd' },
  { key: 'artistName', name: 'Artist name', defaultOrder: 'a' },
  { key: 'songName', name: 'Song name', defaultOrder: 'a' },
  { key: 'albumName', name: 'Album name', defaultOrder: 'a' },
  { key: 'custom', name: 'Spotify playlist custom order', defaultOrder: 'a' },
];

const createPlaylistSorter = (sortSpec: string): TrackComparareFn => {
  const parts = sortSpec.split(';');
  if (parts.length % 2 !== 0) {
    throw new Error(`Sorting Spec has an odd number of parts, may be missing an order specifier. sortSpec: '${sortSpec}'`);
  }
  const cmp = (a: Track, b: Track, i: number): number => {
    let part;
    let end = false;
    if (i < parts.length) {
      part = parts[i];
    } else {
      part = 'custom';
      end = true;
    }

    switch (part) {
      case 'trackNumber': {
        const result = a.track_number - b.track_number;
        if (result === 0) {
          return cmp(a, b, i + 2);
        }

        return parts[i + 1] === 'a' ? result : -result;
      }
      case 'albumDate': {
        const aSplit = a.album.release_date.split('-');
        const bSplit = b.album.release_date.split('-');
        for (let n = 0; n < aSplit.length && n < bSplit.length; n += 1) {
          const result = parseInt(aSplit[n], 10) - parseInt(bSplit[n], 10);
          if (result !== 0) {
            return parts[i + 1] === 'a' ? result : -result;
          }
        }

        if (aSplit.length !== bSplit.length) {
          const result = aSplit.length - bSplit.length;
          return parts[i + 1] === 'a' ? result : -result;
        }

        return cmp(a, b, i + 2);
      }
      case 'artistName': {
        const result = a.artists[0].name.localeCompare(b.artists[0].name);
        if (result === 0) {
          return cmp(a, b, i + 2);
        }

        return parts[i + 1] === 'a' ? result : -result;
      }
      case 'songName': {
        const result = a.name.localeCompare(b.name);
        if (result === 0) {
          return cmp(a, b, i + 2);
        }

        return parts[i + 1] === 'a' ? result : -result;
      }
      case 'albumName': {
        const result = a.album.name.localeCompare(b.album.name);
        if (result === 0) {
          return cmp(a, b, i + 2);
        }

        return parts[i + 1] === 'a' ? result : -result;
      }
      /* eslint-disable-next-line default-case-last */
      default:
      case 'custom': {
        const result = a.spotifyPlaylistIndex - b.spotifyPlaylistIndex;
        if (!end && result === 0) {
          return cmp(a, b, i + 2);
        }

        return result;
      }
    }
  };
  return (a, b) => cmp(a, b, 0);
};

const createRequestFields = (sortSpec: string): string => {
  const parts = sortSpec.split(';');
  if (parts.length % 2 !== 0) {
    throw new Error(`Sorting Spec has an odd number of parts, may be missing an order specifier. sortSpec: '${sortSpec}'`);
  }
  const neededFields = {
    trackNumber: false,
    album: {
      date: false,
      name: false,
    },
    artist: {
      name: false,
    },
  };
  for (let i = 0; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'trackNumber':
        neededFields.trackNumber = true;
        break;
      case 'albumDate':
        neededFields.album.date = true;
        break;
      case 'artistName':
        neededFields.artist.name = true;
        break;
      case 'albumName':
        neededFields.album.name = true;
        break;
      case 'songName':
      case 'custom':
      default:
        break;
    }
  }

  let result = 'total,items(track(uri,name';
  if (neededFields.trackNumber) {
    result = `${result},track_number`;
  }

  if (neededFields.album.date && neededFields.album.name) {
    result = `${result},album(name,release_date)`;
  } else if (neededFields.album.date) {
    result = `${result},album(release_date)`;
  } else if (neededFields.album.name) {
    result = `${result},album(name)`;
  }

  if (neededFields.artist.name) {
    result = `${result},artists(name)`;
  }

  result = `${result}))`;
  return result;
};

const getSortedPlaylist = async (playlistIds: string[], sortSpec: string): Promise<NamedTrack[]> => {
  const fields = createRequestFields(sortSpec);
  const tracks = (await getTracksWithFields(playlistIds, fields)) as Track[];
  tracks.forEach((track, i) => {
    // eslint-disable-next-line no-param-reassign
    track.spotifyPlaylistIndex = i;
  });
  const compare = createPlaylistSorter(sortSpec);
  tracks.sort(compare);
  return tracks.map((t) => ({ uri: t.uri, name: t.name }));
};

export { getSortedPlaylist, sortParts };
