import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Button,
  Progress,
  Badge,
  Tooltip,
  Segmented,
  Avatar,
  List,
  Divider,
  Alert,
  Timeline,
  Radio,
  Checkbox,
  Tabs,
  Empty,
  Spin
} from 'antd';
import {
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  StarFilled,
  SyncOutlined,
  DownloadOutlined,
  FilterOutlined,
  SwapOutlined,
  HeatMapOutlined,
  FundOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { Column, Line, Radar, Heatmap, Bullet, DualAxes } from '@ant-design/plots';
import styled from 'styled-components';
import CountUp from 'react-countup';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Styled Components
const AnalyticsWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 32px;
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
`;

const ComparisonCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }
  
  .metric-change {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    margin-left: 8px;
  }
  
  .positive {
    color: #52c41a;
  }
  
  .negative {
    color: #ff4d4f;
  }
`;

const RankingCard = styled(Card)`
  .ranking-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #fafafa;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f0f0f0;
      transform: translateX(4px);
    }
    
    &.top-3 {
      background: linear-gradient(90deg, #fff3e0 0%, #ffffff 100%);
      border-left: 4px solid #fa8c16;
    }
  }
`;

const HeatmapContainer = styled.div`
  height: 400px;
  .g2-tooltip {
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
  }
`;

const BestPracticeCard = styled(Card)`
  border-left: 4px solid #52c41a;
  
  .practice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .impact-metrics {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
`;

// Mock data for regions
const regionData = {
  'ភ្នំពេញ': {
    schools: 45,
    teachers: 567,
    students: 19845,
    mentors: 78,
    observationRate: 92,
    improvementRate: 18.5,
    literacyGrowth: 22.3,
    budget: 250000,
    efficiency: 94,
    trend: 'up',
    change: 5.2
  },
  'កណ្តាល': {
    schools: 38,
    teachers: 423,
    students: 14805,
    mentors: 65,
    observationRate: 88,
    improvementRate: 16.2,
    literacyGrowth: 19.8,
    budget: 180000,
    efficiency: 91,
    trend: 'up',
    change: 3.8
  },
  'កំពង់ចាម': {
    schools: 52,
    teachers: 612,
    students: 21420,
    mentors: 82,
    observationRate: 85,
    improvementRate: 15.8,
    literacyGrowth: 18.5,
    budget: 220000,
    efficiency: 88,
    trend: 'up',
    change: 2.1
  },
  'សៀមរាប': {
    schools: 41,
    teachers: 489,
    students: 17115,
    mentors: 71,
    observationRate: 90,
    improvementRate: 17.5,
    literacyGrowth: 20.2,
    budget: 195000,
    efficiency: 92,
    trend: 'up',
    change: 4.5
  },
  'បាត់ដំបង': {
    schools: 35,
    teachers: 398,
    students: 13930,
    mentors: 58,
    observationRate: 83,
    improvementRate: 14.9,
    literacyGrowth: 17.2,
    budget: 165000,
    efficiency: 86,
    trend: 'down',
    change: -1.2
  }
};

// Best practices data
const bestPractices = [
  {
    id: 1,
    region: 'ភ្នំពេញ',
    practice: 'កម្មវិធីណែនាំរួមគ្នា',
    description: 'អ្នកណែនាំធ្វើការជាក្រុមដើម្បីចែករំលែកបទពិសោធន៍',
    impact: {
      teacherSatisfaction: 95,
      observationQuality: 92,
      timeReduction: 30
    },
    implementedDate: '2023-06',
    status: 'active'
  },
  {
    id: 2,
    region: 'សៀមរាប',
    practice: 'ប្រព័ន្ធតាមដានឌីជីថល',
    description: 'ប្រើកម្មវិធីទូរស័ព្ទដើម្បីកត់ត្រាការសង្កេត',
    impact: {
      dataAccuracy: 98,
      reportingSpeed: 85,
      costSaving: 40
    },
    implementedDate: '2023-08',
    status: 'active'
  },
  {
    id: 3,
    region: 'កំពង់ចាម',
    practice: 'វគ្គបណ្តុះបណ្តាលគ្រូជាប់លាប់',
    description: 'សិក្ខាសាលាខ្លីៗប្រចាំសប្តាហ៍សម្រាប់គ្រូ',
    impact: {
      skillImprovement: 88,
      teacherEngagement: 91,
      studentOutcomes: 25
    },
    implementedDate: '2023-09',
    status: 'active'
  }
];

const ComparativeAnalytics: React.FC = () => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['ភ្នំពេញ', 'កណ្តាល']);
  const [comparisonMetric, setComparisonMetric] = useState('improvementRate');
  const [timeRange, setTimeRange] = useState('year');
  const [viewMode, setViewMode] = useState('comparison');
  const [loading, setLoading] = useState(false);

  // Calculate rankings
  const rankings = useMemo(() => {
    return Object.entries(regionData)
      .map(([region, data]) => ({
        region,
        ...data,
        score: (data.observationRate * 0.3 + 
                data.improvementRate * 0.3 + 
                data.literacyGrowth * 0.2 + 
                data.efficiency * 0.2)
      }))
      .sort((a, b) => b.score - a.score);
  }, []);

  // Prepare comparison data
  const comparisonData = selectedRegions.map(region => ({
    region,
    ...regionData[region]
  }));

  // Chart configurations
  const radarConfig = {
    data: selectedRegions.flatMap(region => [
      { region, metric: 'ការសង្កេត', value: regionData[region].observationRate },
      { region, metric: 'ការកែលម្អ', value: regionData[region].improvementRate * 5 },
      { region, metric: 'អក្ខរកម្ម', value: regionData[region].literacyGrowth * 4 },
      { region, metric: 'ប្រសិទ្ធភាព', value: regionData[region].efficiency },
      { region, metric: 'ថវិកា', value: (regionData[region].budget / 5000) }
    ]),
    xField: 'metric',
    yField: 'value',
    seriesField: 'region',
    meta: {
      value: {
        min: 0,
        max: 100
      }
    },
    area: {},
    point: {
      size: 4
    }
  };

  const columnConfig = {
    data: comparisonData,
    xField: 'region',
    yField: comparisonMetric,
    seriesField: 'region',
    legend: false,
    columnStyle: {
      radius: [8, 8, 0, 0]
    },
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6
      }
    }
  };

  const dualAxesConfig = {
    data: [comparisonData, comparisonData],
    xField: 'region',
    yField: ['budget', 'efficiency'],
    geometryOptions: [
      {
        geometry: 'column',
        color: '#5B8FF9'
      },
      {
        geometry: 'line',
        lineStyle: {
          lineWidth: 2
        }
      }
    ]
  };

  // Heatmap data
  const heatmapData = [];
  const metrics = ['observationRate', 'improvementRate', 'literacyGrowth', 'efficiency'];
  Object.entries(regionData).forEach(([region, data]) => {
    metrics.forEach(metric => {
      heatmapData.push({
        region,
        metric: metric === 'observationRate' ? 'ការសង្កេត' :
                metric === 'improvementRate' ? 'ការកែលម្អ' :
                metric === 'literacyGrowth' ? 'អក្ខរកម្ម' : 'ប្រសិទ្ធភាព',
        value: data[metric],
        normalizedValue: data[metric] / 100
      });
    });
  });

  return (
    <AnalyticsWrapper>
      {/* Header */}
      <HeaderSection>
        <Row align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <BarChartOutlined /> វិភាគប្រៀបធៀបតាមតំបន់
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
              ប្រៀបធៀបសមិទ្ធកម្ម កំណត់ការអនុវត្តល្អ និងជំរុញការកែលម្អ
            </Paragraph>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<SyncOutlined />} onClick={() => setLoading(true)}>
                ធ្វើបច្ចុប្បន្នភាព
              </Button>
              <Button type="primary" ghost icon={<DownloadOutlined />}>
                ទាញយករបាយការណ៍
              </Button>
            </Space>
          </Col>
        </Row>
      </HeaderSection>

      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>ជ្រើសរើសតំបន់ដើម្បីប្រៀបធៀប</Text>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="ជ្រើសរើសតំបន់"
                value={selectedRegions}
                onChange={setSelectedRegions}
                maxTagCount={3}
              >
                {Object.keys(regionData).map(region => (
                  <Option key={region} value={region}>{region}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>សូចនាករប្រៀបធៀប</Text>
              <Select
                style={{ width: '100%' }}
                value={comparisonMetric}
                onChange={setComparisonMetric}
              >
                <Option value="improvementRate">អត្រាកែលម្អ</Option>
                <Option value="observationRate">អត្រាសង្កេត</Option>
                <Option value="literacyGrowth">កំណើនអក្ខរកម្ម</Option>
                <Option value="efficiency">ប្រសិទ្ធភាព</Option>
                <Option value="budget">ថវិកា</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>របៀបមើល</Text>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: 'ប្រៀបធៀប', value: 'comparison' },
                  { label: 'ចំណាត់ថ្នាក់', value: 'ranking' },
                  { label: 'ផែនទីកំដៅ', value: 'heatmap' },
                  { label: 'ការអនុវត្តល្អ', value: 'bestpractices' }
                ]}
                block
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Spin spinning={loading} tip="កំពុងផ្ទុកទិន្នន័យ...">
        {viewMode === 'comparison' && (
          <>
            {/* Key Metrics Comparison */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {selectedRegions.map((region, index) => (
                <Col xs={24} md={12} lg={8} key={region}>
                  <ComparisonCard>
                    <Row align="middle" gutter={16} style={{ marginBottom: 16 }}>
                      <Col>
                        <Avatar 
                          size={48} 
                          style={{ 
                            backgroundColor: index === 0 ? '#1890ff' : '#52c41a',
                            fontSize: 24
                          }}
                        >
                          {region.charAt(0)}
                        </Avatar>
                      </Col>
                      <Col flex={1}>
                        <Title level={4} style={{ margin: 0 }}>{region}</Title>
                        <Space>
                          <Text type="secondary">{regionData[region].schools} សាលា</Text>
                          <Divider type="vertical" />
                          <Text type="secondary">{regionData[region].teachers} គ្រូ</Text>
                        </Space>
                      </Col>
                    </Row>
                    
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                        <Text type="secondary">អត្រាកែលម្អ</Text>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                            {regionData[region].improvementRate}%
                          </Text>
                          <span className={`metric-change ${regionData[region].trend === 'up' ? 'positive' : 'negative'}`}>
                            {regionData[region].trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
                            {Math.abs(regionData[region].change)}%
                          </span>
                        </div>
                        <Progress 
                          percent={regionData[region].improvementRate} 
                          strokeColor="#52c41a"
                          showInfo={false}
                        />
                      </div>
                      
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="កំណើនអក្ខរកម្ម"
                            value={regionData[region].literacyGrowth}
                            suffix="%"
                            valueStyle={{ fontSize: 20 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="ប្រសិទ្ធភាព"
                            value={regionData[region].efficiency}
                            suffix="%"
                            valueStyle={{ fontSize: 20, color: '#1890ff' }}
                          />
                        </Col>
                      </Row>
                    </Space>
                  </ComparisonCard>
                </Col>
              ))}
            </Row>

            {/* Comparison Charts */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="ការវិភាគពហុមាត្រដ្ឋាន">
                  <Radar {...radarConfig} height={350} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="ប្រៀបធៀបតាមសូចនាករ">
                  <Column {...columnConfig} height={350} />
                </Card>
              </Col>
            </Row>

            {/* Detailed Comparison Table */}
            <Card title="តារាងប្រៀបធៀបលម្អិត" style={{ marginTop: 24 }}>
              <Table
                dataSource={comparisonData}
                columns={[
                  {
                    title: 'តំបន់',
                    dataIndex: 'region',
                    key: 'region',
                    fixed: 'left',
                    render: (text) => <Text strong>{text}</Text>
                  },
                  {
                    title: 'សាលារៀន',
                    dataIndex: 'schools',
                    key: 'schools',
                    sorter: (a, b) => a.schools - b.schools
                  },
                  {
                    title: 'គ្រូ',
                    dataIndex: 'teachers',
                    key: 'teachers',
                    sorter: (a, b) => a.teachers - b.teachers
                  },
                  {
                    title: 'សិស្ស',
                    dataIndex: 'students',
                    key: 'students',
                    render: (val) => val.toLocaleString()
                  },
                  {
                    title: 'អត្រាសង្កេត',
                    dataIndex: 'observationRate',
                    key: 'observationRate',
                    render: (val) => (
                      <Progress percent={val} size="small" style={{ width: 80 }} />
                    )
                  },
                  {
                    title: 'កែលម្អ',
                    dataIndex: 'improvementRate',
                    key: 'improvementRate',
                    render: (val, record) => (
                      <Space>
                        <Text>{val}%</Text>
                        <Text className={record.trend === 'up' ? 'positive' : 'negative'}>
                          {record.trend === 'up' ? '↑' : '↓'}
                        </Text>
                      </Space>
                    )
                  },
                  {
                    title: 'ថវិកា',
                    dataIndex: 'budget',
                    key: 'budget',
                    render: (val) => `$${val.toLocaleString()}`
                  },
                  {
                    title: 'ប្រសិទ្ធភាព',
                    dataIndex: 'efficiency',
                    key: 'efficiency',
                    render: (val) => (
                      <Badge
                        count={`${val}%`}
                        style={{
                          backgroundColor: val >= 90 ? '#52c41a' : 
                                         val >= 80 ? '#1890ff' : '#faad14'
                        }}
                      />
                    )
                  }
                ]}
                pagination={false}
              />
            </Card>
          </>
        )}

        {viewMode === 'ranking' && (
          <>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <RankingCard 
                  title="ចំណាត់ថ្នាក់សមិទ្ធកម្មសរុប"
                  extra={<Tag color="gold">ធ្វើបច្ចុប្បន្នភាពប្រចាំថ្ងៃ</Tag>}
                >
                  {rankings.map((item, index) => (
                    <div 
                      key={item.region} 
                      className={`ranking-item ${index < 3 ? 'top-3' : ''}`}
                    >
                      <Row align="middle" gutter={16}>
                        <Col span={2}>
                          <Avatar 
                            size={40}
                            style={{
                              backgroundColor: index === 0 ? '#ffd700' :
                                             index === 1 ? '#c0c0c0' :
                                             index === 2 ? '#cd7f32' : '#f0f0f0',
                              color: index < 3 ? 'white' : '#8c8c8c',
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </Col>
                        <Col span={6}>
                          <Text strong style={{ fontSize: 16 }}>{item.region}</Text>
                          <br />
                          <Text type="secondary">{item.schools} សាលា • {item.teachers} គ្រូ</Text>
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="ពិន្ទុសរុប"
                            value={item.score.toFixed(1)}
                            valueStyle={{ fontSize: 20 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Space size="large">
                            <div>
                              <Text type="secondary">សង្កេត</Text>
                              <br />
                              <Text strong>{item.observationRate}%</Text>
                            </div>
                            <Divider type="vertical" />
                            <div>
                              <Text type="secondary">កែលម្អ</Text>
                              <br />
                              <Text strong>{item.improvementRate}%</Text>
                            </div>
                            <Divider type="vertical" />
                            <div>
                              <Text type="secondary">អក្ខរកម្ម</Text>
                              <br />
                              <Text strong>{item.literacyGrowth}%</Text>
                            </div>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </RankingCard>
              </Col>
              
              <Col xs={24} lg={8}>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Card>
                    <Statistic
                      title="តំបន់ដែលមានការរីកចម្រើនបំផុត"
                      value="ភ្នំពេញ"
                      prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
                    />
                    <Text type="secondary">កើនឡើង 22.3% ក្នុងរយៈពេល 6 ខែ</Text>
                  </Card>
                  
                  <Card>
                    <Title level={5}>សូចនាករពិសេស</Title>
                    <List
                      size="small"
                      dataSource={[
                        { label: 'តំបន់លើសពីគោលដៅ', value: 3, color: 'success' },
                        { label: 'តំបន់ត្រូវការជំនួយ', value: 2, color: 'warning' },
                        { label: 'ប្រសិទ្ធភាពមធ្យម', value: '89%', color: 'blue' }
                      ]}
                      renderItem={item => (
                        <List.Item>
                          <Text>{item.label}</Text>
                          <Tag color={item.color}>{item.value}</Tag>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Space>
              </Col>
            </Row>
          </>
        )}

        {viewMode === 'heatmap' && (
          <Card 
            title="ផែនទីកំដៅសមិទ្ធកម្ម"
            extra={
              <Space>
                <HeatMapOutlined style={{ color: '#fa8c16' }} />
                <Text type="secondary">កំដៅបង្ហាញពីសមិទ្ធកម្ម</Text>
              </Space>
            }
          >
            <HeatmapContainer>
              <Heatmap
                data={heatmapData}
                xField="region"
                yField="metric"
                colorField="normalizedValue"
                color={['#BAE7FF', '#1890FF', '#0050B3']}
                label={{
                  visible: true,
                  formatter: (val) => `${(val.value).toFixed(0)}%`
                }}
                tooltip={{
                  formatter: (datum) => ({
                    name: datum.metric,
                    value: `${datum.value.toFixed(1)}%`
                  })
                }}
              />
            </HeatmapContainer>
            
            <Alert
              message="របៀបអាន"
              description="ពណ៌ក្តៅបង្ហាញពីសមិទ្ធកម្មខ្ពស់ ពណ៌ត្រជាក់បង្ហាញពីតំបន់ដែលត្រូវការការកែលម្អ"
              type="info"
              showIcon
              style={{ marginTop: 24 }}
            />
          </Card>
        )}

        {viewMode === 'bestpractices' && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Alert
                  message="ការអនុវត្តល្អដែលបានកំណត់"
                  description="វិធីសាស្ត្រទាំងនេះបានបង្ហាញពីលទ្ធផលល្អបំផុតនិងអាចអនុវត្តនៅតំបន់ផ្សេងៗ"
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </Col>
              
              {bestPractices.map((practice, index) => (
                <Col xs={24} lg={12} key={practice.id}>
                  <BestPracticeCard>
                    <div className="practice-header">
                      <Space>
                        <Avatar
                          size={48}
                          style={{
                            backgroundColor: '#52c41a',
                            fontSize: 24
                          }}
                        >
                          <BulbOutlined />
                        </Avatar>
                        <div>
                          <Title level={5} style={{ margin: 0 }}>{practice.practice}</Title>
                          <Space split={<Divider type="vertical" />}>
                            <Text type="secondary">{practice.region}</Text>
                            <Text type="secondary">អនុវត្តតាំងពី {practice.implementedDate}</Text>
                          </Space>
                        </div>
                      </Space>
                      <Tag color="success">សកម្ម</Tag>
                    </div>
                    
                    <Paragraph>{practice.description}</Paragraph>
                    
                    <div className="impact-metrics">
                      {Object.entries(practice.impact).map(([key, value]) => (
                        <div key={key}>
                          <Text type="secondary">
                            {key === 'teacherSatisfaction' ? 'ពេញចិត្តគ្រូ' :
                             key === 'observationQuality' ? 'គុណភាពសង្កេត' :
                             key === 'dataAccuracy' ? 'ភាពត្រឹមត្រូវទិន្នន័យ' :
                             key === 'reportingSpeed' ? 'ល្បឿនរាយការណ៍' :
                             key === 'costSaving' ? 'សន្សំថវិកា' :
                             key === 'skillImprovement' ? 'កែលម្អជំនាញ' :
                             key === 'teacherEngagement' ? 'ការចូលរួមគ្រូ' :
                             'លទ្ធផលសិស្ស'}
                          </Text>
                          <br />
                          <Text strong style={{ fontSize: 20 }}>
                            {value}%
                          </Text>
                        </div>
                      ))}
                    </div>
                    
                    <Divider />
                    
                    <Space>
                      <Button type="primary" size="small">
                        អនុវត្តនៅតំបន់ផ្សេង
                      </Button>
                      <Button size="small">
                        មើលព័ត៌មានលម្អិត
                      </Button>
                    </Space>
                  </BestPracticeCard>
                </Col>
              ))}
            </Row>
            
            <Card title="ការណែនាំសម្រាប់ការអនុវត្ត" style={{ marginTop: 24 }}>
              <Timeline>
                <Timeline.Item color="blue">
                  វាយតម្លៃស្ថានភាពបច្ចុប្បន្ននៃតំបន់
                </Timeline.Item>
                <Timeline.Item color="blue">
                  ជ្រើសរើសការអនុវត្តដែលសមស្របបំផុត
                </Timeline.Item>
                <Timeline.Item color="blue">
                  បង្កើតផែនការអនុវត្តជាមួយគោលដៅច្បាស់លាស់
                </Timeline.Item>
                <Timeline.Item color="green">
                  ចាប់ផ្តើមអនុវត្តជាដំណាក់កាល
                </Timeline.Item>
                <Timeline.Item>
                  តាមដាននិងវាស់វែងលទ្ធផល
                </Timeline.Item>
              </Timeline>
            </Card>
          </>
        )}
      </Spin>

      {/* Insights Section */}
      <Card 
        title="ការយល់ដឹងសំខាន់ៗ"
        style={{ marginTop: 24 }}
        extra={<InfoCircleOutlined />}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical">
              <Text type="secondary">តំបន់ដែលរីកចម្រើនលឿនបំផុត</Text>
              <Text strong style={{ fontSize: 18 }}>ភ្នំពេញ (+5.2%)</Text>
              <Text type="success">កើនឡើង 22.3% ក្នុង 6 ខែ</Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical">
              <Text type="secondary">ប្រសិទ្ធភាពចំណាយល្អបំផុត</Text>
              <Text strong style={{ fontSize: 18 }}>សៀមរាប</Text>
              <Text type="success">$11.40 ក្នុងមួយសិស្ស</Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical">
              <Text type="secondary">តំបន់ត្រូវការការយកចិត្តទុកដាក់</Text>
              <Text strong style={{ fontSize: 18 }}>បាត់ដំបង (-1.2%)</Text>
              <Text type="warning">ត្រូវការជំនួយបន្ថែម</Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </AnalyticsWrapper>
  );
};

export default ComparativeAnalytics;