import React, { useEffect, useState } from "react";
import { Button, Form, Input, message, Select, Typography } from "antd";
import HOC from "../HOCS/PublicHOC";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../config";
import {
  registerError,
  registerPending,
  registerSuccess,
} from "../store/features/registerSlice";
import { useDispatch, useSelector } from "react-redux";

const { Text } = Typography;
const { Option } = Select;
const Register = () => {
  const [countries, setCountries] = useState([{}]);
  const [validation, setValidation] = useState(false);
  const dispatch = useDispatch();
  const { isLoading, registerMessage } = useSelector(
    (state) => state.registerSlice,
  );
  const navigate = useNavigate();
  useEffect(() => {
    axiosClient.get("accounts/countries/").then((res) => {
      if (res.data) {
        setCountries(
          Object.keys(res.data).map((item) => {
            return {
              value: item,
              title: res.data[item],
            };
          }),
        );
      }
    });
  }, []);
  const register = (values) => {
    if (values.password !== values.password_confirmation) setValidation(true);
    else {
      // post section
      setValidation(false);
      values["company"] = {
        name: values.company,
        country: values.country,
      };
      delete values["country"];
      dispatch(registerPending());
      axiosClient
        .post("accounts/register/", values)
        .then((res) => {
          dispatch(registerSuccess());
          navigate("/");
          message.success(res.data.message);
        })
        .catch((err) => dispatch(registerError(err.response.data)));
    }
  };
  return (
    <div>
      <h3>
        Already a memeber?{" "}
        <span>
          <Link to={"/"}>Log in</Link>
        </span>
      </h3>
      <Form
        layout="vertical"
        autoComplete="off"
        className="form"
        onFinish={register}
      >
        <Form.Item
          name="fullname"
          rules={[
            {
              required: true,
              registerMessage: "Please enter full name!",
            },
          ]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              registerMessage: "Please email!",
            },
          ]}
        >
          <Input type="email" autoComplete={"off"} placeholder="Enter email" />
        </Form.Item>
        {registerMessage.email &&
          registerMessage.email.map((item, index) => (
            <Text key={index} type="danger">
              {item}
              <br />
            </Text>
          ))}
        <Form.Item
          name="password"
          autoComplete={"off"}
          rules={[
            {
              required: true,
              registerMessage: "Please password!",
            },
          ]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>
        <Form.Item
          name="password_confirmation"
          rules={[
            {
              required: true,
              registerMessage: "Please enter password confirmation!",
            },
          ]}
        >
          <Input.Password placeholder="Enter confirmation password" />
        </Form.Item>
        {registerMessage.password &&
          registerMessage.password.map((item, index) => (
            <Text key={index} type="danger">
              {item} <br />
            </Text>
          ))}
        {validation && <Text type="danger">Passwords are not mathcing!</Text>}
        <Form.Item
          name="phone"
          rules={[
            {
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
          <Input style={{ width: "100%" }} placeholder="Enter phone number" />
        </Form.Item>
        <Form.Item
          name="country"
          rules={[
            {
              required: true,
              registerMessage: "Please select country name!",
            },
          ]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select country"
            disabled={countries.length === 0}
          >
            {countries.map((item) => (
              <Option value={item.value}>{item.title}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="company"
          rules={[
            {
              required: true,
              registerMessage: "Please enter company name!",
            },
          ]}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>
        <Button
          loading={isLoading}
          type="gray"
          size="large"
          block
          htmlType="submit"
        >
          Register
        </Button>
      </Form>
    </div>
  );
};

export default HOC(Register);
