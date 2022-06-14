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
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  BarcodeOutlined,
  CameraOutlined,
  CloseOutlined,
  ExclamationOutlined,
  SearchOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useClient } from 'react-supabase';
import Footer from '../components/footer';
import Header from '../components/header';
import Content from '../components/content';
import Highlighter from 'react-highlight-words';
import {
  formatNumber,
  generateBarcode,
  parseNumber,
} from '../components/utils';
import moment from 'moment';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import { FaBoxes } from 'react-icons/fa';

const buttonStyle = {
  minWidth: '7rem',
  margin: '.2rem .2rem .2rem .2rem',
};

export default function Stock() {
  const { user } = useAuth();
  const client = useClient();

  const bardCodeDivRef = useRef(null);

  // Data
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [previousProduct, setPreviousProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [productsHistory, setProductsHistory] = useState([]);

  // Product
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState([null, null]);
  const [category, setCategory] = useState([null, null]);
  const [unity, setUnity] = useState([null, null]);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [profitPrice, setProfitPrice] = useState(0);
  const [stockStart, setStockStart] = useState(0);
  const [stockMinimum, setStockMinimum] = useState(0);
  const [stockMaximum, setStockMaximum] = useState(0);
  const [stockCurrent, setStockCurrent] = useState(0);
  const [entryOrExit, setEntryOrExit] = useState('Entrada');
  const [quantity, setQuantity] = useState(0);

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [modalType, setModalType] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  // Modals
  const [modal, setModal] = useState(false);
  const [modalHistory, setModalHistory] = useState(false);
  const [modalEntryExit, setModalEntryExit] = useState(false);
  const [modalTag, setModalTag] = useState(false);

  // Table
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

    async function retrieveProductsHistoryFirstTime() {
      const { data, error } = await client
        .from('products_history')
        .select('*')
        .eq('company_id', user.company);

      if (error) throw error;

      setProductsHistory(data);
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

    async function retrieveUnits() {
      const { data, error } = await client.from('units').select('*');

      if (error) throw error;

      setUnits(data);
    }

    retrieveProductsFirstTime();
    retrieveProductsHistoryFirstTime();
    retrieveSuppliers();
    retrieveCategories();
    retrieveUnits();

    setLoading(false);
  }, [client, user.company]);

  // Data functions
  async function retrieveProducts() {
    const { data, error } = await client
      .from('products')
      .select('*, suppliers(*), categories(*), units(*)')
      .eq('company_id', user.company);

    if (error) throw error;

    setProducts(data);
  }

  async function retrieveProductsHistory() {
    const { data, error } = await client
      .from('products_history')
      .select('*')
      .eq('company_id', user.company);

    if (error) throw error;

    setProductsHistory(data);
  }

  async function insertProduct() {
    if (!!name.trim()) {
      setLoading(true);
      clearValidation();

      const { data, error } = await client.from('products').insert({
        name: name,
        code: code,
        cost_price: costPrice,
        selling_price: sellingPrice,
        stock_start: stockStart,
        stock_minimum: stockMinimum,
        stock_maximum: stockMaximum,
        stock_current: stockStart,
        company_id: user.company,
        supplier_id: supplier[0],
        category_id: category[0],
        unity_id: unity[0],
      });

      if (error) throw error;

      if (data && stockStart > 0) {
        let { error: historyError } = await client
          .from('products_history')
          .insert({
            type: 'entry',
            value: parseFloat(data[0].cost_price * data[0].stock_start).toFixed(
              2,
            ),
            product_id: data[0].id,
            company_id: user.company,
          });

        if (historyError) throw historyError;

        retrieveProductsHistory();
      }

      setLoading(false);
      retrieveProducts();
      handleCancel();
    } else {
      showValidation('Campo obrigatório!');
    }
  }

  async function updateProduct() {
    if (!!name.trim()) {
      setLoading(true);
      clearValidation();

      const { data, error } = await client
        .from('products')
        .update({
          name: name,
          code: code,
          cost_price: costPrice,
          selling_price: sellingPrice,
          stock_minimum: stockMinimum,
          stock_maximum: stockMaximum,
          stock_current: stockCurrent,
          supplier_id: supplier[0],
          category_id: category[0],
          unity_id: unity[0],
        })
        .eq('id', product.id);

      if (error) throw error;

      let hasHistory = productsHistory.some(
        (item) => item.product_id === product.id,
      );

      if (data && stockCurrent > 0 && !hasHistory) {
        let { error: historyError } = await client
          .from('products_history')
          .insert({
            type: 'entry',
            value: parseFloat(
              data[0].cost_price * data[0].stock_current,
            ).toFixed(2),
            product_id: data[0].id,
            company_id: user.company,
          });

        if (historyError) throw historyError;
      } else if (data && hasHistory) {
        if (stockCurrent > previousProduct.stock_current) {
          let quantity = stockCurrent - previousProduct.stock_current;

          let { error: historyError } = await client
            .from('products_history')
            .insert({
              type: 'entry',
              value: parseFloat(quantity * costPrice).toFixed(2),
              product_id: data[0].id,
              company_id: user.company,
            });

          if (historyError) throw historyError;
        } else if (stockCurrent < previousProduct.stock_current) {
          let quantity = previousProduct.stock_current - stockCurrent;

          let { error: historyError } = await client
            .from('products_history')
            .insert({
              type: 'exit',
              value: parseFloat(quantity * sellingPrice).toFixed(2),
              product_id: data[0].id,
              company_id: user.company,
            });

          if (historyError) throw historyError;
        }
      }

      setLoading(false);
      retrieveProducts();
      retrieveProductsHistory();
      handleCancel();
    } else {
      showValidation('Campo obrigatório!');
    }
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

  async function deleteProductsHistory() {
    const { error } = await client
      .from('products_history')
      .delete()
      .match({ product_id: product.id });

    if (error) throw error;

    retrieveProductsHistory();
    setSelectedRowKeys([]);
    setDisabled(true);
    setModalHistory(false);
  }

  async function insertEntryOrExit() {
    if (quantity > 0) {
      setLoading(true);
      clearValidation();

      let total =
        entryOrExit === 'Entrada'
          ? quantity * product.cost_price
          : quantity * product.selling_price;

      let { data: historyData, error: historyError } = await client
        .from('products_history')
        .insert({
          type: entryOrExit === 'Entrada' ? 'entry' : 'exit',
          value: parseFloat(total).toFixed(2),
          product_id: product.id,
          company_id: user.company,
        });

      if (historyError) throw historyError;

      if (historyData) {
        let { error: productError } = await client
          .from('products')
          .update({
            stock_current:
              entryOrExit === 'Entrada'
                ? product.stock_current + quantity
                : product.stock_current - quantity,
          })
          .eq('id', product.id);

        if (productError) throw productError;

        retrieveProductsHistory();
      }

      setLoading(false);
      retrieveProducts();
      setSelectedRowKeys([]);
      setQuantity(0);
      setEntryOrExit('Entrada');
      setDisabled(true);
      setModalEntryExit(false);
    } else {
      showValidation('Quantidade deve ser superior à zero!');
    }
  }

  // Menu functions
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

    if (product.unity_id !== null) {
      let unity = units.filter((unity) => unity.id === product.unity_id);
      setUnity([unity[0].id, unity[0].name]);
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

  function handleEntryExit() {
    setModalType('entryOrExit');
    setModalEntryExit(true);
  }

  function handleHistory(record) {
    if (product === null) {
      setProduct(record);
    }

    const productHistory = productsHistory.filter(
      (item) => item.product_id === record.id,
    );
    setProductsHistory(productHistory === null ? [] : productHistory);

    setModalType('resetHistory');
    setModalHistory(true);
  }

  // Modal functions
  function handleSubmit() {
    setLoading(true);

    if (modalType === 'new') {
      insertProduct();
    } else if (modalType === 'edit') {
      updateProduct();
    } else if (modalType === 'entryOrExit') {
      insertEntryOrExit();
    } else if (modalType === 'resetHistory') {
      Modal.confirm({
        title: 'Aviso',
        icon: <ExclamationOutlined />,
        content: 'Deseja realmente resetar o histórico deste produto?',
        okText: 'Resetar',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk() {
          deleteProductsHistory();
        },
      });
    }

    setLoading(false);
  }

  function handleCancel() {
    clearValidation();
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
    setPreviousProduct(null);
    setDisabled(true);
    setModal(false);
  }

  function clearValidation() {
    setValidationStatus('');
    setValidationMsg('');
  }

  function showValidation(msg) {
    setValidationStatus('error');
    setValidationMsg(msg);
  }

  function handleTagPrint() {
    const opt = {
      scale: 4,
    };

    const elem = bardCodeDivRef.current;

    html2canvas(elem, opt).then((canvas) => {
      const iframe = document.createElement('iframe');
      iframe.name = 'printf';
      iframe.id = 'printf';
      iframe.height = 0;
      iframe.width = 0;
      document.body.appendChild(iframe);

      const imgUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: '1.0',
      });

      const style = `
        height:20vh;
        width:50vw;
        position:absolute;
        left:0:
        top:0;
    `;

      const url = `<img style="${style}" src="${imgUrl}"/>`;
      var newWin = window.frames['printf'];
      newWin.document.write(`<body onload="window.print()">${url}</body>`);
      newWin.document.close();
    });
  }

  // Table functions and variables
  function handleSelection(selectedRowKeys, selectedRows) {
    setSelectedRowKeys(selectedRowKeys);
    setProduct(selectedRows[0]);
    setPreviousProduct(selectedRows[0]);

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
      dataIndex: 'unity_id',
      align: 'center',
      responsive: ['md'],
      render: (text, record) => {
        if (record.units) return <div>{record.units.initials}</div>;

        return <div>N/D</div>;
      },
    },
    {
      title: 'Estoque Mín/Máx/Atual',
      dataIndex: 'stock_minimum',
      responsive: ['md'],
      align: 'center',
      render: (text, record) => {
        if (record.stock_current < Number(text)) {
          return (
            <>
              <Tag>{Number(text)}</Tag>
              <Tag>{record.stock_maximum}</Tag>
              <Tag color="red">{record.stock_current}</Tag>
            </>
          );
        } else if (
          record.stock_current > record.stock_maximum &&
          record.stock_maximum > 0
        ) {
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
    {
      title: 'Ações',
      dataIndex: 'code',
      align: 'center',
      render: (text, record) =>
        record.code === '' ? (
          <Row>
            <Col span={12}>
              <Button
                type="primary"
                onClick={() => handleHistory(record)}
                icon={<FaBoxes />}
                title="Estoque"
              />
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                disabled
                onClick={() => {
                  setCode(record.code);
                  setModalTag(true);
                }}
                icon={<TagOutlined />}
                title="Código de Barras"
              />
            </Col>
          </Row>
        ) : (
          <Row>
            <Col span={12}>
              <Button
                type="primary"
                onClick={() => handleHistory(record)}
                icon={<FaBoxes />}
                title="Estoque"
              />
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                onClick={() => {
                  setCode(record.code);
                  setModalTag(true);
                }}
                icon={<TagOutlined />}
                title="Código de Barras"
              />
            </Col>
          </Row>
        ),
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
            <Button
              size="large"
              style={buttonStyle}
              disabled={disabled}
              onClick={handleEntryExit}
            >
              Entrada/Saída
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
        closable={false}
        centered
        footer={[
          <Button onClick={handleCancel}>Cancelar</Button>,
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Salvar
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Nome"
                validateStatus={validationStatus}
                help={validationMsg}
              >
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Código">
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  suffix={
                    <>
                      <Popover content="Gerar Código">
                        <BarcodeOutlined
                          onClick={() => setCode(generateBarcode())}
                        />
                      </Popover>
                      <Popover content="Usar Câmera">
                        <CameraOutlined onClick={() => console.log('camera')} />
                      </Popover>
                    </>
                  }
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
                    onChange={(values, key) =>
                      setCategory([key.value, key.children])
                    }
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
            <Col span={12}>
              <Form.Item label="Tipo de Medida">
                <Input.Group>
                  <Select
                    value={unity[0]}
                    placeholder="Selecione aqui..."
                    showSearch
                    optionFilterProp="children"
                    onChange={(values, key) =>
                      setUnity([key.value, key.children])
                    }
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{ width: 'calc(100% - 32px)' }}
                  >
                    {units.map((unity) => (
                      <Select.Option value={unity.id} key={unity.id}>
                        {unity.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    onClick={() => setUnity([null, null])}
                    icon={<CloseOutlined />}
                    disabled={!unity[0]}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12} />
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
                  value={`${profitPrice.toFixed(2)}%`}
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
        title="Entradas e Saídas"
        visible={modalEntryExit}
        closable={false}
        centered
        footer={[
          <Button
            onClick={() => {
              setProduct(null);
              setSelectedRowKeys([]);
              clearValidation();
              setDisabled(true);
              setModalEntryExit(false);
            }}
          >
            Fechar
          </Button>,
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Registrar
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Tipo de Registro">
                <Select
                  value={entryOrExit}
                  onChange={(value) => setEntryOrExit(value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="Entrada">Entrada</Select.Option>
                  <Select.Option value="Saída">Saída</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Quantidade"
                validateStatus={validationStatus}
                help={validationMsg}
              >
                <InputNumber
                  value={quantity}
                  onChange={(value) => setQuantity(value)}
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
        closable={false}
        centered
        footer={[
          <Button
            onClick={() => {
              setSelectedRowKeys([]);
              setDisabled(true);
              setModalHistory(false);
              retrieveProductsHistory();
            }}
          >
            Fechar
          </Button>,
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Resetar
          </Button>,
        ]}
      >
        <List
          dataSource={productsHistory}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={item.type === 'entry' ? 'Entrada' : 'Saída'}
                description={moment(item.created_at).format(
                  'DD/MM/YYYY HH:mm:ss',
                )}
              />
              {item.type === 'entry' ? (
                <Tag color="red">{`Custo R$ ${item.value}`}</Tag>
              ) : (
                <>
                  <Tag color="green">
                    {`Lucro R$ ${parseFloat(
                      (product.selling_price - product.cost_price) *
                        (item.value / product.selling_price),
                    ).toFixed(2)}`}
                  </Tag>
                  <Tag>{`Total R$ ${item.value}`}</Tag>
                </>
              )}
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="Etiqueta"
        visible={modalTag}
        closable={false}
        centered
        footer={[
          <Button
            onClick={() => {
              setCode('');
              setSelectedRowKeys([]);
              setDisabled(true);
              setModalTag(false);
            }}
          >
            Fechar
          </Button>,
          <Button
            type="primary"
            loading={loading}
            onClick={() => handleTagPrint}
          >
            Imprimir Etiqueta
          </Button>,
        ]}
      >
        <div ref={bardCodeDivRef} style={{ textAlign: 'center' }}>
          <Barcode value={code} format="EAN13" />
        </div>
      </Modal>
    </Layout>
  );
}
