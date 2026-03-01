import React, { useEffect, useState } from "react";
import { Button, Col, Form, Input, message, Row, Select } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import DraggableComponent from "./DraggableComponent";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthModal } from "../../SubComponents/AuthModal";
import {
  getPlayListDataById,
  toggleModal,
  updatePlayListData,
} from "../../store/features/playListSlice";
import {
  fetchSlides,
  resetState,
  saveSlideSlice,
  updateDisplaySize,
} from "../../store/features/playListInnerSlice";
import arrowLeft from "../../../assets/images/arrow-left.svg";
import { fetchDisplayTypeData } from "../../store/features/displayTypeSlice";

const { Option } = Select;
const PlaylistEditor = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const {
    slides,
    slideStatus,
    widgetTypes,
    display_id,
    isMutated,
  } = useSelector((state) => state.playListInnerSlice);
  const playListSlice = useSelector((state) => state.playListSlice);
  const displayTypeSlice = useSelector((state) => state.displayTypeSlice);

  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });
  const toggleEdit = () => dispatch(toggleModal("isPlaylist"));

  const changeDisplay = (e) => {
    let element = displayTypeSlice.data.find((item) => item.id === e);
    if (element) {
      dispatch(updateDisplaySize(element));
      setSize({
        width: element.width,
        height: element.height,
      });
      dispatch(
        fetchSlides({ id: params.id, display_type: e, data: widgetTypes }),
      );
    }
  };

  const finish = (values) => {
    values.id = params.id;
    values["description"] = playListSlice.formValue.description;
    values["default_display_type"] = display_id || playListSlice.formValue.default_display_type.id;
    dispatch(updatePlayListData(values));
  };

  const handlePageClose = (event) => {
    // Cancel the event to prevent the browser from closing immediately
    event.preventDefault();
    // You can perform some cleanup actions here or show a confirmation message
    // For example, you can show a confirmation message to the user
    // console.log(isMutated);
    // if(isMutated)
  };

  useEffect(() => {
    if (playListSlice.formValue.id) {
      form.setFieldsValue(playListSlice.formValue);
      getDisplaySize();
    } else {
      form.resetFields();
    }
  }, [playListSlice.formValue]);

  useEffect(() => {
    dispatch(fetchDisplayTypeData({ page: 1 }));
    dispatch(getPlayListDataById({ id: params.id, condition: true }));
    // window.addEventListener("close", handlePageClose);
    // window.addEventListener("pagehide" , handlePageClose);
    return () => {
      // window.removeEventListener("close", handlePageClose);
      // window.removeEventListener("pagehide", handlePageClose);
      dispatch(resetState());
    };
  }, []);

  useEffect(() => {
    if (
      widgetTypes.length > 0 &&
      playListSlice.formValue?.default_display_type?.id
    ) {
      let display_type = playListSlice.formValue?.default_display_type?.id;
      dispatch(fetchSlides({ id: params.id, display_type, data: widgetTypes }));
    }
  }, [widgetTypes, playListSlice.formValue?.default_display_type?.id]);

  useEffect(() => {
    if (playListSlice.requestStatus === "update") {
      dispatch(getPlayListDataById({ id: params.id, condition: true }));
    }
  }, [playListSlice.requestStatus]);

  const getDisplaySize = () => {
    if (displayTypeSlice.data.length > 0) {
      let element = displayTypeSlice.data.find(
        (item) => item.id === playListSlice.formValue.default_display_type.id,
      );
      element &&
        setSize({
          width: element.width,
          height: element.height,
        });
    }
  };
  const save = () => {
    const sortedSlides = [...slides].sort(
      (a, b) => Number(a.position) - Number(b.position),
    );
    const emptySlideIndex = sortedSlides.findIndex(
      (item) => item.items.length === 0,
    );
    if (emptySlideIndex !== -1) {
      message.error(
        `Slide ${emptySlideIndex + 1} is empty. Please add content to all slides before saving.`,
      );
      return;
    }

    let saveData = slides.map((item) => {
      let newData = {};
      newData.name = item.name;
      newData.bg_color = item.bg_color;
      newData.duration = item.duration;
      newData.position = String(item.position);
      newData.items = item.items.map((i) => {
        if (i.type === "video") {
          return {
            type: i.widgetType,
            top: i.top,
            left: i.left,
            width: i.width,
            height: i.height,
            index: i.index,
            display_types: i.display_types ?? [],
            attr: {
              isLoop: i.attr.isLoop,
              ismute: i.attr.ismute,
              location: i.file,
              duration: i.duration,
            },
          };
        } else if (i.type === "image") {
          return {
            type: i.widgetType,
            top: i.top,
            left: i.left,
            width: i.width,
            height: i.height,
            index: i.index,
            display_types: i.display_types ?? [],
            attr: {
              location: i.file,
            },
          };
        } else if (i.type === "text" || i.type === "globaltext") {
          return {
            type: i.widgetType,
            top: i.top,
            left: i.left,
            width: i.width,
            height: i.height,
            index: i.index,
            display_types: i.display_types ?? [],
            attr: {
              textarea: i.attr.textarea,
              fonts: i.attr.fonts,
              speed: i.attr.speed,
              is_scrolling: i.attr.is_scrolling,
              frame_bg_color: i.attr.frame_bg_color,
            },
          };
        } else if (i.type === "site") {
          return {
            type: i.widgetType,
            top: i.top,
            left: i.left,
            width: i.width,
            height: i.height,
            index: i.index,
            display_types: i.display_types ?? [],
            attr: {
              url: i.attr.url,
              authorization: i.attr.authorization,
            },
          };
        } else if (i.type === "table") {
          return {
            type: i.widgetType,
            top: i.top,
            left: i.left,
            width: i.width,
            height: i.height,
            index: i.index,
            display_types: i.display_types ?? [],
            attr: {
              columns: i.tableData.columns,
              rows: i.tableData.rows,
              bg_color: i.bg_color,
            },
          };
        }
      });
      return newData;
    });
    // if (saveData.length === 1 && saveData[0].items.length === 0)
    //     return;
    let display_type = display_id;

    if (saveData.length === 1 && saveData[0].items.length === 0) {
      saveData = [];
    }
    dispatch(saveSlideSlice({ id: params.id, data: saveData, display_type }))
      .unwrap()
      .then((res) => {
        if (display_type && display_type !== playListSlice.formValue?.default_display_type?.id) {
          dispatch(updatePlayListData({
            id: params.id,
            name: playListSlice.formValue.name,
            description: playListSlice.formValue.description,
            default_display_type: display_type,
          }));
        }
        message.success("Playlist saved successfully!");
      });
  };

  const changeRoute = () => navigate(-1);

  return (
    <div className="editor">
      <Row justify={"space-between"} align={"middle"}>
        <Col span={4}>
          <div>
            <a onClick={changeRoute}>
              <img
                className="mx-2"
                src={arrowLeft}
                style={{ width: "15px" }}
                align={"arrow-left"}
              />
            </a>
            {playListSlice.formValue?.name}
          </div>
        </Col>
        <Col span={14}>
          <div className="d-flex justify-content-center">
            <Select
              size={"middle"}
              style={{
                width: "100%",
              }}
              onChange={(e) => {
                changeDisplay(e);
              }}
              placeholder="Select"
              value={display_id}
            >
              {displayTypeSlice.data.map((item, index) => {
                return (
                  <Option key={index} value={item.id} block>
                    {item.name} {item.width} x {item.height}
                  </Option>
                );
              })}
            </Select>
            <Button
              size={"middle"}
              className="mx-2"
              onClick={() => dispatch(getPlayListDataById({ id: params.id }))}
            >
              Rename
            </Button>
            <Link
              to={`/playlists/preview/${params.id}/${display_id}`}
              target={"_blank"}
              rel="noreferrer"
            >
              <Button size={"middle"} icon={<CaretRightOutlined />}>
                Preview
              </Button>
            </Link>
            <Button
              size={"middle"}
              loading={slideStatus}
              className="ant-btn-success mx-2"
              onClick={save}
            >
              Save
            </Button>
          </div>
        </Col>
      </Row>
      <DraggableComponent size={size} />

      <AuthModal
        title={"Edit display name"}
        isOpen={playListSlice.isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Playlist name"
            name="name"
            rules={[{ required: true, message: "Playlist name is required!" }]}
          >
            <Input placeholder="Enter playlist name" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleEdit}>
              Cancel
            </Button>
            <Button
              loading={playListSlice.postDataLoading}
              className="ant-btn-success"
              htmlType="submit"
            >
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>
    </div>
  );
};

export default PlaylistEditor;
