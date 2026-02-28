import { Layout, Menu } from "antd";
import React, { useMemo } from "react";
import logo from "../../assets/images/qmeter-logo.svg";
import logoResponsive from "../../assets/images/qmeter-logo.svg";
import { NavLink, useParams } from "react-router-dom";
import { links } from "../routing/links";
import { extractPermissionCodes, hasPermission } from "../../helpers";
import Cookies from "js-cookie";

const { Sider } = Layout;
export const Sidebar = ({ collapsed }) => {
  const params = useParams();
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    user = {};
  }
  const userPermissions = extractPermissionCodes(user);

  const filteredLinks = links.admin.filter((item) =>
    hasPermission(userPermissions, item.permission),
  );

  const menuItems = useMemo(() =>
    filteredLinks.map((item) =>
      item.children
        ? {
            key: item.to + "_submenu",
            label: (
              <span>
                <img style={{ width: 20 }} src={item.icon} alt="" />
                <span style={{ marginLeft: 26 }}>{item.title}</span>
              </span>
            ),
            children: item.children.map((child) => ({
              key: child.to,
              label: <NavLink to={child.to}>{child.title}</NavLink>,
            })),
          }
        : {
            key: item.to,
            label: (
              <NavLink to={item.to}>
                <img style={{ width: 20 }} src={item.icon} alt="" />
                <span style={{ marginLeft: 26 }}>{item.title}</span>
              </NavLink>
            ),
          },
    ),
  [filteredLinks]);

  return (
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div className="logo">
        <img src={collapsed ? logoResponsive : logo} alt={"logo"} />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={["/" + params["*"]]}
        defaultOpenKeys={filteredLinks
          .filter((item) => item.children && ("/" + params["*"]).startsWith(item.to))
          .map((item) => item.to + "_submenu")}
        items={menuItems}
      />
    </Sider>
  );
};
