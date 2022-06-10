import { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { CameraOutlined, SearchOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useClient } from "react-supabase";
import Footer from "../components/footer";
import Header from "../components/header";
import Content from "../components/content";
import Highlighter from "react-highlight-words";

const buttonStyle = {
  minWidth: "7rem",
  margin: ".2rem .2rem .2rem .2rem",
};

export default function Stock() {
  const { user } = useAuth();
  const client = useClient();

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const searchInput = useRef(null);

  function handleNew() {
    setTitle("Novo Produto");
    setModal(true);
  }

  function handleOk(values) {
    console.log(values);
  }

  useEffect(() => {
    setLoading(true);

    retrieveProducts();
    retrieveSuppliers();
    retrieveCategories();

    setLoading(false);
  }, []);

  async function retrieveProducts() {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("company_id", user.company);

    if (error) throw error;

    setProducts(data);
  }

  async function retrieveSuppliers() {
    const { data, error } = await client
      .from("suppliers")
      .select("*")
      .eq("company_id", user.company);

    if (error) throw error;

    setSuppliers(data);
  }

  async function retrieveCategories() {
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("company_id", user.company);

    if (error) throw error;

    setCategories(data);
  }

  function handleSelection(selectedRowKeys, selectedRows) {
    setSelectedRowKeys(selectedRowKeys);
    setProduct(selectedRows[0]);
  }

  function handleSearch(selectedKeys, confirm, dataIndex) {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  }

  function handleReset(clearFilters) {
    clearFilters();
    setSearchText("");
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
            display: "block",
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
          color: filtered ? "#1890ff" : undefined,
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
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: "Produto",
      dataIndex: "name",
      sorter: (a, b) => a.name.length - b.name.length,
      ...getColumnSearchProps("name"),
    },
    {
      title: "Custo R$",
      dataIndex: "cost_price",
      sorter: (a, b) => a.cost_price - b.cost_price,
      align: "center",
    },
    {
      title: "Venda R$",
      dataIndex: "sale_price",
      sorter: (a, b) => a.sale_price - b.sale_price,
      align: "center",
    },
    {
      title: "Estoque Mínimo",
      dataIndex: "inventory_minimum",
      sorter: (a, b) => a.inventory_minimum - b.inventory_minimum,
      responsive: ["md"],
      align: "center",
    },
    {
      title: "Estoque Atual",
      dataIndex: "inventory_current",
      sorter: (a, b) => a.inventory_current - b.inventory_current,
      responsive: ["md"],
      render: (text, record) => {
        let tagColor =
          Number(text) <= record.inventory_minimum ? "red" : "green";

        return <Tag color={tagColor}>{text}</Tag>;
      },
      align: "center",
    },
  ];

  return (
    <Layout>
      <Header user={user} client={client} />
      <Content>
        <Row
          align="middle"
          justify="center"
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          <Col flex="auto" style={{ textAlign: "center" }}>
            <Button size="large" style={buttonStyle} onClick={handleNew}>
              Cadastrar
            </Button>
            <Button size="large" style={buttonStyle}>
              Editar
            </Button>
            <Button size="large" style={buttonStyle}>
              Excluir
            </Button>
          </Col>
        </Row>
        <Row align="middle" justify="center" style={{ width: "100%" }}>
          <Table
            dataSource={products}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedRowKeys,
              onChange: handleSelection,
            }}
            style={{ width: "100%" }}
          />
        </Row>
      </Content>
      <Footer />
      <Modal
        title={title}
        visible={modal}
        onOk={form.submit}
        onCancel={() => {
          setModal(false);
          form.resetFields();
        }}
      >
        <Form form={form} onFinish={handleOk} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Código" name="code">
                <Input.Group compact>
                  <Input type="text" style={{ width: "calc(100% - 32px)" }} />
                  <Button type="primary" icon={<CameraOutlined />} />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nome"
                name="name"
                rules={[{ required: true, message: "Campo obrigatório!" }]}
              >
                <Input type="text" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fornecedor" name="supplier">
                <Select
                  showSearch
                  placeholder="Selecione aqui..."
                  onChange={(value) => setSupplier(value)}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map((supplier) => (
                    <Select.Option value={supplier.name} key={supplier.id}>
                      {supplier.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Categoria" name="category">
                <Select
                  showSearch
                  placeholder="Selecione aqui..."
                  onChange={(value) => setCategory(value)}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {categories.map((category) => (
                    <Select.Option value={category.name} key={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Custo R$" name="cost_price">
                <InputNumber
                  formatter={(value) =>
                    `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Venda R$" name="sale_price">
                <InputNumber
                  formatter={(value) =>
                    `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lucro R$" name="profit_price">
                <InputNumber
                  formatter={(value) =>
                    `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
}
