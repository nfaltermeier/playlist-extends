import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

export interface NamedTrack {
  name: string,
  uri: string
}

export interface ExtendablePlaylist {
  readonly id: string,
  readonly name: string,
  readonly snapshotId: string,
  readonly componentPlaylistIds: string[],
  readonly needsSync: boolean,
  readonly deletedOnSpotify: boolean,
  readonly isUserPlaylist: boolean,
  // The track URIs as of the last sync, only stored for composite playlists
  readonly lastSyncTracks: NamedTrack[],
  readonly sortSpec: string,
  // How the playlist is sorted among the other playlists on the homepage
  readonly playlistSortNumber: number,
}

export const defaultSortSpec = 'custom;a';

const playlistsAdapter = createEntityAdapter<ExtendablePlaylist>({
  sortComparer: (a, b) => (a.playlistSortNumber - b.playlistSortNumber),
});
type StateType = Parameters<typeof playlistsAdapter.updateMany>[0];

const changeSortOrderFn = (state: StateType, action: PayloadAction<{ playlistToMoveId: string, newIndex: number }>) => {
  const { playlistToMoveId, newIndex } = action.payload;
  const playlistToMove = state.entities[playlistToMoveId];
  if (playlistToMove) {
    const updates = state.ids.map((id, index) => {
      if (id === playlistToMoveId) {
        return { id, changes: { playlistSortNumber: newIndex } };
      }
      const pl = state.entities[id]!;
      if (pl.playlistSortNumber >= newIndex) {
        return { id, changes: { playlistSortNumber: pl.playlistSortNumber + 1 } };
      }
      // This should help prevent the sort numbers just getting larger and larger
      return { id, changes: { playlistSortNumber: index } };
    });
    playlistsAdapter.updateMany(state, updates);
  }
};

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState: playlistsAdapter.getInitialState(),
  reducers: {
    addPlaylist(state, action: PayloadAction<ExtendablePlaylist>) {
      playlistsAdapter.addOne(state, action.payload);
      changeSortOrderFn(state, { payload: { playlistToMoveId: action.payload.id, newIndex: action.payload.playlistSortNumber }, type: 'playlists/changeSortOrder' });
    },
    mergeSpotifyState(state, action: PayloadAction<SpotifyApi.PlaylistObjectSimplified[]>) {
      const incomingPlaylists = action.payload;
      // key: component playlist ID, value: array of composite playlist IDs that contain the key playlist
      const compositePlaylistsMap = new Map<string, string[]>();
      const playlistWasUpdated = new Map<string, boolean>();
      // Temporarily set all playlists as deleted, unset later during individual processing
      state.ids.forEach((id) => {
        const p = state.entities[id];
        if (p) {
          p.deletedOnSpotify = true;
        }
      });
      /**
       * Recursively checks all playlists that contain playlistId as a component playlist.
       * Assumes that playlistId needs sync!
       */
      const checkCompositePlaylists = (playlistId: string) => {
        const compositePlaylistIds = compositePlaylistsMap.get(playlistId);
        if (compositePlaylistIds) {
          compositePlaylistIds.forEach((compositePlaylistId) => {
            // only recursively check playlists that have already been checked where it seemed that no sync was needed
            if (playlistWasUpdated.get(compositePlaylistId) === false) {
              const compositePlaylist = state.entities[compositePlaylistId];
              if (compositePlaylist) {
                compositePlaylist.needsSync = true;
                playlistWasUpdated.set(compositePlaylistId, true);
                checkCompositePlaylists(compositePlaylistId);
              } else {
                console.warn('compositePlaylistId is not present in state');
              }
            }
          });
        }
      };
      incomingPlaylists.forEach((playlist) => {
        const oldPlaylist = state.entities[playlist.id];
        if (oldPlaylist) {
          oldPlaylist.deletedOnSpotify = false;
          const snapshotChanged = oldPlaylist.snapshotId !== playlist.snapshot_id;
          playlistWasUpdated.set(playlist.id, snapshotChanged);
          if (snapshotChanged) {
            // TODO: If this is a composite playlist, check if the same change was also made in a component playlist. If not, some kind of sync needed
            oldPlaylist.snapshotId = playlist.snapshot_id;

            const compositePlaylistIds = compositePlaylistsMap.get(playlist.id);
            if (compositePlaylistIds) {
              compositePlaylistIds.forEach((compositePlaylistId) => {
                const compositePlaylist = state.entities[compositePlaylistId];
                if (compositePlaylist) {
                  compositePlaylist.needsSync = true;
                  playlistWasUpdated.set(compositePlaylistId, true);
                  checkCompositePlaylists(compositePlaylistId);
                } else {
                  console.warn('compositePlaylistId is not present in state');
                }
              });
            }
          }

          if (oldPlaylist.name !== playlist.name) {
            oldPlaylist.name = playlist.name;
          }

          oldPlaylist.componentPlaylistIds.forEach((componentPlaylistId) => {
            const otherComposites = compositePlaylistsMap.get(componentPlaylistId);
            if (otherComposites) {
              otherComposites.push(playlist.id);
            } else {
              compositePlaylistsMap.set(componentPlaylistId, [playlist.id]);
            }

            if (playlistWasUpdated.get(componentPlaylistId)) {
              oldPlaylist.needsSync = true;
              playlistWasUpdated.set(playlist.id, true);
            }
          });
        } else {
          playlistsAdapter.addOne(state, {
            id: playlist.id,
            name: playlist.name,
            snapshotId: playlist.snapshot_id,
            componentPlaylistIds: [],
            needsSync: false,
            deletedOnSpotify: false,
            isUserPlaylist: true,
            lastSyncTracks: [],
            sortSpec: defaultSortSpec,
            playlistSortNumber: 0,
          });
        }
      });
    },
    setName(state, action: PayloadAction<{ playlistId: string, name: string }>) {
      playlistsAdapter.updateOne(state, { id: action.payload.playlistId, changes: { name: action.payload.name } });
    },
    setSnapshotId(state, action: PayloadAction<{ playlistId: string, snapshotId: string }>) {
      playlistsAdapter.updateOne(state, { id: action.payload.playlistId, changes: { snapshotId: action.payload.snapshotId } });
    },
    setComponentPlaylists(state, action: PayloadAction<{ playlistId: string, componentPlaylistIds: string[] }>) {
      playlistsAdapter.updateOne(state, { id: action.payload.playlistId, changes: { componentPlaylistIds: action.payload.componentPlaylistIds } });
    },
    testResetNeedsSync(state) {
      playlistsAdapter.updateMany(state, state.ids.map((id) => ({
        id, changes: { needsSync: false },
      })));
    },
    setCompositePlaylistsNeedSync(state, action: PayloadAction<string>) {
      const playlistId = action.payload;
      const updatedPlaylists = [playlistId];
      {
        const playlist = state.entities[playlistId];
        if (playlist) {
          playlist.needsSync = false;
        }
      }
      // key: component playlist ID, value: array of composite playlist IDs that contain the key playlist
      const compositePlaylistsMap = new Map<string, string[]>();
      /**
       * Recursively set all playlists to need sync that contain playlistId as a component playlist.
       */
      const setCompositePlaylists = (checkPlaylistId: string) => {
        const compositePlaylistIds = compositePlaylistsMap.get(checkPlaylistId);
        if (compositePlaylistIds) {
          compositePlaylistIds.forEach((compositePlaylistId) => {
            const compositePlaylist = state.entities[compositePlaylistId];
            if (compositePlaylist) {
              if (!compositePlaylist.needsSync) {
                compositePlaylist.needsSync = true;
                updatedPlaylists.push(compositePlaylist.id);
                setCompositePlaylists(compositePlaylistId);
              }
            } else {
              console.warn('compositePlaylistId is not present in state');
            }
          });
        }
      };
      state.ids.forEach((checkPlaylistId) => {
        const playlist = state.entities[checkPlaylistId];
        if (!playlist) { return; }
        if (updatedPlaylists.some((test) => playlist.componentPlaylistIds.includes(test))) {
          playlist.needsSync = true;
          updatedPlaylists.push(playlist.id);
          setCompositePlaylists(playlist.id);
        } else {
          playlist.componentPlaylistIds.forEach((componentPlaylistId) => {
            const otherComposites = compositePlaylistsMap.get(componentPlaylistId);
            if (otherComposites) {
              otherComposites.push(playlist.id);
            } else {
              compositePlaylistsMap.set(componentPlaylistId, [playlist.id]);
            }
          });
        }
      });
    },
    deletePlaylist(state, action: PayloadAction<string>) {
      playlistsAdapter.removeOne(state, action.payload);
    },
    setLastSyncTracks(state, action: PayloadAction<{ playlistId: string, tracks: NamedTrack[] }>) {
      playlistsAdapter.updateOne(state, { id: action.payload.playlistId, changes: { lastSyncTracks: action.payload.tracks } });
    },
    setSortSpec(state, action: PayloadAction<{ playlistId: string, spec: string }>) {
      playlistsAdapter.updateOne(state, { id: action.payload.playlistId, changes: { sortSpec: action.payload.spec } });
    },
    replacePlaylist(state, action: PayloadAction<{ oldId: string, newId: string }>) {
      const { oldId, newId } = action.payload;
      state.ids.forEach((id) => {
        const playlist = state.entities[id];
        if (!playlist) {
          return;
        }
        const i = playlist.componentPlaylistIds.indexOf(oldId);
        if (i !== -1) {
          playlist.componentPlaylistIds = new Array(...playlist.componentPlaylistIds);
          playlist.componentPlaylistIds.splice(i, 1, newId);
        }
      });
    },
    changeSortOrder: changeSortOrderFn,
  },
});

export const {
  selectAll: selectAllPlaylists,
  selectById: selectPlaylistById,
  selectIds: selectPlaylistIds,
  selectTotal: selectTotalPlaylists,
} = playlistsAdapter.getSelectors((state: RootState) => state.playlists);

export const usePlaylists = () => useSelector(selectAllPlaylists);
export const usePlaylistById = (id: string) => useSelector((state: RootState) => selectPlaylistById(state, id));
export const {
  addPlaylist, mergeSpotifyState, setName, setSnapshotId,
  setComponentPlaylists, testResetNeedsSync, setCompositePlaylistsNeedSync, deletePlaylist,
  setLastSyncTracks, setSortSpec, replacePlaylist, changeSortOrder,
} = playlistsSlice.actions;
export default playlistsSlice.reducer;
/**
 * For migrations, not recommended for usage. Not a redux action.
 */
export const setAllPlaylists = playlistsAdapter.setAll;
