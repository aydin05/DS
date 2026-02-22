import React from "react";
import { Button, Modal } from "antd";

const ConfirmDeleteModal = ({
  isOpen,
  onCancel,
  onConfirm,
  loading = false,
  title = "Are you sure?",
  message = "You will not be able to recover this!",
}) => {
  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
    >
      <h3 style={{ textAlign: "center" }}>{message}</h3>
      <div className="d-flex justify-content-end" style={{ marginTop: 16 }}>
        <Button type="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="ant-btn-danger"
          loading={loading}
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
