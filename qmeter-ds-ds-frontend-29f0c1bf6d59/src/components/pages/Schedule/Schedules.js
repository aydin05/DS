import React, { useCallback, useEffect, useMemo } from "react";
import { Button, Dropdown, Form, Input, message, TreeSelect } from "antd";
import tableAction from "../../../assets/images/table-action.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { AuthModal } from "../../SubComponents/AuthModal";
import ConfirmDeleteModal from "../../SubComponents/ConfirmDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteScheduleData,
  fetchScheduleData,
  getScheduleDataById,
  postScheduleData,
  resetStatus,
  toggleDeleteModal,
  toggleModal,
  updateScheduleData,
} from "../../store/features/scheduleSlice";
import { fetchBranchData } from "../../store/features/branchSlice";
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
  const branchSlice = useSelector((state) => state.branchSlice);
  /*component states*/
  const branchDisplayTree = useMemo(() => {
    return branchSlice.data.map((branch) => ({
      title: branch.name,
      value: `branch-${branch.id}`,
      key: `branch-${branch.id}`,
      selectable: false,
      children: (branch.display || []).map((d) => ({
        title: d.name,
        value: d.id,
        key: d.id,
      })),
    }));
  }, [branchSlice.data]);

  /*component actions*/
  const toggleEdit = useCallback(() => dispatch(toggleModal()), [dispatch]);
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id !== null ? { open: true, id } : { open: false, id: null })), [dispatch]);

  const finish = useCallback((values) => {
    const { display_ids: rawIds, ...rest } = values;
    const display_ids = (rawIds || []).filter((v) => typeof v === 'number');
    const payload = { ...rest, display_ids };
    if (formValue.id) {
      payload.id = formValue.id;
      dispatch(updateScheduleData(payload));
    } else dispatch(postScheduleData(payload));
  }, [formValue.id, dispatch]);
  const deleteRole = useCallback(() => dispatch(deleteScheduleData(deleteScheduleId)), [deleteScheduleId, dispatch]);
  /*side effects*/
  useEffect(() => {
    dispatch(fetchScheduleData({ page: 1 }));
    dispatch(fetchBranchData({ page: 1 }));
    return () => {
      dispatch(resetStatus());
    };
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
      const displayIds = (formValue.assigned_displays || []).map((d) => d.id);
      form.setFieldsValue({ ...formValue, display_ids: displayIds });
    } else {
      form.resetFields();
    }
  }, [formValue]);
  const columns = useMemo(() => [
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
      title: "Assigned Displays",
      dataIndex: "assigned_displays",
      key: "assigned_displays",
      render: (displays) => {
        if (!displays || displays.length === 0) return "-";
        return displays
          .map((d) => `${d.branch_name || "No branch"} / ${d.name}`)
          .join(", ");
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
                label: "Manage",
                key: "0",
                onClick: () => navigate("/schedules/" + row.id),
              },
              {
                label: "Edit",
                key: "1",
                onClick: () => dispatch(getScheduleDataById({ id: row.id })),
              },
              {
                label: "Delete",
                key: "2",
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
  ], [dispatch, toggleDelete, navigate, branchSlice.data]);

  const action = useCallback((page) => dispatch(fetchScheduleData({ page })), [dispatch]);

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
        isLoading={isLoading}
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
            label={"Assign to Displays"}
            name={"display_ids"}
          >
            <TreeSelect
              treeData={branchDisplayTree}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              placeholder="Select branch / displays"
              allowClear
              treeDefaultExpandAll
              filterTreeNode={(input, node) =>
                node.title.toLowerCase().includes(input.toLowerCase())
              }
              disabled={branchSlice.isLoading}
              style={{ width: "100%" }}
            />
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

      <ConfirmDeleteModal
        isOpen={isOpenDeleteModal}
        onCancel={() => toggleDelete()}
        onConfirm={deleteRole}
        loading={deleteDataLoading}
      />
    </div>
  );
};
