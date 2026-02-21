import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";

const initialState = {
  // Email Config
  emailConfig: null,
  emailConfigLoading: false,
  emailConfigError: null,

  // Email Templates
  templates: [],
  templatesLoading: false,
  templatesCount: 0,
  templatesCurrent: 1,
  templateFormValue: {},
  isOpenTemplateModal: false,
  templatePostLoading: false,
  templatePostError: null,
  templateRequestStatus: "",

  // Recipient Lists
  recipientLists: [],
  recipientListsLoading: false,
  recipientListsCount: 0,
  recipientListsCurrent: 1,
  recipientListFormValue: {},
  isOpenRecipientListModal: false,
  recipientListPostLoading: false,
  recipientListPostError: null,
  recipientListRequestStatus: "",

  // Recipients (within a list)
  recipientPostLoading: false,
  recipientPostError: null,
  recipientRequestStatus: "",

  // Notification Settings
  notificationSetting: null,
  notificationSettingLoading: false,
  notificationSettingError: null,
  notificationSettingRequestStatus: "",
};

// ---- Email Config ----
export const fetchEmailConfig = createAsyncThunk(
  "notification/fetchEmailConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("notification/email-config/");
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const saveEmailConfig = createAsyncThunk(
  "notification/saveEmailConfig",
  async (data, { rejectWithValue }) => {
    try {
      let response;
      if (data.id) {
        response = await axiosClient.put(
          `notification/email-config/${data.id}/`,
          data,
        );
      } else {
        response = await axiosClient.post("notification/email-config/", data);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const testEmailConfig = createAsyncThunk(
  "notification/testEmailConfig",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `notification/email-config/${id}/test/`,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

// ---- Email Templates ----
export const fetchEmailTemplates = createAsyncThunk(
  "notification/fetchEmailTemplates",
  async ({ page, search }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `notification/email-templates/?page=${page}${search ? "&search=" + search : ""}`,
      );
      return { ...response.data, current_page: page };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const postEmailTemplate = createAsyncThunk(
  "notification/postEmailTemplate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        "notification/email-templates/",
        data,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const updateEmailTemplate = createAsyncThunk(
  "notification/updateEmailTemplate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `notification/email-templates/${data.id}/`,
        data,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const deleteEmailTemplate = createAsyncThunk(
  "notification/deleteEmailTemplate",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`notification/email-templates/${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

// ---- Recipient Lists ----
export const fetchRecipientLists = createAsyncThunk(
  "notification/fetchRecipientLists",
  async ({ page, search }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `notification/recipient-lists/?page=${page}${search ? "&search=" + search : ""}`,
      );
      return { ...response.data, current_page: page };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const fetchRecipientListById = createAsyncThunk(
  "notification/fetchRecipientListById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        `notification/recipient-lists/${id}/`,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const postRecipientList = createAsyncThunk(
  "notification/postRecipientList",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        "notification/recipient-lists/",
        data,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const updateRecipientList = createAsyncThunk(
  "notification/updateRecipientList",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `notification/recipient-lists/${data.id}/`,
        data,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const deleteRecipientList = createAsyncThunk(
  "notification/deleteRecipientList",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`notification/recipient-lists/${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

// ---- Recipients (individual) ----
export const postRecipient = createAsyncThunk(
  "notification/postRecipient",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        "notification/recipients/",
        data,
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const deleteRecipient = createAsyncThunk(
  "notification/deleteRecipient",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`notification/recipients/${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

// ---- Notification Settings ----
export const fetchNotificationSettings = createAsyncThunk(
  "notification/fetchNotificationSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(
        "notification/notification-settings/",
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const saveNotificationSettings = createAsyncThunk(
  "notification/saveNotificationSettings",
  async (data, { rejectWithValue }) => {
    try {
      let response;
      if (data.id) {
        response = await axiosClient.put(
          `notification/notification-settings/${data.id}/`,
          data,
        );
      } else {
        response = await axiosClient.post(
          "notification/notification-settings/",
          data,
        );
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

const notificationSlice = createSlice({
  name: "notificationSlice",
  initialState,
  reducers: {
    toggleTemplateModal: (state) => {
      state.isOpenTemplateModal = !state.isOpenTemplateModal;
      if (!state.isOpenTemplateModal) {
        state.templateFormValue = {};
        state.templatePostError = null;
      }
      state.templateRequestStatus = "";
    },
    setTemplateFormValue: (state, action) => {
      state.templateFormValue = action.payload;
      state.isOpenTemplateModal = true;
    },
    toggleRecipientListModal: (state) => {
      state.isOpenRecipientListModal = !state.isOpenRecipientListModal;
      if (!state.isOpenRecipientListModal) {
        state.recipientListFormValue = {};
        state.recipientListPostError = null;
      }
      state.recipientListRequestStatus = "";
    },
    setRecipientListFormValue: (state, action) => {
      state.recipientListFormValue = action.payload;
      state.isOpenRecipientListModal = true;
    },
    resetNotificationStatus: (state) => {
      state.templateRequestStatus = "";
      state.recipientListRequestStatus = "";
      state.recipientRequestStatus = "";
      state.notificationSettingRequestStatus = "";
    },
  },
  extraReducers: (builder) => {
    // Email Config
    builder.addCase(fetchEmailConfig.pending, (state) => {
      state.emailConfigLoading = true;
    });
    builder.addCase(fetchEmailConfig.fulfilled, (state, action) => {
      state.emailConfigLoading = false;
      const results = action.payload.results || action.payload;
      state.emailConfig = Array.isArray(results) ? results[0] || null : results;
    });
    builder.addCase(fetchEmailConfig.rejected, (state, action) => {
      state.emailConfigLoading = false;
      state.emailConfigError = action.payload;
    });

    builder.addCase(saveEmailConfig.pending, (state) => {
      state.emailConfigLoading = true;
    });
    builder.addCase(saveEmailConfig.fulfilled, (state, action) => {
      state.emailConfigLoading = false;
      state.emailConfig = action.payload;
      state.emailConfigError = null;
    });
    builder.addCase(saveEmailConfig.rejected, (state, action) => {
      state.emailConfigLoading = false;
      state.emailConfigError = action.payload;
    });

    // Email Templates
    builder.addCase(fetchEmailTemplates.pending, (state) => {
      state.templatesLoading = true;
    });
    builder.addCase(fetchEmailTemplates.fulfilled, (state, action) => {
      state.templatesLoading = false;
      state.templates = action.payload.results || [];
      state.templatesCount = action.payload.count || 0;
      state.templatesCurrent = action.payload.current_page;
    });
    builder.addCase(fetchEmailTemplates.rejected, (state) => {
      state.templatesLoading = false;
    });

    builder.addCase(postEmailTemplate.pending, (state) => {
      state.templatePostLoading = true;
    });
    builder.addCase(postEmailTemplate.fulfilled, (state) => {
      state.templatePostLoading = false;
      state.templateRequestStatus = "post";
      state.isOpenTemplateModal = false;
      state.templatePostError = null;
    });
    builder.addCase(postEmailTemplate.rejected, (state, action) => {
      state.templatePostLoading = false;
      state.templatePostError = action.payload;
    });

    builder.addCase(updateEmailTemplate.pending, (state) => {
      state.templatePostLoading = true;
    });
    builder.addCase(updateEmailTemplate.fulfilled, (state) => {
      state.templatePostLoading = false;
      state.templateRequestStatus = "update";
      state.isOpenTemplateModal = false;
    });
    builder.addCase(updateEmailTemplate.rejected, (state, action) => {
      state.templatePostLoading = false;
      state.templatePostError = action.payload;
    });

    builder.addCase(deleteEmailTemplate.pending, (state) => {
      state.templatesLoading = true;
    });
    builder.addCase(deleteEmailTemplate.fulfilled, (state) => {
      state.templatesLoading = false;
      state.templateRequestStatus = "delete";
    });

    // Recipient Lists
    builder.addCase(fetchRecipientLists.pending, (state) => {
      state.recipientListsLoading = true;
    });
    builder.addCase(fetchRecipientLists.fulfilled, (state, action) => {
      state.recipientListsLoading = false;
      state.recipientLists = action.payload.results || [];
      state.recipientListsCount = action.payload.count || 0;
      state.recipientListsCurrent = action.payload.current_page;
    });
    builder.addCase(fetchRecipientLists.rejected, (state) => {
      state.recipientListsLoading = false;
    });

    builder.addCase(fetchRecipientListById.pending, (state) => {
      state.recipientListsLoading = true;
    });
    builder.addCase(fetchRecipientListById.fulfilled, (state, action) => {
      state.recipientListsLoading = false;
    });
    builder.addCase(fetchRecipientListById.rejected, (state) => {
      state.recipientListsLoading = false;
    });

    builder.addCase(postRecipientList.pending, (state) => {
      state.recipientListPostLoading = true;
    });
    builder.addCase(postRecipientList.fulfilled, (state) => {
      state.recipientListPostLoading = false;
      state.recipientListRequestStatus = "post";
      state.isOpenRecipientListModal = false;
      state.recipientListPostError = null;
    });
    builder.addCase(postRecipientList.rejected, (state, action) => {
      state.recipientListPostLoading = false;
      state.recipientListPostError = action.payload;
    });

    builder.addCase(updateRecipientList.pending, (state) => {
      state.recipientListPostLoading = true;
    });
    builder.addCase(updateRecipientList.fulfilled, (state) => {
      state.recipientListPostLoading = false;
      state.recipientListRequestStatus = "update";
      state.isOpenRecipientListModal = false;
    });

    builder.addCase(deleteRecipientList.pending, (state) => {
      state.recipientListsLoading = true;
    });
    builder.addCase(deleteRecipientList.fulfilled, (state) => {
      state.recipientListsLoading = false;
      state.recipientListRequestStatus = "delete";
    });

    // Recipients
    builder.addCase(postRecipient.pending, (state) => {
      state.recipientPostLoading = true;
    });
    builder.addCase(postRecipient.fulfilled, (state) => {
      state.recipientPostLoading = false;
      state.recipientRequestStatus = "post";
    });
    builder.addCase(postRecipient.rejected, (state, action) => {
      state.recipientPostLoading = false;
      state.recipientPostError = action.payload;
    });

    builder.addCase(deleteRecipient.fulfilled, (state) => {
      state.recipientRequestStatus = "delete";
    });

    // Notification Settings
    builder.addCase(fetchNotificationSettings.pending, (state) => {
      state.notificationSettingLoading = true;
    });
    builder.addCase(fetchNotificationSettings.fulfilled, (state, action) => {
      state.notificationSettingLoading = false;
      const results = action.payload.results || action.payload;
      state.notificationSetting = Array.isArray(results)
        ? results[0] || null
        : results;
    });
    builder.addCase(fetchNotificationSettings.rejected, (state) => {
      state.notificationSettingLoading = false;
    });

    builder.addCase(saveNotificationSettings.pending, (state) => {
      state.notificationSettingLoading = true;
    });
    builder.addCase(saveNotificationSettings.fulfilled, (state, action) => {
      state.notificationSettingLoading = false;
      state.notificationSetting = action.payload;
      state.notificationSettingRequestStatus = "saved";
    });
    builder.addCase(saveNotificationSettings.rejected, (state, action) => {
      state.notificationSettingLoading = false;
      state.notificationSettingError = action.payload;
    });
  },
});

export default notificationSlice.reducer;
export const {
  toggleTemplateModal,
  setTemplateFormValue,
  toggleRecipientListModal,
  setRecipientListFormValue,
  resetNotificationStatus,
} = notificationSlice.actions;
