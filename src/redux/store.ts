/* eslint import/no-import-module-exports: "off" */
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistReducer,
  createMigrate,
} from 'redux-persist';

import storage from 'redux-persist/lib/storage';
import rootReducer from './reducers';

import { selectAllPlaylists, setAllPlaylists } from './playlists';

const migrations = {
  2: (state: any): any => {
    const playlists = selectAllPlaylists(state);
    return { ...state, playlists: setAllPlaylists(state.playlists, playlists.map((playlist) => ({ ...playlist, isUserPlaylist: true }))) };
  },
  3: (state: any): any => {
    const playlists = selectAllPlaylists(state);
    return {
      ...state,
      playlists: setAllPlaylists(state.playlists, playlists.map((playlist) => (
        { ...playlist, lastSyncTracks: [], needsSync: playlist.componentPlaylistIds.length > 0 }
      ))),
    };
  },
  // Changing global storage to per-user storage, this will clear global storage
  4: (): any => ({}),
};

let localStorageKey = 'reduxStore';
export const getLocalStorageKey = () => localStorageKey;

const persistConfig = {
  key: localStorageKey,
  whitelist: ['playlists'],
  version: 4,
  storage,
  migrate: createMigrate(migrations),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export const switchToUserStore = (userId: string) => {
  localStorageKey = `${userId}:reduxStore`;
  persistConfig.key = localStorageKey;
  store.replaceReducer(persistReducer(persistConfig, rootReducer));
};

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./reducers', () => {
    console.log('processing new reducers');
    store.replaceReducer(persistReducer(persistConfig, rootReducer));
  });
}

export const persistor = persistStore(store);

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
