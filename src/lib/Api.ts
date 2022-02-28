import store from '../redux/store';
import { mergeSpotifyState } from '../redux/playlists';
import { refreshAccessToken } from './auth';
import spotifyApi from './spotifyApiKeeper';

// copy of https://github.com/DefinitelyTyped/DefinitelyTyped/blob/74b19cf32a1b2f10958f5729f798245afb1125f5/types/spotify-web-api-node/index.d.ts#L1037
// because this interface is not exported
interface Response<T> {
  body: T;
  headers: Record<string, string>;
  statusCode: number;
}

const refreshAuthWrapper = async <T>(requestFn: () => Promise<T>): Promise<T> => {
  try {
    const result = await requestFn();
    return result;
  } catch (e: any) {
    if (e.body && e.body.error && e.body.error.status === 401 && e.body.error.message === 'The access token expired') {
      const refreshToken = spotifyApi.getRefreshToken();
      if (refreshToken) {
        console.log('trying to refresh access token');
        const response = await refreshAccessToken(refreshToken);
        spotifyApi.setAccessToken(response.access_token);

        const result = await requestFn();
        return result;
      }
      console.warn('No spotify API refresh token set, cannot retry request');
      throw e;
    } else {
      throw e;
    }
  }
};

/* eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention */
const _paginateRequest = async <T>(requestFn: (offset: number) => Promise<Response<SpotifyApi.PagingObject<T>>>, refreshAuth: boolean): Promise<T[]> => {
  let total;
  let retrievedCount = 0;
  let results: T[] = [];
  do {
    let request;
    if (refreshAuth) {
      const internalRetrievedCount = retrievedCount;
      request = refreshAuthWrapper(() => requestFn(internalRetrievedCount));
    } else {
      request = requestFn(retrievedCount);
    }
    const result = (await request).body;
    total = result.total;
    retrievedCount += result.items.length;
    results = results.concat(result.items);
  } while (retrievedCount < total);

  return results;
};

const paginateAndRefreshAuth = <T>(requestFn: (offset: number) => Promise<Response<SpotifyApi.PagingObject<T>>>): Promise<T[]> => (
  _paginateRequest(requestFn, true)
);

/**
 * Retrieves the current user's playlists and puts them in the redux store
 */
const fetchPlaylists = async (successCallback: () => void, failureCallback: () => void) => {
  const { dispatch } = store;
  try {
    const result = await paginateAndRefreshAuth((offset) => spotifyApi.getUserPlaylists({ limit: 50, offset }));
    // dispatch(testResetNeedsSync());
    dispatch(mergeSpotifyState(result));
    successCallback();
  } catch (e) {
    console.error(e);
    failureCallback();
  }
};

const getTrackUris = async (playlistIds: string[]): Promise<string[]> => {
  const jaggedSongs = await Promise.all(playlistIds.map((playlist) => (
    paginateAndRefreshAuth((offset) => (
      spotifyApi.getPlaylistTracks(playlist, { fields: 'items(track(uri)),total', limit: 50, offset })
    ))
  )));
  return jaggedSongs.flat().map((trackObject) => trackObject.track.uri);
};

export {
  paginateAndRefreshAuth, refreshAuthWrapper, fetchPlaylists, getTrackUris,
};
