import React from "react";
import { Button, Form, Input, Typography } from "antd";
import HOC from "../HOCS/PublicHOC";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosClient from "../../config";
import { useDispatch, useSelector } from "react-redux";
import {
  loginError,
  loginPending,
  loginSuccess,
} from "../store/features/loginSlice";

const { Text } = Typography;
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.loginSlice);
  const finish = (values) => {
    dispatch(loginPending());
    axiosClient
      .post("accounts/login/", values)
      .then((res) => {
        Cookies.set("q-token", res.data.token, { expires: 30 });
        localStorage.setItem("user", JSON.stringify(res.data));
        dispatch(loginSuccess());
        navigate("/");
      })
      .catch((error) => {
        if (error.response) dispatch(loginError(error.response.data));
      });
  };
  return (
    <div>
      <h3>
        Don't have an account?{" "}
        <span>
          <Link to={"/register"}>Sign up</Link>
        </span>
      </h3>
      <Form
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
          <Input.Password placeholder="Enter password" />
        </Form.Item>
        {Object.values(error).length > 0 &&
          Object.values(error).map((item) => (
            <Text type={"danger"}>{item}</Text>
          ))}
        <Button
          loading={isLoading}
          type="primary"
          size="large"
          block
          htmlType="submit"
        >
          Login
        </Button>
        <div className={"mt-3"}>
          <Link className="login-form-forgot" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </Form>
    </div>
  );
};

export default HOC(Login);
