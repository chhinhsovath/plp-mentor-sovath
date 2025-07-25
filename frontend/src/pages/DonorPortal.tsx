import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Tabs,
  Timeline,
  Avatar,
  List,
  Badge,
  Tooltip,
  Divider,
  Select,
  DatePicker,
  Empty,
  Result,
  Segmented,
  Alert
} from 'antd';
import {
  DollarOutlined,
  FundOutlined,
  RiseOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BankOutlined,
  GlobalOutlined,
  HeartOutlined,
  TeamOutlined,
  FileTextOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Pie, Line, Column, Liquid, Gauge, Area } from '@ant-design/plots';
import styled from 'styled-components';
import CountUp from 'react-countup';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Styled Components
const DonorWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const HeroCard = styled(Card)`
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 48px;
  }
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.85);
  }
  
  .ant-statistic-content {
    color: white;
  }
`;

const FundCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }
`;

const DonorCard = styled(Card)`
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .donor-tier {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
`;

const ImpactMetric = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${props => props.color || '#f0f2f5'};
  border-radius: 8px;
  margin-bottom: 12px;
  
  .metric-icon {
    font-size: 32px;
    color: ${props => props.iconColor || '#1890ff'};
  }
  
  .metric-content {
    flex: 1;
    margin: 0 16px;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #262626;
  }
`;

// Mock data
const fundAllocation = [
  { category: 'ការបណ្តុះបណ្តាលគ្រូ', value: 35, amount: 350000 },
  { category: 'សម្ភារៈសិក្សា', value: 25, amount: 250000 },
  { category: 'កម្មវិធីណែនាំ', value: 20, amount: 200000 },
  { category: 'បច្ចេកវិទ្យា', value: 15, amount: 150000 },
  { category: 'ប្រតិបត្តិការ', value: 5, amount: 50000 }
];

const monthlyTrend = [
  { month: 'មករា', donations: 850000, expenses: 720000 },
  { month: 'កុម្ភៈ', donations: 920000, expenses: 780000 },
  { month: 'មីនា', donations: 1100000, expenses: 890000 },
  { month: 'មេសា', donations: 980000, expenses: 850000 },
  { month: 'ឧសភា', donations: 1250000, expenses: 920000 },
  { month: 'មិថុនា', donations: 1180000, expenses: 980000 }
];

const topDonors = [
  { id: 1, name: 'មូលនិធិអាស៊ី', amount: 500000, tier: 'platinum', logo: '🏛️' },
  { id: 2, name: 'ក្រុមហ៊ុន ABC', amount: 350000, tier: 'gold', logo: '🏢' },
  { id: 3, name: 'អង្គការ XYZ', amount: 250000, tier: 'gold', logo: '🌟' },
  { id: 4, name: 'បុគ្គលសប្បុរស', amount: 150000, tier: 'silver', logo: '❤️' },
  { id: 5, name: 'សមាគមអ្នកជំនួញ', amount: 100000, tier: 'silver', logo: '🤝' }
];

const recentDonations = [
  {
    id: 1,
    donor: 'មូលនិធិអាស៊ី',
    amount: 50000,
    date: '2024-01-15',
    purpose: 'កម្មវិធីបណ្តុះបណ្តាលគ្រូ',
    status: 'completed'
  },
  {
    id: 2,
    donor: 'ក្រុមហ៊ុន ABC',
    amount: 35000,
    date: '2024-01-14',
    purpose: 'សម្ភារៈសិក្សា',
    status: 'completed'
  },
  {
    id: 3,
    donor: 'អង្គការ XYZ',
    amount: 25000,
    date: '2024-01-13',
    purpose: 'បច្ចេកវិទ្យាអប់រំ',
    status: 'processing'
  }
];

const impactProjects = [
  {
    id: 1,
    name: 'កម្មវិធីអក្ខរកម្មថ្នាក់ទី១',
    budget: 150000,
    spent: 120000,
    progress: 80,
    beneficiaries: 2500,
    schools: 15,
    status: 'active'
  },
  {
    id: 2,
    name: 'បណ្តុះបណ្តាលគ្រូគណិតវិទ្យា',
    budget: 100000,
    spent: 45000,
    progress: 45,
    beneficiaries: 850,
    schools: 8,
    status: 'active'
  },
  {
    id: 3,
    name: 'កម្មវិធីអានឱ្យកូនស្តាប់',
    budget: 80000,
    spent: 78000,
    progress: 97.5,
    beneficiaries: 3200,
    schools: 20,
    status: 'completed'
  }
];

const DonorPortal: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [activeTab, setActiveTab] = useState('overview');

  // Chart configurations
  const pieConfig = {
    data: fundAllocation,
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'spider',
      content: '{name}\n{percentage}'
    },
    interactions: [{ type: 'element-active' }]
  };

  const lineConfig = {
    data: monthlyTrend,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    }
  };

  const liquidConfig = {
    percent: 0.85,
    outline: {
      border: 4,
      distance: 8
    },
    wave: {
      length: 128
    },
    statistic: {
      title: {
        formatter: () => 'ប្រសិទ្ធភាព',
        style: {
          fontSize: '16px'
        }
      },
      content: {
        style: {
          fontSize: '24px'
        }
      }
    }
  };

  return (
    <DonorWrapper>
      {/* Hero Section */}
      <HeroCard>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="large">
              <Title level={1} style={{ color: 'white', margin: 0 }}>
                វិស័យតម្លាភាពហិរញ្ញវត្ថុ
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
                តាមដានផលប៉ះពាល់នៃការវិនិយោគរបស់អ្នកក្នុងការអប់រំកម្ពុជា
              </Paragraph>
              <Space>
                <Button type="primary" size="large" ghost icon={<DownloadOutlined />}>
                  ទាញយករបាយការណ៍
                </Button>
                <Button size="large" style={{ background: 'white', borderColor: 'white' }}>
                  មើលវីដេអូអំពីផលប៉ះពាល់
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="ថវិកាសរុបឆ្នាំនេះ"
                  value={1250000}
                  prefix="$"
                  valueStyle={{ fontSize: 32 }}
                  formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="ប្រសិទ្ធភាពចំណាយ"
                  value={85}
                  suffix="%"
                  valueStyle={{ fontSize: 32 }}
                  formatter={(value) => <CountUp end={value as number} duration={2} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="សិស្សទទួលផល"
                  value={45678}
                  valueStyle={{ fontSize: 32 }}
                  formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="គ្រូបានបណ្តុះបណ្តាល"
                  value={1234}
                  valueStyle={{ fontSize: 32 }}
                  formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </HeroCard>

      {/* Navigation Tabs */}
      <Card style={{ marginBottom: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab="ទិដ្ឋភាពទូទៅ" key="overview" />
          <TabPane tab="ការបែងចែកថវិកា" key="allocation" />
          <TabPane tab="គម្រោងនិងផលប៉ះពាល់" key="projects" />
          <TabPane tab="អ្នកឧបត្ថម្ភ" key="donors" />
          <TabPane tab="របាយការណ៍" key="reports" />
        </Tabs>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <FundCard>
                <Statistic
                  title="ថវិកាទទួលបាន"
                  value={1250000}
                  prefix={<DollarOutlined />}
                  suffix="USD"
                  valueStyle={{ color: '#3f8600' }}
                />
                <Progress percent={100} showInfo={false} strokeColor="#52c41a" />
                <Text type="secondary">100% នៃគោលដៅ</Text>
              </FundCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FundCard>
                <Statistic
                  title="ថវិកាបានចំណាយ"
                  value={1062500}
                  prefix={<FundOutlined />}
                  suffix="USD"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress percent={85} strokeColor="#1890ff" />
                <Text type="secondary">85% នៃថវិកាសរុប</Text>
              </FundCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FundCard>
                <Statistic
                  title="គម្រោងសកម្ម"
                  value={12}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Space>
                  <Badge status="success" text="កំពុងដំណើរការ" />
                </Space>
              </FundCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FundCard>
                <Statistic
                  title="អ្នកឧបត្ថម្ភ"
                  value={45}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <Space>
                  <Text type="secondary"><RiseOutlined /> កើន 23%</Text>
                </Space>
              </FundCard>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="និន្នាការចំណូល-ចំណាយ" extra={<Tag color="blue">ឆ្នាំ 2024</Tag>}>
                <Area
                  data={monthlyTrend.flatMap(item => [
                    { month: item.month, value: item.donations, type: 'ចំណូល' },
                    { month: item.month, value: item.expenses, type: 'ចំណាយ' }
                  ])}
                  xField="month"
                  yField="value"
                  seriesField="type"
                  smooth
                  areaStyle={{ fillOpacity: 0.6 }}
                  height={300}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="ប្រសិទ្ធភាពចំណាយ">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Liquid {...liquidConfig} height={200} />
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <ImpactMetric color="#f6ffed" iconColor="#52c41a">
                        <CheckCircleOutlined className="metric-icon" />
                        <div className="metric-content">
                          <div>គម្រោងបញ្ចប់</div>
                          <div className="metric-value">8</div>
                        </div>
                      </ImpactMetric>
                      <ImpactMetric color="#e6f4ff" iconColor="#1890ff">
                        <ClockCircleOutlined className="metric-icon" />
                        <div className="metric-content">
                          <div>កំពុងដំណើរការ</div>
                          <div className="metric-value">12</div>
                        </div>
                      </ImpactMetric>
                      <ImpactMetric color="#fff7e6" iconColor="#fa8c16">
                        <InfoCircleOutlined className="metric-icon" />
                        <div className="metric-content">
                          <div>គ្រោងទុក</div>
                          <div className="metric-value">5</div>
                        </div>
                      </ImpactMetric>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities */}
          <Card title="សកម្មភាពថ្មីៗ" extra={<Button type="link">មើលទាំងអស់</Button>}>
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>មូលនិធិអាស៊ី</Text> បានផ្តល់ថវិកា <Text strong>$50,000</Text> សម្រាប់កម្មវិធីបណ្តុះបណ្តាលគ្រូ
                <br />
                <Text type="secondary">2 ថ្ងៃមុន</Text>
              </Timeline.Item>
              <Timeline.Item color="blue">
                គម្រោង <Text strong>អក្ខរកម្មថ្នាក់ទី១</Text> សម្រេចបាន 80% នៃគោលដៅ
                <br />
                <Text type="secondary">5 ថ្ងៃមុន</Text>
              </Timeline.Item>
              <Timeline.Item>
                របាយការណ៍ត្រីមាសទី 2 ត្រូវបានបោះពុម្ពផ្សាយ
                <br />
                <Text type="secondary">1 សប្តាហ៍មុន</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </>
      )}

      {/* Allocation Tab */}
      {activeTab === 'allocation' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="ការបែងចែកថវិកាតាមប្រភេទ">
              <Pie {...pieConfig} height={400} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="ព័ត៌មានលម្អិតការចំណាយ">
              <Table
                dataSource={fundAllocation}
                columns={[
                  {
                    title: 'ប្រភេទ',
                    dataIndex: 'category',
                    key: 'category'
                  },
                  {
                    title: 'ចំនួនទឹកប្រាក់',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (amount) => `$${amount.toLocaleString()}`
                  },
                  {
                    title: 'ភាគរយ',
                    dataIndex: 'value',
                    key: 'value',
                    render: (value) => (
                      <Progress 
                        percent={value} 
                        size="small" 
                        strokeColor="#1890ff"
                      />
                    )
                  }
                ]}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {impactProjects.map(project => (
              <Col xs={24} md={8} key={project.id}>
                <Card
                  title={project.name}
                  extra={
                    <Tag color={project.status === 'completed' ? 'success' : 'processing'}>
                      {project.status === 'completed' ? 'បានបញ្ចប់' : 'កំពុងដំណើរការ'}
                    </Tag>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text type="secondary">វឌ្ឍនភាព</Text>
                      <Progress 
                        percent={project.progress} 
                        status={project.status === 'completed' ? 'success' : 'active'}
                      />
                    </div>
                    <Row>
                      <Col span={12}>
                        <Statistic
                          title="ថវិកា"
                          value={project.budget}
                          prefix="$"
                          valueStyle={{ fontSize: 20 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="បានចំណាយ"
                          value={project.spent}
                          prefix="$"
                          valueStyle={{ fontSize: 20, color: '#cf1322' }}
                        />
                      </Col>
                    </Row>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row>
                      <Col span={12}>
                        <Space>
                          <UserOutlined />
                          <Text>{project.beneficiaries.toLocaleString()} សិស្ស</Text>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Space>
                          <BookOutlined />
                          <Text>{project.schools} សាលា</Text>
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
          
          <Card title="ផលប៉ះពាល់សរុប">
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="សិស្សទទួលផលសរុប"
                  value={45678}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="គ្រូបានបណ្តុះបណ្តាល"
                  value={1234}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="សាលារៀនចូលរួម"
                  value={156}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="តម្លៃក្នុងម្នាក់"
                  value={27.50}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* Donors Tab */}
      {activeTab === 'donors' && (
        <>
          <Card 
            title="អ្នកឧបត្ថម្ភកំពូល" 
            style={{ marginBottom: 24 }}
            extra={
              <Space>
                <Tag color="gold">ស្វ័យប្រវត្តិ</Tag>
                <Tag color="silver">ប្រាក់</Tag>
                <Tag color="#cd7f32">សំរិទ្ធ</Tag>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {topDonors.map((donor, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={donor.id}>
                  <DonorCard>
                    <div className="donor-tier" style={{
                      color: donor.tier === 'platinum' ? '#e6e6e6' :
                            donor.tier === 'gold' ? '#ffd700' : '#c0c0c0'
                    }}>
                      {donor.tier.toUpperCase()}
                    </div>
                    <Avatar size={64} style={{ fontSize: 32, marginBottom: 16 }}>
                      {donor.logo}
                    </Avatar>
                    <Title level={5}>{donor.name}</Title>
                    <Statistic
                      value={donor.amount}
                      prefix="$"
                      valueStyle={{ fontSize: 20 }}
                    />
                    {index < 3 && (
                      <Badge
                        count={`លេខ ${index + 1}`}
                        style={{
                          backgroundColor: index === 0 ? '#ffd700' :
                                         index === 1 ? '#c0c0c0' : '#cd7f32'
                        }}
                      />
                    )}
                  </DonorCard>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title="ប្រវត្តិការឧបត្ថម្ភ">
            <Table
              dataSource={recentDonations}
              columns={[
                {
                  title: 'អ្នកឧបត្ថម្ភ',
                  dataIndex: 'donor',
                  key: 'donor',
                  render: (text) => <Text strong>{text}</Text>
                },
                {
                  title: 'ចំនួនទឹកប្រាក់',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => (
                    <Text style={{ color: '#3f8600', fontWeight: 'bold' }}>
                      ${amount.toLocaleString()}
                    </Text>
                  )
                },
                {
                  title: 'គោលបំណង',
                  dataIndex: 'purpose',
                  key: 'purpose'
                },
                {
                  title: 'កាលបរិច្ឆេទ',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date) => new Date(date).toLocaleDateString('km-KH')
                },
                {
                  title: 'ស្ថានភាព',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'completed' ? 'success' : 'processing'}>
                      {status === 'completed' ? 'បានបញ្ចប់' : 'កំពុងដំណើរការ'}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="របាយការណ៍តម្លាភាព"
              description="ទាញយករបាយការណ៍លម្អិតអំពីការប្រើប្រាស់ថវិកា និងផលប៉ះពាល់"
              type="info"
              showIcon
              action={
                <Space>
                  <Button size="small" type="primary">ទាញយក PDF</Button>
                  <Button size="small">ទាញយក Excel</Button>
                </Space>
              }
            />
          </Col>
          
          <Col xs={24} md={12}>
            <Card
              title="របាយការណ៍ត្រីមាស"
              extra={<FileTextOutlined style={{ fontSize: 24 }} />}
            >
              <List
                dataSource={[
                  { title: 'ត្រីមាសទី 1 - 2024', date: '2024-04-01' },
                  { title: 'ត្រីមាសទី 4 - 2023', date: '2024-01-01' },
                  { title: 'ត្រីមាសទី 3 - 2023', date: '2023-10-01' }
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button type="link" icon={<DownloadOutlined />}>PDF</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>Excel</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} />}
                      title={item.title}
                      description={`បោះពុម្ពផ្សាយ៖ ${new Date(item.date).toLocaleDateString('km-KH')}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card
              title="របាយការណ៍ពិសេស"
              extra={<PieChartOutlined style={{ fontSize: 24 }} />}
            >
              <List
                dataSource={[
                  { title: 'ផលប៉ះពាល់អក្ខរកម្ម 2023', type: 'impact' },
                  { title: 'វិភាគចំណាយតាមខេត្ត', type: 'analysis' },
                  { title: 'ប្រសិទ្ធភាពកម្មវិធី', type: 'efficiency' }
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="primary" size="small">មើល</Button>]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: item.type === 'impact' ? '#52c41a' :
                                           item.type === 'analysis' ? '#1890ff' : '#722ed1'
                          }}
                        >
                          {item.type === 'impact' ? '📊' :
                           item.type === 'analysis' ? '📈' : '📉'}
                        </Avatar>
                      }
                      title={item.title}
                      description={
                        <Tag>{item.type === 'impact' ? 'ផលប៉ះពាល់' :
                              item.type === 'analysis' ? 'វិភាគ' : 'ប្រសិទ្ធភាព'}</Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </DonorWrapper>
  );
};

export default DonorPortal;