import React from "react";
import { Col, Row } from "antd";
import logo from "../../assets/images/qmeter-logo.svg";

const WrappedHoc = (WrappedComponent) => {
  class HOC extends React.Component {
    render() {
      return (
        <div>
          <div className="authenticated-page">
            <Row justify="center" align="middle" style={{ height: "100vh" }}>
              <Col xs={0} md={13}>
                <div>
                  <img src={logo} alt={"Logo"} />
                  <h2 className="mt-1">Welcome to Qmeter Digital Signage</h2>
                </div>
              </Col>
              <Col xs={22} md={7}>
                <WrappedComponent />
              </Col>
            </Row>
          </div>
        </div>
      );
    }
  }
  return HOC;
};
export default WrappedHoc;
