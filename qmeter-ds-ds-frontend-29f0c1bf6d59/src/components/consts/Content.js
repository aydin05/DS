import React, { useMemo } from "react";
import { Layout, Avatar, Tooltip, Button } from "antd";
import { routes } from "../routing/routes";
import { Route, Routes, Navigate } from "react-router-dom";
import menubar from "../../assets/images/menubar.svg";
import { logOut } from "../store/features/loginSlice";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import NoMatch from "./NoMatch";
import { UserOutlined } from "@ant-design/icons";
import { extractPermissionCodes, hasPermission } from "../../helpers";

const { Content } = Layout;

export const ContentApp = ({ toggle }) => {
  const user = JSON.parse(Cookies.get("user"));
  const dispatch = useDispatch();
  const userPermissions = extractPermissionCodes(user);

  const logout = () => {
    dispatch(logOut());
  };

  const RequirePermission = ({ permission, children }) => {
    if (permission && !hasPermission(userPermissions, permission)) {
      return <NoMatch />;
    }
    return children;
  };

  const firstAllowedPath = useMemo(() => {
    for (const route of routes.admin) {
      if (hasPermission(userPermissions, route.permission)) {
        if (route.children && route.children.length > 0) {
          return route.children[0].path;
        }
        return route.path;
      }
    }
    return null;
  }, [userPermissions]);

  return (
    <Content className="content" style={{ minHeight: "100vh" }}>
      <div className="header">
        <a onClick={toggle}>
          <img src={menubar} alt="menubar" />
        </a>
        <div className="profile">
          <div>
            <h4>{user.fullname}</h4>
            <h5>{user.email}</h5>
          </div>
          <Tooltip
            placement="topLeft"
            title={
              <div>
                <Button onClick={logout}>Log out</Button>
              </div>
            }
            color="white"
          >
            <Avatar size="large" icon={<UserOutlined />} />
          </Tooltip>
        </div>
      </div>

      <div className="content-app">
        <Routes>
          <Route
            path="/"
            element={
              hasPermission(userPermissions, "display_tpyes_management") ? (
                <RequirePermission permission="display_tpyes_management">
                  {routes.admin.find((r) => r.path === "/").element}
                </RequirePermission>
              ) : (
                <Navigate to={firstAllowedPath || "/404"} replace />
              )
            }
          />

          {routes.admin.map((item, i) => {
            if (item.children) {
              return (
                <Route path={item.path} key={i}>
                  {item.children.map((child, x) => (
                    <Route
                      key={x}
                      path={child.path}
                      element={
                        <RequirePermission permission={item.permission}>
                          {child.element}
                        </RequirePermission>
                      }
                    />
                  ))}
                </Route>
              );
            }

            if (item.path === "/") return null;

            return (
              <Route
                key={i}
                path={item.path}
                element={
                  <RequirePermission permission={item.permission}>
                    {item.element}
                  </RequirePermission>
                }
              />
            );
          })}

          <Route path="*" element={<NoMatch />} />
        </Routes>
      </div>
    </Content>
  );
};
