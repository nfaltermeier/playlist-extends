import { combineReducers } from '@reduxjs/toolkit';

import playlistsReducer from './playlists';
import loggedInReducer from './loggedIn';
import migratePersistOnLoginReducer from './migratePersistOnLogin';
import preferencesReducer from './preferences';

const rootReducer = combineReducers({
  playlists: playlistsReducer,
  loggedIn: loggedInReducer,
  migratePersistOnLogin: migratePersistOnLoginReducer,
  preferences: preferencesReducer,
});

export default rootReducer;
