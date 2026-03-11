import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  data: [],
  count: 1,
  current_page: 1,
  isOpenModal: false,
  formValue: {},
  isOpenDeleteModal: false,
  postDataLoading: false,
  requestStatus: "",
  deleteDisplayTypeId: null,
  deleteDataLoading: false,
  deleteError: null,
  postError: null,
};
const fetchDisplayTypeData = createAsyncThunk(
  "getDisplayTypeSlice",
  async ({ page, search }) => {
    /*fetch displayType data*/
    const response = await axiosClient(
      `display/display-type/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postDisplayTypeData = createAsyncThunk(
  "postDisplayTypeSlice" /*post displayType data*/,
  async (data, { rejectWithValue }) => {
    /*post displayType data*/
    try {
      const response = await axiosClient.post("display/display-type/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getDisplayTypeDataById = createAsyncThunk(
  "getDisplayTypeSliceById" /*get displayType data by id*/,
  async (id) => {
    const response = await axiosClient.get(`display/display-type/${id}`);
    return response.data;
  },
);
const updateDisplayTypeData = createAsyncThunk(
  "editDisplayTypeSlice" /*update displayType data*/,
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `display/display-type/${data.id}/`,
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
const deleteDisplayTypeData = createAsyncThunk(
  "deleteDisplayTypeSlice" /*delete displayType data*/,
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(`display/display-type/${id}/`);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const displayTypeSlice = createSlice({
  name: "displayTypeSlice",
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isOpenModal = !state.isOpenModal;
      state.formValue = {};
      state.requestStatus = "";
    },
    toggleDeleteModal: (state, action) => {
      const { open, id } = action.payload ?? {};
      state.isOpenDeleteModal = open ?? !state.isOpenDeleteModal;
      state.deleteDisplayTypeId = id ?? null;
      state.deleteDataLoading = false;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    /*fetch data build add case*/
    builder.addCase(fetchDisplayTypeData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDisplayTypeData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchDisplayTypeData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post displayType data builder add case*/
    builder.addCase(postDisplayTypeData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postDisplayTypeData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
    });
    builder.addCase(postDisplayTypeData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    /*get displayType data builder add case*/
    builder.addCase(getDisplayTypeDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getDisplayTypeDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
    });
    builder.addCase(getDisplayTypeDataById.rejected, (state) => {
      state.isLoading = false;
    });

    /*update display type data builder add case*/
    builder.addCase(updateDisplayTypeData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateDisplayTypeData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
      state.formValue = action.payload;
      state.data = state.data.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      );
    });
    builder.addCase(updateDisplayTypeData.rejected, (state, action) => {
      state.postDataLoading = false;
      state.postError = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
    });

    /*delete display type data builder add case*/
    builder.addCase(deleteDisplayTypeData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteDisplayTypeData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    builder.addCase(deleteDisplayTypeData.rejected, (state, action) => {
      state.deleteDataLoading = false;
      state.isOpenDeleteModal = false;
      state.deleteError = action.payload?.detail || "Failed to delete display type";
    });
  },
});
export default displayTypeSlice.reducer;
export {
  fetchDisplayTypeData,
  postDisplayTypeData,
  updateDisplayTypeData,
  getDisplayTypeDataById,
  deleteDisplayTypeData,
};
export const { toggleModal, toggleDeleteModal } = displayTypeSlice.actions;
