import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteScheduleData,
  fetchScheduleDateRange,
  getScheduleDataById,
  postScheduleDateForm,
  toggleModal,
  updateScheduleData,
  updateScheduleDateForm,
} from "../../store/features/scheduleSlice";
import { useNavigate, useParams } from "react-router-dom";
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
  const [repeatType, setRepeatType] = useState(false);
  const [saveScheduleData, setSaveScheduleData] = useState({});
  const localizer = momentLocalizer(moment);
  const [startDate, setStartDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const toggleSelectEvent = (e) => {
    setSelectEvent(!selectEvent);
    setEventData(e);
  };
  const fetchScheduleDataById = () => {
    axiosClient(
      `playlist/${params.id}/schedule-playlist/${eventData.id}/ `,
    ).then((res) => {
      setSelectEvent(false);
      let data = res.data;
      data["start_time"] = moment(data.start_time);
      data["end_time"] = moment(data.end_time);
      setIsAllDay(data.is_all_day);
      setRepeatType(data.repeat_type);
      setSaveScheduleData(data);
      form.setFieldsValue(data);
      toggleEditScheduleModal();
    });
    setEditEventModal(!editEventModal);
  };
  const toggleEditScheduleModal = (reset) => {
    setEditEventModal(!editEventModal);
    if (reset) {
      setIsAllDay(false);
      setRepeatType(false);
      form.resetFields();
    }
  };
  const toggle = () => dispatch(toggleModal("isScheduleRange"));
  const toggleDeleteSchedule = () =>
    setIsOpenScheduleDeleteModal(
      !isOpenScheduleDeleteModal,
    ); /*delete modal for redux*/
  const deleteSchedule = () => {
    dispatch(deleteScheduleData(params.id));
    navigate(-1);
  };
  const deleteEvent = () => {
    axiosClient
      .delete(`playlist/${params.id}/schedule-playlist/${eventData.id}/`)
      .then(() => {
        dispatch(fetchScheduleDateRange(params.id));
        toggleSelectEvent({});
        message.success("This event deleted successfully!");
      });
  };
  const selectSlot = (event) => {
    toggle();
  };
  const finish = (values) => {
    values["start_time"] = moment(values.start_time).format();
    values["end_time"] = moment(values.end_time).format();
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
  }, []);
  useEffect(() => {
    if (postDateFormSchedule) {
      message.success("New event added successfuly!");
      dispatch(fetchScheduleDateRange(params.id));
      form.resetFields();
    }
  }, [postDateFormSchedule]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center bg-header mb-4">
        <div>
          <h3 className={"m-0"}>Schedule manage</h3>
          <p> You can manage schedule date from this section</p>
        </div>
        <div>
          <Button onClick={toggleDeleteSchedule} type="danger">
            Delete Schedule
          </Button>
        </div>
      </div>
      {isLoadingSchedule ? (
        <Spin />
      ) : (
        <div>
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
            // defaultView="month"
            formats={formats}
            date={currentDate}
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
                    current && current < moment().startOf("day")
                  }
                  onChange={(value) => setStartDate(value)}
                />
              ) : (
                <DatePicker
                  showTime
                  format={"YYYY-MM-DD HH:mm:ss"}
                  disabledDate={(current) =>
                    current && current < moment().startOf("day")
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
                    (current < moment().startOf("day") ||
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
                    (current < moment().startOf("day") ||
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
          <Form.Item label="Description" name="description">
            <Input placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            label={"Playlist"}
            name={"playlist"}
            rules={[{ required: true, message: "Playlist is required!" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) => option.children.includes(input)}
              disabled={playListSlice.isLoading}
              placeholder="Select playlist"
            >
              {playListSlice.data.length > 0 &&
                playListSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
            </Select>
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
            <Button loading={postDataLoading} type="success" htmlType="submit">
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
            type="danger"
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
