import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

export interface ExtendedablePlaylist {
  id: string,
  name: string,
  snapshot: string,
  extendedPlaylists: string[]
}

type PlaylistsState = ExtendedablePlaylist[];

const initialState = [] as PlaylistsState;

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    addPlaylists(state, action: PayloadAction<ExtendedablePlaylist[]>) {
      return state.concat(action.payload);
    },
    setName(state, action: PayloadAction<{ playlistId: string, name: string }>) {
      const playlist = state.find((v) => action.payload.playlistId === v.id);
      if (playlist) {
        playlist.name = action.payload.name;
      }
    },
    updateStapshot(state, action: PayloadAction<{ playlistId: string, snapshot: string }>) {
      const playlist = state.find((v) => action.payload.playlistId === v.id);
      if (playlist) {
        playlist.snapshot = action.payload.snapshot;
      }
    },
    addSubPlaylists(state, action: PayloadAction<{ playlistId: string, subPlaylists: string[] }>) {
      const playlist = state.find((v) => action.payload.playlistId === v.id);
      if (playlist) {
        playlist.extendedPlaylists = playlist.extendedPlaylists.concat(action.payload.subPlaylists);
      }
    },
    removeSubPlaylists(state, action: PayloadAction<{ playlistId: string, subPlaylists: string[] }>) {
      const playlist = state.find((v) => action.payload.playlistId === v.id);
      if (playlist) {
        playlist.extendedPlaylists = playlist.extendedPlaylists.filter((v) => !action.payload.subPlaylists.includes(v));
      }
    },
  },
});

export const usePlaylists = () => useSelector((state: RootState) => state.playlists);
export const {
  addPlaylists, setName, updateStapshot, addSubPlaylists, removeSubPlaylists,
} = playlistsSlice.actions;
export default playlistsSlice.reducer;
