import { useEffect, useState } from 'react';
import { Button, Form, Input, Layout, Row, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { handleLogin, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (localStorage.getItem('email')) {
      setEmail(localStorage.getItem('email'));
      setPassword(localStorage.getItem('password'));
    }
  }, []);

  function onSubmit(values) {
    handleLogin(values.email, values.password);
  }

  return (
    <Layout>
      <Layout.Content>
        <Row
          align="middle"
          justify="center"
          style={{ width: '100wh', height: '100vh' }}
        >
          <Form onFinish={onSubmit} style={{ width: '300px' }}>
            <Form.Item>
              <Typography.Title
                level={3}
                style={{ width: '100%', textAlign: 'center' }}
              >
                PDV Online
              </Typography.Title>
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Insira um endereço de e-mail',
                },
              ]}
            >
              <Input
                type="text"
                value={email}
                placeholder="Email"
                prefix={<UserOutlined />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Insira uma senha',
                },
              ]}
            >
              <Input
                type="password"
                value={password}
                placeholder="Senha"
                prefix={<LockOutlined />}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ width: '100%' }}
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
