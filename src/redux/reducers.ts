import { combineReducers } from '@reduxjs/toolkit';

import playlistsReducer from './playlists';
import loggedInReducer from './loggedIn';
import migratePersistOnLoginReducer from './migratePersistOnLogin';

const rootReducer = combineReducers({
  playlists: playlistsReducer,
  loggedIn: loggedInReducer,
  migratePersistOnLogin: migratePersistOnLoginReducer,
});

export default rootReducer;
