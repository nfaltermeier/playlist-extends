import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

type LoggedInState = boolean;

const initialState = false as LoggedInState;

const loggedInSlice = createSlice({
  name: 'loggedIn',
  initialState,
  reducers: {
    setLoggedIn() {
      return true;
    },
    setLoggedOut() {
      return false;
    },
  },
});

export const useLoggedIn = () => useSelector((state: RootState) => state.loggedIn);
export const { setLoggedIn, setLoggedOut } = loggedInSlice.actions;
export default loggedInSlice.reducer;
