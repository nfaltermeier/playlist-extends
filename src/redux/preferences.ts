/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

interface PreferencesState {
  readonly defaultPublicPlaylists: boolean,
}

const initialState: PreferencesState = {
  defaultPublicPlaylists: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setDefaultPublicPlaylists(state, action: PayloadAction<boolean>) {
      state.defaultPublicPlaylists = action.payload;
    },
  },
});

export const useDefaultPublicPlaylists = () => useSelector((state: RootState) => state.preferences.defaultPublicPlaylists);
export const { setDefaultPublicPlaylists } = preferencesSlice.actions;
export default preferencesSlice.reducer;
