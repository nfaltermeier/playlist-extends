import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

export interface ExtendedablePlaylist {
  id: string,
  name: string,
  snapshotId: string,
  componentPlaylistIds: string[],
  isComponentPlaylist: boolean,
  needsSync: boolean,
  deletedOnSpotify: boolean
}

const playlistsAdapter = createEntityAdapter<ExtendedablePlaylist>();

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState: playlistsAdapter.getInitialState(),
  reducers: {
    addPlaylists: playlistsAdapter.addMany,
    mergeSpotifyState(state, action: PayloadAction<SpotifyApi.PlaylistObjectSimplified[]>) {
      const playlists = action.payload;
      const playlistChanges = new Map<string, Partial<ExtendedablePlaylist>>();
      // key: component playlist ID, value: array of composite playlist IDs that contain the key playlist
      const compositePlaylistsMap = new Map<string, string[]>();
      const playlistWasUpdated = new Map<string, boolean>();
      playlists.forEach((playlist) => {
        const oldPlaylist = state.entities[playlist.id];
        if (oldPlaylist) {
          const updated = oldPlaylist.snapshotId !== playlist.snapshot_id;
          playlistWasUpdated.set(playlist.id, updated);
          if (updated) {
            {
              const update = playlistChanges.get(playlist.id);
              if (update) {
                update.snapshotId = playlist.snapshot_id;
              } else {
                playlistChanges.set(playlist.id, { snapshotId: playlist.snapshot_id, id: playlist.id });
              }
            }

            const compositePlaylistIds = compositePlaylistsMap.get(playlist.id);
            if (compositePlaylistIds) {
              compositePlaylistIds.forEach((compositePlaylistId) => {
                const update = playlistChanges.get(compositePlaylistId);
                if (update) {
                  update.needsSync = true;
                } else {
                  playlistChanges.set(compositePlaylistId, { needsSync: true, id: compositePlaylistId });
                }
              });
            }
          }

          oldPlaylist.componentPlaylistIds.forEach((componentPlaylistId) => {
            if (playlistWasUpdated.get(componentPlaylistId)) {
              const update = playlistChanges.get(playlist.id);
              if (update) {
                update.needsSync = true;
              } else {
                playlistChanges.set(playlist.id, { needsSync: true, id: playlist.id });
              }
            } else {
              const otherComposites = compositePlaylistsMap.get(componentPlaylistId);
              if (otherComposites) {
                otherComposites.push(playlist.id);
              } else {
                compositePlaylistsMap.set(componentPlaylistId, [playlist.id]);
              }
            }
          });
        } else {
          playlistChanges.set(playlist.id, {
            id: playlist.id,
            name: playlist.name,
            snapshotId: playlist.snapshot_id,
            componentPlaylistIds: [],
            isComponentPlaylist: false,
            needsSync: false,
            deletedOnSpotify: false,
          });
        }
      });
      if (playlistChanges.size > 0) {
        // casting partial ExtendedablePlaylist to ExtendedablePlaylist is fine unless the store state is concurrently modified
        playlistsAdapter.upsertMany(state, Array.from(playlistChanges.values()) as ExtendedablePlaylist[]);
      }
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
  },
});

export const {
  selectAll: selectAllPlaylists,
  selectById: selectPlaylistById,
} = playlistsAdapter.getSelectors((state: RootState) => state.playlists);
export const usePlaylists = () => useSelector(selectAllPlaylists);
export const {
  addPlaylists, mergeSpotifyState, setName, setSnapshotId, setComponentPlaylists, testResetNeedsSync,
} = playlistsSlice.actions;
export default playlistsSlice.reducer;
