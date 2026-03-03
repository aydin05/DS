import { SubHeader } from "../../SubComponents/SubHeader";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AuthModal } from "../../SubComponents/AuthModal";
import ConfirmDeleteModal from "../../SubComponents/ConfirmDeleteModal";
import { Button, Dropdown, Form, Input, message, Modal, Progress, Select } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import axiosClient from "../../../config";
import tableAction from "../../../assets/images/table-action.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deletePlayListData,
  discardPlayList,
  fetchPlayListData,
  getPlayListDataById,
  postPlayListData,
  publishPlayList,
  toggleDeleteModal,
  toggleModal,
  updatePlayListData,
  duplicatePlayList,
  toggleDuplicateModal,
} from "../../store/features/playListSlice";
import { fetchDisplayTypeData } from "../../store/features/displayTypeSlice";
import CustomDataTable from "../../consts/CustomDataTable";
import { pageSize } from "../../../helpers";

const { Option } = Select;
export const PlayLists = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const {
    isLoading,
    data,
    count,
    current_page,
    isOpenModal,
    formValue,
    isOpenDeleteModal,
    isOpenDuplicateModal,
    duplicatedPlaylist,
    duplicateLoading,
    postDataLoading,
    requestStatus,
    deletedPlaylistId,
    deleteDataLoading,
    postError,
  } = useSelector((state) => state.playListSlice);
  const displayTypeSlice = useSelector((state) => state.displayTypeSlice);
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeStatus, setMergeStatus] = useState("idle"); // idle | processing | ready | failed
  const [mergeError, setMergeError] = useState(null);
  const mergePollingRef = useRef(null);

  const toggleEdit = useCallback(() => dispatch(toggleModal()), [dispatch]);
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id !== null ? { open: true, id } : { open: false, id: null })), [dispatch]);
  const [duplicateForm] = Form.useForm();

  const finish = useCallback((values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updatePlayListData(values));
    } else dispatch(postPlayListData(values));
  }, [formValue.id, dispatch]);
  const deletePlaylist = useCallback(() => dispatch(deletePlayListData(deletedPlaylistId)), [deletedPlaylistId, dispatch]);
  /*side effects*/
  useEffect(() => {
    dispatch(fetchDisplayTypeData({ page: 1 }));
    dispatch(fetchPlayListData({ page: current_page || 1 }));
  }, []);
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new playlist successfully created");
          break;
        case "update":
          message.success("The playlist successfully updated");
          break;
        case "delete":
          message.success("The playlist successfully deleted");
          break;
        case "duplicate":
          message.success("The playlist successfully renamed");
          break;
      }
      dispatch(fetchPlayListData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (formValue.id) {
      let data = {
        ...formValue,
        default_display_type: formValue.default_display_type.id,
      };
      form.setFieldsValue(data);
    } else {
      form.resetFields();
    }
  }, [formValue]);
  useEffect(() => {
    if (postError) {
      form.setFields(postError);
    }
  }, [postError]);

  const stopMergePolling = useCallback(() => {
    if (mergePollingRef.current) {
      clearInterval(mergePollingRef.current);
      mergePollingRef.current = null;
    }
  }, []);

  const startMergePolling = useCallback((playlistId) => {
    stopMergePolling();
    setMergeStatus("processing");
    setMergeError(null);
    setMergeModalVisible(true);

    mergePollingRef.current = setInterval(async () => {
      try {
        const res = await axiosClient.get(`playlist/${playlistId}/merge-status/`);
        const { status, error } = res.data;
        if (status === "ready") {
          setMergeStatus("ready");
          stopMergePolling();
          setTimeout(() => setMergeModalVisible(false), 2000);
        } else if (status === "failed") {
          setMergeStatus("failed");
          setMergeError(error || "Unknown error");
          stopMergePolling();
        }
      } catch (err) {
        console.error("Merge status poll error:", err);
      }
    }, 3000);
  }, [stopMergePolling]);

  useEffect(() => {
    return () => stopMergePolling();
  }, [stopMergePolling]);

  const publish = useCallback((id) =>
    dispatch(publishPlayList(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPlayListData({ page: 1 }));
        message.success("Published!");
        startMergePolling(id);
      }), [dispatch, startMergePolling]);
  const discard = useCallback((id) =>
    dispatch(discardPlayList(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPlayListData({ page: 1 }));
        message.success("Discarded!");
      }), [dispatch]);

  const handleDuplicate = useCallback((id) => {
    dispatch(duplicatePlayList(id));
  }, [dispatch]);

  const finishDuplicateRename = (values) => {
    if (duplicatedPlaylist) {
      dispatch(updatePlayListData({ id: duplicatedPlaylist.id, ...values }))
        .unwrap()
        .then(() => {
          dispatch(toggleDuplicateModal());
          dispatch(fetchPlayListData({ page: 1 }));
          message.success("Playlist duplicated successfully");
        });
    }
  };

  useEffect(() => {
    if (duplicatedPlaylist && isOpenDuplicateModal) {
      duplicateForm.setFieldsValue({ name: duplicatedPlaylist.name });
    }
  }, [duplicatedPlaylist, isOpenDuplicateModal]);

  const columns = useMemo(() => [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => (current_page - 1) * pageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Display type",
      dataIndex: "default_display_type",
      key: "default_display_type",
      render: (text) => {
        let element = displayTypeSlice.data.find((item) => item.id === text.id);
        return (
          element && `${element.name} : ${element.width} x ${element.height}`
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "action",
      key: "action",
      render: (text, row) => (
        <Dropdown
          menu={{
            items: [
              {
                label: "Manage",
                key: "0",
                onClick: () => navigate(`/playlists/${row.id}`),
              },
              {
                label: "Publish",
                key: "1",
                disabled: !row.is_update,
                onClick: () => publish(row.id),
              },
              {
                label: "Discard",
                key: "2",
                disabled: !row.is_update,
                onClick: () => discard(row.id),
              },
              {
                label: "Edit",
                key: "3",
                onClick: () => dispatch(getPlayListDataById({ id: row.id })),
              },
              {
                label: "Duplicate",
                key: "4",
                onClick: () => handleDuplicate(row.id),
              },
              {
                label: "Delete",
                key: "5",
                onClick: () => toggleDelete(row.id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Button type="text">
              <img src={tableAction} alt="..." />
            </Button>
          </a>
        </Dropdown>
      ),
    },
  ], [dispatch, navigate, toggleDelete, publish, discard, handleDuplicate, displayTypeSlice.data, current_page]);
  return (
    <div>
      <SubHeader
        title={"Playlist"}
        paragraph={"You can manage playlists from this section"}
        button_title={"New playlist"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*Data Table*/}
      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchPlayListData}
        count={count}
        current={current_page}
        pageSize={pageSize}
      />
      {/*create and edit modal*/}
      <AuthModal
        title={
          formValue.name ? `Edit ${formValue.name}` : "Create new playlist"
        }
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finish} form={form}>
          <Form.Item
            label="PlayList name"
            name="name"
            rules={[{ required: true, message: "Playlist name required!" }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            name="default_display_type"
            label="Default display type"
            rules={[
              { required: true, message: "Default display type required!" },
            ]}
          >
            <Select placeholder="Select display type" allowClear>
              {displayTypeSlice.data.map((item, index) => {
                return (
                  <Option key={index} value={item.id}>
                    {item.name} : {`${item.width} x ${item.height}`}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input placeholder="Enter description" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleEdit}>
              Cancel
            </Button>
            <Button loading={postDataLoading} className="ant-btn-success" htmlType="submit">
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>
      {/*duplicate rename modal*/}
      <AuthModal
        title="Rename duplicated playlist"
        isOpen={isOpenDuplicateModal}
        cancel={() => dispatch(toggleDuplicateModal())}
        isFooter={"none"}
      >
        <Form layout="vertical" onFinish={finishDuplicateRename} form={duplicateForm}>
          <Form.Item
            label="Playlist name"
            name="name"
            rules={[{ required: true, message: "Playlist name required!" }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={() => dispatch(toggleDuplicateModal())}>
              Cancel
            </Button>
            <Button loading={postDataLoading} className="ant-btn-success" htmlType="submit">
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>
      <ConfirmDeleteModal
        isOpen={isOpenDeleteModal}
        onCancel={() => toggleDelete()}
        onConfirm={deletePlaylist}
        loading={deleteDataLoading}
      />

      {/* Merge Video Progress Modal */}
      <Modal
        title="Generating Video"
        open={mergeModalVisible}
        footer={mergeStatus === "failed" ? [
          <Button key="close" onClick={() => setMergeModalVisible(false)}>Close</Button>
        ] : null}
        closable={mergeStatus !== "processing"}
        onCancel={() => { stopMergePolling(); setMergeModalVisible(false); }}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          {mergeStatus === "processing" && (
            <>
              <LoadingOutlined style={{ fontSize: 48, color: "#1890ff" }} />
              <p style={{ marginTop: 16, fontSize: 16 }}>Merging slides into video...</p>
              <p style={{ color: "#888" }}>This may take up to a minute depending on the number of slides.</p>
              <Progress percent={99.9} status="active" showInfo={false} style={{ marginTop: 16 }} />
            </>
          )}
          {mergeStatus === "ready" && (
            <>
              <CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a" }} />
              <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>Video ready!</p>
              <p style={{ color: "#888" }}>The merged video is now live on all connected displays.</p>
            </>
          )}
          {mergeStatus === "failed" && (
            <>
              <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
              <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>Video generation failed</p>
              <p style={{ color: "#888" }}>{mergeError}</p>
              <p style={{ color: "#888", marginTop: 8 }}>Displays will use slide-by-slide mode as fallback.</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
