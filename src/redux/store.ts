import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistCombineReducers,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import playlistsReducer from './playlists';
import loggedInReducer from './loggedIn';

const persistConfig = {
  key: 'reduxStore',
  whitelist: ['playlists'],
  version: 1,
  storage,
};

const rootReducer = persistCombineReducers(persistConfig, {
  playlists: playlistsReducer,
  loggedIn: loggedInReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export const persistor = persistStore(store);

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
