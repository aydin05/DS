import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./features/loginSlice";
import registerSlice from "./features/registerSlice";
import userSlice from "./features/userSlice";
import branchSlice from "./features/branchSlice";
import roleSlice from "./features/roleSlice";
import playListSlice from "./features/playListSlice";
import displayTypeSlice from "./features/displayTypeSlice";
import displayGroupsSlice from "./features/displayGroupsSlice";
import scheduleSlice from "./features/scheduleSlice";
import displaySlice from "./features/displaySlice";
import playListInnerSlice from "./features/playListInnerSlice";
import deviceStatusSlice from "./features/deviceStatusSlice";
import notificationSlice from "./features/notificationSlice";

const store = configureStore({
  reducer: {
    loginSlice,
    registerSlice,
    userSlice,
    branchSlice,
    roleSlice,
    playListSlice,
    displayTypeSlice,
    displayGroupsSlice,
    scheduleSlice,
    displaySlice,
    playListInnerSlice,
    deviceStatusSlice,
    notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export default store;
