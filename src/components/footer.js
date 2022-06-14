import { Layout, Row, Col, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const options = [
  {
    title: 'Caixa',
    to: '/caixa',
    disabled: true,
  },
  {
    title: 'Clientes',
    to: '/clientes',
    disabled: true,
  },
  {
    title: 'Financeiro',
    to: '/financeiro',
    disabled: true,
  },
  {
    title: 'Estoque',
    to: '/estoque',
    disabled: false,
  },
  {
    title: 'Configurações',
    to: '/configuracoes',
    disabled: true,
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <Layout.Footer
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100%',
        height: '8rem',
        padding: '8px 16px',
        backgroundColor: '#fff',
      }}
    >
      <Row
        align="middle"
        justify="center"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Col flex="auto" style={{ textAlign: 'center' }}>
          {options.map((option) => (
            <Button
              key={option.title}
              disabled={option.disabled}
              size="large"
              style={{ minWidth: '7rem', margin: '.2rem .2rem .2rem .2rem' }}
              onClick={() => navigate(option.to)}
            >
              {option.title}
            </Button>
          ))}
        </Col>
      </Row>
    </Layout.Footer>
  );
}
