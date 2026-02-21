import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Collapse,
  Divider,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Row,
  Space,
  Spin,
  Tabs,
  Tooltip,
  Upload,
} from "antd";
import {
  DownOutlined,
  InboxOutlined,
  PlusOutlined,
  TableOutlined,
} from "@ant-design/icons";
import video from "../../../assets/images/video-item.svg";
import image from "../../../assets/images/image-item.svg";
import text from "../../../assets/images/text-1-item.svg";
import globaltext from "../../../assets/images/text-2-item.svg";
import site from "../../../assets/images/multi.svg";
import { AuthModal } from "../../SubComponents/AuthModal";
import { useDispatch, useSelector } from "react-redux";
import Text from "./Items/Text";
import Image from "./Items/Image";
import Video from "./Items/Video";
import axiosClient from "../../../config";
import {
  addItem,
  deleteFile,
  fetchWidgetTypes,
  selectedSlideItem,
  toggleDeleteModal,
  updateItemIndex,
  updateSlide,
  uploadFile,
} from "../../store/features/playListInnerSlice";
import cancel from "../../../assets/images/cancel.svg";
import checkMark from "../../../assets/images/metro-checkmark.svg";
import Iframe from "./Items/Site";
import Table, { defaultColumnThStyleAttr } from "./Items/Table";

