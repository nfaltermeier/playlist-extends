import { combineReducers } from '@reduxjs/toolkit';

import playlistsReducer from './playlists';
import loggedInReducer from './loggedIn';

const rootReducer = combineReducers({
  playlists: playlistsReducer,
  loggedIn: loggedInReducer,
});

export default rootReducer;
