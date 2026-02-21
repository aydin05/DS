import React, { useState } from "react";
import { Tabs } from "antd";
import { MailOutlined, FileTextOutlined, TeamOutlined, AlertOutlined } from "@ant-design/icons";
import EmailConfig from "./EmailConfig";
import EmailTemplates from "./EmailTemplates";
import RecipientLists from "./RecipientLists";
import NotificationSettings from "./NotificationSettings";

const tabItems = [
  {
    key: "email-config",
    label: <span><MailOutlined style={{ marginRight: 8 }} />Email Config</span>,
    children: <EmailConfig />,
  },
  {
    key: "email-templates",
    label: <span><FileTextOutlined style={{ marginRight: 8 }} />Email Templates</span>,
    children: <EmailTemplates />,
  },
  {
    key: "recipient-lists",
    label: <span><TeamOutlined style={{ marginRight: 8 }} />Recipient Lists</span>,
    children: <RecipientLists />,
  },
  {
    key: "device-alerts",
    label: <span><AlertOutlined style={{ marginRight: 8 }} />Device Alerts</span>,
    children: <NotificationSettings />,
  },
];

export const EmailSettings = () => {
  const [activeKey, setActiveKey] = useState("email-config");

  return (
    <div style={{ padding: "20px" }}>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        type="card"
        items={tabItems}
      />
    </div>
  );
};

export default EmailSettings;
