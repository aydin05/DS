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
  eventRequestStatus: "",
  deleteScheduleId: null,
  deleteDataLoading: false,
  isLoadingSchedule: false,
  scheduleRange: [],
  postDateFormSchedule: false,
  postError: false,
};
const fetchScheduleData = createAsyncThunk(
  "getScheduleSlice",
  async ({ page, search }) => {
    /*fetch shcedule data*/
    const response = await axiosClient(
      `playlist/schedule/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });
    return { ...response.data, current_page: page };
  },
);
const postScheduleData = createAsyncThunk(
  "postScheduleSlice",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("playlist/schedule/", data);
      return response.data;
    } catch (err) {
      if (!err.response) {
        throw err;
      }
      return rejectWithValue(err.response.data);
    }
  },
);
const getScheduleDataById = createAsyncThunk(
  "getScheduleSliceById" /*get role data by id*/,
  async ({ id, condition }) => {
    const response = await axiosClient.get(`playlist/schedule/${id}`);
    return { ...response.data, condition };
  },
);
const updateScheduleData = createAsyncThunk(
  "editScheduleSlice" /*update role data*/,
  async (data) => {
    const response = await axiosClient.put(
      `playlist/schedule/${data.id}/`,
      data,
    );
    return response.data;
  },
);
const deleteScheduleData = createAsyncThunk(
  "deleteScheduleSlice" /*delete role data*/,
  async (id) => {
    const response = await axiosClient.delete(`playlist/schedule/${id}/`);
    return response.data;
  },
);
/*Schedule fetch date*/
const fetchScheduleDateRange = createAsyncThunk(
  "fetchScheduleDateRange",
  async (id) => {
    const response = await axiosClient.get(`playlist/${id}/schedule-playlist/`);
    return response.data;
  },
);

// const fetchScheduleDateRangeById = createAsyncThunk('fetchScheduleDateRangeById',
//     async ({range_id, schedule_id}) => {
//         const response = await axiosClient.get(`playlist/${range_id}/schedule-playlist/${schedule_id}/`)
//         return response.data;
//     })

/*Schedule post date*/
const postScheduleDateForm = createAsyncThunk(
  "postScheduleDateForm",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `playlist/${payload.id}/schedule-playlist/`,
        payload.data,
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
const updateScheduleDateForm = createAsyncThunk(
  "updateScheduleDateForm",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `playlist/${payload.id}/schedule-playlist/${payload.data.id}/`,
        payload.data,
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
// const deleteScheduleDateForm =

const scheduleSlice = createSlice({
  name: "scheduleSlice",
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
      state.isOpenDeleteModal = !state.isOpenDeleteModal;
      state.deleteScheduleId = action.payload;
      state.deleteDataLoading = false;
    },
  },
  extraReducers: (builder) => {
    /*fetch data build add case*/
    builder.addCase(fetchScheduleData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchScheduleData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.requestStatus = "";
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchScheduleData.rejected, (state, action) => {
      state.isLoading = false;
    });

    /*post user data builder add case*/
    builder.addCase(postScheduleData.pending, (state) => {
      state.postDataLoading = true;
    });
    builder.addCase(postScheduleData.fulfilled, (state, action) => {
      state.requestStatus = "post";
      state.postDataLoading = false;
      state.isOpenModal = false;
      state.postDataError = "";
    });
    builder.addCase(postScheduleData.rejected, (state, action) => {
      let error = action.payload
        ? Object.entries(action.payload).map(([key, value]) => ({
            name: key,
            errors: value,
          }))
        : [{ name: "error", errors: ["Network error"] }];
      state.postDataLoading = false;
      state.postError = error;
    });

    builder.addCase(getScheduleDataById.pending, (state, action) => {
      state.isLoading = true;
      state.postDataLoading = true;
    });
    builder.addCase(getScheduleDataById.fulfilled, (state, action) => {
      if (!action.payload.condition) {
        state.isOpenModal = true;
      }
      state.isLoading = false;
      state.formValue = action.payload;
      state.postDataLoading = false;
      state.requestStatus = "";
    });

    /*update schedule data builder add case*/
    builder.addCase(updateScheduleData.pending, (state, action) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateScheduleData.fulfilled, (state, action) => {
      state.postDataLoading = false;
      state.requestStatus = "update";
      state.isOpenModal = false;
    });

    /*delete schedule data builder add case*/
    builder.addCase(deleteScheduleData.pending, (state, action) => {
      state.deleteDataLoading = true;
    });
    builder.addCase(deleteScheduleData.fulfilled, (state, action) => {
      state.deleteDataLoading = false;
      state.requestStatus = "delete";
      state.isOpenDeleteModal = false;
    });
    /*fetch schedule date builder add case*/

    builder.addCase(fetchScheduleDateRange.pending, (state) => {
      state.isLoadingSchedule = true;
    });
    builder.addCase(fetchScheduleDateRange.fulfilled, (state, action) => {
      let events = action.payload.map((item) => {
        return {
          id: item.id,
          title: item.name,
          start: new Date(Date.parse(item.start_time)),
          end: new Date(Date.parse(item.end_time)),
        };
      });
      state.isLoadingSchedule = false;
      state.scheduleRange = events;
      state.postDateFormSchedule = false;
      state.eventRequestStatus = "";
    });
    builder.addCase(fetchScheduleDateRange.rejected, (state) => {
      state.isLoadingSchedule = false;
    });

    /*post schedule date builder add case*/

    builder.addCase(postScheduleDateForm.pending, (state) => {
      state.postDataLoading = true;
    });
    builder.addCase(postScheduleDateForm.fulfilled, (state) => {
      state.postDataLoading = false;
      state.postDateFormSchedule = true;
      // state.eventRequestStatus = "post";
      state.isOpenModal = false;
    });
    builder.addCase(postScheduleDateForm.rejected, (state) => {
      state.postDataLoading = false;
      state.postDateFormSchedule = false;
      state.isOpenModal = false;
    });

    /*fetch schedule range by id*/

    builder.addCase(updateScheduleDateForm.pending, (state) => {
      state.postDataLoading = true;
    });
    builder.addCase(updateScheduleDateForm.fulfilled, (state) => {
      state.postDataLoading = false;
      state.eventRequestStatus = "update";
    });
    builder.addCase(updateScheduleDateForm.rejected, (state) => {
      state.postDataLoading = false;
    });
  },
});

export default scheduleSlice.reducer;
export {
  fetchScheduleData,
  postScheduleData,
  getScheduleDataById,
  updateScheduleData,
  deleteScheduleData,
  fetchScheduleDateRange,
  postScheduleDateForm,
  updateScheduleDateForm,
};
export const { toggleModal, toggleDeleteModal } = scheduleSlice.actions;
