import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  isLoadingCoreGroup: false,
  data: [],
  count: 1,
  current_page: 1,
  core_group_data: [],
  isOpenModal: false,
  formValue: {},
  isOpenDeleteModal: false,
  postDataLoading: false,
  requestStatus: "",
  deletedRoleId: null,
  deleteDataLoading: false,
  postError: null,
};
const fetchCoreGroups = createAsyncThunk("getCoreSlice", async () => {
  const response = await axiosClient("core/groups/");
  return response.data.map((item) => {
    return { ...item, key: item.id };
  });
});
const fetchRoleData = createAsyncThunk(
  "getRoleSlice",
  async ({ page, search }) => {
    /*fetch role data*/
    const response = await axiosClient(
      `accounts/role/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postRoleData = createAsyncThunk(
  "postRoleSlice" /*post role data*/,
  async (data, { rejectWithValue }) => {
    /*post role data*/
    try {
      const response = await axiosClient.post("accounts/role/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getRoleDataById = createAsyncThunk(
  "getRoleSliceById" /*get role data by id*/,
  async (id) => {
    const response = await axiosClient.get(`accounts/role/${id}`);
    return response.data;
  },
);
const updateRoleData = createAsyncThunk(
  "editRoleSlice" /*update role data*/,
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`accounts/role/${data.id}/`, data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const deleteRoleData = createAsyncThunk(
  "deleteRoleSlice" /*delete role data*/,
  async (id) => {
    const response = await axiosClient.delete(`accounts/role/${id}/`);
    return response.data;
  },
);
const roleSlice = createSlice({
  name: "roleSlice",
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isOpenModal = !state.isOpenModal;
      state.formValue = {};
      state.requestStatus = "";
      state.postError = null;
    },
    toggleDeleteModal: (state, action) => {
      const { open, id } = action.payload ?? {};
      state.isOpenDeleteModal = open ?? !state.isOpenDeleteModal;
      state.deletedRoleId = id ?? null;
      state.deleteDataLoading = false;
    },
  },
  extraReducers: (builder) => {
    /*fetch core groups data*/
    builder.addCase(fetchCoreGroups.pending, (state) => {
      state.isLoadingCoreGroup = true;
    });

    builder.addCase(fetchCoreGroups.fulfilled, (state, action) => {
      state.isLoadingCoreGroup = false;
      state.core_group_data = action.payload;
    });
    builder.addCase(fetchCoreGroups.rejected, (state, action) => {
      state.isLoadingCoreGroup = false;
    });

    /*fetch data build add case*/
    builder.addCase(fetchRoleData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchRoleData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchRoleData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post role data builder add case*/
    builder.addCase(postRoleData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(postRoleData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "post";
      state.isOpenModal = false;
    });
    builder.addCase(postRoleData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    /*get role data builder add case*/
    builder.addCase(getRoleDataById.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(getRoleDataById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.formValue = action.payload;
      state.isOpenModal = true;
    });
    builder.addCase(getRoleDataById.rejected, (state) => {
      state.isLoading = false;
    });

    /*update role data builder add case*/
    builder.addCase(updateRoleData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateRoleData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
      state.formValue = action.payload;
      state.data = state.data.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      );
    });
    builder.addCase(updateRoleData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    /*delete role data builder add case*/
    builder.addCase(deleteRoleData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteRoleData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    builder.addCase(deleteRoleData.rejected, (state) => {
      state.deleteDataLoading = false;
    });
  },
});
export default roleSlice.reducer;
export {
  fetchRoleData,
  postRoleData,
  updateRoleData,
  getRoleDataById,
  deleteRoleData,
  fetchCoreGroups,
};
export const { toggleModal, toggleDeleteModal } = roleSlice.actions;
