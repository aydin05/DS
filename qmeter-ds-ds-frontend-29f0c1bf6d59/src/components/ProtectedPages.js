import React, { useState } from "react";
import { Layout } from "antd";
import { Sidebar } from "./consts/Sidebar";
import { ContentApp } from "./consts/Content";

const ProtectedPages = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(!collapsed);
  return (
    <Layout>
      <Sidebar collapsed={collapsed} />
      <Layout className="site-layout">
        <ContentApp toggle={toggle} />
      </Layout>
    </Layout>
  );
};

export default ProtectedPages;
