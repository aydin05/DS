import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  Form,
  Input,
  message,
  Radio,
  Select,
} from "antd";
import tableAction from "../../assets/images/table-action.svg";
import {
  deleteDisplayGroupData,
  fetchDisplayGroupData,
  getDisplayGroupDataById,
  postDisplayGroupData,
  toggleDeleteModal,
  toggleModal,
  updateDisplayGroupData,
} from "../store/features/displayGroupsSlice";
import { AuthModal } from "../SubComponents/AuthModal";
import ConfirmDeleteModal from "../SubComponents/ConfirmDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import { SubHeader } from "../SubComponents/SubHeader";
import { fetchScheduleData } from "../store/features/scheduleSlice";
import { fetchPlayListData } from "../store/features/playListSlice";
import { fetchDisplayData } from "../store/features/displaySlice";
import { fetchBranchData } from "../store/features/branchSlice";
import { fetchDisplayTypeData } from "../store/features/displayTypeSlice";
import CustomDataTable from "../consts/CustomDataTable";

export const DisplayGroups = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
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
    deleteDisplayGroupId,
    deleteDataLoading,
    postError,
  } = useSelector((state) => state.displayGroupsSlice);
  const playlistSlice = useSelector((state) => state.playListSlice);
  const scheduleSlice = useSelector((state) => state.scheduleSlice);
  const displaySlice = useSelector((state) => state.displaySlice);
  const displayTypeSlice = useSelector((state) => state.displayTypeSlice);
  const branchSlice = useSelector((state) => state.branchSlice);

  const [radio, setRadio] = useState("1");

  const toggleSetRadio = ({ target }) => {
    setRadio(target.value);
    if (target.value === "1") {
      form.setFieldsValue({ schedule: undefined });
    } else if (target.value === "2") {
      form.setFieldsValue({ playlist: undefined });
    }
  };

  const toggleEdit = () => {
    dispatch(toggleModal());
    setRadio("1");
  };
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id !== null ? { open: true, id } : { open: false, id: null })), [dispatch]);

  const finish = useCallback((values) => {
    if (radio === "1") {
      delete values.schedule;
    } else if (radio === "2") {
      delete values.playlist;
    }
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateDisplayGroupData(values));
    } else dispatch(postDisplayGroupData(values));
  }, [formValue.id, dispatch, radio]);
  const deleteDisplayType = useCallback(() =>
    dispatch(deleteDisplayGroupData(deleteDisplayGroupId)), [deleteDisplayGroupId, dispatch]);
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new display group successfully created");
          break;
        case "update":
          message.success("The display group successfully updated");
          break;
        case "delete":
          message.success("The display group successfully deleted");
          dispatch(fetchDisplayData());
          break;
      }
      dispatch(fetchDisplayGroupData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (postError) {
      form.setFields(postError);
    }
  }, [postError]);
  useEffect(() => {
    if (formValue.id) {
      if (formValue.playlist) setRadio("1");
      else if (formValue.schedule) setRadio("2");
      else if (formValue.display_set) setRadio("3");
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);
  useEffect(() => {
    // dispatch(fetchDisplayGroupData({ page: 1 }));
    dispatch(fetchScheduleData({ page: 1 }));
    dispatch(fetchPlayListData({ page: 1 }));
    dispatch(fetchDisplayData());
    dispatch(fetchBranchData({ page: 1 }));
    dispatch(fetchDisplayTypeData({ page: 1 }));
  }, []);
  const columns = useMemo(() => [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "PlayList",
      dataIndex: "playlist",
      key: "playlist",
      render: (text) => {
        return (
          !playlistSlice.isLoading &&
          playlistSlice.data.find((item) => item.id === text)?.name
        );
      },
    },
    {
      title: "Schedule",
      dataIndex: "schedule",
      key: "schedule",
      render: (text) => {
        return (
          !scheduleSlice.isLoading &&
          scheduleSlice.data.find((item) => item.id === text)?.name
        );
      },
    },
    {
      title: "Display",
      dataIndex: "display",
      key: "display",
      render: (text) => {
        return text.map((item) => item.name).join(" , ");
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
          menu={{
            items: [
              {
                label: "Edit",
                key: "0",
                onClick: () => dispatch(getDisplayGroupDataById(row.id)),
              },
              {
                label: "Delete",
                key: "1",
                onClick: () => toggleDelete(row.id),
              },
            ],
          }}
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
  ], [dispatch, toggleDelete, playlistSlice, scheduleSlice]);

  return (
    <div>
      <SubHeader
        title={"Display groups"}
        paragraph={"You can manage display groups from this section"}
        button_title={"New display group"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />

      {/*Data Table*/}
      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchDisplayGroupData}
        count={count}
        current={current_page}
      />

      {/*create and edit modal*/}
      <AuthModal
        title={
          formValue.name ? `Edit ${formValue.name}` : "Create new display group"
        }
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Display group name"
            name="name"
            rules={[
              { required: true, message: "Display group name required!" },
            ]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Radio.Group onChange={toggleSetRadio} value={radio}>
            <Radio value={"1"}>Playlist</Radio>
            <Radio value={"2"}>Schedule</Radio>
          </Radio.Group>
          {radio === "1" ? (
            <Form.Item
              name={"playlist"}
              rules={[{ required: true, message: "Playlist is required!" }]}
            >
              <Select
                placeholder="Select playlist"
                disabled={playlistSlice.isLoading}
              >
                {playlistSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : radio === "2" ? (
            <Form.Item
              name={"schedule"}
              rules={[{ required: true, message: "Schedule is required!" }]}
            >
              <Select
                placeholder="Select schedule"
                disabled={scheduleSlice.isLoading}
              >
                {scheduleSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <div></div>
          )}
          <Form.Item label={"Add display to group"} name={"display_set"}>
            <Select
              maxTagCount="responsive"
              mode="multiple"
              placeholder="Select display"
              disabled={
                displaySlice.isLoading &&
                displayTypeSlice.isLoading &&
                branchSlice.isLoading
              }
            >
              {displaySlice.data.length > 0 &&
                displaySlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name} (Branch :{" "}
                    {branchSlice.data.find((i) => i.id === item.branch)?.name} ,
                    Display type :
                    {
                      displayTypeSlice.data.find(
                        (i) => i.id === item.display_type,
                      )?.width
                    }
                    x
                    {
                      displayTypeSlice.data.find(
                        (i) => i.id === item.display_type,
                      )?.height
                    }
                    )
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter description" />
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

      <ConfirmDeleteModal
        isOpen={isOpenDeleteModal}
        onCancel={() => toggleDelete()}
        onConfirm={deleteDisplayType}
        loading={deleteDataLoading}
      />
    </div>
  );
};
