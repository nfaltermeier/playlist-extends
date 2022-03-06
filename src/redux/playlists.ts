import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

export interface ExtendablePlaylist {
  readonly id: string,
  readonly name: string,
  readonly snapshotId: string,
  readonly componentPlaylistIds: string[],
  readonly needsSync: boolean,
  readonly deletedOnSpotify: boolean,
  readonly isUserPlaylist: boolean
}

const playlistsAdapter = createEntityAdapter<ExtendablePlaylist>();
const localSelectors = playlistsAdapter.getSelectors();

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState: playlistsAdapter.getInitialState(),
  reducers: {
    prependPlaylist(state, action: PayloadAction<ExtendablePlaylist>) {
      playlistsAdapter.setAll(state, [action.payload, ...localSelectors.selectAll(state)]);
    },
    mergeSpotifyState(state, action: PayloadAction<SpotifyApi.PlaylistObjectSimplified[]>) {
      const playlists = action.payload;
      // key: component playlist ID, value: array of composite playlist IDs that contain the key playlist
      const compositePlaylistsMap = new Map<string, string[]>();
      const playlistWasUpdated = new Map<string, boolean>();
      const deletedOnSpotify = new Set<string>();
      // IDs should all be strings, but Typescript is concerned they might not be
      state.ids.forEach((id) => { deletedOnSpotify.add(id.toString()); });
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
      playlists.forEach((playlist) => {
        const oldPlaylist = state.entities[playlist.id];
        if (oldPlaylist) {
          deletedOnSpotify.delete(playlist.id);
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
          });
        }
      });
      deletedOnSpotify.forEach((deletedId) => {
        const deleted = state.entities[deletedId];
        // TODO: check if non-user playlist is deleted, need to make an API call
        if (deleted && deleted.isUserPlaylist) {
          deleted.deletedOnSpotify = true;
        } else {
          console.warn('deleted playlist ID is not present in state');
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
  },
});

export const {
  selectAll: selectAllPlaylists,
  selectById: selectPlaylistById,
} = playlistsAdapter.getSelectors((state: RootState) => state.playlists);
export const usePlaylists = () => useSelector(selectAllPlaylists);
export const usePlaylistById = (id: string) => useSelector((state: RootState) => selectPlaylistById(state, id));
export const {
  prependPlaylist, mergeSpotifyState, setName, setSnapshotId,
  setComponentPlaylists, testResetNeedsSync, setCompositePlaylistsNeedSync, deletePlaylist,
} = playlistsSlice.actions;
export default playlistsSlice.reducer;
/**
 * For migrations, not recommended for usage. Not a redux action.
 */
export const setAllPlaylists = playlistsAdapter.setAll;
