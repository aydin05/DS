import { SubHeader } from "../../SubComponents/SubHeader";
import React, { useEffect } from "react";
import { AuthModal } from "../../SubComponents/AuthModal";
import { Button, Dropdown, Form, Input, Menu, message, Select } from "antd";
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
  const toggleEdit = () => dispatch(toggleModal());
  const toggleDelete = (id = null) => dispatch(toggleDeleteModal(id));
  const [duplicateForm] = Form.useForm();

  const finish = (values) => {
    if (formValue.id) {
      values.id = formValue.id;
      dispatch(updatePlayListData(values));
    } else dispatch(postPlayListData(values));
  };
  const deletePlaylist = () => dispatch(deletePlayListData(deletedPlaylistId));
  /*side effects*/
  useEffect(() => {
    // dispatch(fetchPlayListData({ page: 1 }));
    dispatch(fetchDisplayTypeData({ page: 1 }));
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

  const publish = (id) =>
    dispatch(publishPlayList(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPlayListData({ page: 1 }));
        message.success("Published!");
      });
  const discard = (id) =>
    dispatch(discardPlayList(id))
      .unwrap()
      .then(() => {
        dispatch(fetchPlayListData({ page: 1 }));
        message.success("Discarded!");
      });

  const handleDuplicate = (id) => {
    dispatch(duplicatePlayList(id));
  };

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

  const columns = [
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
          overlay={
            <Menu
              items={[
                {
                  label: (
                    <a onClick={() => navigate(`/playlists/${row.id}`)}>
                      Manage{" "}
                    </a>
                  ),
                  key: "0",
                },
                {
                  label: <a onClick={() => publish(row.id)}>Publish </a>,
                  key: "1",
                  disabled: !row.is_update,
                },
                {
                  label: <a onClick={() => discard(row.id)}>Discard </a>,
                  key: "2",
                  disabled: !row.is_update,
                },
                {
                  label: (
                    <a
                      onClick={() =>
                        dispatch(getPlayListDataById({ id: row.id }))
                      }
                    >
                      Edit
                    </a>
                  ),
                  key: "3",
                },
                {
                  label: (
                    <a onClick={() => handleDuplicate(row.id)}>
                      Duplicate
                    </a>
                  ),
                  key: "4",
                },
                {
                  label: <a onClick={() => toggleDelete(row.id)}>Delete</a>,
                  key: "5",
                },
              ]}
            />
          }
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
  ];
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
      {/*delete modal*/}
      <AuthModal
        title="Are you sure?"
        isOpen={isOpenDeleteModal}
        cancel={toggleDelete}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <div className="d-flex justify-content-end">
          <Button type="text" htmlType="button" onClick={() => toggleDelete()}>
            Cancel
          </Button>
          <Button
            onClick={deletePlaylist}
            loading={deleteDataLoading}
            className="ant-btn-danger"
            htmlType="submit"
          >
            Delete
          </Button>
        </div>
      </AuthModal>
    </div>
  );
};
