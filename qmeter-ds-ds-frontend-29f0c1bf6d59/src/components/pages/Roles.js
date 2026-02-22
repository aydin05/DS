import React, { useCallback, useEffect, useMemo } from "react";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  message,
  Row,
  Spin,
  Select,
} from "antd";
import tableAction from "../../assets/images/table-action.svg";
import { SubHeader } from "../SubComponents/SubHeader";
import { AuthModal } from "../SubComponents/AuthModal";
import ConfirmDeleteModal from "../SubComponents/ConfirmDeleteModal";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteRoleData,
  fetchCoreGroups,
  fetchRoleData,
  getRoleDataById,
  postRoleData,
  toggleDeleteModal,
  toggleModal,
  updateRoleData,
} from "../store/features/roleSlice";
import CustomDataTable from "../consts/CustomDataTable";

export const Roles = () => {
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
    deletedRoleId,
    deleteDataLoading,
    isLoadingCoreGroup,
    core_group_data,
    postError,
  } = useSelector((state) => state.roleSlice);

  /*component states*/

  /*component actions*/
  const toggleEdit = useCallback(() => dispatch(toggleModal()), [dispatch]);
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id)), [dispatch]);

  const finish = useCallback((values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateRoleData(values));
    } else dispatch(postRoleData(values));
  }, [formValue.id, dispatch]);
  const deleteRole = useCallback(() => dispatch(deleteRoleData(deletedRoleId)), [deletedRoleId, dispatch]);
  /*side effects*/
  useEffect(() => {
    // dispatch(fetchRoleData({ page: 1 }));
    dispatch(fetchCoreGroups());
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
          message.success("The new role successfully created");
          break;
        case "update":
          message.success("The role successfully updated");
          break;
        case "delete":
          message.success("The role successfully deleted");
          break;
      }
      dispatch(fetchRoleData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (formValue.id) {
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);
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
                onClick: () => dispatch(getRoleDataById(row.id)),
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
  ], [dispatch, toggleDelete]);
  return (
    <div>
      <SubHeader
        title={"Roles"}
        paragraph={"You can manage roles from this section"}
        button_title={"New role"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*Data Table*/}

      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchRoleData}
        count={count}
        current={current_page}
      />

      {/*create and edit modal*/}
      <AuthModal
        title={formValue.name ? `Edit ${formValue.name}` : "Create new role"}
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Role name"
            name="name"
            rules={[{ required: true, message: "Role name is required!" }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role modules"
            rules={[
              {
                required: true,
                message: "At least one role module must be selected!",
              },
            ]}
          >
            <Checkbox.Group>
              <Row type={"flex"} align={"middle"}>
                {!isLoadingCoreGroup ? (
                  core_group_data.map((item, index) => (
                    <Col key={index} span={12}>
                      {" "}
                      <Checkbox
                        value={item.id}
                        style={{
                          lineHeight: "32px",
                        }}
                      >
                        {item.name}
                      </Checkbox>
                    </Col>
                  ))
                ) : (
                  <Row type={"flex"} align={"middle"}>
                    {" "}
                    <Col>
                      <Spin />
                    </Col>
                  </Row>
                )}
              </Row>
            </Checkbox.Group>
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
