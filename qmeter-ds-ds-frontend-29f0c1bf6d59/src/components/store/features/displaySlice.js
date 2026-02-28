import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  data: [],
  isOpenModal: false,
  formValue: {},
  isOpenDeleteModal: false,
  postDataLoading: false,
  requestStatus: "",
  deleteDisplayId: null,
  deleteDataLoading: false,
  postError: null,
};
const fetchDisplayData = createAsyncThunk("getDisplaySlice", async () => {
  /*fetch displayType data*/
  const response = await axiosClient(`display/unassigned-display/`);
  return response.data.map((item, index) => {
    return {
      ...item,
      key: index,
    };
  });
});
const postDisplayData = createAsyncThunk(
  "postDisplaySlice" /*post displayType data*/,
  async (data, { rejectWithValue }) => {
    /*post displayType data*/
    try {
      const response = await axiosClient.post("display/display/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getDisplayDataById = createAsyncThunk(
  "getDisplaySliceById" /*get displayType data by id*/,
  async (id) => {
    const response = await axiosClient.get(`display/display/${id}`);
    return response.data;
  },
);
const updateDisplayData = createAsyncThunk(
  "editDisplaySlice" /*update displayType data*/,
  async (data) => {
    const response = await axiosClient.put(`display/display/${data.id}/`, data);
    return response.data;
  },
);
const deleteDisplayData = createAsyncThunk(
  "deleteDisplaySlice" /*delete displayType data*/,
  async (id) => {
    const response = await axiosClient.delete(`display/display/${id}/`);
    return response.data;
  },
);
const displaySlice = createSlice({
  name: "displaySlice",
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isOpenModal = !state.isOpenModal;
      state.formValue = {};
      state.requestStatus = "";
    },
    toggleDeleteModal: (state, action) => {
      state.isOpenDeleteModal = !state.isOpenDeleteModal;
      state.deleteDisplayId = action.payload;
      state.deleteDataLoading = false;
    },
    resetDisplayState: (state) => {
      state.requestStatus = "";
    },
  },
  extraReducers: (builder) => {
    /*fetch data build add case*/
    builder.addCase(fetchDisplayData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDisplayData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
      state.requestStatus = "";
    });
    builder.addCase(fetchDisplayData.rejected, (state) => {
      state.isLoading = false;
    });

    /*post displayType data builder add case*/
    builder.addCase(postDisplayData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postDisplayData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
    });
    builder.addCase(postDisplayData.rejected, (state, action) => {
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
    builder.addCase(getDisplayDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getDisplayDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
    });
    builder.addCase(getDisplayDataById.rejected, (state) => {
      state.isLoading = false;
    });

    /*update display data builder add case*/
    builder.addCase(updateDisplayData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateDisplayData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
    });
    builder.addCase(updateDisplayData.rejected, (state, action) => {
      state.postDataLoading = false;
      state.postError = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
    });

    /*delete display data builder add case*/
    builder.addCase(deleteDisplayData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteDisplayData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    builder.addCase(deleteDisplayData.rejected, (state) => {
      state.deleteDataLoading = false;
    });
  },
});
export default displaySlice.reducer;
export {
  fetchDisplayData,
  postDisplayData,
  updateDisplayData,
  getDisplayDataById,
  deleteDisplayData,
};
export const { toggleModal, toggleDeleteModal, resetDisplayState } =
  displaySlice.actions;
