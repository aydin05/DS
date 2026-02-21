import display from "../../assets/images/display.svg";
import displayGroup from "../../assets/images/display-group.svg";
import branch from "../../assets/images/branch.svg";
import schedules from "../../assets/images/calendar.svg";
import user from "../../assets/images/user.svg";
// import myCompany from "../../assets/images/company.svg";
import playLists from "../../assets/images/playlists.svg";
import deviceStatus from "../../assets/images/device-status.svg";
import settings from "../../assets/images/settings.svg";

export const links = {
  admin: [
    {
      to: "/",
      title: "Display types",
      icon: display,
      permission: "display_tpyes_management",
    },
    {
      to: "/display-groups",
      title: "Display group",
      icon: displayGroup,
      permission: "display_group_management",
    },

    {
      to: "/branches",
      title: "Branches",
      icon: branch,
      permission: "branch_management",
    },
    {
      to: "/playlists",
      title: "Playlists",
      icon: playLists,
      permission: "playlist_management",
    },
    {
      to: "/schedules",
      title: "Schedules",
      icon: schedules,
      permission: "schedule_management",
    },
    {
      to: "/device-status",
      title: "Device status",
      icon: deviceStatus,
      permission: "device_status_management",
    },
    {
      to: "/user",
      title: "User Management",
      icon: user,
      children: [
        {
          to: "/user",
          title: "Users",
        },
        {
          to: "/roles",
          title: "Roles",
        },
      ],
      permission: "user_management",
    },
    // {
    //     to: "/my-company",
    //     title: "My company",
    //     icon: myCompany
    // },
    {
      to: "/settings",
      title: "Settings",
      icon: settings,
      children: [
        {
          to: "/settings/email-config",
          title: "Email Settings",
        },
        {
          to: "/settings/email-templates",
          title: "Email Templates",
        },
        {
          to: "/settings/recipient-lists",
          title: "Recipient Lists",
        },
        {
          to: "/settings/device-alerts",
          title: "Device Alerts",
        },
      ],
      permission: "settings_management",
    },
  ],
};
