import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  activeSlide: "slide1",
  updated: false,
  isLoading: false,
  data: [],
  count: 1,
  current_page: 1,
  isOpenModal: false,
  formValue: {},
  isOpenDeleteModal: false,
  isOpenDuplicateModal: false,
  duplicatedPlaylist: null,
  duplicateLoading: false,
  postDataLoading: false,
  requestStatus: "",
  deletedPlaylistId: null,
  deleteDataLoading: false,
  postError: null,
};
const fetchPlayListData = createAsyncThunk(
  "getPlayListSlice",
  async ({ page, search }) => {
    /*fetch role data*/
    const response = await axiosClient(
      `playlist/playlist/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postPlayListData = createAsyncThunk(
  "postPlayListSlice" /*post role data*/,
  async (data, { rejectWithValue }) => {
    /*post role data*/
    try {
      const response = await axiosClient.post("playlist/playlist/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getPlayListDataById = createAsyncThunk(
  "getPlayListSliceById" /*get role data by id*/,
  async ({ id, condition }) => {
    const response = await axiosClient.get(`playlist/playlist/${id}`);
    return { data: response.data, condition };
  },
);
const updatePlayListData = createAsyncThunk(
  "editPlayListSlice" /*update role data*/,
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `playlist/playlist/${data.id}/`,
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
const deletePlayListData = createAsyncThunk(
  "deletePlayListSlice" /*delete role data*/,
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(`playlist/playlist/${id}/`);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const publishPlayList = createAsyncThunk("publishPlayList", async (id) => {
  const response = await axiosClient.post(`playlist/playlist/${id}/publish/`);
  return response.data;
});
const discardPlayList = createAsyncThunk("discardPlayList", async (id) => {
  const response = await axiosClient.post(`playlist/playlist/${id}/discard/`);
  return response.data;
});
const duplicatePlayList = createAsyncThunk(
  "duplicatePlayList",
  async (id) => {
    const response = await axiosClient.post(`playlist/playlist/${id}/duplicate/`);
    return response.data;
  },
);
const playListSlice = createSlice({
  name: "playListSlice",
  initialState,
  reducers: {
    toggleModal: (state, action) => {
      if (!action.payload) {
        state.formValue = {};
      }
      state.isOpenModal = !state.isOpenModal;
      state.requestStatus = "";
    },
    toggleDeleteModal: (state, action) => {
      const { open, id } = action.payload ?? {};
      state.isOpenDeleteModal = open ?? !state.isOpenDeleteModal;
      state.deletedPlaylistId = id ?? null;
      state.deleteDataLoading = false;
    },
    toggleDuplicateModal: (state) => {
      state.isOpenDuplicateModal = !state.isOpenDuplicateModal;
      if (!state.isOpenDuplicateModal) {
        state.duplicatedPlaylist = null;
      }
    },
    resetModals: (state) => {
      state.isOpenDeleteModal = false;
      state.isOpenModal = false;
      state.isOpenDuplicateModal = false;
      state.deletedPlaylistId = null;
      state.deleteDataLoading = false;
    },
  },
  extraReducers: (builder) => {
    /*fetch data build add case*/
    builder.addCase(fetchPlayListData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchPlayListData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchPlayListData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post playlist data builder add case*/
    builder.addCase(postPlayListData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postPlayListData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
      state.postError = "";
    });
    builder.addCase(postPlayListData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    /*get playlist data builder add case*/
    builder.addCase(getPlayListDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getPlayListDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload.data;
      state.requestStatus = "";
      if (!action.payload.condition) {
        state.isOpenModal = true;
      }
    });
    builder.addCase(getPlayListDataById.rejected, (state) => {
      state.isLoading = false;
    });

    /*update playlist data builder add case*/
    builder.addCase(updatePlayListData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updatePlayListData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
      state.data = state.data.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      );
    });
    builder.addCase(updatePlayListData.rejected, (state, action) => {
      state.postDataLoading = false;
      state.postError = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
    });

    /*delete playlist data builder add case*/
    builder.addCase(deletePlayListData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deletePlayListData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    builder.addCase(deletePlayListData.rejected, (state) => {
      state.deleteDataLoading = false;
    });

    /*Publish builder*/
    builder.addCase(publishPlayList.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(publishPlayList.fulfilled, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(publishPlayList.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*Discard builder*/
    builder.addCase(discardPlayList.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(discardPlayList.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(discardPlayList.rejected, (state) => {
      state.isLoading = false;
    });

    /*Duplicate builder*/
    builder.addCase(duplicatePlayList.pending, (state) => {
      state.duplicateLoading = true;
    });
    builder.addCase(duplicatePlayList.fulfilled, (state, action) => {
      state.duplicateLoading = false;
      state.duplicatedPlaylist = action.payload;
      state.isOpenDuplicateModal = true;
    });
    builder.addCase(duplicatePlayList.rejected, (state) => {
      state.duplicateLoading = false;
    });
  },
});

export default playListSlice.reducer;
export {
  fetchPlayListData,
  postPlayListData,
  updatePlayListData,
  getPlayListDataById,
  deletePlayListData,
  publishPlayList,
  discardPlayList,
  duplicatePlayList,
};
export const { toggleModal, toggleDeleteModal, toggleDuplicateModal, resetModals } = playListSlice.actions;
