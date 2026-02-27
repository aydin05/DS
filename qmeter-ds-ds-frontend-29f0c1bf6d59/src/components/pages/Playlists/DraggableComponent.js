import React, { useEffect, useState } from "react";
import { Button, Col, Collapse, Row, Slider, Spin } from "antd";
import Properties from "./Properties";
import { CloseOutlined, HolderOutlined, PlusOutlined } from "@ant-design/icons";
import image from "../../../assets/images/social.jpeg";
import { Rnd } from "react-rnd";
import { useDispatch, useSelector } from "react-redux";
import cancel from "../../../assets/images/cancel.svg";
import {
  addSlide,
  removeItem,
  removeSlide,
  reorderSlides,
  selectedSlideItem,
  selectSlide,
  updateItemIndex,
  updateSlideItems,
} from "../../store/features/playListInnerSlice";
import Table from "./DraggableItems/Table";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableSlide({ item, index, selectedPosition, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: String(item.position) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`slide ${item.position === selectedPosition ? "active" : ""}`}
    >
      <div className="slide-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span
          {...attributes}
          {...listeners}
          className="drag-handle"
          style={{ cursor: "grab", display: "inline-flex", alignItems: "center" }}
        >
          <HolderOutlined />
        </span>
        <span className="slide-label" style={{ flex: 1, textAlign: "center", fontSize: "12px" }}>Slide {index}</span>
        <span className="close" onClick={() => onRemove(Number(item.position))}>
          <CloseOutlined />
        </span>
      </div>
      <div
        className={`slide-inner ${item.position === selectedPosition ? "active" : ""}`}
        onClick={() => onSelect(item.position)}
      >
        <span className="duration">{item.duration} sec</span>
      </div>
    </div>
  );
}

const EDITOR_MAX_WIDTH = 1000;
const EDITOR_MAX_HEIGHT = 600;

