import moment from "moment";

const pageSize = 10;

const formats = {
  timeGutterFormat: (date) => moment(date).format("HH:mm"),
  agendaTimeFormat: (date) => moment(date).format("HH:mm"),
  eventTimeRangeFormat: ({ start, end }) =>
    `${moment(start).format("HH:mm")} – ${moment(end).format("HH:mm")}`,
  dayHeaderFormat: (date) => moment(date).format("dddd, DD MMMM"),
  dayFormat: (date) => moment(date).format("ddd, DD MMM"),
  agendaHeaderFormat: ({ start, end }) =>
    `${moment(start).format("DD MMM")} – ${moment(end).format("DD MMM")}`,
};

const extractPermissionCodes = (user) => {
  if (!user) return [];
  if (user?.is_admin || user?.is_master) return ["*"];
  return user.role?.map((role) => role.code) || [];
};

const hasPermission = (permissions, code) =>
  permissions.includes("*") || permissions.includes(code);

export { pageSize, formats, extractPermissionCodes, hasPermission };
