import React from "react";
import { Row, Col } from "antd";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function NoMatch(props) {
  const { isAuth } = useSelector((state) => state.loginSlice);
  return isAuth ? (
    <Row style={{ height: "100vh" }} justify="center" align="center">
      <Col span={2}>
        <h2> 404 Not found</h2>
      </Col>
    </Row>
  ) : (
    <Navigate to={"/"} />
  );
}

export default NoMatch;
