import React, { useEffect } from "react";
import { Form, Select, Switch, Button, message, Spin, Divider, Typography, List, Tag } from "antd";
import { SubHeader } from "../../SubComponents/SubHeader";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  fetchEmailTemplates,
} from "../../store/features/notificationSlice";
import {
  fetchBranchData,
  patchBranchNotification,
} from "../../store/features/branchSlice";

const { Text } = Typography;

export const NotificationSettings = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const {
    notificationSetting,
    notificationSettingLoading,
    templates,
  } = useSelector((state) => state.notificationSlice);
  const { data: branches, isLoading: branchesLoading } = useSelector((state) => state.branchSlice);

  useEffect(() => {
    dispatch(fetchNotificationSettings());
    dispatch(fetchEmailTemplates({ page: 1, search: "" }));
    dispatch(fetchBranchData({ page: 1, search: "" }));
  }, [dispatch]);

  const onBranchToggle = (branch, checked) => {
    dispatch(patchBranchNotification({ id: branch.id, notifications_enabled: checked })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success(`"${branch.name}" notifications ${checked ? "enabled" : "disabled"}`);
      } else {
        message.error("Failed to update branch");
      }
    });
  };

  useEffect(() => {
    if (notificationSetting) {
      form.setFieldsValue(notificationSetting);
    }
  }, [notificationSetting, form]);

  const onFinish = (values) => {
    if (notificationSetting?.id) {
      values.id = notificationSetting.id;
    }
    dispatch(saveNotificationSettings(values)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Device alert settings saved successfully");
      } else {
        message.error("Failed to save settings");
      }
    });
  };

  return (
    <div>
      <SubHeader
        title="Device Alerts"
        paragraph="Get email notifications when devices go offline or come back online"
        isDisabled={notificationSettingLoading}
      />
      <Spin spinning={notificationSettingLoading}>
        <div style={{ maxWidth: 600, padding: "20px" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              is_enabled: true,
              check_interval_seconds: 300,
            }}
          >
            <Form.Item
              label="Enable Device Alerts"
              name="is_enabled"
              valuePropName="checked"
              extra="Turn on/off automatic email alerts for device status changes"
            >
              <Switch />
            </Form.Item>

            <Divider orientation="left">Email templates</Divider>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              Choose separate email templates for when a device goes offline and when it comes back online.
              Create templates in Settings → Email Templates.
            </Text>

            <Form.Item
              label="Device Went Offline (Inactive)"
              name="inactive_template"
              rules={[
                { required: true, message: "Please select a template for inactive alerts" },
              ]}
              extra="This email is sent when a device stops responding"
            >
              <Select placeholder="Select template for offline notification">
                {templates.map((tpl) => (
                  <Select.Option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Device Came Back Online (Active)"
              name="active_template"
              extra="This email is sent when a previously offline device reconnects"
            >
              <Select placeholder="Select template for back-online notification" allowClear>
                {templates.map((tpl) => (
                  <Select.Option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Divider orientation="left">Check frequency</Divider>

            <Form.Item
              label="Check Interval"
              name="check_interval_seconds"
              rules={[
                { required: true, message: "Check interval is required" },
              ]}
              extra="How often the system checks device status and sends alerts"
            >
              <Select placeholder="Select check interval">
                <Select.Option value={30}>30 seconds</Select.Option>
                <Select.Option value={60}>1 minute</Select.Option>
                <Select.Option value={90}>1 minute 30 seconds</Select.Option>
                <Select.Option value={120}>2 minutes</Select.Option>
                <Select.Option value={150}>2 minutes 30 seconds</Select.Option>
                <Select.Option value={180}>3 minutes</Select.Option>
                <Select.Option value={210}>3 minutes 30 seconds</Select.Option>
                <Select.Option value={240}>4 minutes</Select.Option>
                <Select.Option value={270}>4 minutes 30 seconds</Select.Option>
                <Select.Option value={300}>5 minutes</Select.Option>
              </Select>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={notificationSettingLoading}
              style={{ marginTop: 8 }}
            >
              Save Settings
            </Button>
          </Form>

          <Divider orientation="left">Branch notifications</Divider>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Enable or disable email alerts per branch. Disabled branches will be ignored by the notification checker.
          </Text>
          <Spin spinning={branchesLoading}>
            <List
              bordered
              dataSource={branches}
              locale={{ emptyText: "No branches found" }}
              renderItem={(branch) => (
                <List.Item
                  actions={[
                    <Switch
                      checked={branch.notifications_enabled}
                      onChange={(checked) => onBranchToggle(branch, checked)}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={branch.name}
                    description={
                      branch.notifications_enabled
                        ? <Tag color="green">Receiving alerts</Tag>
                        : <Tag color="red">Alerts disabled</Tag>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        </div>
      </Spin>
    </div>
  );
};

export default NotificationSettings;
