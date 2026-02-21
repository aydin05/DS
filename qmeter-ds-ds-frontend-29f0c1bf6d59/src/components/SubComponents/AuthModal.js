import { Modal } from "antd";

export const AuthModal = ({
  isOpen,
  title,
  cancel,
  save,
  children,
  isFooter,
  okType,
  width,
}) => {
  return (
    <div>
      <Modal
        title={title}
        visible={isOpen}
        onCancel={cancel}
        onOk={save}
        okButtonProps={{ style: { display: isFooter } }}
        cancelButtonProps={{ style: { display: isFooter } }}
        okType={okType}
        width={width}
      >
        {children}
      </Modal>
    </div>
  );
};
