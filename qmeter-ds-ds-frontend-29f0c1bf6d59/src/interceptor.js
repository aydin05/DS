import axiosClient from "./config";
import Cookies from "js-cookie";
import store from "./components/store/store";
import { logOut, networkError } from "./components/store/features/loginSlice";

axiosClient.interceptors.request.use(
  (config) => {
    const qToken = Cookies.get("q-token");
    if (qToken) {
      config.headers.Authorization = "Token " + qToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      store.dispatch(networkError());
      return Promise.reject(error);
    }
    switch (error.response.status) {
      case 400:
        return Promise.reject(error);
      case 401:
        store.dispatch(logOut());
        return Promise.reject(error);
      default:
        return Promise.reject(error);
    }
  },
);
