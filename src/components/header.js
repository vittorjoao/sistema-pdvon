import { Layout, PageHeader, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

export default function Header({ user, client }) {
  function handleLogout() {
    client.auth.signOut();
  }

  return (
    <Layout.Header style={{ padding: '0px', height: '3.5rem' }}>
      <PageHeader
        title={user ? user.companies.name.toUpperCase() : ''}
        ghost={false}
        extra={[
          <Button key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
            Sair
          </Button>,
        ]}
        style={{ padding: '8px 16px' }}
      />
    </Layout.Header>
  );
}
