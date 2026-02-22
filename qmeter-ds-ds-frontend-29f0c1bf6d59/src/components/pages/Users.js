import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
  Row,
  Select,
  Tabs,
  Typography,
} from "antd";
import tableAction from "../../assets/images/table-action.svg";
import { SubHeader } from "../SubComponents/SubHeader";
import { AuthModal } from "../SubComponents/AuthModal";
import { timeZones, weeks } from "../../staticData";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUserData,
  fetchUserData,
  getUserDataById,
  postUserData,
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
  const [disabled, setDisabled] = useState(false);
  const [tab, setTab] = useState("1");
  /*component actions*/
  const toggleEdit = () => {
    if (formValue.id) {
      setDisabled(false);
    }
    tab !== "1" && changeTab("1");
    dispatch(toggleModal());
  };
  const toggleDelete = (id = null) => dispatch(toggleDeleteModal(id));

  const changeCheckbox = ({ target }) => {
    if (target.checked) {
      form.setFields([
        { name: "role", value: undefined },
        { name: "branch", value: undefined },
      ]);
      setDisabled(true);
    } else {
      setDisabled(target.checked);
    }
  };
  const changeTab = (key) => key !== tab && setTab(key);
  const deleteUser = () => dispatch(deleteUserData(deleteUserId));
  const getuserDataById = (id) => {
    dispatch(getUserDataById(id));
    setDisabled(false);
  };

  const finish = async () => {
    try {
      const values = await form.validateFields();

      values.day_of_week = 1;

      if (!values.is_admin) {
        const currentValues = form.getFieldsValue();

        const hasBranch =
          Array.isArray(currentValues.branch) &&
          currentValues.branch.length > 0;
        const hasRole =
          Array.isArray(currentValues.role) && currentValues.role.length > 0;

        if (!hasBranch) {
          form.setFields([
            { name: "branch", errors: ["Please select at least one branch"] },
          ]);
          setTab("2");
          return;
        }

        if (!hasRole) {
          form.setFields([
            { name: "role", errors: ["Please select at least one role"] },
          ]);
          setTab("3");
          return;
        }
      } else {
        values.branch = [];
        values.role = [];
      }

      if (values.password !== values.password_confirmation) {
        form.setFields([
          {
            name: "password_confirmation",
            errors: ["The password confirmation does not match"],
          },
        ]);
        return;
      }

      if (formValue.id) {
        values.id = formValue.id;
        if (!values.job_title) delete values.job_title;
        dispatch(updateUserData(values));
      } else {
        dispatch(postUserData(values));
      }

      setTab("1");
    } catch (err) {
      const firstError = err?.errorFields?.[0]?.name?.[0];
      if (firstError === "branch") setTab("2");
      else if (firstError === "role") setTab("3");
      else setTab("1");
    }
  };

  /*side effects*/
  useEffect(() => {
    // dispatch(fetchUserData({ page: 1 })); //get user data
    dispatch(fetchBranchData({ page: 1 })); //get branch data
    dispatch(fetchRoleData({ page: 1 })); //get role data
  }, []);

  useEffect(() => {
    // set form value data to form
    if (formValue.id) {
      form.setFieldsValue(formValue);
    } else {
      form.resetFields();
    }
    // check is_admin field false or true

    if (formValue.is_admin) {
      setDisabled(true);
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
      form.setFields(
        Object.entries(postDataError).map((item) => {
          return {
            name: item[0],
            errors: item[1],
          };
        }),
      );

      if (Object.entries(postDataError).length > 2) {
        tab !== "1" && setTab("1");
      } else if (
        Object.entries(postDataError).length === 2 &&
        postDataError.branch &&
        postDataError.role
      ) {
        changeTab("2");
      } else if (postDataError.role) {
        changeTab("3");
      }
    }
  }, [postDataError]);
  // useEffect(() => {
  //
  //     let anotherErrors = Object.entries(postDataError).length > 2;
  //
  //     if (anotherErrors) tab !=="1" && setTab("1");
  //     let branch = form.getFieldError('branch').length>0;
  //
  //     let role = form.getFieldError('role').length > 0;
  //
  //     if (branch) setTab("2");
  //     else if (role) setTab("3")
  //
  // }, [form])
  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (text, row, index) => index + 1,
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
          overlay={
            <Menu
              items={[
                {
                  label: <a onClick={() => getuserDataById(row.id)}>Edit</a>,
                  key: "0",
                },
                {
                  label: <a onClick={() => toggleDelete(row.id)}>Delete</a>,
                  key: "1",
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
        <Form layout="vertical" onFinish={finish} form={form}>
          <Tabs activeKey={tab} onChange={changeTab} items={[
            {
              key: "1",
              label: "User details",
              children: (
                <>
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
                    label={"Time zone"}
                    name={"timezone"}
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
                    <Checkbox defaultChecked={false} onChange={changeCheckbox}>
                      Is Admin?
                    </Checkbox>
                  </Form.Item>
                </>
              ),
            },
            ...(!disabled && !form.getFieldsValue().is_admin ? [
              {
                key: "2",
                label: "Branches",
                children: (
                  <Form.Item
                    name="branch"
                    label="Branches"
                    initialValue={formValue.branch || []}
                  >
                    <Checkbox.Group>
                      <Row>
                        {branchSlice.data.length > 0 &&
                          branchSlice.data.map((item, index) => (
                            <div
                              className="d-flex"
                              style={{
                                flexWrap: "wrap",
                              }}
                              key={index}
                            >
                              <Checkbox
                                value={item.id}
                                style={{
                                  lineHeight: "32px",
                                }}
                              >
                                {item.name}
                              </Checkbox>
                            </div>
                          ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                ),
              },
              {
                key: "3",
                label: "Roles",
                children: (
                  <Form.Item
                    name="role"
                    label="Roles"
                    initialValue={formValue.role || []}
                  >
                    <Checkbox.Group>
                      <Row>
                        {roleSlice.data.length > 0 &&
                          roleSlice.data.map((item, index) => (
                            <div
                              className="d-flex"
                              style={{
                                flexWrap: "wrap",
                              }}
                              key={index}
                            >
                              <Checkbox
                                value={item.id}
                                style={{
                                  lineHeight: "32px",
                                }}
                              >
                                {item.name}
                              </Checkbox>
                            </div>
                          ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                ),
              },
            ] : []),
          ]} />
          <Divider />
          {/*{*/}
          {/*    postDataError && <div>*/}
          {/*        <Typography.Text className="ant-btn-danger">All errors : </Typography.Text>*/}
          {/*        <br/>*/}
          {/*        {Object.values(postDataError).map(item => (item.map((i, z) => <Text*/}
          {/*            key={z}*/}
          {/*            type={"danger"}>*{i} <br/></Text>)))}*/}
          {/*    </div>*/}
          {/*}*/}
          <div className="d-flex justify-content-end">
            <Button type="text" htmlType="button" onClick={toggleEdit}>
              Cancel
            </Button>
            <Button className="ant-btn-success" loading={postDataLoading} htmlType="submit">
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
        // save={deleteDisplaytype}
        okType={"danger"}
        isFooter={"none"}
      >
        <h3 align="center">You will not be able to recover this!</h3>
        <div className="d-flex justify-content-end">
          <Button type="text" htmlType="button" onClick={() => toggleDelete()}>
            Cancel
          </Button>
          <Button
            onClick={deleteUser}
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
