import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tabs,
  Row,
  Col,
  Statistic,
  TreeSelect,
  Avatar,
  Tooltip,
  Badge,
  Dropdown,
  Divider,
  Typography,
  Alert,
  Popconfirm,
  message,
  Drawer,
  List,
  Empty,
  Timeline,
  Progress,
  Breadcrumb,
  Switch,
  InputNumber,
  Radio
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  GlobalOutlined,
  BankOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  BookOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

// Styled Components
const PageWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const StatsCard = styled(Card)`
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .ant-statistic-title {
    color: #8c8c8c;
  }
`;

const SchoolCard = styled(Card)`
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const HierarchyBadge = styled(Tag)`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
`;

// Type definitions
interface School {
  id: string;
  name: string;
  nameKh: string;
  code: string;
  type: 'primary' | 'secondary' | 'high';
  address: string;
  province: string;
  district: string;
  commune: string;
  village: string;
  zone: string;
  cluster: string;
  department: string;
  director: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  statistics: {
    totalTeachers: number;
    activeTeachers: number;
    totalStudents: number;
    femaleStudents: number;
    maleStudents: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Mock hierarchical data
const hierarchicalData = {
  zones: [
    { id: 'z1', name: 'តំបន់ភាគកណ្តាល', provinces: ['ភ្នំពេញ', 'កណ្តាល', 'តាកែវ'] },
    { id: 'z2', name: 'តំបន់ភាគឦសាន', provinces: ['កំពង់ចាម', 'ក្រចេះ', 'ត្បូងឃ្មុំ'] },
    { id: 'z3', name: 'តំបន់ភាគពាយ័ព្យ', provinces: ['បាត់ដំបង', 'បន្ទាយមានជ័យ', 'សៀមរាប'] }
  ],
  provinces: {
    'ភ្នំពេញ': { departments: ['មន្ទីរអប់រំ ភ្នំពេញ'] },
    'កណ្តាល': { departments: ['មន្ទីរអប់រំ កណ្តាល'] },
    'កំពង់ចាម': { departments: ['មន្ទីរអប់រំ កំពង់ចាម'] },
    'សៀមរាប': { departments: ['មន្ទីរអប់រំ សៀមរាប'] },
    'បាត់ដំបង': { departments: ['មន្ទីរអប់រំ បាត់ដំបង'] }
  },
  departments: {
    'មន្ទីរអប់រំ ភ្នំពេញ': { clusters: ['ចំការមន', 'ទួលគោក', 'ដូនពេញ'] },
    'មន្ទីរអប់រំ កណ្តាល': { clusters: ['ស្អាង', 'កៀនស្វាយ', 'លើកដែក'] }
  }
};

// Mock schools data
const mockSchools: School[] = [
  {
    id: '1',
    name: 'Phnom Penh Thmey Primary School',
    nameKh: 'សាលាបឋមសិក្សា ភ្នំពេញថ្មី',
    code: 'PP-001',
    type: 'primary',
    address: 'ផ្លូវ 271, សង្កាត់ភ្នំពេញថ្មី',
    province: 'ភ្នំពេញ',
    district: 'ខណ្ឌសែនសុខ',
    commune: 'សង្កាត់ភ្នំពេញថ្មី',
    village: 'ភូមិ 1',
    zone: 'តំបន់ភាគកណ្តាល',
    cluster: 'ចំការមន',
    department: 'មន្ទីរអប់រំ ភ្នំពេញ',
    director: {
      id: 'd1',
      name: 'លោក សុខ សំអាត',
      phone: '012 345 678',
      email: 'soksamat@school.edu.kh'
    },
    statistics: {
      totalTeachers: 45,
      activeTeachers: 42,
      totalStudents: 1250,
      femaleStudents: 620,
      maleStudents: 630
    },
    coordinates: {
      lat: 11.5564,
      lng: 104.9282
    },
    status: 'active',
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Kandal Primary School',
    nameKh: 'សាលាបឋមសិក្សា កណ្តាល',
    code: 'KD-001',
    type: 'primary',
    address: 'ភូមិ ស្អាង, ឃុំ ស្អាង',
    province: 'កណ្តាល',
    district: 'ស្រុកស្អាង',
    commune: 'ឃុំស្អាង',
    village: 'ភូមិ 2',
    zone: 'តំបន់ភាគកណ្តាល',
    cluster: 'ស្អាង',
    department: 'មន្ទីរអប់រំ កណ្តាល',
    director: {
      id: 'd2',
      name: 'លោកស្រី ចាន់ ដារា',
      phone: '012 456 789',
      email: 'chandara@school.edu.kh'
    },
    statistics: {
      totalTeachers: 38,
      activeTeachers: 36,
      totalStudents: 980,
      femaleStudents: 490,
      maleStudents: 490
    },
    status: 'active',
    createdAt: '2023-02-20',
    updatedAt: '2024-01-08'
  }
];

const SchoolsPage: React.FC = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [filteredSchools, setFilteredSchools] = useState<School[]>(mockSchools);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    zone: '',
    province: '',
    department: '',
    cluster: '',
    type: '',
    status: ''
  });

  // Get user role and determine access level
  const getUserRole = () => {
    if (!user) return 'teacher';
    return (user.role?.name || user.role || 'teacher').toLowerCase();
  };

  const userRole = getUserRole();

  // Role-based access control
  const canCreateSchool = ['administrator', 'zone', 'provincial'].includes(userRole);
  const canEditSchool = ['administrator', 'zone', 'provincial', 'department'].includes(userRole);
  const canDeleteSchool = ['administrator', 'zone'].includes(userRole);
  const canManageDirectors = ['administrator', 'zone', 'provincial', 'department'].includes(userRole);

  // Filter schools based on user role and hierarchy
  const getAccessibleSchools = () => {
    let filtered = [...schools];

    switch (userRole) {
      case 'administrator':
        // Can see all schools
        break;
      case 'zone':
        // Can see schools in their zone
        filtered = filtered.filter(s => s.zone === user?.zone);
        break;
      case 'provincial':
        // Can see schools in their province
        filtered = filtered.filter(s => s.province === user?.province);
        break;
      case 'department':
        // Can see schools in their department
        filtered = filtered.filter(s => s.department === user?.department);
        break;
      case 'cluster':
        // Can see schools in their cluster
        filtered = filtered.filter(s => s.cluster === user?.cluster);
        break;
      case 'director':
        // Can see only their school
        filtered = filtered.filter(s => s.director.id === user?.id);
        break;
      case 'teacher':
        // Can see only their school
        filtered = filtered.filter(s => s.id === user?.schoolId);
        break;
    }

    return filtered;
  };

  useEffect(() => {
    const accessibleSchools = getAccessibleSchools();
    setFilteredSchools(accessibleSchools);
  }, [schools, user]);

  // Calculate statistics
  const calculateStats = () => {
    const accessible = getAccessibleSchools();
    return {
      totalSchools: accessible.length,
      activeSchools: accessible.filter(s => s.status === 'active').length,
      totalTeachers: accessible.reduce((sum, s) => sum + s.statistics.totalTeachers, 0),
      totalStudents: accessible.reduce((sum, s) => sum + s.statistics.totalStudents, 0)
    };
  };

  const stats = calculateStats();

  // Table columns
  const columns: ColumnsType<School> = [
    {
      title: 'កូដសាលា',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left',
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'ឈ្មោះសាលា',
      dataIndex: 'nameKh',
      key: 'nameKh',
      fixed: 'left',
      width: 200,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.name}</Text>
        </Space>
      )
    },
    {
      title: 'ប្រភេទ',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          primary: { text: 'បឋមសិក្សា', color: 'blue' },
          secondary: { text: 'មធ្យមសិក្សា', color: 'green' },
          high: { text: 'វិទ្យាល័យ', color: 'purple' }
        };
        return <Tag color={typeMap[type]?.color}>{typeMap[type]?.text}</Tag>;
      }
    },
    {
      title: 'ទីតាំង',
      key: 'location',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.province} / {record.district}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.commune} / {record.village}</Text>
        </Space>
      )
    },
    {
      title: 'នាយកសាលា',
      key: 'director',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <Space direction="vertical" size={0}>
            <Text>{record.director.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.director.phone}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'គ្រូបង្រៀន',
      key: 'teachers',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.statistics.activeTeachers} style={{ backgroundColor: '#52c41a' }}>
          <TeamOutlined style={{ fontSize: 20 }} />
        </Badge>
      )
    },
    {
      title: 'សិស្សសរុប',
      key: 'students',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Statistic 
          value={record.statistics.totalStudents} 
          valueStyle={{ fontSize: 16 }}
        />
      )
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status === 'active' ? 'សកម្ម' : 'អសកម្ម'} 
        />
      )
    },
    {
      title: 'សកម្មភាព',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="មើលព័ត៌មានលម្អិត">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedSchool(record);
                setIsDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          {canEditSchool && (
            <Tooltip title="កែប្រែ">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteSchool && (
            <Popconfirm
              title="តើអ្នកប្រាកដថាចង់លុបសាលានេះ?"
              onConfirm={() => handleDelete(record.id)}
              okText="បាទ/ចាស"
              cancelText="ទេ"
            >
              <Tooltip title="លុប">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    filterSchools(value, selectedFilters);
  };

  const filterSchools = (search: string, filters: any) => {
    let filtered = getAccessibleSchools();
    
    // Text search
    if (search) {
      filtered = filtered.filter(school =>
        school.nameKh.includes(search) ||
        school.name.toLowerCase().includes(search.toLowerCase()) ||
        school.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply filters
    if (filters.zone) filtered = filtered.filter(s => s.zone === filters.zone);
    if (filters.province) filtered = filtered.filter(s => s.province === filters.province);
    if (filters.department) filtered = filtered.filter(s => s.department === filters.department);
    if (filters.cluster) filtered = filtered.filter(s => s.cluster === filters.cluster);
    if (filters.type) filtered = filtered.filter(s => s.type === filters.type);
    if (filters.status) filtered = filtered.filter(s => s.status === filters.status);
    
    setFilteredSchools(filtered);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...selectedFilters, [key]: value };
    setSelectedFilters(newFilters);
    filterSchools(searchText, newFilters);
  };

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    form.setFieldsValue(school);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // API call would go here
      setSchools(schools.filter(s => s.id !== id));
      message.success('សាលាត្រូវបានលុបដោយជោគជ័យ');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការលុបសាលា');
    }
    setLoading(false);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (selectedSchool) {
        // Update existing school
        setSchools(schools.map(s => 
          s.id === selectedSchool.id ? { ...s, ...values, updatedAt: new Date().toISOString() } : s
        ));
        message.success('សាលាត្រូវបានកែប្រែដោយជោគជ័យ');
      } else {
        // Create new school
        const newSchool: School = {
          ...values,
          id: Date.now().toString(),
          statistics: {
            totalTeachers: 0,
            activeTeachers: 0,
            totalStudents: 0,
            femaleStudents: 0,
            maleStudents: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setSchools([...schools, newSchool]);
        message.success('សាលាត្រូវបានបង្កើតដោយជោគជ័យ');
      }
      setIsModalVisible(false);
      form.resetFields();
      setSelectedSchool(null);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
    }
    setLoading(false);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <BankOutlined /> គ្រប់គ្រងសាលារៀន
            </Title>
            <Breadcrumb style={{ marginTop: 8 }}>
              <Breadcrumb.Item><HomeOutlined /> ទំព័រដើម</Breadcrumb.Item>
              <Breadcrumb.Item>សាលារៀន</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col>
            <Space>
              <Button icon={<SyncOutlined />} onClick={() => message.info('កំពុងធ្វើបច្ចុប្បន្នភាព...')}>
                ធ្វើបច្ចុប្បន្នភាព
              </Button>
              <Button icon={<DownloadOutlined />}>
                ទាញយករបាយការណ៍
              </Button>
              {canCreateSchool && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedSchool(null);
                    form.resetFields();
                    setIsModalVisible(true);
                  }}
                >
                  បង្កើតសាលាថ្មី
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="សាលាសរុប"
              value={stats.totalSchools}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="សាលាសកម្ម"
              value={stats.activeSchools}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="គ្រូសរុប"
              value={stats.totalTeachers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="សិស្សសរុប"
              value={stats.totalStudents}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </StatsCard>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="បញ្ជីសាលា" key="list">
            {/* Filters */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={6}>
                <Search
                  placeholder="ស្វែងរកសាលា..."
                  onSearch={handleSearch}
                  allowClear
                />
              </Col>
              {userRole === 'administrator' && (
                <Col xs={24} md={4}>
                  <Select
                    placeholder="តំបន់"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={(value) => handleFilterChange('zone', value)}
                  >
                    {hierarchicalData.zones.map(zone => (
                      <Option key={zone.id} value={zone.name}>{zone.name}</Option>
                    ))}
                  </Select>
                </Col>
              )}
              {['administrator', 'zone'].includes(userRole) && (
                <Col xs={24} md={4}>
                  <Select
                    placeholder="ខេត្ត"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={(value) => handleFilterChange('province', value)}
                  >
                    {['ភ្នំពេញ', 'កណ្តាល', 'កំពង់ចាម', 'សៀមរាប', 'បាត់ដំបង'].map(p => (
                      <Option key={p} value={p}>{p}</Option>
                    ))}
                  </Select>
                </Col>
              )}
              <Col xs={24} md={3}>
                <Select
                  placeholder="ប្រភេទ"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('type', value)}
                >
                  <Option value="primary">បឋមសិក្សា</Option>
                  <Option value="secondary">មធ្យមសិក្សា</Option>
                  <Option value="high">វិទ្យាល័យ</Option>
                </Select>
              </Col>
              <Col xs={24} md={3}>
                <Select
                  placeholder="ស្ថានភាព"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="active">សកម្ម</Option>
                  <Option value="inactive">អសកម្ម</Option>
                </Select>
              </Col>
            </Row>

            {/* Schools Table */}
            <Table
              columns={columns}
              dataSource={filteredSchools}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                total: filteredSchools.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `សរុប ${total} សាលា`
              }}
            />
          </TabPane>

          <TabPane tab="តាមផែនទី" key="map">
            <div style={{ height: 500, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty
                image={<EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                description="ផែនទីនឹងមាននៅពេលក្រោយ"
              />
            </div>
          </TabPane>

          <TabPane tab="ឋានានុក្រម" key="hierarchy">
            <Alert
              message="រចនាសម្ព័ន្ធតាមឋានានុក្រម"
              description="បង្ហាញពីទំនាក់ទំនងរវាងតំបន់ ខេត្ត មន្ទីរ ចង្កោម និងសាលារៀន"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Timeline mode="left">
              <Timeline.Item color="blue" dot={<GlobalOutlined />}>
                <Card size="small">
                  <Text strong>អ្នកគ្រប់គ្រង (Administrator)</Text>
                  <br />
                  <Text type="secondary">មើលឃើញទាំងអស់ • គ្រប់គ្រងទាំងអស់</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="green" dot={<ApartmentOutlined />}>
                <Card size="small">
                  <Text strong>តំបន់ (Zone)</Text>
                  <br />
                  <Text type="secondary">គ្រប់គ្រងតំបន់ • អនុម័តបេសកកម្ម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="orange" dot={<BankOutlined />}>
                <Card size="small">
                  <Text strong>ខេត្ត (Provincial)</Text>
                  <br />
                  <Text type="secondary">គ្រប់គ្រងខេត្ត • អនុម័តបេសកកម្ម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="purple" dot={<ClusterOutlined />}>
                <Card size="small">
                  <Text strong>មន្ទីរ (Department)</Text>
                  <br />
                  <Text type="secondary">គ្រប់គ្រងចង្កោម • មិនអនុម័តបេសកកម្ម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="cyan" dot={<TeamOutlined />}>
                <Card size="small">
                  <Text strong>ចង្កោម (Cluster)</Text>
                  <br />
                  <Text type="secondary">គ្រប់គ្រងសាលា • មិនអនុម័តបេសកកម្ម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="gold" dot={<SafetyCertificateOutlined />}>
                <Card size="small">
                  <Text strong>នាយកសាលា (Director)</Text>
                  <br />
                  <Text type="secondary">គ្រប់គ្រងគ្រូ • អនុម័តបេសកកម្ម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item dot={<UserOutlined />}>
                <Card size="small">
                  <Text strong>គ្រូបង្រៀន (Teacher)</Text>
                  <br />
                  <Text type="secondary">មើលខ្លួនឯង • ចូលដោយខ្លួនឯង</Text>
                </Card>
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={selectedSchool ? 'កែប្រែព័ត៌មានសាលា' : 'បង្កើតសាលាថ្មី'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedSchool(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="កូដសាលា"
                rules={[{ required: true, message: 'សូមបញ្ចូលកូដសាលា' }]}
              >
                <Input placeholder="ឧ. PP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="ប្រភេទសាលា"
                rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទសាលា' }]}
              >
                <Select placeholder="ជ្រើសរើសប្រភេទ">
                  <Option value="primary">បឋមសិក្សា</Option>
                  <Option value="secondary">មធ្យមសិក្សា</Option>
                  <Option value="high">វិទ្យាល័យ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nameKh"
                label="ឈ្មោះសាលា (ខ្មែរ)"
                rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលា' }]}
              >
                <Input placeholder="សាលាបឋមសិក្សា..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="ឈ្មោះសាលា (អង់គ្លេស)"
                rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលា' }]}
              >
                <Input placeholder="Primary School..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider>ទីតាំង</Divider>

          <Row gutter={16}>
            {userRole === 'administrator' && (
              <Col span={12}>
                <Form.Item
                  name="zone"
                  label="តំបន់"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសតំបន់' }]}
                >
                  <Select placeholder="ជ្រើសរើសតំបន់">
                    {hierarchicalData.zones.map(zone => (
                      <Option key={zone.id} value={zone.name}>{zone.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            <Col span={12}>
              <Form.Item
                name="province"
                label="ខេត្ត/រាជធានី"
                rules={[{ required: true, message: 'សូមជ្រើសរើសខេត្ត' }]}
              >
                <Select placeholder="ជ្រើសរើសខេត្ត">
                  {['ភ្នំពេញ', 'កណ្តាល', 'កំពង់ចាម', 'សៀមរាប', 'បាត់ដំបង'].map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="district"
                label="ស្រុក/ខណ្ឌ"
                rules={[{ required: true }]}
              >
                <Input placeholder="ស្រុក/ខណ្ឌ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="commune"
                label="ឃុំ/សង្កាត់"
                rules={[{ required: true }]}
              >
                <Input placeholder="ឃុំ/សង្កាត់" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="village"
                label="ភូមិ"
                rules={[{ required: true }]}
              >
                <Input placeholder="ភូមិ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="អាសយដ្ឋានលម្អិត"
              >
                <Input placeholder="ផ្លូវ/ផ្ទះលេខ..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider>នាយកសាលា</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['director', 'name']}
                label="ឈ្មោះនាយកសាលា"
                rules={[{ required: true }]}
              >
                <Input placeholder="ឈ្មោះពេញ" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['director', 'phone']}
                label="លេខទូរស័ព្ទ"
                rules={[{ required: true }]}
              >
                <Input placeholder="012 345 678" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['director', 'email']}
                label="អ៊ីមែល"
              >
                <Input placeholder="example@school.edu.kh" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="ស្ថានភាព"
                initialValue="active"
              >
                <Radio.Group>
                  <Radio value="active">សកម្ម</Radio>
                  <Radio value="inactive">អសកម្ម</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedSchool ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'បង្កើតសាលា'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setSelectedSchool(null);
              }}>
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* School Detail Drawer */}
      <Drawer
        title="ព័ត៌មានលម្អិតសាលា"
        placement="right"
        width={600}
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
      >
        {selectedSchool && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* School Header */}
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge.Ribbon text={selectedSchool.code} color="blue">
                  <Title level={4}>{selectedSchool.nameKh}</Title>
                </Badge.Ribbon>
                <Text type="secondary">{selectedSchool.name}</Text>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text type="secondary">ប្រភេទ៖</Text> <Tag color="blue">បឋមសិក្សា</Tag>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">ស្ថានភាព៖</Text> <Badge status="success" text="សកម្ម" />
                  </Col>
                </Row>
              </Space>
            </Card>

            {/* Statistics */}
            <Card title="ស្ថិតិ">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="គ្រូសរុប" 
                    value={selectedSchool.statistics.totalTeachers} 
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="គ្រូសកម្ម" 
                    value={selectedSchool.statistics.activeTeachers} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="សិស្សសរុប" 
                    value={selectedSchool.statistics.totalStudents} 
                    prefix={<BookOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="សិស្សស្រី" 
                    value={selectedSchool.statistics.femaleStudents} 
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="សិស្សប្រុស" 
                    value={selectedSchool.statistics.maleStudents} 
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Location */}
            <Card title="ទីតាំង">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><EnvironmentOutlined /> <Text strong>តំបន់៖</Text> {selectedSchool.zone}</div>
                <div><Text strong>ខេត្ត៖</Text> {selectedSchool.province}</div>
                <div><Text strong>ស្រុក/ខណ្ឌ៖</Text> {selectedSchool.district}</div>
                <div><Text strong>ឃុំ/សង្កាត់៖</Text> {selectedSchool.commune}</div>
                <div><Text strong>ភូមិ៖</Text> {selectedSchool.village}</div>
                <div><Text strong>អាសយដ្ឋាន៖</Text> {selectedSchool.address}</div>
              </Space>
            </Card>

            {/* Director Info */}
            <Card title="នាយកសាលា">
              <Space>
                <Avatar size={64} icon={<UserOutlined />} />
                <Space direction="vertical">
                  <Text strong>{selectedSchool.director.name}</Text>
                  <Text><PhoneOutlined /> {selectedSchool.director.phone}</Text>
                  <Text><MailOutlined /> {selectedSchool.director.email}</Text>
                </Space>
              </Space>
            </Card>

            {/* Actions */}
            {canEditSchool && (
              <Space style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  block
                  onClick={() => {
                    setIsDetailDrawerVisible(false);
                    handleEdit(selectedSchool);
                  }}
                >
                  កែប្រែព័ត៌មានសាលា
                </Button>
              </Space>
            )}
          </Space>
        )}
      </Drawer>
    </PageWrapper>
  );
};

export default SchoolsPage;