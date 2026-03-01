import React, { useEffect } from "react";
import { Button, Form, Input, Switch, Dropdown, Menu, message, Popconfirm } from "antd";
import { SubHeader } from "../../SubComponents/SubHeader";
import { AuthModal } from "../../SubComponents/AuthModal";
import CustomDataTable from "../../consts/CustomDataTable";
import { useDispatch, useSelector } from "react-redux";
import { pageSize } from "../../../helpers";
import tableAction from "../../../assets/images/table-action.svg";
import {
  fetchEmailTemplates,
  postEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  toggleTemplateModal,
  setTemplateFormValue,
  resetNotificationStatus,
} from "../../store/features/notificationSlice";

const { TextArea } = Input;

export const EmailTemplates = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const {
    templates,
    templatesLoading,
    templatesCount,
    templatesCurrent,
    templateFormValue,
    isOpenTemplateModal,
    templatePostLoading,
    templatePostError,
    templateRequestStatus,
  } = useSelector((state) => state.notificationSlice);

  useEffect(() => {
    dispatch(fetchEmailTemplates({ page: 1, search: "" }));
  }, [dispatch]);

  useEffect(() => {
    if (templateRequestStatus) {
      switch (templateRequestStatus) {
        case "post":
          message.success("Template created successfully");
          break;
        case "update":
          message.success("Template updated successfully");
          break;
        case "delete":
          message.success("Template deleted successfully");
          break;
        default:
          break;
      }
      dispatch(fetchEmailTemplates({ page: 1, search: "" }));
      dispatch(resetNotificationStatus());
    }
  }, [templateRequestStatus, dispatch]);

  useEffect(() => {
    if (templateFormValue?.id) {
      form.setFieldsValue(templateFormValue);
    } else {
      form.resetFields();
    }
  }, [templateFormValue, form]);

  useEffect(() => {
    if (templatePostError) {
      const errors = Object.entries(templatePostError).map(([key, value]) => ({
        name: key,
        errors: Array.isArray(value) ? value : [value],
      }));
      form.setFields(errors);
    }
  }, [templatePostError, form]);

  const toggleModal = () => dispatch(toggleTemplateModal());

  const onFinish = (values) => {
    if (templateFormValue?.id) {
      values.id = templateFormValue.id;
      dispatch(updateEmailTemplate(values));
    } else {
      dispatch(postEmailTemplate(values));
    }
  };

  const onEdit = (record) => {
    dispatch(setTemplateFormValue(record));
  };

  const onDelete = (id) => {
    dispatch(deleteEmailTemplate(id));
  };

  const columns = [
    {
      title: "#",
      render: (_, __, index) => (templatesCurrent - 1) * pageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Subject",
      dataIndex: "subject",
    },
    {
      title: "Default",
      dataIndex: "is_default",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit",
                onClick: () => onEdit(row),
              },
              {
                key: "delete",
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this template?"
                    onConfirm={() => onDelete(row.id)}
                    okText="Delete"
                    cancelText="Cancel"
                  >
                    <span style={{ color: "#ff4d4f" }}>Delete</span>
                  </Popconfirm>
                ),
              },
            ],
          }}
        >
          <Button type="text">
            <img src={tableAction} alt="actions" />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <SubHeader
        title="Email Templates"
        paragraph="Create and manage email templates for notifications"
        button_title="Create Template"
        toggle={toggleModal}
        isDisabled={templatesLoading}
      />

      <CustomDataTable
        data={templates.map((item, index) => ({ ...item, key: item.id || index }))}
        isLoading={templatesLoading}
        columns={columns}
        action={fetchEmailTemplates}
        count={templatesCount}
        current={templatesCurrent}
        pageSize={pageSize}
      />

      <AuthModal
        title={
          templateFormValue?.id
            ? `Edit "${templateFormValue.name}"`
            : "Create New Template"
        }
        isOpen={isOpenTemplateModal}
        cancel={toggleModal}
        isFooter="none"
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item
            label="Template Name"
            name="name"
            rules={[{ required: true, message: "Template name is required" }]}
          >
            <Input placeholder="e.g. Device Inactive Alert" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input placeholder="e.g. [Alert] {{device_name}} is inactive" />
          </Form.Item>

          <Form.Item
            label="Body"
            name="body"
            rules={[{ required: true, message: "Body is required" }]}
          >
            <TextArea
              rows={8}
              placeholder={
                "Available variables:\n{{device_name}} - Display name\n{{branch_name}} - Branch name\n{{status}} - Device status\n{{last_heartbeat}} - Last heartbeat time\n{{company_name}} - Company name"
              }
            />
          </Form.Item>

          <Form.Item
            label="Set as default template"
            name="is_default"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleModal}>
              Cancel
            </Button>
            <Button
              loading={templatePostLoading}
              type="primary"
              htmlType="submit"
            >
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>
    </div>
  );
};

export default EmailTemplates;
