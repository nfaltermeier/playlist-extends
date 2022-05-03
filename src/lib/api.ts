import { batch } from 'react-redux';
import store from '../redux/store';
import {
  mergeSpotifyState, selectAllPlaylists, setComponentPlaylists,
  setCompositePlaylistsNeedSync, setLastSyncTracks, setSnapshotId, prependPlaylist, selectPlaylistById, replacePlaylist, deletePlaylist, setSortSpec,
} from '../redux/playlists';
import { refreshAccessToken } from './auth';
import spotifyApi from './spotifyApiKeeper';
import type { NamedTrack } from '../redux/playlists';
import { setDefaultPublicPlaylists } from '../redux/preferences';
import { createSortingRequestFields, createPlaylistSorter, SortingTrack } from './sorting';

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
 * Retrieves the current user's playlists and any external playlists already in the redux store
 * and merges them with the current redux store's playlists
 */
const fetchPlaylists = async (successCallback: () => void, failureCallback: () => void) => {
  const { dispatch } = store;
  try {
    const currentPlaylists = selectAllPlaylists(store.getState());
    const externalPlaylists = currentPlaylists.filter((p) => !p.isUserPlaylist);
    const playlistPromises = externalPlaylists.map((p) => refreshAuthWrapper(() => spotifyApi.getPlaylist(p.id, { fields: 'name,id,snapshot_id' }).catch(() => null)));
    const result = await paginateAndRefreshAuth((offset) => spotifyApi.getUserPlaylists({ limit: 50, offset }));
    (await Promise.all(playlistPromises)).forEach((p) => {
      if (p !== null) {
        result.push(p.body);
      }
    });
    // dispatch(testResetNeedsSync());
    dispatch(mergeSpotifyState(result));
    successCallback();
  } catch (e) {
    console.error(e);
    failureCallback();
  }
};

/**
 * @param fields Must include 'total' top level field for pagination
 * @returns Track objects with the requested fields. Probably not actually full objects.
 */
const getTracksWithFields = async (playlistIds: string[], fields: string): Promise<SpotifyApi.TrackObjectFull[]> => {
  const jaggedSongs = await Promise.all(playlistIds.map((playlist) => (
    paginateAndRefreshAuth((offset) => (
      spotifyApi.getPlaylistTracks(playlist, { fields, limit: 50, offset })
    ))
  )));
  return jaggedSongs.flat().map((t) => t.track);
};

const getSortedPlaylist = async (playlistIds: string[], sortSpec: string): Promise<NamedTrack[]> => {
  const fields = createSortingRequestFields(sortSpec);
  const tracks = (await getTracksWithFields(playlistIds, fields)) as SortingTrack[];
  tracks.forEach((track, i) => {
    // eslint-disable-next-line no-param-reassign
    track.spotifyPlaylistIndex = i;
  });
  const compare = createPlaylistSorter(sortSpec);
  tracks.sort(compare);
  return tracks.map((t) => ({ uri: t.uri, name: t.name }));
};

const createNewPlaylist = async (playlistName: string, checkedPlaylistIds: string[], sortSpec: string, publicPlaylist: boolean): Promise<string> => {
  const { dispatch } = store;
  const sortedTracks = await getSortedPlaylist(checkedPlaylistIds, sortSpec);
  const trackUris = sortedTracks.map((t) => t.uri);

  const playlistId = (await spotifyApi.createPlaylist(playlistName, { public: publicPlaylist })).body.id;

  let tracksAdded = 0;
  let snapshotId;
  do {
    snapshotId = (await spotifyApi.addTracksToPlaylist(
      playlistId,
      trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100)),
      { position: tracksAdded }
    )).body.snapshot_id;
    // tracksAdded will be inaccurate after the while loop, but that should be okay
    tracksAdded += 100;
  } while (tracksAdded < trackUris.length);
  dispatch(prependPlaylist({
    id: playlistId,
    name: playlistName,
    snapshotId,
    componentPlaylistIds: checkedPlaylistIds,
    needsSync: false,
    deletedOnSpotify: false,
    isUserPlaylist: true,
    lastSyncTracks: sortedTracks,
    sortSpec,
  }));
  dispatch(setDefaultPublicPlaylists(publicPlaylist));
  return playlistId;
};

const updateExistingPlaylist = async (playlistId: string, componentPlaylistIds: string[], sortSpec: string) => {
  const sortedTracks = await getSortedPlaylist(componentPlaylistIds, sortSpec);
  const trackUris = sortedTracks.map((t) => t.uri);

  let tracksAdded = 100;
  let snapshotId = (await spotifyApi.replaceTracksInPlaylist(
    playlistId,
    trackUris.slice(0, Math.min(trackUris.length, 100))
  )).body.snapshot_id;
  while (tracksAdded < trackUris.length) {
    snapshotId = (await spotifyApi.addTracksToPlaylist(
      playlistId,
      trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100))
    )).body.snapshot_id;
    // tracksAdded will be inaccurate after the while loop, but that should be okay
    tracksAdded += 100;
  }

  batch(() => {
    const { dispatch } = store;
    dispatch(setSnapshotId({ playlistId, snapshotId }));
    dispatch(setComponentPlaylists({ playlistId, componentPlaylistIds }));
    dispatch(setCompositePlaylistsNeedSync(playlistId));
    dispatch(setLastSyncTracks({ playlistId, tracks: sortedTracks }));
    dispatch(setSortSpec({ playlistId, spec: sortSpec }));
  });
};

const replaceDeletedPlaylist = async (playlistId: string, publicPlaylist: boolean): Promise<string> => {
  const { dispatch } = store;
  const playlist = selectPlaylistById(store.getState(), playlistId);
  if (!playlist) {
    throw new Error(`Trying to replace playlist that doesn't exist '${playlistId}'`);
  }
  const newId = await createNewPlaylist(playlist.name, playlist.componentPlaylistIds, playlist.sortSpec, publicPlaylist);
  dispatch(replacePlaylist({ oldId: playlistId, newId }));
  dispatch(deletePlaylist(playlistId));
  return newId;
};

/**
 * Argument should be the result of makeSyncOrder from playlistsHelper
 * @param playlistsToSync Should be the result of makeSyncOrder from playlistsHelper
 */
const syncMultiplePlaylists = async (playlistsToSync: string[]) => {
  const reduxState = store.getState();
  for (let i = 0; i < playlistsToSync.length; i += 1) {
    const pId = playlistsToSync[i];
    const p = selectPlaylistById(reduxState, pId);
    if (!p) {
      throw new Error(`Trying to sync non-existent playlist '${pId}'`);
    }
    await updateExistingPlaylist(p.id, p.componentPlaylistIds, p.sortSpec);
  }
};

export {
  paginateAndRefreshAuth, refreshAuthWrapper, fetchPlaylists, getTracksWithFields,
  getSortedPlaylist, createNewPlaylist, updateExistingPlaylist, replaceDeletedPlaylist, syncMultiplePlaylists,
};
