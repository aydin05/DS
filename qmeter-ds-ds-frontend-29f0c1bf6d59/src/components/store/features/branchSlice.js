import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  data: [],
  count: 1,
  current_page: 1,
  current_page_display: 1,
  isOpenModal: false,
  formValue: {},
  isOpenDeleteModal: false,
  postDataLoading: false,
  requestStatus: "",
  deletedBranchId: null,
  deleteDataLoading: false,
  postError: null,

  previewOpenLinkData: {},
  isOpenedPreviewOpenLinkData: false,
};
const fetchBranchData = createAsyncThunk(
  "branchSlice",
  async ({ page, search, notifications_enabled }) => {
    let url = `branch/branch/?page=${page}${search ? "&search=" + search : ""}`;
    if (notifications_enabled !== undefined && notifications_enabled !== null) {
      url += `&notifications_enabled=${notifications_enabled}`;
    }
    const response = await axiosClient.get(url);
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postBranchData = createAsyncThunk(
  "postBranchSlice",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("branch/branch/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getBranchDataById = createAsyncThunk(
  "getBranchSliceById",
  async ({ id, page, search }, { rejectWithValue }) => {
    try {
      const response =
        await axiosClient.get(`branch/branch/${id}${page ? "?page=" + page : ""}${search ? "&search=" + search : ""}`);
      return { ...response.data, current_page_display: page };
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const updateBranchData = createAsyncThunk(
  "editBranchSlice",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`branch/branch/${data.id}/`, data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const deleteBranchData = createAsyncThunk("deleteBranchSlice", async (id) => {
  const response = await axiosClient.delete(`branch/branch/${id}/`);
  return response.data;
});
const patchBranchNotification = createAsyncThunk(
  "patchBranchNotification",
  async ({ id, notifications_enabled }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch(`branch/branch/${id}/`, { notifications_enabled });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);
const branchSlice = createSlice({
  name: "branchSlice",
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isOpenModal = !state.isOpenModal;
      state.formValue = {};
      state.requestStatus = "";
    },
    toggleDeleteModal: (state, action) => {
      state.isOpenDeleteModal = !state.isOpenDeleteModal;
      state.deletedBranchId = action.payload;
      state.deleteDataLoading = false;
    },
    resetBranchState: (state) => {
      state.isOpenModal = false;
    },
    previewOpenLinkData: (state, action) => {
      state.previewOpenLinkData = action.payload;
    },
  },
  extraReducers: (builder) => {
    /*fetch branch data builder add case*/
    builder.addCase(fetchBranchData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchBranchData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchBranchData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post branch data builder add case*/
    builder.addCase(postBranchData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postBranchData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
      state.postError = "";
    });
    builder.addCase(postBranchData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    /*get branch data builder add case*/
    builder.addCase(getBranchDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getBranchDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
      state.current_page_display = action.payload.current_page_display;
    });
    builder.addCase(getBranchDataById.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*update branch data builder add case*/
    builder.addCase(updateBranchData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateBranchData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
    });

    /*delete branch data builder add case*/
    builder.addCase(deleteBranchData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteBranchData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });

    /*patch branch notification*/
    builder.addCase(patchBranchNotification.fulfilled, (state, action) => {
      state.data = state.data.map((b) =>
        b.id === action.payload.id ? { ...b, notifications_enabled: action.payload.notifications_enabled } : b
      );
    });
  },
});
export default branchSlice.reducer;
export {
  fetchBranchData,
  postBranchData,
  getBranchDataById,
  updateBranchData,
  deleteBranchData,
  patchBranchNotification,
};
export const {
  toggleModal,
  toggleDeleteModal,
  resetBranchState,
  previewOpenLinkData,
} = branchSlice.actions;
