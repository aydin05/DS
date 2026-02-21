import { useNavigate, useParams } from "react-router-dom";
// import { useCallback } from "react";
import arrowLeft from "../../../assets/images/arrow-left.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { Card, Col, Row, Timeline, Spin, Empty } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  fetchDeviceStatusById,
} from "../../store/features/deviceStatusSlice";

import {
  generateStatusTag,
  formatDateTime,
} from "../../../helpers/deviceStatusHelpers";

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

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center bg-header mb-4">
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
          <img src={arrowLeft} style={{ width: 15 }} alt="back" />
        </span>
        <span className="ms-2">Device Logs</span>
      </div>

      <SubHeader title="Device logs timeline" isDisabled={isLoading} />

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

        {!isLoading && data.length > 0 && (
          <>
            <Timeline>
              {data.map((log) => {
                const dateTime = formatDateTime(log.created_at);
                const [date, time] = dateTime.split(", ");

                return (
                  <Timeline.Item key={log.id}>
                    <Row gutter={16}>
                      <Col md={6}>
                        <p>{date}</p>
                        <p className="fw-500">{time}</p>
                      </Col>

                      <Col md={18}>
                        <p style={{ wordBreak: "break-word" }}>
                          {log.logs?.length > 0
                            ? log.logs.map((item, index) => (
                                <div key={index}>{item}</div>
                              ))
                            : <span style={{ color: "#aaa", fontStyle: "italic" }}>
                                No log messages — this device sends heartbeats only
                              </span>
                          }
                        </p>
                      </Col>
                    </Row>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </>
        )}
      </Card>
    </div>
  );
};

export default DeviceStatusView;
