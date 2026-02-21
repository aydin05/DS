import { Col, Divider, Input, InputNumber, Row } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSlideItems } from "../../../store/features/playListInnerSlice";

const Iframe = ({ properties }) => {
  const { top, left, width, height, index, attr } = properties;
  const dispatch = useDispatch();
  const { selectedItem } = useSelector((state) => state.playListInnerSlice);
  const updateValue = (key, e) => {
    e = e ? e : 0;
    let item = Object.assign({}, properties);
    item[key] = e;
    dispatch(updateSlideItems(item));
  };
  const changeAttribute = (key, e) => {
    let attrObject = Object.assign({}, attr);
    attrObject[key] = e;
    updateValue("attr", attrObject);
  };
  return (
    <>
      <div>
        <Row>
          <Col span={12}>
            <div className="d-flex justify-content-between align-items-center">
              <span>Top : </span>
              <InputNumber
                onChange={(e) => updateValue("top", e)}
                value={top}
                min={0}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="d-flex justify-content-between align-items-center">
              <span className={"mx-2"}>Left : </span>
              <InputNumber
                onChange={(e) => updateValue("left", e)}
                value={left}
                min={0}
              />
            </div>
          </Col>
        </Row>
        <Row className={"mt-2"}>
          <Col span={12}>
            <div className="d-flex justify-content-between align-items-center">
              <span>Width : </span>
              <InputNumber
                onChange={(e) => updateValue("width", e)}
                value={width}
                min={0}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="d-flex justify-content-between align-items-center">
              <span className={"mx-2"}>Height : </span>
              <InputNumber
                onChange={(e) => updateValue("height", e)}
                value={height}
                min={0}
              />
            </div>
          </Col>
        </Row>
        <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
          <span>Index : </span>
          <InputNumber
            onChange={(e) => {
              if (e) {
                updateValue("index", e);
              }
            }}
            value={index}
            min={0}
          />
        </div>
        <Divider className="my-0" />
        <div>
          <span className={"mx-2"}>Url : </span>
          <Input.TextArea
            value={attr.url}
            onChange={(e) => changeAttribute("url", e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <span className={"mx-2"}>Authorization : </span>
          <Input.TextArea
            value={attr.authorization}
            onChange={(e) => changeAttribute("authorization", e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
export default Iframe;