function DraggableComponent({ size }) {
  const dispatch = useDispatch();
  const { selectedItem, slides, selectedPosition, fetchSlideStatus } =
    useSelector((state) => state.playListInnerSlice);
  const [zoom, setZoom] = useState(100);

  // Calculate base scale so the full display type fits within the editor area
  const canvasWidth = size.width || 1920;
  const canvasHeight = size.height || 1080;
  const baseScale = Math.min(
    EDITOR_MAX_WIDTH / canvasWidth,
    EDITOR_MAX_HEIGHT / canvasHeight
  );
  const effectiveScale = baseScale * (zoom / 100);
  const scaledW = canvasWidth * effectiveScale;
  const scaledH = canvasHeight * effectiveScale;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const sortedSlides = [...slides].sort(
    (a, b) => Number(a.position) - Number(b.position),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedSlides.findIndex(
      (s) => String(s.position) === active.id,
    );
    const newIndex = sortedSlides.findIndex(
      (s) => String(s.position) === over.id,
    );
    if (oldIndex !== -1 && newIndex !== -1) {
      dispatch(reorderSlides({ oldIndex, newIndex }));
    }
  };

  const addNewSlide = () => dispatch(addSlide()); /*Adding new slide in redux*/

  const setActiveSlide = (id) => dispatch(selectSlide(id)); /*Activated slide*/

  const findItem = (id) =>
    selectedItem?.items?.find((item) => item.position_id === id);
  const onResize = (e, d, ref, delta, position, id) => {
    let element = Object.assign({}, findItem(id));
    element["width"] = Number(
      ref.style.width.slice(0, ref.style.width.indexOf("p")),
    );
    element["height"] = Number(
      ref.style.height.slice(0, ref.style.height.indexOf("p")),
    );
    element["top"] = position.y;
    element["left"] = position.x;
    updateValue(element);
  };
  const onDragDrop = (e, d, id) => {
    let element = Object.assign({}, findItem(id));
    element.left = d.x;
    element.top = d.y;
    updateValue(element);
  };
  const updateValue = (item) => {
    dispatch(updateSlideItems(item));
  };
  useEffect(() => {
    dispatch(selectedSlideItem());
  }, []); //mounting
  return (
    <div className="draggable-component">
      <Row className="mt-4">
        <Col span={18} className="pr-3">
          <div className="box" style={{ width: scaledW + 2, height: scaledH + 2, minWidth: 0, maxWidth: 'none', overflow: 'hidden' }}>
            <div
              className="box-container"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'left top',
                backgroundColor: selectedItem?.bg_color,
                position: 'relative',
              }}
              id={"box-container"}
            >
              {/*React rnd section*/}
              {fetchSlideStatus ? (
                <div
                  style={{
                    height: "500px",
                  }}
                  className={"d-flex justify-content-center align-items-center"}
                >
                  <Spin />
                </div>
              ) : (
                (selectedItem?.items || []).map((item, i) => {
                  return (
                    <Rnd
                      key={i}
                      bounds="#box-container"
                      onResizeStop={(e, d, ref, delta, positon) => {
                        onResize(e, d, ref, delta, positon, item.position_id);
                      }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        dispatch(updateItemIndex(item));
                      }}
                      onDragStop={(e, d) => {
                        e.stopPropagation();
                        onDragDrop(e, d, item.position_id);
                      }}
                      style={{
                        touchAction: "none",
                        zIndex: 9999999 + item.index,
                        border:
                          item.index === selectedItem?.selectedIndex &&
                          "1px solid gray",
                      }}
                      className="rnd"
                      size={{
                        width: item.width,
                        height: item.height,
                      }}
                      position={{
                        x: item.left,
                        y: item.top,
                      }}
                    >
                      {item.type === "video" ? (
                        <video
                          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
                          controls
                          loop={item.attr.isLoop}
                          muted={item.attr.ismute}
                          src={item.file}
                          draggable={false}
                        >
                          Browser not supported
                        </video>
                      ) : item.type === "image" ? (
                        <div
                          style={{
                            backgroundImage: `url(${item.file})`,
                            width: "100%",
                            height: "100%",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        ></div>
                      ) : item.type === "text" || item.type === "globaltext" ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: item.attr.frame_bg_color,
                          }}
                        >
                          {item.attr.is_scrolling ? (
                            <marquee
                              behavior="scroll"
                              direction="left"
                              scrollamount={item.attr.speed}
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: item.attr.textarea,
                                }}
                              />
                            </marquee>
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: item.attr.textarea,
                              }}
                            />
                          )}
                        </div>
                      ) : item.type === "site" ? (
                        <div
                          className={
                            "d-flex justify-content-center align-items-center"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            background: item.attr.frame_bg_color,
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
                      ) : item.type === "table" ? (
                        <Table table={item} size={size} />
                      ) : (
                        <div></div>
                      )}
                      {item.index === selectedItem?.selectedIndex && (
                        <span
                          onClick={() => dispatch(removeItem(item))}
                          className="cancel"
                        >
                          <img src={cancel} alt={"cancel"} />
                        </span>
                      )}
                    </Rnd>
                  );
                })
              )}
            </div>
          </div>
        </Col>
        <Col span={6}>
          <Properties size={size} />
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              Canvas: {canvasWidth} x {canvasHeight} &middot; Zoom: {zoom}%
            </div>
            <Slider min={20} max={150} value={zoom} onChange={(e) => setZoom(e)} />
          </div>
        </Col>
      </Row>
      <div className="slides__container">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedSlides.map((s) => String(s.position))}
            strategy={horizontalListSortingStrategy}
          >
            <div className="slides">
              {sortedSlides.map((item, idx) => (
                <SortableSlide
                  key={item.position}
                  item={item}
                  index={idx + 1}
                  selectedPosition={selectedPosition}
                  onSelect={setActiveSlide}
                  onRemove={(pos) => dispatch(removeSlide(pos))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button icon={<PlusOutlined />} onClick={addNewSlide}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default DraggableComponent;
