import { DisplayTypes } from "../pages/DisplayTypes";
import { DisplayGroups } from "../pages/DisplayGroups";
import { Branches } from "../pages/Branches/Branches";
import { Schedules } from "../pages/Schedule/Schedules";
import { Users } from "../pages/Users";
import { PlayLists } from "../pages/Playlists/PlayLists";
import PlaylistEditor from "../pages/Playlists/PlaylistEditor";
import { Roles } from "../pages/Roles";
import BranchManage from "../pages/Branches/BranchManage";
import ManageSchedule from "../pages/Schedule/ManageSchedule";
import { DeviceStatus } from "../pages/DeviceStatus/DeviceStatus";
import DeviceStatusView from "../pages/DeviceStatus/DeviceStatusView";
import { EmailConfig } from "../pages/Settings/EmailConfig";
import { EmailTemplates } from "../pages/Settings/EmailTemplates";
import { RecipientLists } from "../pages/Settings/RecipientLists";
import { NotificationSettings } from "../pages/Settings/NotificationSettings";

export const routes = {
  admin: [
    {
      path: "/",
      element: <DisplayTypes />,
      permission: "display_tpyes_management",
    },
    {
      path: "/display-groups",
      element: <DisplayGroups />,
      permission: "display_group_management",
    },
    {
      path: "/branches",
      children: [
        {
          path: "/branches",
          element: <Branches />,
        },
        {
          path: "/branches/:id",
          element: <BranchManage />,
        },
      ],
      permission: "branch_management",
    },
    {
      path: "/schedules",
      children: [
        {
          path: "/schedules",
          element: <Schedules />,
        },
        {
          path: "/schedules/:id",
          element: <ManageSchedule />,
        },
      ],
      permission: "schedule_management",
    },
    {
      path: "/device-status",
      children: [
        {
          path: "/device-status",
          element: <DeviceStatus />,
        },
        {
          path: "/device-status/:id",
          element: <DeviceStatusView />,
        },
      ],
      permission: "device_status_management",
    },
    {
      path: "/user",
      element: <Users />,
      permission: "user_management",
    },
    {
      path: "/roles",
      element: <Roles />,
      permission: "user_management",
    },
    // {
    //     path: "/my-company",
    //     element: <MyCompany/>,
    // },
    {
      path: "/playlists",
      children: [
        {
          path: "/playlists",
          element: <PlayLists />,
        },
        {
          path: "/playlists/:id",
          element: <PlaylistEditor />,
        },
        // {
        //     path: "/playlists/preview/:id",
        //     element: <Preview/>
        // }
      ],
      permission: "playlist_management",
    },
    {
      path: "/settings",
      children: [
        {
          path: "/settings/email-config",
          element: <EmailConfig />,
        },
        {
          path: "/settings/email-templates",
          element: <EmailTemplates />,
        },
        {
          path: "/settings/recipient-lists",
          element: <RecipientLists />,
        },
        {
          path: "/settings/device-alerts",
          element: <NotificationSettings />,
        },
      ],
      permission: "settings_management",
    },
  ],
};
