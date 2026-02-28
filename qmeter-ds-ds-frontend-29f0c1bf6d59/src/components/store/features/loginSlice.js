import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  isAuth: !!Cookies.get("q-token"),
  error: {},
  networkError: "",
};
const loginSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginPending: () => {
      return {
        isLoading: true,
        error: {},
        isAuth: false,
        networkError: "",
      };
    },
    loginSuccess: () => {
      return {
        isLoading: false,
        isAuth: true,
        error: {},
        networkError: "",
      };
    },
    loginError: (state, action) => {
      return {
        isLoading: false,
        isAuth: false,
        error: action.payload,
        networkError: "",
      };
    },
    logOut: (state) => {
      Cookies.remove("q-token");
      Cookies.remove("user");
      return {
        isLoading: false,
        error: {},
        networkError: "",
        isAuth: false,
      };
    },
    networkError: (state) => {
      return {
        ...state,
        networkError: "Network error! Please try again!",
      };
    },
  },
});
export default loginSlice.reducer;
export const { loginPending, loginSuccess, loginError, logOut, networkError } =
  loginSlice.actions;
