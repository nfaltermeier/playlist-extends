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

import { defaultSortSpec, selectAllPlaylists, setAllPlaylists } from './playlists';
import { setMigrated } from './migratePersistOnLogin';

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
  4: (state: any): any => ({ ...state, migratePersistOnLogin: true }),
  5: (state: any): any => {
    const playlists = selectAllPlaylists(state);
    return { ...state, playlists: setAllPlaylists(state.playlists, playlists.map((playlist) => ({ ...playlist, sortSpec: defaultSortSpec }))) };
  },
};

let localStorageKey = 'reduxStore';
export const getLocalStorageKey = () => localStorageKey;

const persistConfig = {
  key: localStorageKey,
  whitelist: ['playlists', 'migratePersistOnLogin'],
  version: 5,
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

export const persistor = persistStore(store);

export const switchToUserStore = async (userId: string) => {
  localStorageKey = `${userId}:reduxStore`;

  if (store.getState().migratePersistOnLogin) {
    store.dispatch(setMigrated());
    await persistor.flush();

    const currentState = localStorage.getItem('persist:reduxStore');
    if (currentState !== null) {
      localStorage.setItem(`persist:${localStorageKey}`, currentState);
      localStorage.removeItem('persist:reduxStore');
    }
  }

  persistConfig.key = localStorageKey;
  store.replaceReducer(persistReducer(persistConfig, rootReducer));
};

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./reducers', () => {
    console.log('processing new reducers');
    store.replaceReducer(persistReducer(persistConfig, rootReducer));
  });
}

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
