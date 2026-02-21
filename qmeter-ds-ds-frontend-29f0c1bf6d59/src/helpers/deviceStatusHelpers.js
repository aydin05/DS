import { Tag } from "antd";

/**
 * Device active/inactive tag
 * @param {string} updatedAt - ISO date
 * @param {number} thresholdSeconds
 */
export const generateStatusTag = (
  lastHeartbeat,
  isHealthy,
  thresholdSeconds = 300,
) => {
  if (isHealthy === true) {
    return <Tag color="green">Active</Tag>;
  }
  if (isHealthy === false) {
    return <Tag color="red">Inactive</Tag>;
  }
  // Fallback: if is_healthy is not provided, use client-side time check
  if (!lastHeartbeat) {
    return <Tag color="red">Inactive</Tag>;
  }

  const heartbeatTime = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  const diffInSeconds = (now - heartbeatTime) / 1000;

  const isActive = diffInSeconds <= thresholdSeconds;

  return (
    <Tag color={isActive ? "green" : "red"}>
      {isActive ? "Active" : "Inactive"}
    </Tag>
  );
};

/**
 * Date formatter
 */
export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-GB", { hour12: false }) : "-";
