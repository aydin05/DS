import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchPreview,
  fetchWidgetTypes,
} from "../../store/features/playListInnerSlice";
import { Spin } from "antd";

const Preview = (props) => {
  const dispatch = useDispatch();
  const params = useParams();
  const { previewStatus, previewData, widgetTypes } = useSelector(
    (state) => state.playListInnerSlice,
  );
  const [currentSlide, setCurrentSlide] = useState([]);

  const startPlayList = (index) => {
    if (previewData.slides.length === index) {
      startPlayList(0);
      return;
    }
    setCurrentSlide(previewData.slides[index]);
    let duration = previewData.slides[index].duration * 1000;
    setTimeout(() => {
      startPlayList(index + 1);
    }, duration);
  };
  const elements = (item) => {
    switch (item.type) {
      case "image":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: "url('" + item.file + "')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        );
      case "video":
        let props = {};
        if (item.attr.isLoop) {
          props.loop = true;
        }
        if (item.attr.ismute) {
          props.muted = true;
        }
        return (
          <video
            src={item.file}
            preload="metadata"
            autoPlay
            type="video/mp4"
            style={{ width: "100%", height: "100%" }}
            {...props}
          />
        );
      case "text":
      case "globaltext":
        if (item.attr.is_scrolling) {
          return (
            <marquee
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: item.attr.frame_bg_color,
                overflow: "hidden",
              }}
              behavior="scroll"
              direction="left"
              scrollamount={item.attr.speed}
            >
              <div dangerouslySetInnerHTML={{ __html: item.attr.textarea }} />
            </marquee>
          );
        } else {
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: item.attr.frame_bg_color,
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: item.attr.textarea }}
            />
          );
        }
      case "site":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <iframe
              style={{
                width: "100%",
                height: "100%",
              }}
              allowFullScreen={true}
              src={item.attr.url}
            ></iframe>
          </div>
        );
      case "table":
        return (
          <div
            className="draggable-table"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <table>
              <thead>
                <tr>
                  {item.tableData.columns.map((th, index) => (
                    <th
                      key={index}
                      // style={{
                      //   backgroundColor: checkTableHeadCellValue(th, index)
                      //     ?.attr?.backgroundColor,
                      // }}
                    >
                      <p style={{ ...th.attr }} className={"m-0"}>
                        {th.text}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((td, columnIndex) => (
                      <td
                        style={{
                          backgroundColor: td.attr,
                        }}
                        key={`${rowIndex}${columnIndex}`}
                      >
                        <p style={{ ...td.attr }} className={"m-0"}>
                          {td.text}
                        </p>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };
  useEffect(() => {
    dispatch(fetchWidgetTypes());
  }, []);

  useEffect(() => {
    if (widgetTypes.length > 0) {
      dispatch(
        fetchPreview({
          id: params.id,
          display_type: params.display_type,
          widgetTypes,
        }),
      );
    }
  }, [widgetTypes]);

  useEffect(() => {
    /*you catch the status from the redux and start the playList*/

    console.log("previewData.slides : ", previewData.slides);

    if (previewData.slides && previewData.slides.length > 0) {
      startPlayList(0);
    }
  }, [previewData.slides]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        cursor: "none",
      }}
    >
      {previewStatus ? (
        <Spin />
      ) : (
        <div
          style={{
            position: "relative",
            backgroundColor: currentSlide.bg_color,
            width: previewData.general?.width,
            height: previewData.general?.height,
          }}
        >
          {currentSlide.items &&
            currentSlide.items.map((item, index) => {
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    width: item.width + "px",
                    height: item.height + "px",
                    top: item.top + "px",
                    left: item.left + "px",
                    zIndex: item.index,
                  }}
                >
                  {elements(item)}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
export default Preview;
