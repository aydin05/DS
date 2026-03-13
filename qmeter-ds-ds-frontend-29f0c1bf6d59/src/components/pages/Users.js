import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Input,
  message,
  Row,
  Select,
  Steps,
  Typography,
} from "antd";
import tableAction from "../../assets/images/table-action.svg";
import { SubHeader } from "../SubComponents/SubHeader";
import { AuthModal } from "../SubComponents/AuthModal";
import ConfirmDeleteModal from "../SubComponents/ConfirmDeleteModal";
import { timeZones, weeks } from "../../staticData";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUserData,
  fetchUserData,
  getUserDataById,
  postUserData,
  resetStatus,
  toggleDeleteModal,
  toggleModal,
  updateUserData,
} from "../store/features/userSlice";
import { fetchBranchData } from "../store/features/branchSlice";
import { fetchRoleData } from "../store/features/roleSlice";
import CustomDataTable from "../consts/CustomDataTable";

const { Text } = Typography;
export const Users = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  /*store data*/
  const {
    isLoading,
    data,
    count,
    current_page,
    isOpenModal,
    isOpenDeleteModal,
    postDataLoading,
    formValue,
    requestStatus,
    postDataError,
    deleteUserId,
    deleteDataLoading,
  } = useSelector((state) => state.userSlice);

  const branchSlice = useSelector((state) => state.branchSlice);
  const roleSlice = useSelector((state) => state.roleSlice);
  /*component states*/
  const [step, setStep] = useState(0);
  const isAdmin = Form.useWatch("is_admin", form);

  /*component actions*/
  const toggleEdit = () => {
    setStep(0);
    dispatch(toggleModal());
  };
  const toggleDelete = useCallback((id = null) => dispatch(toggleDeleteModal(id !== null ? { open: true, id } : { open: false, id: null })), [dispatch]);

  const deleteUser = useCallback(() => dispatch(deleteUserData(deleteUserId)), [deleteUserId, dispatch]);
  const getuserDataById = useCallback((id) => {
    dispatch(getUserDataById(id));
    setStep(0);
  }, [dispatch]);

  // Step 1 field names for validation
  const step1Fields = formValue.id
    ? ["fullname", "email", "phone_number", "timezone"]
    : ["fullname", "email", "password", "password_confirmation", "phone_number", "timezone"];

  const totalSteps = isAdmin ? 1 : 3;

  const handleNext = async () => {
    try {
      if (step === 0) {
        await form.validateFields(step1Fields);
        // check password match for new users
        if (!formValue.id) {
          const { password, password_confirmation } = form.getFieldsValue();
          if (password !== password_confirmation) {
            form.setFields([
              { name: "password_confirmation", errors: ["The password confirmation does not match"] },
            ]);
            return;
          }
        }
      }
      if (step === 1) {
        const branch = form.getFieldValue("branch");
        if (!Array.isArray(branch) || branch.length === 0) {
          form.setFields([{ name: "branch", errors: ["Please select at least one branch"] }]);
          return;
        }
      }
      setStep(step + 1);
    } catch {
      // validation failed — errors shown on fields
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.day_of_week = 1;

      if (isAdmin) {
        values.branch = [];
        values.role = [];
      } else {
        // validate role on final step
        if (!Array.isArray(values.role) || values.role.length === 0) {
          form.setFields([{ name: "role", errors: ["Please select at least one role"] }]);
          return;
        }
      }

      if (formValue.id) {
        values.id = formValue.id;
        if (!values.job_title) delete values.job_title;
        dispatch(updateUserData(values));
      } else {
        dispatch(postUserData(values));
      }
      setStep(0);
    } catch {
      // validation failed
    }
  };

  /*side effects*/
  useEffect(() => {
    dispatch(fetchUserData({ page: 1 })); //get user data
    dispatch(fetchBranchData({ page: 1, page_size: 1000 })); //get all branches for form
    dispatch(fetchRoleData({ page: 1, page_size: 1000 })); //get all roles for form
    return () => {
      dispatch(resetStatus());
    };
  }, []);

  useEffect(() => {
    // set form value data to form
    if (formValue.id) {
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
  }, [formValue]);
  useEffect(() => {
    if (requestStatus) {
      switch (requestStatus) {
        case "post":
          message.success("The new user successfully created");
          break;
        case "update":
          message.success("The user successfully updated");
          break;
        case "delete":
          message.success("The user successfully deleted");
          break;
      }
      dispatch(fetchUserData({ page: 1 }));
    }
  }, [requestStatus]);
  useEffect(() => {
    if (postDataError) {
      const fields = Object.entries(postDataError).map(([key, errors]) => ({
        name: key,
        errors,
      }));
      form.setFields(fields);
      const allErrors = fields.flatMap((f) => f.errors || []);
      if (allErrors.length) message.error(allErrors.join(", "));

      // navigate to the step that has the error
      if (postDataError.branch) setStep(1);
      else if (postDataError.role) setStep(2);
      else setStep(0);
    }
  }, [postDataError]);
  const columns = useMemo(() => [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => (current_page - 1) * 10 + index + 1,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
    },
    {
      title: "Phone number",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Timezone",
      dataIndex: "timezone",
      key: "timezone",
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
                label: "Edit",
                key: "0",
                onClick: () => getuserDataById(row.id),
              },
              {
                label: "Delete",
                key: "1",
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
  ], [getuserDataById, toggleDelete]);
  return (
    <div>
      <SubHeader
        title={"Users"}
        paragraph={"You can manage users from this section"}
        button_title={"New user"}
        toggle={toggleEdit}
        isDisabled={isLoading}
      />
      {/*Data Table*/}

      <CustomDataTable
        data={data}
        isLoading={isLoading}
        columns={columns}
        action={fetchUserData}
        count={count}
        current={current_page}
      />
      {/*create and edit modal*/}
      <AuthModal
        title={
          formValue.fullname ? `Edit ${formValue.fullname}` : "Create new user"
        }
        isOpen={isOpenModal}
        cancel={toggleEdit}
        isFooter={"none"}
      >
        {!isAdmin && (
          <Steps
            current={step}
            size="small"
            onChange={formValue.id ? (s) => setStep(s) : undefined}
            style={{ marginBottom: 24 }}
            items={[
              { title: "User details" },
              { title: "Branches" },
              { title: "Roles" },
            ]}
          />
        )}
        <Form layout="vertical" form={form}>
          {/* Step 1: User details */}
          <div style={{ display: step === 0 ? "block" : "none" }}>
            <Form.Item
              label="Full name"
              name="fullname"
              rules={[{ required: true, message: "Full name is required!" }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Email is required!" }]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
            {!formValue.id && (
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required!" }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            )}
            {!formValue.id && (
              <Form.Item
                label="Password confirmation"
                name="password_confirmation"
                rules={[
                  {
                    required: true,
                    message: "Password confirmation is required!",
                  },
                ]}
              >
                <Input.Password placeholder="Enter password confirmation" />
              </Form.Item>
            )}
            <Form.Item
              name="phone_number"
              label="Phone number"
              validateFirst
              rules={[
                {
                  required: true,
                  pattern: /^(?:\d*)$/,
                  message: "Value should contain just number",
                },
                {
                  min: 9,
                  message: "Value should be more than 9 character",
                },
                {
                  max: 15,
                  message: "Value should be less than 15 character",
                },
              ]}
              validateTrigger="onBlur"
            >
              <Input
                style={{ width: "100%" }}
                placeholder="Enter phone number"
              />
            </Form.Item>
            <Form.Item label="Job title" name="job_title">
              <Input placeholder="Enter job title" />
            </Form.Item>
            <Form.Item
              label="Time zone"
              name="timezone"
              rules={[{ required: true, message: "Time zone is required!" }]}
            >
              <Select
                placeholder="Select timezone"
                showSearch
                allowClear
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {timeZones.map((item, index) => (
                  <Select.Option key={index} value={item.value}>
                    {item.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="is_admin" valuePropName="checked">
              <Checkbox>Is Admin?</Checkbox>
            </Form.Item>
          </div>

          {/* Step 2: Branches (non-admin only) */}
          {!isAdmin && (
            <div style={{ display: step === 1 ? "block" : "none" }}>
              <Form.Item
                name="branch"
                label="Select branches for this user"
              >
                <Checkbox.Group>
                  <Row>
                    {branchSlice.data.map((item) => (
                      <div
                        className="d-flex"
                        style={{ flexWrap: "wrap" }}
                        key={item.id}
                      >
                        <Checkbox
                          value={item.id}
                          style={{ lineHeight: "32px" }}
                        >
                          {item.name}
                        </Checkbox>
                      </div>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          )}

          {/* Step 3: Roles (non-admin only) */}
          {!isAdmin && (
            <div style={{ display: step === 2 ? "block" : "none" }}>
              <Form.Item
                name="role"
                label="Select roles for this user"
              >
                <Checkbox.Group>
                  <Row>
                    {roleSlice.data.map((item) => (
                      <div
                        className="d-flex"
                        style={{ flexWrap: "wrap" }}
                        key={item.id}
                      >
                        <Checkbox
                          value={item.id}
                          style={{ lineHeight: "32px" }}
                        >
                          {item.name}
                        </Checkbox>
                      </div>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          )}

          <Divider />
          <div className="d-flex justify-content-end" style={{ gap: 8 }}>
            <Button type="text" onClick={toggleEdit}>
              Cancel
            </Button>
            {step > 0 && (
              <Button onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {(isAdmin || step === totalSteps - 1) ? (
              <Button
                className="ant-btn-success"
                loading={postDataLoading}
                onClick={handleSubmit}
              >
                Save
              </Button>
            ) : (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </Form>
      </AuthModal>

      <ConfirmDeleteModal
        isOpen={isOpenDeleteModal}
        onCancel={() => toggleDelete()}
        onConfirm={deleteUser}
        loading={deleteDataLoading}
      />
    </div>
  );
};
