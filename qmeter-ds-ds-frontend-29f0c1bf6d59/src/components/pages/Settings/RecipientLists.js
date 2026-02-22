import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Dropdown,
  Menu,
  message,
  Tag,
  Tooltip,
  Space,
  Divider,
} from "antd";
import { SubHeader } from "../../SubComponents/SubHeader";
import { AuthModal } from "../../SubComponents/AuthModal";
import CustomDataTable from "../../consts/CustomDataTable";
import { useDispatch, useSelector } from "react-redux";
import { pageSize } from "../../../helpers";
import tableAction from "../../../assets/images/table-action.svg";
import {
  fetchRecipientLists,
  postRecipientList,
  updateRecipientList,
  deleteRecipientList,
  fetchRecipientListById,
  postRecipient,
  deleteRecipient,
  toggleRecipientListModal,
  setRecipientListFormValue,
  resetNotificationStatus,
} from "../../store/features/notificationSlice";
import { fetchBranchData } from "../../store/features/branchSlice";

export const RecipientLists = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [recipientForm] = Form.useForm();
  const [selectedList, setSelectedList] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    recipientLists,
    recipientListsLoading,
    recipientListsCount,
    recipientListsCurrent,
    recipientListFormValue,
    isOpenRecipientListModal,
    recipientListPostLoading,
    recipientListPostError,
    recipientListRequestStatus,
    recipientRequestStatus,
  } = useSelector((state) => state.notificationSlice);

  const { data: branches } = useSelector((state) => state.branchSlice);

  useEffect(() => {
    dispatch(fetchRecipientLists({ page: 1, search: "" }));
    dispatch(fetchBranchData({ page: 1, search: "" }));
  }, [dispatch]);

  useEffect(() => {
    if (recipientListRequestStatus) {
      switch (recipientListRequestStatus) {
        case "post":
          message.success("Recipient list created successfully");
          break;
        case "update":
          message.success("Recipient list updated successfully");
          break;
        case "delete":
          message.success("Recipient list deleted successfully");
          break;
        default:
          break;
      }
      dispatch(fetchRecipientLists({ page: 1, search: "" }));
      dispatch(resetNotificationStatus());
    }
  }, [recipientListRequestStatus, dispatch]);

  useEffect(() => {
    if (recipientRequestStatus) {
      if (selectedList?.id) {
        dispatch(fetchRecipientListById(selectedList.id)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            setSelectedList(res.payload);
          }
        });
      }
      dispatch(fetchRecipientLists({ page: 1, search: "" }));
      dispatch(resetNotificationStatus());
    }
  }, [recipientRequestStatus, dispatch, selectedList?.id]);

  useEffect(() => {
    if (recipientListFormValue?.id) {
      form.setFieldsValue(recipientListFormValue);
    } else {
      form.resetFields();
    }
  }, [recipientListFormValue, form]);

  useEffect(() => {
    if (recipientListPostError) {
      const errors = Object.entries(recipientListPostError).map(
        ([key, value]) => ({
          name: key,
          errors: Array.isArray(value) ? value : [value],
        }),
      );
      form.setFields(errors);
    }
  }, [recipientListPostError, form]);

  const toggleModal = () => {
    if (!isOpenRecipientListModal) {
      form.resetFields();
    }
    dispatch(toggleRecipientListModal());
  };

  const onFinish = (values) => {
    if (recipientListFormValue?.id) {
      values.id = recipientListFormValue.id;
      dispatch(updateRecipientList(values));
    } else {
      dispatch(postRecipientList(values));
    }
  };

  const onEdit = (record) => {
    dispatch(setRecipientListFormValue(record));
  };

  const onDelete = (id) => {
    dispatch(deleteRecipientList(id));
  };

  const openDetail = (record) => {
    setSelectedList(record);
    setIsDetailOpen(true);
  };

  const addRecipient = (values) => {
    dispatch(
      postRecipient({
        ...values,
        recipient_list: selectedList.id,
      }),
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Recipient added");
        recipientForm.resetFields();
      } else {
        message.error("Failed to add recipient");
      }
    });
  };

  const removeRecipient = (id) => {
    dispatch(deleteRecipient(id)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        message.success("Recipient removed");
      }
    });
  };

  const columns = [
    {
      title: "#",
      render: (_, __, index) =>
        (recipientListsCurrent - 1) * pageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => text || "-",
    },
    {
      title: "Branches",
      dataIndex: "branch_names",
      render: (names) => {
        if (!names || names.length === 0) {
          return <Tag color="purple">All branches</Tag>;
        }
        const visible = names.slice(0, 5);
        const hidden = names.slice(5);
        return (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {visible.map((name) => (
              <Tag key={name} color="purple" style={{ margin: 0 }}>{name}</Tag>
            ))}
            {hidden.length > 0 && (
              <Tooltip
                title={
                  <div>
                    {hidden.map((name) => (
                      <div key={name}>{name}</div>
                    ))}
                  </div>
                }
              >
                <Tag color="default" style={{ margin: 0, cursor: "pointer" }}>
                  +{hidden.length} more…
                </Tag>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: "Recipients",
      dataIndex: "recipient_count",
      render: (count) => <Tag color="blue">{count} email(s)</Tag>,
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "manage",
                label: "Manage Recipients",
                onClick: () => openDetail(row),
              },
              {
                key: "edit",
                label: "Edit",
                onClick: () => onEdit(row),
              },
              {
                key: "delete",
                label: "Delete",
                danger: true,
                onClick: () => onDelete(row.id),
              },
            ],
          }}
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
        title="Recipient Lists"
        paragraph="Manage email recipient lists for notifications"
        button_title="Create List"
        toggle={toggleModal}
        isDisabled={recipientListsLoading}
      />

      <CustomDataTable
        data={recipientLists.map((item, index) => ({
          ...item,
          key: item.id || index,
        }))}
        isLoading={recipientListsLoading}
        columns={columns}
        action={fetchRecipientLists}
        count={recipientListsCount}
        current={recipientListsCurrent}
        pageSize={pageSize}
      />

      {/* Create/Edit Recipient List Modal */}
      <AuthModal
        title={
          recipientListFormValue?.id
            ? `Edit "${recipientListFormValue.name}"`
            : "Create New Recipient List"
        }
        isOpen={isOpenRecipientListModal}
        cancel={toggleModal}
        isFooter="none"
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item
            label="List Name"
            name="name"
            rules={[{ required: true, message: "List name is required" }]}
          >
            <Input placeholder="e.g. IT Team" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input placeholder="e.g. IT department notification recipients" />
          </Form.Item>

          <Form.Item
            label="Branches"
            name="branches"
            extra="Leave empty to cover all branches"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="All branches (default)"
              optionFilterProp="children"
            >
              {branches.map((b) => (
                <Select.Option key={b.id} value={b.id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleModal}>
              Cancel
            </Button>
            <Button
              loading={recipientListPostLoading}
              type="primary"
              htmlType="submit"
            >
              Save
            </Button>
          </div>
        </Form>
      </AuthModal>

      {/* Manage Recipients Modal */}
      <AuthModal
        title={
          selectedList ? `Recipients - ${selectedList.name}` : "Recipients"
        }
        isOpen={isDetailOpen}
        cancel={() => setIsDetailOpen(false)}
        isFooter="none"
        width={600}
      >
        {selectedList && (
          <div>
            <Form
              form={recipientForm}
              layout="inline"
              onFinish={addRecipient}
              style={{ marginBottom: 16 }}
            >
              <Form.Item
                name="name"
                style={{ flex: 1 }}
              >
                <Input placeholder="Name (optional)" />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Email required" },
                  { type: "email", message: "Invalid email" },
                ]}
                style={{ flex: 2 }}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Add
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <div>
              {selectedList.recipients && selectedList.recipients.length > 0 ? (
                selectedList.recipients.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Space>
                      <span style={{ fontWeight: 500 }}>
                        {r.name || "—"}
                      </span>
                      <span style={{ color: "#888" }}>{r.email}</span>
                    </Space>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => removeRecipient(r.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <p style={{ color: "#999", textAlign: "center" }}>
                  No recipients yet. Add one above.
                </p>
              )}
            </div>
          </div>
        )}
      </AuthModal>
    </div>
  );
};

export default RecipientLists;
