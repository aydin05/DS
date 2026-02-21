import React, { useEffect, useState } from "react";
import { Button, Divider, Form, Input, message, Radio, Select, Switch, Tooltip } from "antd";
import arrowLeft from "../../../assets/images/arrow-left.svg";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteBranchData,
  fetchBranchData,
  getBranchDataById,
  previewOpenLinkData,
  resetBranchState,
  updateBranchData,
} from "../../store/features/branchSlice";
import { useDispatch, useSelector } from "react-redux";
import { AuthModal } from "../../SubComponents/AuthModal";
import {
  deleteDisplayData,
  getDisplayDataById,
  postDisplayData,
  resetDisplayState,
  toggleDeleteModal,
  toggleModal,
  updateDisplayData,
} from "../../store/features/displaySlice";
import { fetchDisplayTypeData } from "../../store/features/displayTypeSlice";
import { fetchPlayListData } from "../../store/features/playListSlice";
import { fetchScheduleData } from "../../store/features/scheduleSlice";
import { SubHeader } from "../../SubComponents/SubHeader";
import CustomDataTable from "../../consts/CustomDataTable";
import { fetchDisplayGroupData } from "../../store/features/displayGroupsSlice";
import axiosClient from "../../../config";

const BranchManage = (props) => {
  /*get data with id  , which id you need to get from navigate route params*/
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const [form] = Form.useForm();
  const {
    isLoading,
    isOpenModal,
    isOpenDeleteModal,
    deleteDataLoading,
    formValue,
    requestStatus,
    postDataLoading,
    deleteDisplayId,
    postError,
  } = useSelector((state) => state.displaySlice);
  const branchSlice = useSelector((state) => state.branchSlice);
  const displayTypeSlice = useSelector((state) => state.displayTypeSlice);
  const playListSlice = useSelector((state) => state.playListSlice);
  const scheduleSlice = useSelector((state) => state.scheduleSlice);
  const displayGroupSlice = useSelector((state) => state.displayGroupsSlice);
  const [isOpenDeleteBranch, setIsOpenDeleteBranch] = useState(false);
  const [choice, setChoice] = useState("1");
  const changeRoute = () => navigate(-1);
  const toggleDeleteBranch = () => setIsOpenDeleteBranch(!isOpenDeleteBranch);
  const toggleEdit = () => {
    dispatch(toggleModal());
    setChoice("1");
  }; /*delete modal for branch*/
  const toggleDelete = (id = null) =>
    dispatch(toggleDeleteModal(id)); /*delete modal for redux*/

  const toggleSetRadio = ({ target }) => setChoice(target.value);

  const toggleBranchNotifications = (checked) => {
    const branchData = branchSlice.formValue;
    dispatch(
      updateBranchData({
        id: branchData.id,
        name: branchData.name,
        description: branchData.description,
        timezone: branchData.timezone,
        notifications_enabled: checked,
      }),
    ).then(() => {
      message.success(
        `Branch & all displays notifications ${checked ? "enabled" : "disabled"}`,
      );
      dispatch(getBranchDataById({ id: params.id, page: 1 }));
    });
  };

  const toggleDisplayNotifications = (displayId, checked) => {
    const displays = branchSlice.formValue.display?.results || branchSlice.formValue.display || [];
    const isSingleDisplay = displays.length === 1;

    axiosClient
      .patch(`display/display/${displayId}/`, {
        notifications_enabled: checked,
      })
      .then(() => {
        if (isSingleDisplay) {
          const branchData = branchSlice.formValue;
          dispatch(
            updateBranchData({
              id: branchData.id,
              name: branchData.name,
              description: branchData.description,
              timezone: branchData.timezone,
              notifications_enabled: checked,
            }),
          ).then(() => {
            message.success(
              `Notifications ${checked ? "enabled" : "disabled"}`,
            );
            dispatch(getBranchDataById({ id: params.id, page: 1 }));
          });
        } else {
          message.success(
            `Display notifications ${checked ? "enabled" : "disabled"}`,
          );
          dispatch(getBranchDataById({ id: params.id, page: 1 }));
        }
      })
      .catch(() => {
        message.error("Failed to update display notifications");
      });
  };

  const deleteBranch = () => {
    dispatch(deleteBranchData(params.id));
    navigate(-1);
    toggleDeleteBranch();
  };

  const open = (username) => {
    window.open(`/branches/open-link/${username}`, "_blank");
  };

  const finish = (values) => {
    values["branch"] = branchSlice.formValue.id;
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateDisplayData(values));
    } else dispatch(postDisplayData(values));
  };
  const deleteDisplay = () => {
    dispatch(deleteDisplayData(deleteDisplayId));
  };
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new display successfully created");
          break;
        case "update":
          message.success("The display successfully updated");
          break;
        case "delete":
          message.success("The display successfully deleted");
          break;
      }
      dispatch(getBranchDataById({ id: params.id, page: 1 }));
      dispatch(resetDisplayState());
    }
  }, [requestStatus]);

  useEffect(() => {
    dispatch(getBranchDataById({ id: params.id, page: 1 }));
    dispatch(fetchDisplayTypeData({ page: 1 }));
    dispatch(fetchBranchData({ page: 1 }));
    dispatch(fetchPlayListData({ page: 1 }));
    dispatch(fetchScheduleData({ page: 1 }));
    dispatch(fetchDisplayGroupData({ page: 1 }));
  }, [params.id]);

  useEffect(() => {
    if (formValue.id) {
      if (formValue.playlist) setChoice("1");
      else if (formValue.schedule) setChoice("2");
      else if (formValue.display_group) setChoice("3");
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);

  useEffect(() => {
    if (branchSlice.formValue.id) {
      dispatch(resetBranchState());
    }
  }, [branchSlice.formValue]);
  /*check if the playlist name and other keys are exist*/
  useEffect(() => {
    if (postError) {
      form.setFields(postError);
    }
  }, [postError]);

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => index + 1,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Display type",
      dataIndex: "display_type",
      key: "display_type",
      render: (text) => {
        return (
          !displayTypeSlice.isLoading &&
          displayTypeSlice.data.find((item) => item.id === text)?.name
        );
      },
    },

    {
      title: "Playlist",
      dataIndex: "playlist",
      key: "playlist",
      render: (text) => {
        return (
          !playListSlice.isLoading &&
          playListSlice.data.find((item) => item.id === text)?.name
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
          scheduleSlice.data.find((item) => item.id === Number(text))?.name
        );
      },
    },
    {
      title: "Group",
      dataIndex: "display_group",
      key: "display_group",
      render: (text) => {
        return (
          !displayGroupSlice.isLoading &&
          displayGroupSlice.data.find((item) => item.id === Number(text))?.name
        );
      },
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (text) => {
        return (
          !branchSlice.isLoading &&
          branchSlice.data.find((item) => item.id === text)?.name
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Notifications",
      dataIndex: "notifications_enabled",
      key: "notifications_enabled",
      render: (value, row) => (
        <Tooltip title={value ? "Notifications enabled" : "Notifications disabled"}>
          <Switch
            size="small"
            checked={value}
            onChange={(checked) => toggleDisplayNotifications(row.id, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      dataIndex: "action",
      key: "action",
      render: (text, row) => (
        <div className="d-flex justify-content-start">
          <Button type={"default"} onClick={() => open(row.username)}>
            Open
          </Button>
          <Button
            onClick={() => dispatch(getDisplayDataById(row.id))}
            type={"primary"}
            className="mx-2"
          >
            Edit
          </Button>
          <Button onClick={() => toggleDelete(row.id)} type={"danger"}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center bg-header mb-4">
        <div>
          <a onClick={changeRoute}>
            <img
              className="mx-2"
              src={arrowLeft}
              style={{ width: "15px" }}
              align={"arrow-left"}
            />
          </a>
          {branchSlice.formValue?.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button onClick={toggleDeleteBranch} type="danger">
            Delete Branch
          </Button>
        </div>
      </div>
      <SubHeader
        title={"Branch displays"}
        button_title={"Create display"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*<Table loading={branchSlice.isLoading} columns={columns}*/}
      {/*       dataSource={branchSlice.formValue.display?.results && branchSlice.formValue.display.results.map(item => {*/}
      {/*           return {...item, key: item.id}*/}
      {/*       })}/>*/}

      {branchSlice.formValue.display && (
        <CustomDataTable
          data={
            branchSlice.formValue.display?.results &&
            branchSlice.formValue.display.results.map((item) => {
              return { ...item, key: item.id };
            })
          }
          isLoading={branchSlice.isLoading}
          columns={columns}
          action={getBranchDataById}
          id={params.id}
          count={branchSlice.formValue.display.count}
          current={branchSlice.current_page_display}
          extraFilter={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 10 }}>
              <span style={{ fontSize: 13, color: "#555" }}>All notifications:</span>
              <Switch
                checked={branchSlice.formValue?.notifications_enabled}
                onChange={toggleBranchNotifications}
                checkedChildren="On"
                unCheckedChildren="Off"
              />
            </span>
          }
        />
      )}

      {/*Edit and create modal for display*/}
      <AuthModal
        title={formValue.name ? `Edit ${formValue.name}` : "Create new display"}
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Display name"
            name="name"
            rules={[{ required: true, message: "Display name is required!" }]}
          >
            <Input placeholder="Enter display name" />
          </Form.Item>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username name is required!" }]}
          >
            <Input placeholder="Enter username name" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required!" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item
            label={"Display type"}
            name={"display_type"}
            rules={[{ required: true, message: "Display type is required!" }]}
          >
            <Select placeholder="Select display type">
              {displayTypeSlice.data.map((item, index) => (
                <Select.Option key={index} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Radio.Group
            onChange={toggleSetRadio}
            value={choice}
            style={{ marginBottom: "5px" }}
          >
            <Radio value={"1"}>Playlist</Radio>
            <Radio value={"2"}>Schedule</Radio>
            <Radio value={"3"}>Group</Radio>
          </Radio.Group>
          {choice === "1" ? (
            <Form.Item
              // label={"Playlist"}
              name={"playlist"}
              rules={[{ required: true, message: "Playlist is required!" }]}
            >
              <Select placeholder="Select playlist">
                {playListSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : choice === "2" ? (
            <Form.Item
              // label={"Schedule"}
              name={"schedule"}
              rules={[{ required: true, message: "Schedule is required!" }]}
            >
              <Select placeholder="Select schedule">
                {scheduleSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item
              // label={"Display type"}
              name={"display_group"}
              rules={[{ required: true, message: "Display type is required!" }]}
            >
              <Select placeholder="Select display group">
                {displayGroupSlice.data.map((item, index) => (
                  <Select.Option key={index} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/*<Form.Item*/}
          {/*    label={"Branch"}*/}
          {/*    name={"branch"}*/}
          {/*    rules={[{required: true, message: 'Branch is required!'}]}>*/}
          {/*    <Select placeholder="Select branch">*/}
          {/*        {*/}
          {/*            branchSlice.data.map((item, index) => <Select.Option*/}
          {/*                key={index}*/}
          {/*                value={item.id}>{item.name}</Select.Option>)*/}
          {/*        }*/}
          {/*    </Select>*/}
          {/*</Form.Item>*/}
          <Form.Item label="Description" name="description">
            <Input placeholder="Enter description" />
          </Form.Item>

          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleEdit}>
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
        isOpen={isOpenDeleteBranch}
        cancel={toggleDeleteBranch}
        // save={deleteDisplaytype}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <div className="d-flex justify-content-end">
          <Button
            type="text"
            htmlType="button"
            onClick={() => toggleDeleteBranch()}
          >
            Cancel
          </Button>
          <Button onClick={deleteBranch} type="danger" htmlType="submit">
            Save
          </Button>
        </div>
      </AuthModal>

      {/*delete modal for display*/}
      <AuthModal
        title="Are you sure?"
        isOpen={isOpenDeleteModal}
        cancel={() => toggleDelete()}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <Divider />
        <div className="d-flex justify-content-end">
          <Button type="text" htmlType="button" onClick={() => toggleDelete()}>
            Cancel
          </Button>
          <Button
            onClick={deleteDisplay}
            loading={deleteDataLoading}
            type="danger"
            htmlType="submit"
          >
            Delete
          </Button>
        </div>
      </AuthModal>
    </div>
  );
};
export default BranchManage;
