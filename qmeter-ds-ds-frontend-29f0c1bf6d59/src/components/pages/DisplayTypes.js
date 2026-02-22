import React, { useCallback, useEffect, useMemo } from "react";
import { 
  Button, 
  Dropdown, 
  Form, 
  Input, 
  InputNumber, 
  message, 
  Table, 
  Select 
} from "antd";
import tableAction from "../../assets/images/table-action.svg";
import {
  deleteDisplayTypeData,
  fetchDisplayTypeData,
  getDisplayTypeDataById,
  postDisplayTypeData,
  toggleDeleteModal,
  toggleModal,
  updateDisplayTypeData,
} from "../store/features/displayTypeSlice";
import { AuthModal } from "../SubComponents/AuthModal";
import { useDispatch, useSelector } from "react-redux";
import { SubHeader } from "../SubComponents/SubHeader";
import CustomDataTable from "../consts/CustomDataTable";
import ConfirmDeleteModal from "../SubComponents/ConfirmDeleteModal";

export const DisplayTypes = () => {
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
    deleteDisplayTypeId,
    deleteDataLoading,
    postError,
  } = useSelector((state) => state.displayTypeSlice);

  const toggleEdit = useCallback(() => dispatch(toggleModal()), [dispatch]);
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id)), [dispatch]);

  const finish = useCallback((values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updateDisplayTypeData(values));
    } else dispatch(postDisplayTypeData(values));
  }, [formValue.id, dispatch]);
  const deleteDisplayType = useCallback(() =>
    dispatch(deleteDisplayTypeData(deleteDisplayTypeId)), [deleteDisplayTypeId, dispatch]);
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new display type successfully created");
          break;
        case "update":
          message.success("The display type successfully updated");
          break;
        case "delete":
          message.success("The display type successfully deleted");
          break;
      }
      dispatch(fetchDisplayTypeData({ page: 1 }));
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
  // useEffect(() => {
  //   dispatch(fetchDisplayTypeData({ page: 1 }));
  // }, []);
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
      title: "Width",
      dataIndex: "width",
      key: "width",
    },
    {
      title: "Height",
      dataIndex: "height",
      key: "height",
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
                label: (
                  <a onClick={() => dispatch(getDisplayTypeDataById(row.id))}>
                    Edit
                  </a>
                ),
                key: "0",
              },
              {
                label: <a onClick={() => toggleDelete(row.id)}>Delete</a>,
                key: "1",
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
        title={"Display types"}
        paragraph={"You can manage display types from this section"}
        button_title={"New display type"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />

      {/*Data Table*/}
      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchDisplayTypeData}
        count={count}
        current={current_page}
      />

      {/*create and edit modal*/}
      <AuthModal
        title={
          formValue.name ? `Edit ${formValue.name}` : "Create new display type"
        }
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="Display type name"
            name="name"
            rules={[{ required: true, message: "Display name required!" }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            label="Width"
            name="width"
            rules={[{ required: true, message: "Dipslay width required!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="width"
            />
          </Form.Item>
          <Form.Item
            label="Height"
            name="height"
            rules={[{ required: true, message: "Dipslay height required!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="height"
            />
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
