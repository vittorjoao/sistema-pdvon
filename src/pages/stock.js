import { Layout } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useClient } from 'react-supabase';
import Footer from '../components/footer';
import Header from '../components/header';
import Content from '../components/content';

export default function Stock() {
  const { user } = useAuth();
  const client = useClient();

  return (
    <Layout>
      <Header user={user} client={client} />
      <Content>
        <p>estoque</p>
      </Content>
      <Footer />
    </Layout>
  );
}