const { Panel } = Collapse;
const { Dragger } = Upload;
let durations = [];
(() => {
  for (let i = 0; i <= 60; i++) {
    durations.push(i);
  }
})();
const Properties = ({ size }) => {
  const colorRef = useRef();
  const dispatch = useDispatch();
  const {
    slides,
    selectedPosition,
    selectedItem,
    isLoadingUpload,
    uploadDatas,
    fileStatus,
    isOpenDeleteModal,
    deleteFileId,
    deleteStatus,
    isLoadingWidgetType,
    widgetTypes,
    widgetTypeObject,
  } = useSelector((state) => state.playListInnerSlice);

  /*component state*/
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenIframeModal, setIsOpenIframeModal] = useState(false);
  const [tab, setTab] = useState("1");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [widgetType, setWidgetType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  const selectFiles = (items, widgetType) => {
    if (!selectedFiles.some((item) => item.id === items.id)) {
      setSelectedFiles([
        ...selectedFiles,
        { ...items, widgetType: widgetTypeObject[items.type] },
      ]);
    }
  };
  const removeFiles = (id) =>
    setSelectedFiles(selectedFiles.filter((item) => item.id !== id));

  const toggle = (key, widgetType) => {
    setIsOpenModal(!isOpenModal);
    setTab(key);
    setWidgetType(widgetType);
  };
  const toggleIframe = (widgetType) => {
    setIsOpenIframeModal(!isOpenIframeModal);
    setWidgetType(widgetType);
  };
  const toggleDelete = (id = null) => dispatch(toggleDeleteModal(id));

  const deleteImageOrVideo = () => {
    removeFiles(deleteFileId);
    dispatch(deleteFile(deleteFileId));
  };

  const fileUpload = (options) => {
    /*file upload function*/
    const { file } = options;
    const type = file.type.includes("image") ? "image" : "video";
    const formData = new FormData();
    formData.append("file", file); //append file
    formData.append("type", type); //append file type , video or image
    setIsLoading(true);
    const hideMsg = type === "video"
      ? message.loading("Preparing video for display specs (H.264 / 8000 kbps / 30 fps). Please wait, do not close the page...", 0)
      : null;
    axiosClient
      .post("core/file/", formData)
      .then(() => {
        hideMsg && hideMsg();
        message.success(`${file.name} file uploaded successfully.`);
        dispatch(uploadFile());
        setIsLoading(false);
        type === "video" && setTab("2");
      })
      .catch((error) => {
        hideMsg && hideMsg();
        setIsLoading(false);
        const data = error.response && error.response.data;
        if (data && data.non_field_errors) {
          data.non_field_errors.forEach(function(err) {
            message.error(err, 6);
          });
        } else if (data && typeof data === 'object') {
          const msgs = Object.values(data).flat();
          if (msgs.length > 0) {
            msgs.forEach(function(err) { message.error(String(err), 6); });
          } else {
            message.error(`${file.name} file upload failed.`);
          }
        } else {
          message.error(`${file.name} file upload failed.`);
        }
      });
  };
  const addItemSlide = () => {
    if (selectedFiles.length !== 0) {
      let index = slides.find(
        (item) => item.position === selectedPosition,
      ).selectedIndex;
      let position_id =
        selectedItem.items.length > 0
          ? selectedItem.items[selectedItem.items.length - 1].position_id
          : 0;
      let items = selectedFiles.map((item, i) => {
        index += 1;
        position_id += 1;
        if (item.type === "image") {
          return {
            ...item,
            width: size.width < 200 ? size.width : 200,
            height: size.width < 200 ? size.width : 200,
            top: 0,
            left: 0,
            index: index,
            position_id: position_id,
            widgetType: item.widgetType,
          };
        } else {
          return {
            ...item,
            width: size.width < 200 ? size.width : 200,
            height: size.width < 200 ? size.width : 200,
            top: 0,
            left: 0,
            index: index,
            position_id: position_id,
            widgetType: item.widgetType,
            attr: {
              isLoop: false,
              ismute: false,
            },
          };
        }
      });
      dispatch(addItem(items));
      setSelectedFiles([]);
      toggle("1");
    } else message.error("No items have been selected");
  };
  const addText = (type, widgetType) => {
    let position_id =
      selectedItem.items.length > 0
        ? selectedItem.items[selectedItem.items.length - 1].position_id
        : 0;
    let index = slides.find(
      (item) => item.position === selectedPosition,
    ).selectedIndex;
    let items = [
      {
        width: size.width < 400 ? size.width : 400,
        height: size.width < 50 ? size.width : 50,
        top: 0,
        left: 0,
        index: index + 1,
        position_id: position_id + 1,
        widgetType,
        type: type,
        attr: {
          fonts: "",
          textarea: "You can write here!!!",
          speed: 60,
          is_scrolling: false,
          frame_bg_color: "#f3f0f0",
        },
      },
    ];
    dispatch(addItem(items));
  };
  const addIframe = (e) => {
    let position_id =
      selectedItem.items.length > 0
        ? selectedItem.items[selectedItem.items.length - 1].position_id
        : 0;
    let index = slides.find(
      (item) => item.position === selectedPosition,
    ).selectedIndex;
    let items = [
      {
        width: size.width,
        height: size.height,
        top: 0,
        left: 0,
        index: index + 1,
        position_id: position_id + 1,
        type: "site",
        widgetType,
        attr: {
          ...e,
        },
      },
    ];
    dispatch(addItem(items));
    toggleIframe();
  };

  const addTableWidget = (widgetId) => {
    // TODO : delete temporary variables;
    let position_id =
      selectedItem.items.length > 0
        ? selectedItem.items[selectedItem.items.length - 1].position_id
        : 0;

    let index = slides.find(
      (item) => item.position === selectedPosition,
    ).selectedIndex;

    let items = [
      {
        width: 400,
        height: 50,
        top: 0,
        left: 0,
        index: index + 1,
        position_id: position_id + 1,
        type: "table",
        widgetType: widgetId,
        tableData: {
          columns: [],
          rows: [],
        },
        attr: {
          fontSize: 12,
        },
      },
    ];

    dispatch(addItem(items));
  };
  const checkIframe = () =>
    selectedItem.items.some((item) => item.type === "site");
  const updateSlideDurationBgColor = (key, value) => {
    dispatch(updateSlide({ key, value }));
  };
  const uploadProps = {
    /*Upload props*/ customRequest: fileUpload,
    multiple: true,
    accept: "image/* , video/*",
    beforeUpload: (file) => {},
  };

  const changePanel = (key) => {
    if (activeKey === key) {
      setActiveKey(null);
    } else {
      setActiveKey(key);

      const item = selectedItem.items.find(
        (item) => item.index === Number(key),
      );
      if (item) {
        dispatch(updateItemIndex(item));
      }
    }
  };

  useEffect(() => {
    dispatch(uploadFile());
    dispatch(fetchWidgetTypes());
    dispatch(selectedSlideItem());
  }, []);

  useEffect(() => {
    if (fileStatus) {
      message.success(`File deleted successfully.`);
      dispatch(uploadFile());
    }
  }, [fileStatus]);

  return (
    <div>
      <div className="properties">
        <div className="title">Slide properties</div>
        <div className="mx-3 mt-3 mb-2">
          Duration : &nbsp;
          <InputNumber
            style={{
              width: 70,
              marginRight: 10,
            }}
            value={selectedItem.duration}
            min={0}
            onChange={(e) => {
              updateSlideDurationBgColor("duration", e);
            }}
          />
          {selectedItem.videoDurations.length > 0 && (
            <Dropdown
              overlay={
                <Menu
                  onClick={({ key }) =>
                    updateSlideDurationBgColor(
                      "duration",
                      Number(key.split(" ")[0]),
                    )
                  }
                  items={selectedItem.videoDurations.map((item, index) => {
                    return {
                      label: `${item.duration} sec
                                    (${item.name?.slice(item.name.indexOf("company_file/") + 13)})`,
                      key: item.duration + " " + index,
                    };
                  })}
                />
              }
            >
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  Set from file
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          )}
        </div>
        <div className="mx-3">
          Background :{" "}
          <span>
            <div
              className="color"
              onClick={() => colorRef.current.click()}
              style={{
                backgroundColor: selectedItem.bg_color,
                border: "1px solid",
              }}
            ></div>
            <input
              type="color"
              style={{ visibility: "hidden" }}
              ref={colorRef}
              onChange={(e) => {
                updateSlideDurationBgColor("bg_color", e.target.value);
              }}
            />
          </span>
        </div>
      </div>
      <div className="properties mt-3">
        <div className="title">Current slide items</div>
        <Collapse
          onChange={changePanel}
          accordion
          expandIconPosition="end"
          activeKey={activeKey}
        >
          {selectedItem.items.map((item, panel_index) => (
            <Panel
              // key={panel_index}
              header={panel_index + 1 + " . " + item.type}
              key={`${item?.position_id}`}
            >
              {item.type === "text" || item.type === "globaltext" ? (
                <Text properties={item} />
              ) : item.type === "image" ? (
                <Image properties={item} />
              ) : item.type === "video" ? (
                <Video properties={item} />
              ) : item.type === "site" ? (
                <Iframe size={size} properties={item} />
              ) : item.type === "table" ? (
                <Table properties={item} />
              ) : (
                item.type
              )}
            </Panel>
          ))}
        </Collapse>
        <div className="d-flex justify-content-center mt-3">
          <Tooltip
            title={
              <div className="d-flex align-items-center justify-content-between">
                {widgetTypes.map((item, index) => {
                  if (item.name === "image") {
                    return (
                      <Button
                        key={index}
                        disabled={checkIframe()}
                        onClick={() => toggle("1", item.id)}
                        shape="circle"
                        className="ml-1"
                      >
                        <img src={image} alt={"image"} width={20} height={20} />
                      </Button>
                    );
                  } else if (item.name === "video") {
                    return (
                      <Button
                        key={index}
                        disabled={checkIframe()}
                        onClick={() => toggle("2", item.id)}
                        shape="circle"
                        className="ml-1"
                      >
                        <img src={video} alt={"video"} width={20} height={20} />
                      </Button>
                    );
                  } else if (item.name === "text") {
                    return (
                      <Button
                        key={index}
                        shape="circle"
                        disabled={checkIframe()}
                        onClick={() => addText("text", item.id)}
                        className="ml-1"
                      >
                        <img src={text} alt={"text"} width={20} height={20} />
                      </Button>
                    );
                  } else if (item.name === "globaltext") {
                    return (
                      <Button
                        key={index}
                        shape="circle"
                        disabled={checkIframe()}
                        onClick={() => addText("globaltext", item.id)}
                        className="ml-1"
                      >
                        <img src={globaltext} alt={"globaltext"} width={16} height={16} />
                      </Button>
                    );
                  } else if (item.name === "table") {
                    return (
                      <Button
                        key={index}
                        shape="circle"
                        className="mx-1"
                        onClick={() => addTableWidget(item.id)}
                      >
                        <TableOutlined />
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        key={index}
                        disabled={selectedItem.items.length > 0}
                        shape="circle"
                        className="mx-1"
                        onClick={() => toggleIframe(item.id)}
                      >
                        <img src={site} alt={"site"} width={18} height={18} />
                      </Button>
                    );
                  }
                })}
              </div>
            }
            color={"white"}
          >
            <Button disabled={isLoadingWidgetType} icon={<PlusOutlined />}>
              Add item
            </Button>
          </Tooltip>
        </div>
      </div>

      <AuthModal
        title={"Select or upload a file"}
        isOpen={isOpenModal}
        cancel={toggle}
        isFooter={"none"}
        width={1000}
      >
        <Tabs activeKey={tab} centered onChange={(e) => setTab(e)} items={[
          {
            key: "1",
            label: "Images",
            children: (
              <>
                <h4>Already added</h4>
                <Row>
                  <Col span={12}>
                    <div
                      className="d-flex justify-content-start align-items-center"
                      style={{
                        flexWrap: "wrap",
                        height: "440px",
                        overflow: "auto",
                      }}
                    >
                      {isLoadingUpload ? (
                        <Spin />
                      ) : (
                        uploadDatas
                          .filter((item) => item.type === "image")
                          .map((item, index) => (
                            <div key={index} className="image-crop mt-2 ">
                              <div
                                className={"image-crop-inner-div"}
                                onClick={() => {
                                  selectedFiles.some((i) => i.id === item.id)
                                    ? removeFiles(item.id)
                                    : selectFiles(item);
                                }}
                              >
                                <img src={item.file} alt={`image file` + index} />
                                {selectedFiles.some((i) => i.id === item.id) && (
                                  <span className="selected">
                                    <img src={checkMark} />
                                  </span>
                                )}
                              </div>
                              <span onClick={() => toggleDelete(item.id)}>
                                <img
                                  className="cancel"
                                  src={cancel}
                                  alt={"cancel"}
                                />
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </Col>
                  <Col span={12} style={{ borderLeft: "1px solid #e4dfdf" }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        maxHeight: "440px",
                        overflow: "auto",
                      }}
                    >
                      {selectedFiles
                        .filter((item) => item.type === "image")
                        .map((item, index) => (
                          <div className="image-crop mt-2" key={index}>
                            <div className="image-crop-inner-div">
                              <img src={item.file} alt={`image file` + index} />
                              <span onClick={() => removeFiles(item.id)}>
                                <img
                                  className="cancel"
                                  src={cancel}
                                  alt={"cancel"}
                                />
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "2",
            label: "Videos",
            children: (
              <>
                <h4>Already added</h4>
                <Row>
                  <Col span={12}>
                    <div
                      className="d-flex justify-content-start align-items-center"
                      style={{
                        flexWrap: "wrap",
                        height: "440px",
                        overflow: "auto",
                      }}
                    >
                      {isLoadingUpload ? (
                        <Spin />
                      ) : (
                        uploadDatas
                          .filter((item) => item.type === "video")
                          .map((item, index) => (
                            <div key={index} className="image-crop mt-2">
                              <div
                                className="image-crop-inner-div"
                                onClick={() => {
                                  selectedFiles.some((i) => i.id === item.id)
                                    ? removeFiles(item.id)
                                    : selectFiles(item);
                                }}
                              >
                                <video preload="metadata" muted playsInline>
                                  <source src={`${item.file}#t=0.1`} type="video/mp4" />
                                </video>
                                {selectedFiles.some((i) => i.id === item.id) && (
                                  <span className="selected">
                                    <img src={checkMark} />
                                  </span>
                                )}
                              </div>
                              <span onClick={() => toggleDelete(item.id)}>
                                <img
                                  className="cancel"
                                  src={cancel}
                                  alt={"cancel"}
                                />
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </Col>
                  <Col span={12} style={{ borderLeft: "1px solid #e4dfdf" }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        maxHeight: "440px",
                        overflow: "auto",
                      }}
                    >
                      {selectedFiles
                        .filter((item) => item.type === "video")
                        .map((item, index) => (
                          <div key={index} className="image-crop mt-2">
                            <div className="image-crop-inner-div">
                              <video preload="metadata" muted playsInline>
                                <source src={`${item.file}#t=0.1`} type="video/mp4" />
                              </video>
                              <span onClick={() => removeFiles(item.id)}>
                                <img
                                  className="cancel"
                                  src={cancel}
                                  alt={"cancel"}
                                />
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Col>
                </Row>
              </>
            ),
          },
        ]} />
        <Divider />
        {isLoading ? (
          <Spin>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload. Strictly prohibit from
                uploading company data or other band files
              </p>
            </Dragger>
          </Spin>
        ) : (
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibit from
              uploading company data or other band files
            </p>
          </Dragger>
        )}
        <div className="mt-3 d-flex justify-content-end">
          <Button onClick={toggle} className="mx-2">
            Cancel
          </Button>
          <Button onClick={addItemSlide} type="success">
            Add
          </Button>
        </div>
      </AuthModal>
      {/*delete modal*/}
      <AuthModal
        title="Are you sure?"
        isOpen={isOpenDeleteModal}
        cancel={() => toggleDelete()}
        // save={deleteDisplaytype}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <div className="d-flex justify-content-end">
          <Button type="text" htmlType="button" onClick={() => toggleDelete()}>
            Cancel
          </Button>
          <Button
            onClick={deleteImageOrVideo}
            loading={deleteStatus}
            type="danger"
          >
            Delete
          </Button>
        </div>
      </AuthModal>

      {/*iframe modal*/}
      <AuthModal
        title={"IFrame modal"}
        isOpen={isOpenIframeModal}
        cancel={toggleIframe}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={addIframe}>
          <Form.Item
            label="Iframe url"
            name="url"
            rules={[{ required: true, message: "Iframe url required!" }]}
          >
            <Input type={"url"} placeholder="Enter iframe url" />
          </Form.Item>
          <Form.Item
            label="Authorization"
            name="authorization"
            // rules={[{required: true, message: 'Authorization required!'}]}
          >
            <Input.TextArea placeholder="Enter authorization details" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button
              type="button"
              htmlType="button"
              onClick={() => toggleIframe()}
            >
              Cancel
            </Button>
            <Button type="success" htmlType="submit" className={"mx-2"}>
              Add
            </Button>
          </div>
        </Form>
      </AuthModal>
    </div>
  );
};

export default Properties;
