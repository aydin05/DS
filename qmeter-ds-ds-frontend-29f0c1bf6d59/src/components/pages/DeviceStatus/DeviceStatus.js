import { Button, Dropdown, Menu, Select, message } from "antd";
import { useEffect, useState, useMemo } from "react";
import tableAction from "../../../assets/images/table-action.svg";
import { SubHeader } from "../../SubComponents/SubHeader";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchDeviceStatusData,
  fetchDeviceStatusFilter,
  fetchCompanySettings,
  saveCompanySettings,
} from "../../store/features/deviceStatusSlice";
import { fetchBranchData } from "../../store/features/branchSlice";
import { fetchPlayListData } from "../../store/features/playListSlice";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../consts/CustomDataTable";
import { pageSize } from "../../../helpers";
import {
  generateStatusTag,
  formatDateTime,
} from "../../../helpers/deviceStatusHelpers";

const THRESHOLD_OPTIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 90, label: "1m 30s" },
  { value: 120, label: "2m" },
  { value: 150, label: "2m 30s" },
  { value: 180, label: "3m" },
  { value: 210, label: "3m 30s" },
  { value: 240, label: "4m" },
  { value: 270, label: "4m 30s" },
  { value: 300, label: "5m" },
];

export const DeviceStatus = () => {
  const [status, setStatus] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, count, current_page, data, heartbeatThreshold, thresholdLoading } = useSelector(
    (state) => state.deviceStatusSlice,
  );
  const { data: branches } = useSelector((state) => state.branchSlice);
  const { data: playlists } = useSelector((state) => state.playListSlice);

  useEffect(() => {
    dispatch(fetchBranchData({ page: 1, search: "" }));
    dispatch(fetchPlayListData({ page: 1, search: "" }));
    dispatch(fetchCompanySettings());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchDeviceStatusFilter({
        page: 1,
        search: "",
        status: status,
      }),
    );

    // Auto-poll every 30 seconds to keep status up-to-date
    const pollInterval = setInterval(() => {
      dispatch(
        fetchDeviceStatusFilter({
          page: 1,
          search: "",
          status: status,
        }),
      );
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [dispatch, status]);

  const onThresholdChange = (value) => {
    dispatch(saveCompanySettings(value)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Device status threshold updated");
        dispatch(fetchDeviceStatusFilter({ page: 1, search: "", status }));
      } else {
        message.error("Failed to update threshold");
      }
    });
  };

  const statusOptions = useMemo(
    () => [
      { label: "All", value: 1 },
      { label: "Active", value: true },
      { label: "Inactive", value: false },
    ],
    [],
  );

  const columns = [
    {
      title: "#",
      render: (_, __, index) => (current_page - 1) * pageSize + index + 1,
    },
    {
      title: "Username",
      dataIndex: "device_username",
    },
    {
      title: "Display Name",
      dataIndex: ["display", "name"],
      render: (text) => text ?? "-",
    },
    {
      title: "Branch",
      dataIndex: ["display", "branch"],
      render: (branchId) =>
        branches?.find((b) => b.id === branchId)?.name || "-",
    },
    {
      title: "Playlist",
      dataIndex: ["display", "playlist"],
      render: (playlistId) =>
        playlists?.find((p) => p.id === playlistId)?.name || "-",
    },
    {
      title: "Source",
      dataIndex: "last_heartbeat_source",
      render: (value) => value === "tizen" ? "Tizen" : value === "openlink" ? "Open Link" : "-",
    },
    {
      title: "Status",
      dataIndex: "is_healthy",
      render: (_, row) => generateStatusTag(row.last_heartbeat, row.is_healthy),
    },
    {
      title: "Last Heartbeat",
      dataIndex: "last_heartbeat",
      render: formatDateTime,
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          overlay={
            <Menu
              items={[
                {
                  key: "view",
                  label: (
                    <span onClick={() => navigate(`/device-status/${row.id}`)}>
                      View
                    </span>
                  ),
                },
              ]}
            />
          }
        >
          <Button type="text">
            <img src={tableAction} alt="actions" />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <SubHeader
        title="Device status"
        paragraph="You can view device logs from this section"
        isDisabled={isLoading}
      />

      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchDeviceStatusFilter}
        count={count}
        current={current_page}
        pageSize={pageSize}
        statusOptions={statusOptions}
        status={status}
        onStatusChange={setStatus}
        setStatus={setStatus}
        extraFilter={
          <>
            <span style={{ fontSize: 13, color: "#555", marginRight: 4 }}>Inactive after:</span>
            <Select
              value={heartbeatThreshold}
              onChange={onThresholdChange}
              loading={thresholdLoading}
              style={{ width: 110, marginRight: 10 }}
              options={THRESHOLD_OPTIONS}
              size="large"
            />
          </>
        }
      />
    </div>
  );
};
