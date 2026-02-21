import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  registerMessage: {},
  isRegister: false,
  isLoading: false,
};
const registerSlice = createSlice({
  name: "register",
  initialState,
  reducers: {
    registerError: (state, action) => {
      state.registerMessage = action.payload;
      state.isLoading = false;
    },
    registerSuccess: (state, action) => {
      state.registerMessage = {};
      state.isLoading = false;
      state.isRegister = true;
    },
    registerPending: (state, action) => {
      state.registerMessage = {};
      state.isLoading = true;
      state.isRegister = false;
    },
  },
});

export const { registerError, registerSuccess, registerPending } =
  registerSlice.actions;
export default registerSlice.reducer;
