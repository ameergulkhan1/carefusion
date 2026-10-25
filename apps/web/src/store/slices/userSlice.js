import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {},
  loading: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearUser: (state) => {
      state.profile = null;
      state.preferences = {};
    }
  }
});

export const { setProfile, updatePreferences, clearUser } = userSlice.actions;
export default userSlice.reducer;