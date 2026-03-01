import { Row, Col, Button, Typography } from "antd";

const { Title } = Typography;
export const SubHeader = ({
  title,
  paragraph,
  button_title,
  toggle,
  isDisabled,
}) => {
  return (
    <div>
      <Row gutter={16} justify="space-between" align="middle">
        <Col span={20}>
          <Title level={3} className="mb-1">
            {title}
          </Title>
          <p className="my-0">{paragraph}</p>
        </Col>
        {button_title && (
          <Col span={4}>
            <Button disabled={isDisabled} block className="ant-btn-success" onClick={toggle}>
              {button_title}
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};
