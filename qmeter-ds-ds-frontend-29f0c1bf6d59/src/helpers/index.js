import dayjs from "dayjs";

const pageSize = 10;

const formats = {
  timeGutterFormat: (date) => dayjs(date).format("HH:mm"),
  agendaTimeFormat: (date) => dayjs(date).format("HH:mm"),
  eventTimeRangeFormat: ({ start, end }) =>
    `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`,
  dayHeaderFormat: (date) => dayjs(date).format("dddd, DD MMMM"),
  dayFormat: (date) => dayjs(date).format("ddd, DD MMM"),
  agendaHeaderFormat: ({ start, end }) =>
    `${dayjs(start).format("DD MMM")} – ${dayjs(end).format("DD MMM")}`,
};

const extractPermissionCodes = (user) => {
  if (!user) return [];
  if (user?.is_admin || user?.is_master) return ["*"];
  return user.role?.map((role) => role.code) || [];
};

const hasPermission = (permissions, code) =>
  permissions.includes("*") || permissions.includes(code);

export { pageSize, formats, extractPermissionCodes, hasPermission };
