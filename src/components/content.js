import { Layout } from 'antd';

export default function Content({ children }) {
  return (
    <Layout.Content
      style={{
        width: '100wh',
        height: 'calc(100vh - 11.5rem)',
        padding: '1rem 2rem 1rem 2rem',
      }}
    >
      {children}
    </Layout.Content>
  );
}
