import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Divider,
  Timeline,
  List,
  Avatar
} from 'antd';
import {
  RiseOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  LineChartOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { Line, Pie, Column, Area } from '@ant-design/charts';

const { Title, Text } = Typography;

const PlatformMetrics: React.FC = () => {
  // Sample data for charts
  const growthData = [
    { month: 'មករា', users: 5000, observations: 12000 },
    { month: 'កុម្ភៈ', users: 6500, observations: 15000 },
    { month: 'មីនា', users: 8000, observations: 18000 },
    { month: 'មេសា', users: 9500, observations: 22000 },
    { month: 'ឧសភា', users: 11000, observations: 28000 },
    { month: 'មិថុនា', users: 13000, observations: 35000 },
    { month: 'កក្កដា', users: 15000, observations: 45000 }
  ];

  const provinceData = [
    { province: 'ភ្នំពេញ', count: 2500 },
    { province: 'កណ្តាល', count: 2000 },
    { province: 'សៀមរាប', count: 1800 },
    { province: 'បាត់ដំបង', count: 1500 },
    { province: 'កំពង់ចាម', count: 1200 },
    { province: 'ផ្សេងៗ', count: 8000 }
  ];

  const qualityData = [
    { category: 'ការរៀបចំមេរៀន', before: 65, after: 85 },
    { category: 'បច្ចេកទេសបង្រៀន', before: 60, after: 82 },
    { category: 'ការចូលរួមរបស់សិស្ស', before: 70, after: 88 },
    { category: 'ការវាយតម្លៃ', before: 55, after: 78 },
    { category: 'ការគ្រប់គ្រងថ្នាក់', before: 68, after: 85 }
  ];

  const impactMetrics = [
    {
      title: 'អត្រាការឡើងថ្នាក់របស់សិស្ស',
      value: 92,
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'ការពេញចិត្តរបស់មាតាបិតា',
      value: 85,
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'អវត្តមានគ្រូបង្រៀន',
      value: 12,
      change: '-45%',
      trend: 'down'
    },
    {
      title: 'ពិន្ទុជាតិមធ្យម',
      value: 78,
      change: '+12%',
      trend: 'up'
    }
  ];

  const lineConfig = {
    data: growthData,
    xField: 'month',
    yField: ['users', 'observations'],
    geometryOptions: [
      { geometry: 'line', color: '#1890ff' },
      { geometry: 'line', color: '#52c41a' }
    ],
    legend: {
      items: [
        { name: 'អ្នកប្រើប្រាស់', value: 'users', marker: { style: { fill: '#1890ff' } } },
        { name: 'ការសង្កេត', value: 'observations', marker: { style: { fill: '#52c41a' } } }
      ]
    }
  };

  const pieConfig = {
    data: provinceData,
    angleField: 'count',
    colorField: 'province',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}'
    }
  };

  const columnConfig = {
    data: qualityData.flatMap(d => [
      { category: d.category, type: 'មុន', value: d.before },
      { category: d.category, type: 'ក្រោយ', value: d.after }
    ]),
    xField: 'category',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: {
      radius: [20, 20, 0, 0]
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>ទិន្នន័យ និងផលប៉ះពាល់</Title>
      
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="អ្នកប្រើប្រាស់សកម្ម"
              value={15000}
              prefix={<UserOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <RiseOutlined /> 25%
                </Text>
              }
            />
            <Progress percent={85} strokeColor="#1890ff" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="សាលារៀនចូលរួម"
              value={2500}
              prefix={<GlobalOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <RiseOutlined /> 15%
                </Text>
              }
            />
            <Progress percent={75} strokeColor="#52c41a" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ការសង្កេតប្រចាំខែ"
              value={8500}
              prefix={<BookOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <RiseOutlined /> 30%
                </Text>
              }
            />
            <Progress percent={92} strokeColor="#faad14" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="កំណើនគុណភាព"
              value={78}
              prefix={<TrophyOutlined />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={78} strokeColor="#52c41a" showInfo={false} />
          </Card>
        </Col>
      </Row>

      {/* Growth Chart */}
      <Card title="និន្នាការកំណើន" style={{ marginBottom: 24 }}>
        <Line {...lineConfig} height={300} />
      </Card>

      {/* Distribution and Quality */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="ការចែកចាយតាមខេត្ត">
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="ការកែលម្អគុណភាពបង្រៀន">
            <Column {...columnConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Impact Metrics */}
      <Card title="ផលប៉ះពាល់លើការអប់រំ" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {impactMetrics.map((metric, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card style={{ textAlign: 'center' }}>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.title.includes('អត្រា') || metric.title.includes('ពិន្ទុ') ? '%' : ''}
                  valueStyle={{ 
                    color: metric.trend === 'up' ? '#52c41a' : '#ff4d4f' 
                  }}
                />
                <Tag color={metric.trend === 'up' ? 'success' : 'error'}>
                  {metric.change}
                </Tag>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Success Timeline */}
      <Card title="សមិទ្ធផលសំខាន់ៗ">
        <Timeline mode="alternate">
          <Timeline.Item 
            color="green"
            dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
          >
            <Card size="small">
              <Text strong>ខែមករា ២០២៤</Text>
              <br />
              <Text>ចាប់ផ្តើមសាកល្បងជាមួយសាលារៀន ១០០</Text>
            </Card>
          </Timeline.Item>
          <Timeline.Item color="blue">
            <Card size="small">
              <Text strong>ខែមីនា ២០២៤</Text>
              <br />
              <Text>ពង្រីកទៅខេត្តចំនួន ៥</Text>
            </Card>
          </Timeline.Item>
          <Timeline.Item 
            color="orange"
            dot={<TrophyOutlined style={{ fontSize: '16px' }} />}
          >
            <Card size="small">
              <Text strong>ខែឧសភា ២០២៤</Text>
              <br />
              <Text>សម្រេចបានគោលដៅ ១០,០០០ អ្នកប្រើប្រាស់</Text>
            </Card>
          </Timeline.Item>
          <Timeline.Item>
            <Card size="small">
              <Text strong>ខែកក្កដា ២០២៤</Text>
              <br />
              <Text>ចាប់ផ្តើមការពង្រីកទូទាំងប្រទេស</Text>
            </Card>
          </Timeline.Item>
        </Timeline>
      </Card>

      {/* Recognition */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="ការទទួលស្គាល់">
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: 'ពានរង្វាន់នវានុវត្តន៍ការអប់រំ',
                  description: 'ពីក្រសួងអប់រំ យុវជន និងកីឡា'
                },
                {
                  title: 'កម្មវិធីឌីជីថលល្អបំផុត',
                  description: 'ពីសមាគមបច្ចេកវិទ្យាកម្ពុជា'
                },
                {
                  title: 'ការទទួលស្គាល់អន្តរជាតិ',
                  description: 'ពី UNESCO សម្រាប់ការអប់រំឌីជីថល'
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TrophyOutlined />} style={{ backgroundColor: '#faad14' }} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="ផលប៉ះពាល់សង្គម">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>កាត់បន្ថយគម្លាតគុណភាពអប់រំ</Text>
                <Progress percent={65} status="active" />
              </div>
              <div>
                <Text strong>បង្កើនការចូលរួមរបស់សហគមន៍</Text>
                <Progress percent={80} status="active" strokeColor="#52c41a" />
              </div>
              <div>
                <Text strong>លើកកម្ពស់ជំនាញឌីជីថលគ្រូបង្រៀន</Text>
                <Progress percent={75} status="active" strokeColor="#1890ff" />
              </div>
              <div>
                <Text strong>កែលម្អលទ្ធផលសិក្សារបស់សិស្ស</Text>
                <Progress percent={70} status="active" strokeColor="#722ed1" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlatformMetrics;