import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../../config";
import findMaxElement from "../../../helpers/findMaxElement";

const initialState = {
  slides: [
    {
      name: "Slide1",
      bg_color: "#e5e5e5",
      duration: 10,
      position: 1,
      selectedIndex: 0,
      videoDurations: [],
      items: [],
    },
  ],
  widgetTypes: [],
  selectedItem: {
    items: [],
    videoDurations: [],
  },
  widgetTypeObject: {},
  selectedPosition: 1,
  selectedIndex: 0,
  globalText: [],
  isLoading: false /*loading state management for all slides*/,
  isLoadingUpload: false /*loading state management for image and videos*/,
  isLoadingWidgetType: false,
  uploadDatas: [],
  fileStatus: false,
  isOpenDeleteModal: false,
  deleteFileId: null,
  deleteStatus: false,
  slideStatus: false,
  savedSlide: false,
  fetchSlideStatus: false,

  previewStatus: false,
  previewData: {},

  display_id: null,

  isMutated: false,
};

const fetchSlides = createAsyncThunk(
  "fetchSlides",
  async ({ id, display_type, data }) => {
    const response = await axiosClient.get(
      `playlist/?id=${id}&display_type=${display_type}`,
    );
    return { slide: response.data, data, display_type };
  },
);
const fetchWidgetTypes = createAsyncThunk("fetchWidgetTypes", async () => {
  const response = await axiosClient.get("core/widgettypes/");
  return response.data;
});

const fetchPreview = createAsyncThunk(
  "fetchPreview",
  async ({ id, display_type, widgetTypes }) => {
    const response = await axiosClient.get(
      `playlist/?id=${id}&display_type=${display_type}`,
    );
    return { previewData: response.data, widgetTypes };
  },
);

/*Upload image and video*/

const uploadFile = createAsyncThunk("uploadFile", async () => {
  const response = await axiosClient.get(`core/file/`);
  return response.data;
});
const deleteFile = createAsyncThunk("deleteFile", async (id) => {
  const response = await axiosClient.delete(`core/file/${id}`);
  return response.data;
});
const saveSlideSlice = createAsyncThunk(
  "saveSlideSlice",
  async ({ id, data, display_type }) => {
    const response = await axiosClient.post(
      `playlist/${id}/slide/?display_type=${display_type}`,
      data,
    );
    return response.data;
  },
);
const playListInnerSlice = createSlice({
  name: "playListSlice",
  initialState,
  reducers: {
    addItem: (state, action) => {
      let element = action.payload[0];
      let videoDurations = [];
      let slides = state.slides.map((item) => {
        if (item.position === state.selectedPosition) {
          action.payload.forEach((v) => {
            if (v.type === "video") {
              videoDurations = [
                ...item.videoDurations,
                { duration: v.duration, name: v.file },
              ];
            }
          });
          if (videoDurations.length > 0) {
            item.duration = findMaxElement(
              videoDurations.map((v) => ({ index: v.duration })),
            );
          }
          item.videoDurations = videoDurations;
          // item.duration = findMaxElement(videoDurations.map(v => ({index: v.duration}))); /*set max duration of video durations*/
          item.items = [...item.items, ...action.payload];
          item.selectedIndex = item.items[item.items.length - 1].index;
          return item;
        } else if (element.type === "globaltext") {
          let index = findMaxElement(item.items);
          element["index"] = index + 1;
          item.items = [...item.items, element];
          item.selectedIndex = item.items[item.items.length - 1].index;
          return item;
        }
        return item;
      });

      state.globalText = [
        ...state.globalText,
        ...action.payload.filter((item) => item.type === "globaltext"),
      ]; /*save in global text*/

      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );

      state.slides = slides;
      state.isMutated = true;
    },
    removeItem: (state, action) => {
      let videoDurations = [];
      let slides = state.slides.map((item) => {
        if (item.position === state.selectedPosition) {
          item.items = item.items.filter(
            (x) => x.position_id !== action.payload.position_id,
          );
          if (action.payload.type === "video") {
            videoDurations = item.videoDurations.filter(
              (i) => i.name !== action.payload.file,
            );
            item.videoDurations = videoDurations;
          }
          if (item.items.length === 0) {
            item.selectedIndex = 0;
          } else item.selectedIndex = item.items[item.items.length - 1].index;
          item.duration = findMaxElement(
            videoDurations.map((v) => ({ index: v.duration })),
          ); /*set max duration of video durations*/
          return item;
        }
        return item;
      });
      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );
      state.slides = slides;
      state.isMutated = true;
    },
    addSlide: (state, action) => {
      const maxPosition = Math.max(
        ...state.slides.map((s) => Number(s.position)),
      );
      const newPosition = maxPosition + 1;
      state.slides = [
        ...state.slides,
        {
          name: "Slide" + (state.slides.length + 1),
          bg_color: "#e5e5e5",
          duration: 10,
          videoDurations: [],
          position: newPosition,
          items: state.globalText.length > 0 ? state.globalText : [],
          selectedIndex:
            state.globalText.length > 0
              ? state.globalText[state.globalText.length - 1].index
              : 0,
          id: Date.now() + Math.random(),
        },
      ];
      state.isMutated = true;
    },
    removeSlide: (state, action) => {
      //    remove slide
      if (state.slides.length === 1) return;

      let newSlides = state.slides.filter(
        (item) => Number(item.position) !== Number(action.payload),
      );

      newSlides = newSlides
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((slide, index) => ({
          ...slide,
          position: index + 1,
          name: `Slide${index + 1}`,
        }));

      let newSelectedPosition = Math.min(
        Number(state.selectedPosition),
        newSlides.length,
      );
      if (newSelectedPosition < 1) newSelectedPosition = 1;

      state.selectedPosition = newSelectedPosition;
      state.selectedItem = newSlides.find(
        (slide) => Number(slide.position) === newSelectedPosition,
      ) || newSlides[0];
      state.slides = [...newSlides];
      state.isMutated = true;
    },
    selectSlide: (state, action) => {
      if (state.selectedPosition !== action.payload) {
        state.selectedPosition = action.payload;
        state.selectedItem = state.slides.find(
          (item) => item.position === action.payload,
        );
        state.isMutated = true;
      }
    },
    updateItemIndex: (state, action) => {
      let slides = state.slides.map((item) => {
        if (
          item.position === state.selectedPosition &&
          action.payload.index < item.selectedIndex
        ) {
          let arr = item.items;
          let changes = arr.splice(action.payload.index - 1, 1);
          arr.push(...changes);
          arr.map((item, index) => (item.index = index + 1));
          item.items = arr;
          item.selectedIndex = arr.length;
          arr = null;
          return item;
        }
        return item;
      });
      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );
      state.slides = slides;
      state.isMutated = true;
    },
    updateSlideItems: (state, action) => {
      let slides = state.slides.map((item) => {
        if (item.position === state.selectedPosition) {
          if (item.selectedIndex < action.payload.index) {
            item.selectedIndex = action.payload.index;
          } /* ????? */
          item.items = item.items.map((i) => {
            if (i.position_id === action.payload.position_id) {
              return action.payload;
            }
            return i;
          });
          return item;
        } else if (action.payload.type === "globaltext") {
          item.items = item.items.map((i) => {
            if (
              i.type === "globaltext" &&
              action.payload.position_id === i.position_id
            ) {
              i["width"] = action.payload.width;
              i["height"] = action.payload.height;
              i["top"] = action.payload.top;
              i["left"] = action.payload.left;
              i["attr"] = Object.assign({}, action.payload.attr);
              return i;
            }
            return i;
          });
          return item;
        }
        return item;
      });
      if (action.payload.type === "globaltext") {
        state.globalText = state.globalText.map((i) => {
          if (action.payload.position_id === i.position_id) {
            i["width"] = action.payload.width;
            i["height"] = action.payload.height;
            i["top"] = action.payload.top;
            i["left"] = action.payload.left;
            i["attr"] = Object.assign({}, action.payload.attr);
          }
          return i;
        });
      }
      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );
      state.slides = slides;
      state.isMutated = true;
    },
    updateSlide: (state, action) => {
      state.slides = state.slides.map((item) => {
        if (item.position === state.selectedPosition) {
          item[action.payload.key] = action.payload.value;
        }
        return item;
      });
      state.selectedItem[action.payload.key] = action.payload.value;
      state.isMutated = true;
    },
    updateDisplaySize: (state, action) => {
      state.display_id = action.payload.id;
      state.isMutated = true;
    },
    selectTableCell: (state, action) => {
      state.selectedItem = {
        ...state.selectedItem,
        selectedTableCell: action.payload.selectedTableCell,
        tableCellValue: action.payload.tableCellValue,
      };
    },
    setTableCellValue: (state, action) => {
      /*
      -------------
      */
      let slides = state.slides.map((item) => {
        if (item.position === state.selectedPosition) {
          item.items = item.items.map((i) => {
            if (
              i.index === state.selectedItem.selectedIndex &&
              i.type === "table"
            ) {
              /* single th element */
              if (
                state.selectedItem?.selectedTableCell?.columnIndex >= 0 &&
                (state.selectedItem?.selectedTableCell?.rowIndex ?? -1) < 0
              ) {
                i.tableData.columns = i.tableData.columns.map(
                  (column, columnIndex) => {
                    if (
                      columnIndex ===
                      state.selectedItem?.selectedTableCell?.columnIndex
                    ) {
                      column = { ...action.payload };
                    }
                    return column;
                  },
                );
              }

              /* multiple th element */

              if (state.selectedItem?.selectedTableCell?.column) {
                i.tableData.columns = i.tableData.columns.map((column) => {
                  column = { ...action.payload, text: column.text };
                  return column;
                });
              }

              /* single tbody td element */
              if (
                state.selectedItem?.selectedTableCell?.rowIndex >= 0 &&
                state.selectedItem?.selectedTableCell?.columnIndex >= 0
              ) {
                i.tableData.rows = i.tableData.rows.map((row, rowIndex) => {
                  if (
                    rowIndex === state.selectedItem?.selectedTableCell?.rowIndex
                  ) {
                    row = row.map((innerRowItem, innerRowIndex) => {
                      if (
                        innerRowIndex ===
                        state.selectedItem?.selectedTableCell?.columnIndex
                      ) {
                        innerRowItem = { ...action.payload };
                      }
                      return innerRowItem;
                    });
                  }
                  return row;
                });
              }
              /* multiple tbody tr elements */
              if (state.selectedItem?.selectedTableCell?.rows >= 0) {
                i.tableData.rows = i.tableData.rows.map((row, rowIndex) => {
                  if (
                    rowIndex === state.selectedItem?.selectedTableCell?.rows
                  ) {
                    row = row.map((innerRowItem) => ({
                      ...action.payload,
                      text: innerRowItem.text,
                    }));
                  }
                  return row;
                });
              }
            }
            return i;
          });
        }
        return item;
      });
      /*
      -------------
      */

      state.slides = slides;
      const selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );
      state.selectedItem = {
        ...state.selectedItem,
        tableCellValue: action.payload,
        ...selectedItem,
      };
    },
    updateTableSizes: (state, action) => {
      let slides = state.slides.map((slide) => {
        if (slide.position === state.selectedPosition && slide.items) {
          slide.items = slide.items.map((item) => {
            if (
              item.position_id === state.selectedItem.selectedIndex &&
              item.type === "table"
            ) {
              item.width = action.payload.width;
              item.height = action.payload.height;
            }
            return item;
          });
        }
        return slide;
      });

      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );

      state.slides = slides;
    },
    removeTableColumn: (state) => {
      let slides = state.slides.map((slide) => {
        if (slide.position === state.selectedPosition && slide.items) {
          slide.items = slide.items.map((item) => {
            if (item.type === "table" && item.tableData?.columns?.length) {
              item.tableData.columns.pop();
              item.tableData.rows = item.tableData.rows.map((row) => {
                const updatedRow = [...row];
                updatedRow.pop();
                return updatedRow;
              });
            }
            return item;
          });
        }
        return slide;
      });

      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );

      state.slides = slides;
    },

    removeTableRow: (state) => {
      let slides = state.slides.map((slide) => {
        if (slide.position === state.selectedPosition && slide.items) {
          slide.items = slide.items.map((item) => {
            if (
              item.position_id === state.selectedItem.selectedIndex &&
              item.type === "table"
            ) {
              item.tableData.rows.pop();
            }
            return item;
          });
        }
        return slide;
      });

      state.selectedItem = slides.find(
        (item) => item.position === state.selectedPosition,
      );

      state.slides = slides;
    },
    selectedSlideItem: (state, action) => {
      state.selectedItem = state.slides.find(
        (item) => item.position === state.selectedPosition,
      );
    },
    toggleDeleteModal: (state, action) => {
      state.isOpenDeleteModal = !state.isOpenDeleteModal;
      state.deleteFileId = action.payload;
      state.deleteStatus = false;
    },
    reorderSlides: (state, action) => {
      const { oldIndex, newIndex } = action.payload;
      const sorted = [...state.slides].sort(
        (a, b) => Number(a.position) - Number(b.position),
      );
      const [moved] = sorted.splice(oldIndex, 1);
      sorted.splice(newIndex, 0, moved);
      sorted.forEach((slide, i) => {
        slide.position = i + 1;
      });
      state.slides = sorted;
      state.selectedItem = sorted.find(
        (s) => s.position === state.selectedPosition,
      );
      state.isMutated = true;
    },
    resetState: (state) => {
      state = initialState;
      return state;
    },
  },
  extraReducers: (builder) => {
    /*fetch slider's inner*/
    builder.addCase(fetchSlides.pending, (state) => {
      state.isLoading = true;
      state.fetchSlideStatus = true;
    });
    builder.addCase(fetchSlides.fulfilled, (state, action) => {
      let widgetTypes =
        action.payload
          .data; /* handle widget types for check in the slide items*/
      state.display_id = action.payload.display_type;
      state.savedSlide = false;
      if (action.payload.slide.slides.length === 0) {
        state.fetchSlideStatus = false;
        state.slides = [
          {
            name: "Slide1",
            bg_color: "#e5e5e5",
            duration: 10,
            position: 1,
            selectedIndex: 0,
            videoDurations: [],
            items: [],
          },
        ];
        state.selectedItem = {
          name: "Slide1",
          bg_color: "#e5e5e5",
          duration: 10,
          position: 1,
          selectedIndex: 0,
          videoDurations: [],
          items: [],
        };
        state.selectedPosition = 1;
        state.globalText = [];
        return;
      }
      let fetchedGlobalText = [];
      let slides = action.payload.slide.slides.map((item, index) => {
        const videoDurations = item.items.filter(
          (i) => i.type_content === "video",
        );
        return {
          name: item.name,
          bg_color: item.bg_color,
          duration: item.duration,
          position: Number(item.position),
          selectedIndex: findMaxElement(item.items),
          videoDurations: videoDurations.map((i) => {
            return { duration: i.attr.duration, name: i.attr.location };
          }),
          items: item.items.map((i, y) => {
            let type = widgetTypes.find((x) => x.id === i.type).name;

            if (i.display_types) i["display_types"] = i.display_types;
            let defaultBody = {
              width: i.width,
              height: i.height,
              top: i.top,
              left: i.left,
              index: i.index,
              widgetType: i.type,
              position_id: y + 1,
              display_types: i.display_types,
              type,
            };
            switch (type) {
              case "image":
                return {
                  ...defaultBody,
                  file: i.attr.location,
                };
              case "video":
                return {
                  ...defaultBody,
                  file: i.attr.location,
                  duration: i.attr.duration,
                  attr: {
                    isLoop: i.attr.isLoop,
                    ismute: i.attr.ismute,
                  },
                };
              case "text":
              case "globaltext":
                if (type === "globaltext" && index === 0) {
                  fetchedGlobalText.push({
                    width: i.width,
                    height: i.height,
                    top: i.top,
                    left: i.left,
                    index: i.index,
                    widgetType: i.type,
                    position_id: y + 1,
                    type,
                    attr: {
                      fonts: i.attr.fonts,
                      textarea: i.attr.textarea,
                      speed: i.attr.speed,
                      is_scrolling: i.attr.is_scrolling,
                      frame_bg_color: i.attr.frame_bg_color,
                    },
                  });
                }
                return {
                  ...defaultBody,
                  attr: {
                    fonts: i.attr.fonts,
                    textarea: i.attr.textarea,
                    speed: i.attr.speed,
                    is_scrolling: i.attr.is_scrolling,
                    frame_bg_color: i.attr.frame_bg_color,
                  },
                };
              case "site":
                return {
                  ...defaultBody,
                  attr: {
                    url: i.attr.url,
                    authorization: i.attr.authorization,
                  },
                };
              case "table":
                return {
                  ...defaultBody,
                  bg_color: i.attr.bg_color,
                  tableData: {
                    columns: i.attr.columns,
                    rows: i.attr.rows,
                  },
                };
            }
          }),
        };
      });
      state.globalText = fetchedGlobalText;
      state.selectedItem = slides[0];
      state.slides = slides;
      state.selectedPosition = slides[0].position;
      state.fetchSlideStatus = false;
    });
    builder.addCase(fetchSlides.rejected, (state) => {
      state.isLoading = false;
      state.fetchSlideStatus = false;
    });

    builder.addCase(fetchPreview.pending, (state, action) => {
      state.previewStatus = true;
    });
    builder.addCase(fetchPreview.fulfilled, (state, action) => {
      let widgetTypes =
        action.payload
          .widgetTypes; /* handle widget types for check in the slide items*/
      if (action.payload.previewData.length === 0) {
        state.previewStatus = false;
        return;
      }
      let slides = action.payload.previewData.slides.map((item) => {
        return {
          name: item.name,
          bg_color: item.bg_color,
          duration: item.duration,
          position: item.position,
          selectedIndex: findMaxElement(item.items),
          items: item.items.map((i, y) => {
            let type = widgetTypes.find((x) => x.id === i.type).name;
            let defaultBody = {
              width: i.width,
              height: i.height,
              top: i.top,
              left: i.left,
              index: i.index,
              widgetType: i.type,
              position_id: y + 1,
              type,
            };
            switch (type) {
              case "image":
                return {
                  ...defaultBody,
                  file: i.attr.location,
                };
              case "video":
                return {
                  ...defaultBody,
                  file: i.attr.location,
                  attr: {
                    isLoop: i.attr.isLoop,
                    ismute: i.attr.ismute,
                  },
                };
              case "text":
              case "globaltext":
                return {
                  ...defaultBody,
                  attr: {
                    fonts: i.attr.fonts,
                    textarea: i.attr.textarea,
                    speed: i.attr.speed,
                    is_scrolling: i.attr.is_scrolling,
                    frame_bg_color: i.attr.frame_bg_color,
                  },
                };
              case "site":
                return {
                  ...defaultBody,
                  attr: {
                    url: i.attr.url,
                    authorization: i.attr.authorization,
                  },
                };
              case "table":
                return {
                  ...defaultBody,
                  tableData: {
                    columns: i.attr.columns,
                    rows: i.attr.rows,
                  },
                };
            }
          }),
        };
      });
      state.previewStatus = false;
      state.previewData = {
        general: action.payload.previewData.general,
        slides: slides,
      };
    });
    builder.addCase(fetchPreview.rejected, (state) => {
      state.previewStatus = false;
    });

    /*upload image and video builder*/
    builder.addCase(uploadFile.pending, (state, action) => {
      state.isLoadingUpload = true;
    });
    builder.addCase(uploadFile.fulfilled, (state, action) => {
      state.isLoadingUpload = false;
      state.uploadDatas = action.payload;
      state.fileStatus = false;
      state.deleteStatus = false;
      state.isOpenDeleteModal = false;
    });
    builder.addCase(uploadFile.rejected, (state, action) => {
      state.isLoadingUpload = false;
    });

    /*delete image and video */
    builder.addCase(deleteFile.pending, (state) => {
      state.isLoadingUpload = true;
      state.deleteStatus = true;
    });
    builder.addCase(deleteFile.fulfilled, (state) => {
      state.isLoadingUpload = false;
      state.fileStatus = true;
    });
    builder.addCase(deleteFile.rejected, (state) => {
      state.isLoadingUpload = false;
    });

    /*fetch widgetType*/
    builder.addCase(fetchWidgetTypes.pending, (state) => {
      state.isLoadingWidgetType = true;
    });
    builder.addCase(fetchWidgetTypes.fulfilled, (state, action) => {
      let obj = {};
      action.payload.forEach((item) => {
        obj[item.name] = item.id;
      });
      state.isLoadingWidgetType = false;
      state.widgetTypes = action.payload;
      state.widgetTypeObject = obj;
    });
    builder.addCase(fetchWidgetTypes.rejected, (state) => {
      state.isLoadingUpload = false;
    });

    /*Save slide*/
    builder.addCase(saveSlideSlice.pending, (state, action) => {
      state.slideStatus = true;
    });
    builder.addCase(saveSlideSlice.fulfilled, (state, action) => {
      state.savedSlide = true;
      state.slideStatus = false;
    });
    builder.addCase(saveSlideSlice.rejected, (state, action) => {
      state.slideStatus = false;
    });
  },
});

export default playListInnerSlice.reducer;
export {
  fetchSlides,
  uploadFile,
  deleteFile,
  fetchWidgetTypes,
  saveSlideSlice,
  fetchPreview,
};
export const {
  toggleDeleteModal,
  addItem,
  updateItemIndex,
  removeItem,
  addSlide,
  removeSlide,
  selectSlide,
  selectedSlideItem,
  updateSlideItems,
  updateSlide,
  updateDisplaySize,
  selectTableCell,
  setTableCellValue,
  updateTableSizes,
  resetState,
  removeTableColumn,
  removeTableRow,
  reorderSlides,
} = playListInnerSlice.actions;
