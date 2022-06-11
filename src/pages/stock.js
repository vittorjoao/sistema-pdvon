import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  BarcodeOutlined,
  CloseOutlined,
  ExclamationOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useClient } from 'react-supabase';
import Footer from '../components/footer';
import Header from '../components/header';
import Content from '../components/content';
import Highlighter from 'react-highlight-words';
import { formatNumber, parseNumber } from '../components/utils';
import moment from 'moment';

const buttonStyle = {
  minWidth: '7rem',
  margin: '.2rem .2rem .2rem .2rem',
};

export default function Stock() {
  const { user } = useAuth();
  const client = useClient();

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState([null, null]);
  const [category, setCategory] = useState([null, null]);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [profitPrice, setProfitPrice] = useState(0);
  const [stockStart, setStockStart] = useState(0);
  const [stockMinimum, setStockMinimum] = useState(0);
  const [stockMaximum, setStockMaximum] = useState(0);
  const [stockCurrent, setStockCurrent] = useState(0);

  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const [modal, setModal] = useState(false);
  const [modalHistory, setModalHistory] = useState(false);
  const [modalType, setModalType] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const searchInput = useRef(null);

  useEffect(() => {
    setLoading(true);

    async function retrieveProductsFirstTime() {
      const { data, error } = await client
        .from('products')
        .select('*, suppliers(*), categories(*), units(*)')
        .eq('company_id', user.company);

      if (error) throw error;

      setProducts(data);
    }

    async function retrieveStockHistoryFirstTime() {
      const { data, error } = await client
        .from('stock_history')
        .select('*')
        .eq('company_id', user.company);

      if (error) throw error;

      setStockHistory(data);
    }

    async function retrieveSuppliers() {
      const { data, error } = await client
        .from('suppliers')
        .select('*')
        .eq('company_id', user.company);

      if (error) throw error;

      setSuppliers(data);
    }

    async function retrieveCategories() {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('company_id', user.company);

      if (error) throw error;

      setCategories(data);
    }

    retrieveProductsFirstTime();
    retrieveStockHistoryFirstTime();
    retrieveSuppliers();
    retrieveCategories();

    setLoading(false);
  }, [client, user.company]);

  async function retrieveProducts() {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('company_id', user.company);

    if (error) throw error;

    setProducts(data);
  }

  async function retrieveStockHistory() {
    const { data, error } = await client
      .from('stock_history')
      .select('*')
      .eq('company_id', user.company);

    if (error) throw error;

    setStockHistory(data);
  }

  async function insertProduct() {
    const { data, error } = await client.from('products').insert({
      company_id: user.company,
      code: code,
      name: name,
      supplier_id: supplier[0],
      category_id: category[0],
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_start: stockStart,
      stock_minimum: stockMinimum,
      stock_maximum: stockMaximum,
      stock_current: stockStart,
    });

    if (error) throw error;

    if (data && stockStart > 0) {
      console.log(data);

      let { error: historyError } = await client.from('stock_history').insert({
        type: 'entry',
        value: parseFloat(data[0].cost_price * data[0].stock_start).toFixed(2),
        product_id: data[0].id,
        company_id: user.company,
      });

      if (historyError) throw historyError;

      retrieveStockHistory();
    }

    retrieveProducts();
    handleCancel();
  }

  async function updateProduct() {
    const { error } = await client
      .from('products')
      .update({
        code: code,
        name: name,
        supplier_id: supplier[0],
        category_id: category[0],
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock_minimum: stockMinimum,
        stock_maximum: stockMaximum,
        stock_current: stockCurrent,
      })
      .eq('id', product.id);

    if (error) throw error;

    retrieveProducts();
    handleCancel();
  }

  async function deleteProduct() {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) throw error;

    retrieveProducts();
    handleCancel();
  }

  function handleNew() {
    setModalType('new');
    setModal(true);
  }

  function handleEdit() {
    setModalType('edit');

    setCode(product.code);
    setName(product.name);

    if (product.supplier_id !== null) {
      let supplier = suppliers.filter(
        (supplier) => supplier.id === product.supplier_id,
      );
      setSupplier([supplier[0].id, supplier[0].name]);
    }

    if (product.category_id !== null) {
      let category = categories.filter(
        (category) => category.id === product.category_id,
      );
      setCategory([category[0].id, category[0].name]);
    }

    setCostPrice(product.cost_price);
    setSellingPrice(product.selling_price);
    setProfitPrice(
      ((product.selling_price - product.cost_price) / product.cost_price) * 100,
    );
    setStockStart(product.stock_start);
    setStockMinimum(product.stock_minimum);
    setStockMaximum(product.stock_maximum);
    setStockCurrent(product.stock_current);

    setModal(true);
  }

  function handleDelete() {
    Modal.confirm({
      title: 'Aviso',
      icon: <ExclamationOutlined />,
      content: 'Tem certeza que deseja excluir este produto?',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        setLoading(true);

        deleteProduct();

        setLoading(false);
      },
    });
  }

  function handleEntryExit() {}

  function handleOk(values) {
    setLoading(true);

    if (modalType === 'new') {
      insertProduct(values);
    } else if (modalType === 'edit') {
      updateProduct(values);
    }

    setLoading(false);
  }

  function handleCancel() {
    setCode('');
    setName('');
    setSupplier([null, null]);
    setCategory([null, null]);
    setCostPrice(0);
    setSellingPrice(0);
    setProfitPrice(0);
    setStockStart(0);
    setStockMinimum(0);
    setStockMaximum(0);
    setStockCurrent(0);
    setSelectedRowKeys([]);
    setDisabled(true);
    setModal(false);
  }

  function handleSelection(selectedRowKeys, selectedRows) {
    setSelectedRowKeys(selectedRowKeys);
    setProduct(selectedRows[0]);

    if (product !== undefined || null) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }

  function handleSearch(selectedKeys, confirm, dataIndex) {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  }

  function handleReset(clearFilters) {
    clearFilters();
    setSearchText('');
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          ref={searchInput}
          placeholder="Digite sua pesquisa..."
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Procurar
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Resetar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1890ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: '#ffc069',
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: 'Produto',
      dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Custo/Venda',
      dataIndex: 'cost_price',
      align: 'center',
      render: (text, record) => (
        <>{`R$ ${record.cost_price.toFixed(
          2,
        )} / R$ ${record.selling_price.toFixed(2)}`}</>
      ),
    },
    {
      title: 'Venda R$',
      dataIndex: 'selling_price',
      hidden: true,
    },
    {
      title: 'Estoque Máximo',
      dataIndex: 'stock_maximum',
      hidden: true,
    },
    {
      title: 'Estoque Atual',
      dataIndex: 'stock_current',
      hidden: true,
    },
    {
      title: 'Unidade',
      dataIndex: 'units',
      align: 'center',
      render: (text, record) => {
        if (record.units === null) {
          return <>N/D</>;
        } else {
          return <>{record.units.initials}</>;
        }
      },
    },
    {
      title: 'Estoque Mín/Máx/Atual',
      dataIndex: 'stock_minimum',
      responsive: ['md'],
      align: 'center',
      render: (text, record) => {
        if (record.stock_current <= Number(text)) {
          return (
            <>
              <Tag>{Number(text)}</Tag>
              <Tag>{record.stock_maximum}</Tag>
              <Tag color="red">{record.stock_current}</Tag>
            </>
          );
        } else if (record.stock_current > record.stock_maximum) {
          return (
            <>
              <Tag>{Number(text)}</Tag>
              <Tag>{record.stock_maximum}</Tag>
              <Tag color="orange">{record.stock_current}</Tag>
            </>
          );
        } else {
          return (
            <>
              <Tag>{Number(text)}</Tag>
              <Tag>{record.stock_maximum}</Tag>
              <Tag color="green">{record.stock_current}</Tag>
            </>
          );
        }
      },
    },
  ].filter((item) => !item.hidden);

  return (
    <Layout>
      <Header user={user} client={client} />
      <Content>
        <Row
          align="middle"
          justify="center"
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <Col flex="auto" style={{ textAlign: 'center' }}>
            <Button size="large" style={buttonStyle} onClick={handleNew}>
              Cadastrar
            </Button>
            <Button
              size="large"
              style={buttonStyle}
              disabled={disabled}
              onClick={handleEdit}
            >
              Editar
            </Button>
            <Button
              size="large"
              style={buttonStyle}
              disabled={disabled}
              onClick={handleDelete}
            >
              Excluir
            </Button>
            <Button size="large" style={buttonStyle} onClick={handleEntryExit}>
              Entrada/Saída
            </Button>
            <Button
              size="large"
              style={buttonStyle}
              disabled={disabled}
              onClick={() => {
                const productHistory = stockHistory.filter(
                  (item) => item.product_id === product.id,
                );
                setStockHistory(productHistory === null ? [] : productHistory);
                setModalHistory(true);
              }}
            >
              Histórico
            </Button>
          </Col>
        </Row>
        <Row align="middle" justify="center" style={{ width: '100%' }}>
          <Table
            dataSource={products}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRowKeys,
              onChange: handleSelection,
            }}
            style={{ width: '100%' }}
          />
        </Row>
      </Content>
      <Footer />
      <Modal
        title={modalType === 'new' ? 'Novo Produto' : 'Editar Produto'}
        visible={modal}
        onOk={form.submit}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} onFinish={handleOk} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Código">
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  suffix={<BarcodeOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nome"
                rules={[{ required: true, message: 'Campo obrigatório!' }]}
              >
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fornecedor">
                <Input.Group>
                  <Select
                    showSearch
                    placeholder="Selecione aqui..."
                    value={supplier[0]}
                    onChange={(values, key) =>
                      setSupplier([key.value, key.children])
                    }
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{ width: 'calc(100% - 32px)' }}
                  >
                    {suppliers.map((supplier) => (
                      <Select.Option value={supplier.id} key={supplier.id}>
                        {supplier.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    onClick={() => setSupplier([null, null])}
                    icon={<CloseOutlined />}
                    disabled={!supplier[0]}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Categoria">
                <Input.Group>
                  <Select
                    showSearch
                    placeholder="Selecione aqui..."
                    value={category[0]}
                    onChange={(values, key) => {
                      setCategory([key.value, key.children]);
                    }}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{ width: 'calc(100% - 32px)' }}
                  >
                    {categories.map((category) => (
                      <Select.Option value={category.id} key={category.id}>
                        {category.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    onClick={() => setCategory([null, null])}
                    icon={<CloseOutlined />}
                    disabled={!category[0]}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Custo R$">
                <InputNumber
                  value={costPrice}
                  min={0}
                  onChange={(value) => {
                    let newValue = Number(String(value).replaceAll(',', '.'));
                    setCostPrice(newValue);

                    if (sellingPrice > 0) {
                      setProfitPrice(
                        ((sellingPrice - newValue) / newValue) * 100,
                      );
                    }
                  }}
                  formatter={(value) => formatNumber(value)}
                  parser={(value) => parseNumber(value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Venda R$">
                <InputNumber
                  value={sellingPrice}
                  min={0}
                  onChange={(value) => {
                    let newValue = Number(String(value).replaceAll(',', '.'));
                    setSellingPrice(newValue);

                    if (costPrice > 0) {
                      setProfitPrice(
                        ((newValue - costPrice) / costPrice) * 100,
                      );
                    }
                  }}
                  formatter={(value) => formatNumber(value)}
                  parser={(value) => parseNumber(value)}
                  style={{ width: '100%', opacity: 1 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lucro %">
                <Input
                  type="text"
                  value={`${profitPrice}%`}
                  disabled
                  style={{
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    color: 'inherit',
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {modalType === 'new' ? (
                <Form.Item label="Estoque Inicial">
                  <InputNumber
                    value={stockStart}
                    min={0}
                    onChange={(value) => setStockStart(value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ) : (
                <Form.Item label="Estoque Atual">
                  <InputNumber
                    value={stockCurrent}
                    min={0}
                    onChange={(value) => setStockCurrent(value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item label="Estoque Mínimo">
                <InputNumber
                  value={stockMinimum}
                  min={0}
                  onChange={(value) => setStockMinimum(value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Estoque Máximo">
                <InputNumber
                  value={stockMaximum}
                  min={0}
                  onChange={(value) => setStockMaximum(value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      <Modal
        title="Histórico Entrada/Saída"
        visible={modalHistory}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setSelectedRowKeys([]);
              setDisabled(true);
              setModalHistory(false);
              retrieveStockHistory();
            }}
          >
            Fechar
          </Button>,
          <Button key="submit" type="primary">
            Resetar
          </Button>,
        ]}
      >
        <List
          dataSource={stockHistory}
          renderItem={(item) => (
            <List.Item key={item.product_id}>
              <List.Item.Meta
                title={item.type === 'entry' ? 'Entrada' : 'Saída'}
                description={moment(item.created_at).format(
                  'DD/MM/YYYY HH:mm:ss',
                )}
              />
              <Tag
                color={item.type === 'entry' ? 'red' : 'green'}
              >{`Custo R$ ${item.value}`}</Tag>
            </List.Item>
          )}
        />
      </Modal>
    </Layout>
  );
}
