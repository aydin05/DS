import React, { useCallback, useEffect, useMemo } from "react";
import {
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  message,
  Select,
} from "antd";
import tableAction from "../../../assets/images/table-action.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { AuthModal } from "../../SubComponents/AuthModal";
import ConfirmDeleteModal from "../../SubComponents/ConfirmDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteBranchData,
  fetchBranchData,
  getBranchDataById,
  postBranchData,
  toggleDeleteModal,
  toggleModal,
  updateBranchData,
} from "../../store/features/branchSlice";
import axiosClient from "../../../config";
import { timeZones } from "../../../staticData";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../consts/CustomDataTable";
import { pageSize } from "../../../helpers";

export const Branches = () => {
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
    requestStatus,
    postDataLoading,
    deleteDataLoading,
    deletedBranchId,
    postError,
  } = useSelector((state) => state.branchSlice);

  /*component states*/

  /*component actions*/
  const toggleEdit = useCallback(() => dispatch(toggleModal()), [dispatch]);
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id !== null ? { open: true, id } : { open: false, id: null })), [dispatch]);

  const finish = useCallback((values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateBranchData(values));
    } else dispatch(postBranchData(values));
  }, [formValue.id, dispatch]);
  const deleteBranch = useCallback(() => dispatch(deleteBranchData(deletedBranchId)), [deletedBranchId, dispatch]);
  /*side effects*/
  // useEffect(() => {
  //   dispatch(fetchBranchData({ page: 1 }));
  // }, []);
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new branch successfully created");
          break;
        case "update":
          message.success("The branch successfully updated");
          break;
        case "delete":
          message.success("The branch successfully deleted");
          break;
      }
      dispatch(fetchBranchData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (formValue.id) {
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);
  useEffect(() => {
    if (postError) {
      form.setFields(postError);
    }
  }, [postError]);

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
      title: "Timezone",
      dataIndex: "timezone",
      key: "timezone",
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
                onClick: () => navigate(`/branches/${row.id}`),
              },
              {
                label: "Edit",
                key: "1",
                onClick: () => dispatch(getBranchDataById({ id: row.id })),
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
  ], [dispatch, toggleDelete, navigate]);
  return (
    <div>
      <SubHeader
        title={"Branches"}
        paragraph={"You can manage branches from this section"}
        button_title={"New branch"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*Data Table*/}
      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchBranchData}
        count={count}
        current={current_page}
        pageSize={pageSize}
      />
      {/*create and edit modal*/}
      <AuthModal
        title={formValue.name ? `Edit ${formValue.name}` : "Create new branch"}
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Branch name"
            name="name"
            rules={[{ required: true, message: "Branch name is required!" }]}
          >
            <Input placeholder="Enter branch name" />
          </Form.Item>
          <Form.Item
            label={"Time zone"}
            name={"timezone"}
            rules={[{ required: true, message: "Time zone is required!" }]}
          >
            <Select
              placeholder="Select timezone"
              showSearch
              allowClear
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {timeZones.map((item, index) => (
                <Select.Option key={index} value={item.value}>
                  {item.title}
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

      <ConfirmDeleteModal
        isOpen={isOpenDeleteModal}
        onCancel={() => toggleDelete()}
        onConfirm={deleteBranch}
        loading={deleteDataLoading}
      />
    </div>
  );
};
