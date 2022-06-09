import { Button, Form, Input, Layout, Row, Typography } from "antd";

export default function Login() {
  function onFinish(values) {
    console.log(values);
  }

  return (
    <Layout>
      <Layout.Content>
        <Row
          align="middle"
          justify="center"
          style={{ width: "100wh", height: "100vh" }}
        >
          <Form onFinish={onFinish} style={{ width: "300px" }}>
            <Form.Item>
              <Typography.Title
                level={3}
                style={{ width: "100%", textAlign: "center" }}
              >
                PDV Online
              </Typography.Title>
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Insira um endereço de e-mail",
                },
              ]}
            >
              <Input type="text" placeholder="Email" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: "Insira uma senha",
                },
              ]}
            >
              <Input type="password" placeholder="Senha" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
              >
                ACESSAR
              </Button>
            </Form.Item>
          </Form>
        </Row>
      </Layout.Content>
    </Layout>
  );
}
