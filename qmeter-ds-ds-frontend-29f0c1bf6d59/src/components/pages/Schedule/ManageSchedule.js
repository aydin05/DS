import React, { useEffect, useState } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteScheduleData,
  deleteScheduleDateForm,
  fetchScheduleDateRange,
  getScheduleDataById,
  postScheduleDateForm,
  resetStatus,
  toggleModal,
  updateScheduleData,
  updateScheduleDateForm,
} from "../../store/features/scheduleSlice";
import { useNavigate, useParams } from "react-router-dom";
import arrowLeft from "../../../assets/images/arrow-left.svg";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Spin,
  Tag,
} from "antd";
import { AuthModal } from "../../SubComponents/AuthModal";
import { fetchPlayListData } from "../../store/features/playListSlice";
import axiosClient from "../../../config";
import { formats } from "../../../helpers/index";

const ManageSchedule = (props) => {
  const {
    formValue,
    isOpenModal,
    isLoadingSchedule,
    scheduleRange,
    postDateFormSchedule,
    postDataLoading,
    deleteDataLoading,
    requestStatus,
    eventRequestStatus,
    eventError,
  } = useSelector((state) => state.scheduleSlice);
  const playListSlice = useSelector((state) => state.playListSlice);
  const dispatch = useDispatch();
  const params = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [selectEvent, setSelectEvent] = useState(false);
  const [eventData, setEventData] = useState({});
  const [editEventModal, setEditEventModal] = useState(false);
  const [isOpenScheduleDeleteModal, setIsOpenScheduleDeleteModal] =
    useState(false);
  const [allDay, setIsAllDay] = useState(false);
  const [repeatType, setRepeatType] = useState(null);
  const [saveScheduleData, setSaveScheduleData] = useState({});
  const localizer = dayjsLocalizer(dayjs);
  const [startDate, setStartDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const toggleSelectEvent = (e) => {
    setSelectEvent(!selectEvent);
    setEventData(e);
  };
  const fetchScheduleDataById = () => {
    axiosClient(
      `playlist/${params.id}/schedule-playlist/${eventData.id}/`,
    ).then((res) => {
      setSelectEvent(false);
      let data = res.data;
      data["start_time"] = dayjs(data.start_time);
      data["end_time"] = dayjs(data.end_time);
      setIsAllDay(data.is_all_day);
      setRepeatType(data.repeat_type);
      setSaveScheduleData(data);
      form.setFieldsValue(data);
      setEditEventModal(true);
    });
  };
  const toggleEditScheduleModal = (reset) => {
    setEditEventModal(!editEventModal);
    if (reset) {
      setIsAllDay(false);
      setRepeatType(null);
      form.resetFields();
    }
  };
  const toggle = () => dispatch(toggleModal("isScheduleRange"));
  const toggleDeleteSchedule = () =>
    setIsOpenScheduleDeleteModal(
      !isOpenScheduleDeleteModal,
    ); /*delete modal for redux*/
  const deleteSchedule = () => {
    dispatch(deleteScheduleData(params.id)).then(() => {
      navigate(-1);
    });
  };
  const deleteEvent = () => {
    dispatch(deleteScheduleDateForm({ scheduleId: params.id, eventId: eventData.id })).then((res) => {
      if (!res.error) {
        toggleSelectEvent({});
      }
    });
  };
  const selectSlot = (event) => {
    form.setFieldsValue({ playlist: formValue.default_playlist || undefined });
    toggle();
  };
  const finish = (values) => {
    values["start_time"] = dayjs(values.start_time).format();
    values["end_time"] = dayjs(values.end_time).format();
    if (saveScheduleData.id) {
      values["id"] = saveScheduleData.id;
      dispatch(updateScheduleDateForm({ id: params.id, data: values }));
    } else dispatch(postScheduleDateForm({ id: params.id, data: values }));
  };
  const changePlayList = (id) => {
    let data = { ...formValue };
    data["default_playlist"] = id;
    dispatch(updateScheduleData(data));
  };

  const getScheduleRange = (e) => {
    toggleSelectEvent(e);
  };
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new schedule successfully created");
          break;
        case "update":
          message.success("The schedule successfully updated");
          break;
        case "delete":
          message.success("The schedule successfully deleted");
          break;
      }
      dispatch(getScheduleDataById({ id: params.id, condition: true }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (eventRequestStatus) {
      switch (eventRequestStatus) {
        case "post":
          message.success("The new schedule event successfully created");
          break;
        case "update":
          message.success("The schedule event successfully updated");
          toggleEditScheduleModal(true);
          setEventData({});
          setSaveScheduleData({});
          break;
        case "delete":
          message.success("The schedule event successfully deleted");
          break;
      }
      dispatch(fetchScheduleDateRange(params.id));
    }
  }, [eventRequestStatus]);
  useEffect(() => {
    dispatch(fetchScheduleDateRange(params.id));
    dispatch(fetchPlayListData({ page: 1 }));
    dispatch(getScheduleDataById({ id: params.id, condition: true }));
    return () => {
      dispatch(resetStatus());
    };
  }, []);
  useEffect(() => {
    if (postDateFormSchedule) {
      dispatch(fetchScheduleDateRange(params.id));
      form.resetFields();
    }
  }, [postDateFormSchedule]);
  useEffect(() => {
    if (eventError) {
      const errorMsg = typeof eventError === 'string' ? eventError
        : eventError.error || eventError.detail || JSON.stringify(eventError);
      message.error(errorMsg);
    }
  }, [eventError]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center bg-header mb-4">
        <div>
          <a onClick={() => navigate(-1)}>
            <img
              className="mx-2"
              src={arrowLeft}
              style={{ width: "15px" }}
              alt="arrow-left"
            />
          </a>
          <h3 className={"m-0 d-inline"}>Schedule manage</h3>
          <p className="ms-4"> You can manage schedule date from this section</p>
        </div>
        <div>
          <Button onClick={toggleDeleteSchedule} className="ant-btn-danger">
            Delete Schedule
          </Button>
        </div>
      </div>
      {isLoadingSchedule ? (
        <Spin />
      ) : (
        <div>
          {/* Schedule info panel */}
          {formValue.assigned_displays && formValue.assigned_displays.length > 0 && (
            <div className="mb-4" style={{ padding: "12px 16px", background: "#f5f5f5", borderRadius: "8px" }}>
              <div>
                <strong>Assigned Displays: </strong>
                {formValue.assigned_displays.map((d) => (
                  <Tag key={d.id} color="blue" style={{ marginBottom: "4px" }}>
                    {d.name} → {d.branch_name || "No branch"}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {formValue.id && (!formValue.assigned_displays || formValue.assigned_displays.length === 0) && (
            <div className="mb-4" style={{ padding: "12px 16px", background: "#fffbe6", borderRadius: "8px", border: "1px solid #ffe58f" }}>
              <span style={{ color: "#ad6800" }}>No displays are currently assigned to this schedule.</span>
            </div>
          )}

          <div className={"d-flex align-items-center mb-4"}>
            <div style={{ marginRight: "20px" }}>
              <span>Go to date: </span>
              <DatePicker
                onChange={(date) => {
                  if (date) {
                    setCurrentDate(date.toDate());
                  }
                }}
                format="YYYY-MM-DD"
              />
            </div>

            <div>
              <span>Default playlist : </span>
              <Select
                value={formValue.default_playlist}
                disabled={playListSlice.isLoading}
                style={{
                  width: 200,
                }}
                bordered={false}
                onChange={changePlayList}
              >
                {playListSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          <Calendar
            localizer={localizer}
            selectable={true}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            events={scheduleRange}
            onSelectSlot={selectSlot}
            onSelectEvent={getScheduleRange}
            popup={true}
            initialValue={"dayGridMonth"}
            drilldownView={null}
            formats={formats}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
          />
        </div>
      )}

      <AuthModal
        title="New event"
        isOpen={isOpenModal || editEventModal}
        cancel={() =>
          editEventModal ? toggleEditScheduleModal(true) : toggle()
        }
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Title"
            name="name"
            rules={[{ required: true, message: "Title is required!" }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>

          <div className={"d-flex justify-content-start"}>
            <Form.Item
              label="Start"
              name="start_time"
              rules={[{ required: true, message: "Start date is required!" }]}
            >
              {allDay ? (
                <DatePicker
                  format={"DD/MM/YYYY"}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  onChange={(value) => setStartDate(value)}
                />
              ) : (
                <DatePicker
                  showTime
                  format={"YYYY-MM-DD HH:mm:ss"}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  onChange={(value) => setStartDate(value)}
                />
              )}
            </Form.Item>
            <Form.Item
              label="End"
              style={{ margin: "0px 15px" }}
              name="end_time"
              rules={[{ required: true, message: "End date is required!" }]}
            >
              {allDay ? (
                <DatePicker
                  format={"DD/MM/YYYY"}
                  disabled={!startDate}
                  disabledDate={(current) =>
                    current &&
                    (current < dayjs().startOf("day") ||
                      (startDate && current < startDate))
                  }
                />
              ) : (
                <DatePicker
                  showTime
                  format={"YYYY-MM-DD HH:mm:ss"}
                  disabled={!startDate}
                  disabledDate={(current) =>
                    current &&
                    (current < dayjs().startOf("day") ||
                      (startDate && current < startDate))
                  }
                />
              )}
            </Form.Item>
          </div>

          <div className="d-flex">
            <Form.Item valuePropName="checked" name="is_all_day">
              <Checkbox
                onChange={(e) => {
                  setIsAllDay(e.target.checked);
                }}
                checked={allDay}
              >
                All day
              </Checkbox>
            </Form.Item>
            <Form.Item
              valuePropName="checked"
              style={{ marginLeft: "20px" }}
              name="repeat"
            >
              <Checkbox
                checked={repeatType}
                onChange={(e) => setRepeatType(e.target.checked)}
              >
                Repeat
              </Checkbox>
            </Form.Item>
            {repeatType && (
              <Form.Item style={{ marginLeft: "20px" }} name="repeat_type">
                <Select
                  style={{
                    width: 200,
                  }}
                  placeholder={"Select repeat type"}
                >
                  <Select.Option value={"Weekly"}>Weekly</Select.Option>
                  <Select.Option value={"Daily"}>Daily</Select.Option>
                  <Select.Option value={"Monthly"}>Monthly</Select.Option>
                  <Select.Option value={"Yearly"}>Yearly</Select.Option>
                </Select>
              </Form.Item>
            )}
          </div>
          <Form.Item
            label="Playlist"
            name="playlist"
            rules={[{ required: true, message: "Playlist is required!" }]}
          >
            <Select
              placeholder="Select playlist"
              loading={playListSlice.isLoading}
              style={{ width: "100%" }}
            >
              {playListSlice.data.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input placeholder="Enter description" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button
              type="text"
              htmlType="button"
              onClick={() =>
                editEventModal ? toggleEditScheduleModal() : toggle()
              }
            >
              Cancel
            </Button>
            <Button loading={postDataLoading} className="ant-btn-success" htmlType="submit">
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>

      <AuthModal
        title="Are you sure?"
        isOpen={isOpenScheduleDeleteModal}
        cancel={() => toggleDeleteSchedule()}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <div className="d-flex justify-content-end">
          <Button
            type="text"
            htmlType="button"
            onClick={() => toggleDeleteSchedule()}
          >
            Cancel
          </Button>
          <Button
            onClick={deleteSchedule}
            loading={deleteDataLoading}
            className="ant-btn-danger"
            htmlType="submit"
          >
            Delete
          </Button>
        </div>
      </AuthModal>

      {/*popup confirm for delete or edit*/}
      <AuthModal
        title={"Select event"}
        isOpen={selectEvent}
        cancel={toggleSelectEvent}
        isFooter={"none"}
      >
        <h3>Select event</h3>
        <p>Event title : {eventData.title}</p>
        <Row>
          <Col span={12} style={{ paddingRight: "5px" }}>
            <Button block onClick={fetchScheduleDataById}>
              Edit
            </Button>
          </Col>
          <Col span={12} style={{ paddingLeft: "5px" }}>
            <Popconfirm
              title="Are you sure to delete this event?"
              onConfirm={deleteEvent}
              onCancel={() => {}}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button block type={"danger"}>
                Delete
              </Button>
            </Popconfirm>
          </Col>
        </Row>
      </AuthModal>

      {/*edit event modal*/}

      {/*<AuthModal*/}
      {/*    isOpen={editEventModal}*/}
      {/*    cancel={toggleEditEventModal()}*/}
      {/*    title={"Edit event"}*/}
      {/*    is*/}
      {/*>*/}

      {/*</AuthModal>*/}
    </div>
  );
};

export default ManageSchedule;
