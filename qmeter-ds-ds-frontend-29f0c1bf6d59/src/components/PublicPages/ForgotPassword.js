import React, { useState } from "react";
import HOC from "../HOCS/PublicHOC";
import { Button, Form, Input, message, Typography } from "antd";
import { Link } from "react-router-dom";
import axiosClient, { prod_url } from "../../config";
const { Text } = Typography;

const ForgotPassword = (props) => {
  const [loading, setLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState([]);

  const [form] = Form.useForm();
  const finish = (values) => {
    setLoading(true);
    axiosClient
      .post(
        `accounts/forget-password/?redirect_url=${prod_url}reset-password`,
        values,
      )
      .then((res) => {
        res.data.message && message.success(res.data.message);
        setLoading(false);
        form.resetFields();
      })
      .catch((err) => {
        setLoading(false);
        err.response.data.email && setResetErrors(err.response.data.email);
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
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please email!",
            },
          ]}
        >
          <Input type="email" placeholder="Enter email" />
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
          Send
        </Button>
      </Form>
    </div>
  );
};

export default HOC(ForgotPassword);
