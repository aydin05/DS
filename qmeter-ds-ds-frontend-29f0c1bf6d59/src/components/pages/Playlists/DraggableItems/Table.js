import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTableCell,
  setTableCellValue,
  updateTableSizes,
} from "../../../store/features/playListInnerSlice";
import { fromEventPattern } from "rxjs";

const Table = (props) => {
  const { table, size } = props;
  const tableRef = useRef(null);
  const dispatch = useDispatch();
  const { selectedItem } = useSelector((state) => state.playListInnerSlice);
  console.log("selectedItem  :", selectedItem);
  // const item = selectedItem.items.find(
  //   (element) => element.index === selectedItem.selectedIndex
  // );
  const columns = table?.tableData?.columns ?? [];
  const rows = table?.tableData?.rows ?? [];
  const cell = selectedItem.selectedTableCell;
  const tableCellValue = selectedItem.tableCellValue;
  const bg_color = table?.bg_color;

  const isStyledColumn = cell?.rowIndex === null && cell?.columnIndex >= 0;
  const isStyledRow = cell?.rowIndex >= 0 && cell?.columnIndex >= 0;

  const handleRowCell = (columnIndex, rowIndex) => {
    let cell = "";
    let innerRow = rows.find((_, index) => index === rowIndex);
    cell = innerRow.find((_, index) => index === columnIndex);
    dispatch(
      selectTableCell({
        selectedTableCell: {
          rowIndex,
          columnIndex,
          column: false,
          rows: false,
        },
        tableCellValue: cell,
      }),
    );
  };

  const handleColumnCell = (columnIndex) => {
    let cell = "";
    cell = columns.find((_, index) => index === columnIndex);
    dispatch(
      selectTableCell({
        selectedTableCell: {
          rowIndex: null,
          columnIndex,
          column: false,
          rows: false,
        },
        tableCellValue: cell,
      }),
    );
  };

  const handleAllColumns = (columnIndex) => {
    let cell = "";
    cell = columns[0]; // its be changeable
    dispatch(
      selectTableCell({
        selectedTableCell: {
          rowIndex: null,
          columnIndex: null,
          column: true,
          rows: false,
        },
        tableCellValue: cell,
      }),
    );
  };

  const handleRow = (rowIndex) => {
    let cell = "";
    let innerRow = rows.find((_, index) => index === rowIndex);
    cell = innerRow[0]; // its be changeable
    dispatch(
      selectTableCell({
        selectedTableCell: {
          rowIndex: null,
          columnIndex: null,
          column: false,
          rows: rowIndex,
        },
        tableCellValue: cell,
      }),
    );
  };

  const checkTableHeadCellValue = useMemo(() => {
    return (th, index) => {
      if (isStyledColumn && index === cell?.columnIndex && tableCellValue) {
        return tableCellValue;
      }
      return th;
    };
  }, [JSON.stringify(tableCellValue), JSON.stringify(columns)]);

  const checkTableBodyCellValue = useMemo(() => {
    return (td, columnIndex, rowIndex) => {
      if (
        isStyledRow &&
        columnIndex === cell?.columnIndex &&
        rowIndex === cell?.rowIndex &&
        tableCellValue
      ) {
        return tableCellValue;
      }
      return td;
    };
  }, [JSON.stringify(tableCellValue), JSON.stringify(columns)]);

  // const handleTableSizes = () => {
  //   const resizeObserver = new ResizeObserver((entries) => {
  //     for (let entry of entries) {
  //       console.log("Div size changed:", entry.contentRect);
  //       let width = entry.contentRect.width;
  //       let height = entry.contentRect.height;
  //       requestAnimationFrame(() => {
  //         // dispatch(
  //         //   updateTableSizes({
  //         //     width,
  //         //     height,
  //         //   })
  //         // );
  //       });
  //     }
  //   });

  //   // Use RxJS to wrap the ResizeObserver in an observable
  //   const resizeObservable = fromEventPattern(
  //     (handler) => resizeObserver.observe(tableRef.current),
  //     (handler) => resizeObserver.unobserve(tableRef.current)
  //   );

  //   // Subscribe to the observable to get size changes
  //   resizeObservable.subscribe();
  // };

  useEffect(() => {
    let width = tableRef.current?.offsetWidth;
    let height = tableRef.current?.offsetHeight;
    if (width || height)
      dispatch(
        updateTableSizes({
          width,
          height,
        }),
      );
  }, [columns.length, rows.length]);

  return (
    <div className={"draggable-table"}>
      <table
        ref={tableRef}
        id="table"
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          backgroundColor: bg_color,
        }}
      >
        <thead>
          <tr className={`${cell?.column && "active-cell"}`}>
            {columns.map((th, index) => (
              <th
                key={index}
                onDoubleClick={() => {
                  handleAllColumns(index);
                }}
                onClick={() => {
                  handleColumnCell(index);
                }}
                // style={{
                //   backgroundColor: checkTableHeadCellValue(th, index)?.attr
                //     ?.backgroundColor,
                // }}
                style={{
                  width:
                    columns.length > 3 ? `${100 / columns.length}%` : "360px",
                  backgroundColor: checkTableHeadCellValue(th, index)?.attr
                    ?.backgroundColor,
                }}
                className={`${isStyledColumn && index === cell?.columnIndex && "active-cell"}`}
              >
                <p
                  style={checkTableHeadCellValue(th, index)?.attr}
                  className={"m-0"}
                >
                  {checkTableHeadCellValue(th, index)?.text}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onDoubleClick={() => handleRow(rowIndex)}
              className={`${cell?.rows === rowIndex && "active-cell"}`}
            >
              {row.map((td, columnIndex) => (
                <td
                  // style={{
                  //   backgroundColor: checkTableBodyCellValue(
                  //     td,
                  //     columnIndex,
                  //     rowIndex
                  //   )?.attr?.backgroundColor,
                  // }}
                  style={{
                    width:
                      columns.length > 3 ? `${100 / columns.length}%` : "360px",
                    backgroundColor: checkTableBodyCellValue(
                      td,
                      columnIndex,
                      rowIndex,
                    )?.attr?.backgroundColor,
                  }}
                  className={`${
                    isStyledRow &&
                    columnIndex === cell?.columnIndex &&
                    rowIndex === cell?.rowIndex &&
                    "active-cell"
                  }`}
                  onClick={() => {
                    handleRowCell(columnIndex, rowIndex);
                  }}
                  key={`${rowIndex}${columnIndex}`}
                >
                  <p
                    style={
                      checkTableBodyCellValue(td, columnIndex, rowIndex).attr
                    }
                    className={"m-0"}
                  >
                    {checkTableBodyCellValue(td, columnIndex, rowIndex).text}
                  </p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
