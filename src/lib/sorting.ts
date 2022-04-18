import { getTracksWithFields } from './api';

interface Track extends SpotifyApi.TrackObjectFull {
  spotifyPlaylistIndex: number
}
type TrackComparareFn = (a: Track, b: Track) => number;

const sortParts = [
  { key: 'trackNumber', name: 'Song number in album' },
  { key: 'albumYear', name: 'Album release year' },
  { key: 'artistName', name: 'Artist name' },
  { key: 'songName', name: 'Song name' },
  { key: 'albumName', name: 'Album name' },
  { key: 'custom', name: 'Spotify playlist custom order' },
];

const createPlaylistSorter = (sortSpec: string): TrackComparareFn => {
  const parts = sortSpec.split(';');
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
          return cmp(a, b, i + 1);
        }

        return result;
      }
      case 'albumYear': {
        const aYear = parseInt(a.album.release_date.split('-')[0], 10);
        const bYear = parseInt(a.album.release_date.split('-')[0], 10);
        const result = aYear - bYear;
        if (result === 0) {
          return cmp(a, b, i + 1);
        }

        return result;
      }
      case 'artistName': {
        const result = a.artists[0].name.localeCompare(b.artists[0].name);
        if (result === 0) {
          return cmp(a, b, i + 1);
        }

        return result;
      }
      case 'songName': {
        const result = a.name.localeCompare(b.name);
        if (result === 0) {
          return cmp(a, b, i + 1);
        }

        return result;
      }
      case 'albumName': {
        const result = a.album.name.localeCompare(b.album.name);
        if (result === 0) {
          return cmp(a, b, i + 1);
        }

        return result;
      }
      /* eslint-disable-next-line default-case-last */
      default:
      case 'custom': {
        const result = a.spotifyPlaylistIndex - b.spotifyPlaylistIndex;
        if (!end && result === 0) {
          return cmp(a, b, i + 1);
        }

        return result;
      }
    }
  };
  return (a, b) => cmp(a, b, 0);
};

const createRequestFields = (sortSpec: string): string => {
  const parts = sortSpec.split(';');
  const neededFields = {
    trackNumber: false,
    name: false,
    album: {
      date: false,
      name: false,
    },
    artist: {
      name: false,
    },
  };
  parts.forEach((part) => {
    switch (part) {
      case 'trackNumber':
        neededFields.trackNumber = true;
        break;
      case 'albumYear':
        neededFields.album.date = true;
        break;
      case 'artistName':
        neededFields.artist.name = true;
        break;
      case 'songName':
        neededFields.name = true;
        break;
      case 'albumName':
        neededFields.album.name = true;
        break;
      case 'custom':
      default:
        break;
    }
  });

  let result = 'total,items(tracks(uri';
  if (neededFields.name) {
    result = `${result},name`;
  }
  if (neededFields.trackNumber) {
    result = `${result},track_number`;
  }

  if (neededFields.album.date && neededFields.album.name) {
    result = `${result},album(name,release_Date)`;
  } else if (neededFields.album.date) {
    result = `${result},album(release_Date)`;
  } else if (neededFields.album.name) {
    result = `${result},album(name)`;
  }

  if (neededFields.artist.name) {
    result = `${result},artists(name)`;
  }

  result = `${result}))`;
  return result;
};

const sortPlaylistsTracks = async (playlistIds: string[], sortSpec: string): Promise<string[]> => {
  const fields = createRequestFields(sortSpec);
  const tracks = (await getTracksWithFields(playlistIds, fields)) as Track[];
  tracks.forEach((track, i) => {
    // eslint-disable-next-line no-param-reassign
    track.spotifyPlaylistIndex = i;
  });
  const compare = createPlaylistSorter(sortSpec);
  tracks.sort(compare);
  return tracks.map((t) => t.uri);
};

export { sortPlaylistsTracks, sortParts };
