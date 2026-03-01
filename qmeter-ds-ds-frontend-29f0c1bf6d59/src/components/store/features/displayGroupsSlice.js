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
  deleteDisplayGroupId: null,
  deleteDataLoading: false,
};
const fetchDisplayGroupData = createAsyncThunk(
  "getDisplayGroupSlice",
  async ({ page, search }) => {
    /*fetch displayType data*/
    const response = await axiosClient(
      `display/display-group/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postDisplayGroupData = createAsyncThunk(
  "postDisplayGroupSlice" /*post displayType data*/,
  async (data) => {
    /*post displayType data*/
    const response = await axiosClient.post("display/display-group/", data);
    return response.data;
  },
);
const getDisplayGroupDataById = createAsyncThunk(
  "getDisplayGroupSliceById" /*get displayType data by id*/,
  async (id) => {
    const response = await axiosClient.get(`display/display-group/${id}`);
    return response.data;
  },
);
const updateDisplayGroupData = createAsyncThunk(
  "editDisplayGroupSlice" /*update displayType data*/,
  async (data) => {
    const response = await axiosClient.put(
      `display/display-group/${data.id}/`,
      data,
    );
    return response.data;
  },
);
const deleteDisplayGroupData = createAsyncThunk(
  "deleteDisplayGroupSlice" /*delete displayType data*/,
  async (id) => {
    const response = await axiosClient.delete(`display/display-group/${id}/`);
    return response.data;
  },
);
const displayGroupSlice = createSlice({
  name: "displayGroupSlice",
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
      state.deleteDisplayGroupId = id ?? null;
      state.deleteDataLoading = false;
    },
  },
  extraReducers: (builder) => {
    /*fetch data build add case*/
    builder.addCase(fetchDisplayGroupData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDisplayGroupData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchDisplayGroupData.rejected, (state, action) => {
      state.isLoading = false;
    });
    /*post display group data builder add case*/
    builder.addCase(postDisplayGroupData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postDisplayGroupData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
    });
    builder.addCase(postDisplayGroupData.rejected, (state, action) => {
      state.postDataLoading = false;
    });
    /*get display group data builder add case*/
    builder.addCase(getDisplayGroupDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getDisplayGroupDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
    });
    builder.addCase(getDisplayGroupDataById.rejected, (state) => {
      state.isLoading = false;
    });
    /*update display group data builder add case*/
    builder.addCase(updateDisplayGroupData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateDisplayGroupData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
    });
    builder.addCase(updateDisplayGroupData.rejected, (state) => {
      state.postDataLoading = false;
    });
    /*delete display group data builder add case*/
    builder.addCase(deleteDisplayGroupData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteDisplayGroupData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    builder.addCase(deleteDisplayGroupData.rejected, (state) => {
      state.deleteDataLoading = false;
    });
  },
});
export default displayGroupSlice.reducer;
export {
  fetchDisplayGroupData,
  postDisplayGroupData,
  getDisplayGroupDataById,
  updateDisplayGroupData,
  deleteDisplayGroupData,
};
export const { toggleModal, toggleDeleteModal } = displayGroupSlice.actions;
