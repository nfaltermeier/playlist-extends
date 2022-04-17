import { createSlice } from '@reduxjs/toolkit';

type MigratePersistOnLoginState = boolean;

const initialState = false as MigratePersistOnLoginState;

const loggedInSlice = createSlice({
  name: 'migratePersistOnLogin',
  initialState,
  reducers: {
    setMigrated() {
      return false;
    },
  },
});

export const { setMigrated } = loggedInSlice.actions;
export default loggedInSlice.reducer;
