import React, { useEffect } from "react";
import { Form, Input, InputNumber, Switch, Button, message, Spin } from "antd";
import { SubHeader } from "../../SubComponents/SubHeader";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmailConfig,
  saveEmailConfig,
  testEmailConfig,
} from "../../store/features/notificationSlice";

export const EmailConfig = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { emailConfig, emailConfigLoading } = useSelector(
    (state) => state.notificationSlice,
  );

  useEffect(() => {
    dispatch(fetchEmailConfig());
  }, [dispatch]);

  useEffect(() => {
    if (emailConfig) {
      form.setFieldsValue(emailConfig);
    }
  }, [emailConfig, form]);

  const onFinish = (values) => {
    if (emailConfig?.id) {
      values.id = emailConfig.id;
    }
    dispatch(saveEmailConfig(values)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Email configuration saved successfully");
      } else {
        message.error("Failed to save email configuration");
      }
    });
  };

  const onTest = () => {
    if (!emailConfig?.id) {
      message.warning("Please save the configuration first");
      return;
    }
    dispatch(testEmailConfig(emailConfig.id)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success(res.payload?.status || "Test email sent! Check your inbox.");
      } else {
        message.error(
          res.payload?.error || "Failed to send test email",
        );
      }
    });
  };

  return (
    <div>
      <SubHeader
        title="Email Settings"
        paragraph="Configure SMTP settings for sending email notifications"
        isDisabled={emailConfigLoading}
      />
      <Spin spinning={emailConfigLoading}>
        <div style={{ maxWidth: 600, padding: "20px" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              host: "smtp.office365.com",
              port: 587,
              use_tls: true,
              is_active: true,
              from_name: "Digital Signage",
            }}
          >
            <Form.Item
              label="SMTP Host"
              name="host"
              rules={[{ required: true, message: "SMTP host is required" }]}
            >
              <Input placeholder="smtp.office365.com" />
            </Form.Item>

            <Form.Item
              label="SMTP Port"
              name="port"
              rules={[{ required: true, message: "SMTP port is required" }]}
            >
              <InputNumber
                placeholder="587"
                min={1}
                max={65535}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="username"
              rules={[
                { required: true, message: "Email address is required" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="your-email@outlook.com" />
            </Form.Item>

            <Form.Item
              label="Email Password"
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password placeholder="Your email password" />
            </Form.Item>

            <Form.Item
              label="From Name"
              name="from_name"
            >
              <Input placeholder="Digital Signage" />
            </Form.Item>

            <Form.Item
              label="Use TLS"
              name="use_tls"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Active"
              name="is_active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button type="primary" htmlType="submit" loading={emailConfigLoading}>
                Save
              </Button>
              <Button onClick={onTest} disabled={!emailConfig?.id}>
                Send Test Email
              </Button>
            </div>
          </Form>
        </div>
      </Spin>
    </div>
  );
};

export default EmailConfig;
