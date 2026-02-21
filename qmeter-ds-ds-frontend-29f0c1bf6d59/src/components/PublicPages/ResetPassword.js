import React, { useState } from "react";
import HOC from "../HOCS/PublicHOC";
import { Button, Form, Input, message, Typography } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import axiosClient from "../../config";

const { Text } = Typography;

const ResetPassword = (props) => {
  const [loading, setLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState([]);
  const params = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const finish = (values) => {
    if (values.password !== values.password_confirmation) {
      form.setFields([
        {
          name: "password",
          errors: ["The password confirmation does not match"],
        },
      ]);
      return;
    }
    let token = params.search.slice(params.search.indexOf("token=") + 6);
    if (!token) return;
    let body = {
      uidb64: "NTM",
      token,
      ...values,
    };
    setLoading(true);
    axiosClient
      .post(`accounts/reset-password/`, body)
      .then((res) => {
        res.data.message && message.success(res.data.message);
        setLoading(false);
        form.resetFields();
        navigate("/");
      })
      .catch((err) => {
        setLoading(false);
        err.response.data.password &&
          setResetErrors(err.response.data.password);
      });
  };

  return (
    <div>
      <h3>
        Do you have an account?{" "}
        <span>
          <Link to={"/"}>Log in</Link>
        </span>
      </h3>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        className="form"
        onFinish={finish}
      >
        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: "Please password!",
            },
          ]}
        >
          <Input.Password
            placeholder="Enter password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Form.Item
          label="Password confirmation"
          name="password_confirmation"
          rules={[
            {
              required: true,
              message: "Please password confirmation!",
            },
          ]}
        >
          <Input.Password
            placeholder="Enter password confirmation"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        {resetErrors?.map((item, index) => (
          <p key={index}>
            <Text type="danger">{item}</Text>
          </p>
        ))}
        <Button
          loading={loading}
          type="gray"
          size="large"
          block
          htmlType="submit"
        >
          Reset
        </Button>
      </Form>
    </div>
  );
};

export default HOC(ResetPassword);
