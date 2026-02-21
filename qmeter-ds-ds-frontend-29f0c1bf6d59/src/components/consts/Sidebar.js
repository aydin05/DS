import { Layout, Menu } from "antd";
import React from "react";
import logo from "../../assets/images/qmeter-logo.svg";
import logoResponsive from "../../assets/images/qmeter-logo.svg";
import { NavLink, useParams } from "react-router-dom";
import { links } from "../routing/links";
import { extractPermissionCodes, hasPermission } from "../../helpers";
import Cookies from "js-cookie";

const { SubMenu } = Menu;
const { Sider } = Layout;
export const Sidebar = ({ collapsed }) => {
  const params = useParams();
  const user = JSON.parse(Cookies.get("user"));
  const userPermissions = extractPermissionCodes(user);

  const filteredLinks = links.admin.filter((item) =>
    hasPermission(userPermissions, item.permission),
  );

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
      >
        {filteredLinks?.map((item) =>
          item.children ? (
            <SubMenu
              key={item.to + "_submenu"}
              title={
                <span>
                  <img style={{ width: 20 }} src={item.icon} alt="" />
                  <span style={{ marginLeft: 26 }}>{item.title}</span>
                </span>
              }
            >
              {item.children.map((child) => (
                <Menu.Item key={child.to}>
                  <NavLink to={child.to}>{child.title}</NavLink>
                </Menu.Item>
              ))}
            </SubMenu>
          ) : (
            <Menu.Item key={item.to}>
              <img style={{ width: 20 }} src={item.icon} alt="" />
              <NavLink to={item.to}>
                <span style={{ marginLeft: 26 }}>{item.title}</span>
              </NavLink>
            </Menu.Item>
          ),
        )}
      </Menu>
    </Sider>
  );
};
