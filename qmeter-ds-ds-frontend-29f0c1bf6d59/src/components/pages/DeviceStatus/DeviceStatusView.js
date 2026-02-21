import { useNavigate, useParams } from "react-router-dom";
import arrowLeft from "../../../assets/images/arrow-left.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { Card, Col, Row, Spin, Empty, Tag, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import {
  fetchDeviceStatusById,
} from "../../store/features/deviceStatusSlice";

import {
  generateStatusTag,
} from "../../../helpers/deviceStatusHelpers";

/**
 * Parse a raw log line like:
 *   DeviceTS:2025-02-21T18:30:00.000Z IP:192.168.1.5 DeviceID:abc123 :: Playlist loaded DATA:{...}
 * into { timestamp, message, level }
 */
const parseLogLine = (line) => {
  if (!line || typeof line !== "string") return null;

  let timestamp = "";
  let message = line;

  // Extract device timestamp
  const tsMatch = line.match(/DeviceTS:(\S+)/);
  if (tsMatch) {
    try {
      const d = new Date(tsMatch[1]);
      if (!isNaN(d.getTime())) {
        timestamp = d.toLocaleString("en-GB", { hour12: false });
      } else {
        timestamp = tsMatch[1];
      }
    } catch {
      timestamp = tsMatch[1];
    }
  }

  // Extract the actual message (everything after " :: ")
  const msgSplit = line.split(" :: ");
  if (msgSplit.length > 1) {
    message = msgSplit.slice(1).join(" :: ");
  }

  // Strip trailing DATA:{...} for cleaner display
  message = message.replace(/\s*DATA:\{.*\}$/, "").replace(/\s*DATA:\(.*\)$/, "").trim();

  // Detect level from message content
  let level = "INFO";
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("error") || lowerMsg.includes("fail") || lowerMsg.includes("exception")) {
    level = "ERROR";
  } else if (lowerMsg.includes("warn")) {
    level = "WARN";
  } else if (lowerMsg.includes("download") || lowerMsg.includes("loaded") || lowerMsg.includes("success")) {
    level = "SUCCESS";
  }

  return { timestamp, message, level };
};

const levelColors = {
  ERROR: "red",
  WARN: "orange",
  SUCCESS: "green",
  INFO: "blue",
};

const DeviceStatusView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { isLoading, data } = useSelector((state) => state.deviceStatusSlice);

  useEffect(() => {
    if (id) {
      dispatch(fetchDeviceStatusById(Number(id)));
    }
  }, [dispatch, id]);

  const parsedLogs = useMemo(() => {
    if (!data || data.length === 0) return [];

    const allParsed = [];
    data.forEach((log) => {
      if (log.logs && log.logs.length > 0) {
        log.logs.forEach((line, idx) => {
          const parsed = parseLogLine(line);
          if (parsed && parsed.message) {
            allParsed.push({
              key: `${log.id}-${idx}`,
              ...parsed,
            });
          }
        });
      }
    });

    // Reverse so newest logs are at the top
    return allParsed.reverse();
  }, [data]);

  const logColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (text) => (
        <span style={{ fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>
          {text || "—"}
        </span>
      ),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 90,
      filters: [
        { text: "Error", value: "ERROR" },
        { text: "Warning", value: "WARN" },
        { text: "Success", value: "SUCCESS" },
        { text: "Info", value: "INFO" },
      ],
      onFilter: (value, record) => record.level === value,
      render: (level) => (
        <Tag color={levelColors[level] || "default"} style={{ margin: 0 }}>
          {level}
        </Tag>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text) => (
        <span style={{ wordBreak: "break-word", fontSize: 13 }}>{text}</span>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center bg-header mb-4">
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
          <img src={arrowLeft} style={{ width: 15 }} alt="back" />
        </span>
        <span className="ms-2">Device Logs</span>
      </div>

      <SubHeader title="Device logs" isDisabled={isLoading} />

      {!isLoading && data.length > 0 && (
        <Card className="mb-3">
          <Row gutter={16}>
            <Col md={8}>
              <p className="mb-0" style={{ color: "#888", fontSize: 12 }}>Device</p>
              <p className="fw-500">{data[0]?.device_username || "—"}</p>
            </Col>
            <Col md={8}>
              <p className="mb-0" style={{ color: "#888", fontSize: 12 }}>Source</p>
              <p className="fw-500">{data[0]?.last_heartbeat_source || "—"}</p>
            </Col>
            <Col md={8}>
              <p className="mb-0" style={{ color: "#888", fontSize: 12 }}>Status</p>
              {generateStatusTag(data[0]?.last_heartbeat, data[0]?.is_healthy)}
            </Col>
          </Row>
        </Card>
      )}

      <Card style={{ minHeight: 300 }}>
        {isLoading && <Spin size="large" />}

        {!isLoading && data.length === 0 && (
          <Empty description="No logs available for this device" />
        )}

        {!isLoading && data.length > 0 && parsedLogs.length === 0 && (
          <Empty description="This device sends heartbeats only — no log messages" />
        )}

        {!isLoading && parsedLogs.length > 0 && (
          <Table
            columns={logColumns}
            dataSource={parsedLogs}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["20", "50", "100"] }}
            bordered
          />
        )}
      </Card>
    </div>
  );
};

export default DeviceStatusView;
