import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  removeTableColumn,
  removeTableRow,
  setTableCellValue,
  updateSlide,
  updateSlideItems,
  updateTableSizes,
} from "../../../store/features/playListInnerSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Col,
  Divider,
  Input,
  InputNumber,
  Row,
  Select,
  Color,
} from "antd";
import { updateSlidesForTableData } from "../libs/tableWidget";
import { BgColorsOutlined, FullscreenOutlined } from "@ant-design/icons";

export const defaultColumnThStyleAttr = {
  text: "Column",
  attr: {
    fontSize: 20,
    color: "#CA1A33",
    backgroundColor: "transparent",
    fontStyle: "normal",
    textAlign: "center",
  },
};

export const defaultRowTdStyleAttr = {
  text: "Row",
  attr: {
    fontSize: 20,
    color: "#000000",
    backgroundColor: "transparent",
    fontStyle: "normal",
    textAlign: "center",
  },
};

const generateFontSizeItems = () =>
  Array.from({ length: 53 }, (_, i) => {
    const value = (i + 8).toString();
    return { value, label: value };
  });

const Table = ({ properties }) => {
  const { top, left, width, height, index, tableData, bg_color } = properties;
  const colorRef = useRef();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.playListInnerSlice);
  const { selectedItem } = state;
  const columns = tableData.columns;
  const rows = tableData.rows;

  const { tableCellValue } = selectedItem;
  const {
    rowIndex,
    columnIndex,
    rows: selectedRows,
    column: selectedColumns,
  } = selectedItem.selectedTableCell ?? {};

  const { text, attr } = tableCellValue ?? {};
  const { fontSize, backgroundColor, color, fontStyle, textAlign } = attr ?? {};

  const updateValue = (key, e) => {
    e = e ? e : 0;
    let item = Object.assign({}, properties);
    item[key] = e;
    dispatch(updateSlideItems(item));
  };
  const addNewColumn = () => {
    let newRows = rows;
    const addedNewColumnsLength = columns.length + 1;
    if (rows.length) {
      newRows = newRows.map((row) => {
        if (row.length === addedNewColumnsLength) {
          return row;
        } else {
          let innerRows = [...row];
          for (let i = 0; i < addedNewColumnsLength - row.length; i++) {
            innerRows.push(defaultRowTdStyleAttr);
          }
          return innerRows;
        }
      });
    }
    updateValue("tableData", {
      rows: newRows,
      columns: [...columns, defaultColumnThStyleAttr],
    });
  };

  const addNewRow = () => {
    if (!columns.length) return;

    let newRows = new Array(columns.length);
    newRows = [...newRows].map(() => defaultRowTdStyleAttr);

    updateValue("tableData", {
      ...tableData,
      rows: [...rows, newRows],
    });
  };

  const updateTableCellValue = (key, value) => {
    updateSlidesForTableData(state);
    dispatch(
      setTableCellValue({
        ...tableCellValue,
        [key]: value,
      }),
    );
  };

  const handleTableCellValue = (event) => {
    const value = event.target.value;
    updateTableCellValue("text", value);
  };

  const checkTextBoxShown = () => {
    const isRowsFalse = selectedRows === false;
    const isColumnsFalse = selectedColumns === false;

    if (isRowsFalse && isColumnsFalse) return true;
    if (isRowsFalse || isColumnsFalse) return false;
    return true;
  };

  const reCalculateTableWidthAndHeight = () => {
    const element = document.getElementById("table");

    dispatch(
      updateTableSizes({
        width: element.offsetWidth,
        height: element.offsetHeight,
      }),
    );
  };

  const removeColumn = () => {
    dispatch(removeTableColumn());
  };

  const removeRow = () => {
    dispatch(removeTableRow());
  };

  return (
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
      <div className="mx-3">
        Background :
        <span>
          <div
            className="color"
            onClick={() => colorRef.current.click()}
            style={{
              backgroundColor: bg_color,
              border: "1px solid",
            }}
          ></div>
          <input
            type="color"
            style={{ visibility: "hidden" }}
            ref={colorRef}
            onChange={(e) => {
              updateValue("bg_color", e.target.value);
            }}
          />
        </span>
      </div>

      <Col span={12}>
        <div style={{ padding: "10px 0px" }}>
          <Button onClick={() => updateValue("bg_color", "transparent")}>
            Clear background
          </Button>
        </div>
      </Col>

      <Divider className="my-0" />

      <Row className={"d-flex mt-2 justify-content-between"}>
        <Button onClick={addNewColumn} style={{ width: "50%" }}>
          Add Column
        </Button>
        <Button onClick={addNewRow} style={{ width: "50%" }}>
          Add Row
        </Button>
      </Row>
      <Row className={"d-flex justify-content-between"}>
        <Button onClick={removeColumn} style={{ width: "50%" }}>
          Remove Column
        </Button>
        <Button onClick={removeRow} style={{ width: "50%" }}>
          Remove Row
        </Button>
      </Row>
      <Row>
        <Button
          onClick={reCalculateTableWidthAndHeight}
          style={{ width: "50%" }}
        >
          <FullscreenOutlined />
        </Button>
      </Row>
      {/*<Button block className={"my-2"} onClick={openTableCellStyleContainer}>Change style</Button>*/}

      <Divider />
      {tableCellValue && (
        <Fragment>
          <Row span={12}>
            {checkTextBoxShown() && (
              <Input value={text} onChange={handleTableCellValue} />
            )}
          </Row>
          <Row className={"mt-3"}>
            <Col span={12}>
              <div className="d-flex justify-content-between align-items-center">
                <span>Font size : </span>
                <Select
                  value={fontSize}
                  style={{ minWidth: 60 }}
                  onChange={(value) =>
                    updateTableCellValue("attr", {
                      ...attr,
                      fontSize: +value,
                    })
                  }
                  options={generateFontSizeItems()}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="d-flex justify-content-between align-items-center">
                <span className={"mx-2"}>Color : </span>
                <Input
                  value={color}
                  type={"color"}
                  style={{
                    width: 50,
                  }}
                  onChange={(event) =>
                    updateTableCellValue("attr", {
                      ...attr,
                      color: event.target.value,
                    })
                  }
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="d-flex justify-content-between align-items-center">
                <span>F/style : </span>
                <Select
                  value={fontStyle}
                  style={{ minWidth: 60 }}
                  onChange={(value) =>
                    updateTableCellValue("attr", {
                      ...attr,
                      fontStyle: value,
                    })
                  }
                  options={[
                    { value: "bold", label: "Bold" },
                    { value: "italic", label: "Italic" },
                    { value: "normal", label: "Normal" },
                  ]}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="d-flex justify-content-between align-items-center">
                <span className={"mx-2"}>Bg color : </span>
                <Input
                  value={backgroundColor}
                  onChange={(event) =>
                    updateTableCellValue("attr", {
                      ...attr,
                      backgroundColor: event.target.value,
                    })
                  }
                  type={"color"}
                  style={{
                    width: 50,
                  }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="d-flex justify-content-between align-items-center">
                <span className={"mx-2"}>Transparent color : </span>
                <Button
                  onClick={() =>
                    updateTableCellValue("attr", {
                      ...attr,
                      backgroundColor: "transparent",
                    })
                  }
                >
                  <BgColorsOutlined />
                </Button>
              </div>
            </Col>
          </Row>
        </Fragment>
      )}
    </div>
  );
};

export default Table;
