import { Layout, PageHeader, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function Header({ user, client }) {
  const navigate = useNavigate();

  function handleLogout() {
    client.auth.signOut();
  }

  return (
    <Layout.Header style={{ padding: "0px", height: "3.5rem" }}>
      <PageHeader
        title={
          <Button
            type="text"
            onClick={() => navigate("/")}
            style={{ fontWeight: "bold" }}
          >
            {user ? user.companies.name.toUpperCase() : ""}
          </Button>
        }
        ghost={false}
        extra={[
          <Button key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
            Sair
          </Button>,
        ]}
        style={{ padding: "8px 16px" }}
      />
    </Layout.Header>
  );
}
