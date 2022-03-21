import {
  persistCombineReducers,
  createMigrate,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import playlistsReducer, { selectAllPlaylists, setAllPlaylists } from './playlists';
import loggedInReducer from './loggedIn';

const migrations = {
  2: (state: any): any => {
    const playlists = selectAllPlaylists(state);
    return { ...state, playlists: setAllPlaylists(state.playlists, playlists.map((playlist) => ({ ...playlist, isUserPlaylist: true }))) };
  },
  3: (state: any): any => {
    const playlists = selectAllPlaylists(state);
    return { ...state, playlists: setAllPlaylists(state.playlists, playlists.map((playlist) => ({ ...playlist, lastSyncTrackUris: [], needsSync: true }))) };
  },
};

const persistConfig = {
  key: 'reduxStore',
  whitelist: ['playlists'],
  version: 3,
  storage,
  migrate: createMigrate(migrations),
};

const rootReducer = persistCombineReducers(persistConfig, {
  playlists: playlistsReducer,
  loggedIn: loggedInReducer,
});

export default rootReducer;
