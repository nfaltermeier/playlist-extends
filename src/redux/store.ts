import { configureStore } from '@reduxjs/toolkit';

import playlistsReducer from './playlists';
import loggedInReducer from './loggedIn';

const store = configureStore({
  reducer: {
    playlists: playlistsReducer,
    loggedIn: loggedInReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
