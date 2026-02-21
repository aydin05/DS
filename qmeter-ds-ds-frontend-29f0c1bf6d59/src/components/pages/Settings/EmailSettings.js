import React, { useState } from "react";
import { Tabs } from "antd";
import { MailOutlined, FileTextOutlined, TeamOutlined, AlertOutlined } from "@ant-design/icons";
import { EmailConfig } from "./EmailConfig";
import { EmailTemplates } from "./EmailTemplates";
import { RecipientLists } from "./RecipientLists";
import { NotificationSettings } from "./NotificationSettings";

const items = [
  {
    key: "email-config",
    label: (
      <span>
        <MailOutlined />
        Email Config
      </span>
    ),
    children: <EmailConfig />,
  },
  {
    key: "email-templates",
    label: (
      <span>
        <FileTextOutlined />
        Email Templates
      </span>
    ),
    children: <EmailTemplates />,
  },
  {
    key: "recipient-lists",
    label: (
      <span>
        <TeamOutlined />
        Recipient Lists
      </span>
    ),
    children: <RecipientLists />,
  },
  {
    key: "device-alerts",
    label: (
      <span>
        <AlertOutlined />
        Device Alerts
      </span>
    ),
    children: <NotificationSettings />,
  },
];

export const EmailSettings = () => {
  const [activeKey, setActiveKey] = useState("email-config");

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={items}
        type="card"
        style={{ padding: "0 20px" }}
      />
    </div>
  );
};

export default EmailSettings;
