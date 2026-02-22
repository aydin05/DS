import React, { useEffect } from "react";
import { Button, Dropdown, Form, Input, Menu, message, Select } from "antd";
import tableAction from "../../../assets/images/table-action.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { AuthModal } from "../../SubComponents/AuthModal";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteScheduleData,
  fetchScheduleData,
  getScheduleDataById,
  postScheduleData,
  toggleDeleteModal,
  toggleModal,
  updateScheduleData,
} from "../../store/features/scheduleSlice";
import { fetchPlayListData } from "../../store/features/playListSlice";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../consts/CustomDataTable";
import { pageSize } from "../../../helpers";

export const Schedules = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  /*store data*/
  const {
    isLoading,
    data,
    count,
    current_page,
    isOpenModal,
    formValue,
    isOpenDeleteModal,
    postDataLoading,
    requestStatus,
    deleteScheduleId,
    deleteDataLoading,
    postError,
  } = useSelector((state) => state.scheduleSlice);
  const playListSlice = useSelector((state) => state.playListSlice);
  /*component states*/

  /*component actions*/
  const toggleEdit = () => dispatch(toggleModal());
  const toggleDelete = (id = null) => dispatch(toggleDeleteModal(id));

  const finish = (values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateScheduleData(values));
    } else dispatch(postScheduleData(values));
  };
  const deleteRole = () => dispatch(deleteScheduleData(deleteScheduleId));
  /*side effects*/
  useEffect(() => {
    // dispatch(fetchScheduleData({ page: 1 }));
    dispatch(fetchPlayListData({ page: 1 }));
  }, []);
  /*check if role name exist*/
  useEffect(() => {
    if (postError) {
      form.setFields(postError);
    }
  }, [postError]);
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
      dispatch(fetchScheduleData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (formValue.id) {
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);
  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => (current_page - 1) * pageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Play list",
      dataIndex: "default_playlist",
      key: "default_playlist",
      render: (text, row) => {
        return (
          !playListSlice.isLoading &&
          playListSlice.data.find((item) => item.id === text)?.name
        );
      },
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      dataIndex: "action",
      key: "action",
      render: (text, row) => (
        <Dropdown
          overlay={
            <Menu
              items={[
                {
                  label: (
                    <a onClick={() => navigate("/schedules/" + row.id)}>
                      Manage
                    </a>
                  ),
                  key: "0",
                },
                {
                  label: (
                    <a
                      onClick={() =>
                        dispatch(getScheduleDataById({ id: row.id }))
                      }
                    >
                      Edit
                    </a>
                  ),
                  key: "1",
                },
                {
                  label: <a onClick={() => toggleDelete(row.id)}>Delete</a>,
                  key: "2",
                },
              ]}
            />
          }
          trigger={["click"]}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Button type="text">
              <img src={tableAction} alt="..." />
            </Button>
          </a>
        </Dropdown>
      ),
    },
  ];
  return (
    <div>
      <SubHeader
        title={"Schedules"}
        paragraph={"You can manage schedules from this section"}
        button_title={"New schedule"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*Data Table*/}
      <CustomDataTable
        data={data}
        isLoading={isLoading && playListSlice.isLoading}
        columns={columns}
        action={fetchScheduleData}
        count={count}
        current={current_page}
        pageSize={pageSize}
      />
      {/*create and edit modal*/}
      <AuthModal
        title={
          formValue.name ? `Edit ${formValue.name}` : "Create new schedule"
        }
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Schedule name"
            name="name"
            rules={[{ required: true, message: "Schedule name is required!" }]}
          >
            <Input placeholder="Enter schedule name" />
          </Form.Item>
          <Form.Item
            label={"Playlist"}
            name={"default_playlist"}
            rules={[{ required: true, message: "Playlist zone is required!" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) => option.children.includes(input)}
              disabled={playListSlice.isLoading}
              placeholder="Select playlist"
            >
              {playListSlice.data.map((item, index) => (
                <Select.Option key={index} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input placeholder="Enter description" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleEdit}>
              Cancel
            </Button>
            <Button loading={postDataLoading} className="ant-btn-success" htmlType="submit">
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>

      {/*delete modal*/}
      <AuthModal
        title="Are you sure?"
        isOpen={isOpenDeleteModal}
        cancel={toggleDelete}
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
            onClick={deleteRole}
            loading={deleteDataLoading}
            className="ant-btn-danger"
            htmlType="submit"
          >
            Delete
          </Button>
        </div>
      </AuthModal>
    </div>
  );
};
