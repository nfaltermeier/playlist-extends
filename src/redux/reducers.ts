import {
  persistCombineReducers,
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

export default rootReducer;
