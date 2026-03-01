import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  data: [],
  count: 1,
  current_page: 1,
  isOpenModal: false,
  isOpenDeleteModal: false,
  postDataLoading: false,
  postDataError: "",
  requestStatus: false,
  formValue: {},
  deleteUserId: null,
  deleteDataLoading: false,
};
const fetchUserData = createAsyncThunk(
  "getUserSlice",
  async ({ page, search }) => {
    const response = await axiosClient.get(
      `accounts/user/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postUserData = createAsyncThunk(
  "postUserSlice",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("accounts/user/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getUserDataById = createAsyncThunk("getUserSliceById", async (id) => {
  const response = await axiosClient.get(`accounts/user/${id}`);
  return response.data;
});
const updateUserData = createAsyncThunk(
  "updateUserSlice" /*update role data*/,
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch(
        `accounts/user/${data.id}/`,
        data,
      );
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const deleteUserData = createAsyncThunk(
  "deleteUserSlice" /*delete role data*/,
  async (id) => {
    const response = await axiosClient.delete(`accounts/user/${id}/`);
    return response.data;
  },
);
const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isOpenModal = !state.isOpenModal;
      state.formValue = {};
      state.requestStatus = "";
      state.postDataError = "";
    },
    toggleDeleteModal: (state, action) => {
      const { open, id } = action.payload ?? {};
      state.isOpenDeleteModal = open ?? !state.isOpenDeleteModal;
      state.deleteUserId = id ?? null;
      state.deleteDataLoading = false;
    },
  },
  extraReducers: (builder) => {
    /*get user data builder add case*/
    builder.addCase(fetchUserData.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchUserData.fulfilled, (state, action) => {
      state.requestStatus = false;
      state.isLoading = false;
      state.data = action.payload.results;
      state.postDataLoading = false;
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchUserData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post user data builder add case*/
    builder.addCase(postUserData.pending, (state) => {
      state.postDataLoading = true;
    });
    builder.addCase(postUserData.fulfilled, (state, action) => {
      state.requestStatus = "post";
      state.postDataLoading = false;
      state.isOpenModal = false;
      state.postDataError = "";
    });
    builder.addCase(postUserData.rejected, (state, action) => {
      state.postDataLoading = false;
      state.postDataError = action.payload;
    });

    /*get user data builder add case*/
    builder.addCase(getUserDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getUserDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
    });
    builder.addCase(getUserDataById.rejected, (state) => {
      state.isLoading = false;
    });

    /*update user data builder add case*/
    builder.addCase(updateUserData.pending, (state) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateUserData.fulfilled, (state, action) => {
      state.isOpenModal = false;
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.postDataError = "";
    });
    builder.addCase(updateUserData.rejected, (state, action) => {
      state.postDataError = action.payload;
      state.postDataLoading = false;
    });

    /*delete user data builder add case*/
    builder.addCase(deleteUserData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteUserData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
  },
});

export default userSlice.reducer;
export {
  fetchUserData,
  postUserData,
  getUserDataById,
  updateUserData,
  deleteUserData,
};
export const { toggleModal, toggleDeleteModal } = userSlice.actions;
