import React, { useRef, useState } from "react";
import { AuthModal } from "../../../SubComponents/AuthModal";
import { Button, Checkbox, Col, Divider, InputNumber, Row } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateSlideItems } from "../../../store/features/playListInnerSlice";
import { CloseOutlined } from "@ant-design/icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
// import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Editor from "ckeditor5-custom-build/build/ckeditor";
import { fontSizeOptions } from "../../../../staticData";
const editorConfiguration = {
  fontSize: {
    options: fontSizeOptions,
  },
  toolbar: {
    items: [
      "heading",
      "|",
      "fontfamily",
      "fontsize",
      "|",
      "alignment",
      "|",
      "fontColor",
      "fontBackgroundColor",
      "|",
      "bold",
      "italic",
      "strikethrough",
      "underline",
      "subscript",
      "superscript",
      "|",
      "outdent",
      "indent",
      "|",
      "bulletedList",
      "numberedList",
      "todoList",
      "|",
      "code",
      "codeBlock",
      "|",
      "undo",
      "redo",
    ],
    supportAllValues: true,
  },
};
const Text = ({ properties }) => {
  const { top, left, width, height, index, attr } = properties;
  const dispatch = useDispatch();
  const colorRef = useRef();
  const [isOpen, setIsOpen] = useState(false);
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
  const toggle = () => setIsOpen(!isOpen);

  const handleChangeEditor = (e) => {
    changeAttribute("textarea", e);
  };
  const getSingleText = (editorText) => {
    const cutTextFromHtmlTagsRegex = /(<([^>]+)>)/gi;
    return editorText.replace(cutTextFromHtmlTagsRegex, "");
  };

  return (
    <div>
      <div>
        {/*<Input.TextArea value={model}/>*/}
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
        <div className="d-flex justify-content-between align-items-center mt-2 mb-3">
          <Checkbox
            checked={attr.is_scrolling}
            onChange={(e) => changeAttribute("is_scrolling", e.target.checked)}
          >
            {attr.is_scrolling ? " Disable scrolling" : "Enable scrolling"}
          </Checkbox>
          <InputNumber
            onChange={(e) => {
              changeAttribute("speed", e);
            }}
            disabled={!attr.is_scrolling}
            value={attr.speed}
            min={0}
          />
        </div>
        <span className="d-flex">
          <span className="p-2">Frame background color :</span>{" "}
          <div
            className="color"
            onClick={() => colorRef.current.click()}
            style={{
              backgroundColor: attr.frame_bg_color,
              border: "1px solid gray",
              marginLeft: "5px",
            }}
          ></div>
          <input
            type="color"
            value={attr.frame_bg_color}
            style={{ visibility: "hidden" }}
            ref={colorRef}
            onChange={(e) => {
              changeAttribute("frame_bg_color", e.target.value);
            }}
          />
        </span>
        {attr.frame_bg_color !== "transparent" && (
          <div className={"mb-3"}>
            <Button
              icon={<CloseOutlined />}
              size={"small"}
              className="close"
              onClick={() => {
                changeAttribute("frame_bg_color", "transparent");
              }}
            ></Button>{" "}
            Remove frame background color
          </div>
        )}
        <p className={"dangerously-div"} onClick={toggle}>
          {getSingleText(attr.textarea)}
        </p>
      </div>
      <AuthModal
        title={"Edit text content"}
        // isFooter={"none"}
        cancel={toggle}
        save={toggle}
        isOpen={isOpen}
        width={1000}
      >
        <CKEditor
          editor={Editor}
          data={attr.textarea}
          config={editorConfiguration}
          onChange={(event, editor) => {
            const data = editor.getData();
            handleChangeEditor(data);
          }}
        />
      </AuthModal>
    </div>
  );
};

export default Text;
