import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  isLoading: false,
  data: [],
  detailData: null,
  deviceId: null,
  count: 1,
  current_page: 1,
  formValue: {},
  heartbeatThreshold: 120,
  thresholdLoading: false,
};

const fetchDeviceStatusData = createAsyncThunk(
  "getDeviceStatusSlice",
  async ({ page, search }) => {
    const response = await axiosClient.get(
      `core/logs/?page=${page}${search ? "&search=" + search : ""}`,
    );
    response.data.results = response.data.results.map((item, index) => {
      return { ...item, key: index };
    });

    return { ...response.data, current_page: page };
  },
);

const fetchDeviceStatusById = createAsyncThunk(
  "getDeviceStatusSliceById",
  async (id) => {
    const response = await axiosClient.get(`core/logs/${id}/`);
    return response.data;
  },
);

const downloadDeviceLogsById = createAsyncThunk(
  "deviceStatusDownloadById",
  async (id) => {
    const response = await axiosClient.get(`core/logs/${id}/download/`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers["content-disposition"];
    const filename = disposition
      ? disposition.split("filename=")[1]?.replace(/"/g, "")
      : `device_log_${id}.log`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return id;
  },
);

const fetchDeviceStatusFilter = createAsyncThunk(
  "getDeviceStatusSliceFilter",
  async ({ page, search, status }) => {
    const url =
      `core/logs/?page=${page}` +
      (search ? `&search=${encodeURIComponent(search)}` : "") +
      (status !== 1 ? `&status=${status}` : "");
    const response = await axiosClient(url);

    response.data.results = response.data.results.map((item, index) => ({
      ...item,
      key: item?.id ?? index,
    }));

    return { ...response.data, current_page: page };
  },
);

const fetchCompanySettings = createAsyncThunk(
  "deviceStatus/fetchCompanySettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("core/company-settings/");
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

const saveCompanySettings = createAsyncThunk(
  "deviceStatus/saveCompanySettings",
  async (heartbeat_threshold_seconds, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put("core/company-settings/", {
        heartbeat_threshold_seconds,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

const deviceStatusSlice = createSlice({
  name: "deviceStatusSlice",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(fetchDeviceStatusData.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDeviceStatusData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchDeviceStatusData.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchDeviceStatusById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDeviceStatusById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = Array.isArray(action.payload.data)
        ? action.payload.data
        : [action.payload.data];
    });
    builder.addCase(fetchDeviceStatusById.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(downloadDeviceLogsById.fulfilled, (state, action) => {
      state.deviceId = action.payload;
    });
    builder.addCase(downloadDeviceLogsById.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchDeviceStatusFilter.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDeviceStatusFilter.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload.results;
      state.count = action.payload.count;
      state.current_page = action.payload.current_page;
    });
    builder.addCase(fetchDeviceStatusFilter.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchCompanySettings.pending, (state) => {
      state.thresholdLoading = true;
    });
    builder.addCase(fetchCompanySettings.fulfilled, (state, action) => {
      state.thresholdLoading = false;
      state.heartbeatThreshold = action.payload.heartbeat_threshold_seconds;
    });
    builder.addCase(fetchCompanySettings.rejected, (state) => {
      state.thresholdLoading = false;
    });

    builder.addCase(saveCompanySettings.pending, (state) => {
      state.thresholdLoading = true;
    });
    builder.addCase(saveCompanySettings.fulfilled, (state, action) => {
      state.thresholdLoading = false;
      state.heartbeatThreshold = action.payload.heartbeat_threshold_seconds;
    });
    builder.addCase(saveCompanySettings.rejected, (state) => {
      state.thresholdLoading = false;
    });
  },
});

export default deviceStatusSlice.reducer;
export {
  fetchDeviceStatusData,
  fetchDeviceStatusById,
  downloadDeviceLogsById,
  fetchDeviceStatusFilter,
  fetchCompanySettings,
  saveCompanySettings,
};
