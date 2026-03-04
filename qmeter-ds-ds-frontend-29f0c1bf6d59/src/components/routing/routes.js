import React, { lazy, Suspense } from "react";
import { Spin } from "antd";

// Retry dynamic import once then force-reload to pick up new chunks after deploy
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // Chunk missing after deploy — reload page once to get fresh index.html
      const key = "chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem(key);
      return importFn(); // second attempt — if still fails, let it crash normally
    })
  );
}

const DisplayTypes = lazyRetry(() => import("../pages/DisplayTypes").then((m) => ({ default: m.DisplayTypes })));
const DisplayGroups = lazyRetry(() => import("../pages/DisplayGroups").then((m) => ({ default: m.DisplayGroups })));
const Branches = lazyRetry(() => import("../pages/Branches/Branches").then((m) => ({ default: m.Branches })));
const BranchManage = lazyRetry(() => import("../pages/Branches/BranchManage"));
const Schedules = lazyRetry(() => import("../pages/Schedule/Schedules").then((m) => ({ default: m.Schedules })));
const ManageSchedule = lazyRetry(() => import("../pages/Schedule/ManageSchedule"));
const DeviceStatus = lazyRetry(() => import("../pages/DeviceStatus/DeviceStatus").then((m) => ({ default: m.DeviceStatus })));
const DeviceStatusView = lazyRetry(() => import("../pages/DeviceStatus/DeviceStatusView"));
const Users = lazyRetry(() => import("../pages/Users").then((m) => ({ default: m.Users })));
const Roles = lazyRetry(() => import("../pages/Roles").then((m) => ({ default: m.Roles })));
const PlayLists = lazyRetry(() => import("../pages/Playlists/PlayLists").then((m) => ({ default: m.PlayLists })));
const PlaylistEditor = lazyRetry(() => import("../pages/Playlists/PlaylistEditor"));
const EmailSettings = lazyRetry(() => import("../pages/Settings/EmailSettings").then((m) => ({ default: m.EmailSettings })));

const Fallback = (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

const wrap = (element) => <Suspense fallback={Fallback}>{element}</Suspense>;

export const routes = {
  admin: [
    {
      path: "/",
      element: wrap(<DisplayTypes />),
      permission: "display_tpyes_management",
    },
    {
      path: "/display-groups",
      element: wrap(<DisplayGroups />),
      permission: "display_group_management",
    },
    {
      path: "/branches",
      children: [
        {
          path: "/branches",
          element: wrap(<Branches />),
        },
        {
          path: "/branches/:id",
          element: wrap(<BranchManage />),
        },
      ],
      permission: "branch_management",
    },
    {
      path: "/schedules",
      children: [
        {
          path: "/schedules",
          element: wrap(<Schedules />),
        },
        {
          path: "/schedules/:id",
          element: wrap(<ManageSchedule />),
        },
      ],
      permission: "schedule_management",
    },
    {
      path: "/device-status",
      children: [
        {
          path: "/device-status",
          element: wrap(<DeviceStatus />),
        },
        {
          path: "/device-status/:id",
          element: wrap(<DeviceStatusView />),
        },
      ],
      permission: "device_status_management",
    },
    {
      path: "/user",
      element: wrap(<Users />),
      permission: "user_management",
    },
    {
      path: "/roles",
      element: wrap(<Roles />),
      permission: "user_management",
    },
    {
      path: "/playlists",
      children: [
        {
          path: "/playlists",
          element: wrap(<PlayLists />),
        },
        {
          path: "/playlists/:id",
          element: wrap(<PlaylistEditor />),
        },
      ],
      permission: "playlist_management",
    },
    {
      path: "/settings/email",
      element: wrap(<EmailSettings />),
      permission: "settings_management",
    },
  ],
};
