import React, { useState } from "react";
import { Tabs } from "antd";
import { MailOutlined, FileTextOutlined, TeamOutlined, AlertOutlined } from "@ant-design/icons";
import EmailConfig from "./EmailConfig";
import EmailTemplates from "./EmailTemplates";
import RecipientLists from "./RecipientLists";
import NotificationSettings from "./NotificationSettings";

const { TabPane } = Tabs;

export const EmailSettings = () => {
  const [activeKey, setActiveKey] = useState("email-config");

  return (
    <div style={{ padding: "20px" }}>
      <Tabs activeKey={activeKey} onChange={setActiveKey} type="card">
        <TabPane
          tab={<span><MailOutlined style={{ marginRight: 8 }} />Email Config</span>}
          key="email-config"
        >
          <EmailConfig />
        </TabPane>
        <TabPane
          tab={<span><FileTextOutlined style={{ marginRight: 8 }} />Email Templates</span>}
          key="email-templates"
        >
          <EmailTemplates />
        </TabPane>
        <TabPane
          tab={<span><TeamOutlined style={{ marginRight: 8 }} />Recipient Lists</span>}
          key="recipient-lists"
        >
          <RecipientLists />
        </TabPane>
        <TabPane
          tab={<span><AlertOutlined style={{ marginRight: 8 }} />Device Alerts</span>}
          key="device-alerts"
        >
          <NotificationSettings />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EmailSettings;
