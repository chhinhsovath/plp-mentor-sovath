import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Statistic, 
  Space, 
  Tag, 
  Timeline,
  Tabs,
  Avatar,
  Badge,
  Carousel,
  Progress,
  Divider,
  Alert,
  List,
  Collapse,
  Steps
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  GlobalOutlined,
  SafetyOutlined,
  MobileOutlined,
  CloudOutlined,
  DashboardOutlined,
  FormOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  TrophyOutlined,
  HeartOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SettingOutlined
} from '@ant-design/icons';
import CountUp from 'react-countup';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ShowcasePage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<string>('administrator');

  const platformStats = {
    users: 15000,
    schools: 2500,
    observations: 45000,
    provinces: 25,
    mentors: 1200,
    improvement: 78
  };

  const coreFeatures = [
    {
      title: 'ប្រព័ន្ធគ្រប់គ្រងការសង្កេត',
      icon: <FormOutlined />,
      color: '#1890ff',
      description: 'ឧបករណ៍សង្កេតថ្នាក់រៀនដែលមានលក្ខណៈឌីជីថល និងអាចកែប្រែបាន',
      details: [
        'ទម្រង់សង្កេតដែលអាចកែប្រែបាន',
        'ការវាយតម្លៃតាមពេលវេលាជាក់ស្តែង',
        'ការគាំទ្រការងារក្រៅបណ្តាញ',
        'ហត្ថលេខាឌីជីថល'
      ]
    },
    {
      title: 'ប្រព័ន្ធរបាយការណ៍វិភាគ',
      icon: <BarChartOutlined />,
      color: '#52c41a',
      description: 'ការវិភាគទិន្នន័យជាក់លាក់សម្រាប់ការសម្រេចចិត្ត',
      details: [
        'ផ្ទាំងគ្រប់គ្រងតាមពេលវេលាជាក់ស្តែង',
        'របាយការណ៍តាមតួនាទី',
        'ការវិភាគនិន្នាការ',
        'ការនាំចេញទិន្នន័យ'
      ]
    },
    {
      title: 'ការគ្រប់គ្រងតាមឋានានុក្រម',
      icon: <TeamOutlined />,
      color: '#722ed1',
      description: 'ការគ្រប់គ្រងតួនាទីតាមរចនាសម្ព័ន្ធអប់រំ',
      details: [
        'តួនាទី ៧ កម្រិត',
        'ការចូលប្រើតាមឋានានុក្រម',
        'ការគ្រប់គ្រងតាមតំបន់',
        'ការអនុញ្ញាតដោយស្វ័យប្រវត្តិ'
      ]
    },
    {
      title: 'បេសកកម្ម និងការតាមដាន',
      icon: <RocketOutlined />,
      color: '#fa541c',
      description: 'ប្រព័ន្ធគ្រប់គ្រងបេសកកម្មនិងតាមដានវឌ្ឍនភាព',
      details: [
        'ការរៀបចំផែនការបេសកកម្ម',
        'ការតាមដានសកម្មភាព',
        'ការធ្វើរបាយការណ៍វឌ្ឍនភាព',
        'ការវាយតម្លៃលទ្ធផល'
      ]
    }
  ];

  const roleCapabilities = {
    administrator: {
      name: 'អ្នកគ្រប់គ្រង',
      capabilities: [
        'គ្រប់គ្រងអ្នកប្រើប្រាស់ទាំងអស់',
        'ចូលមើលរបាយការណ៍ពេញលេញ',
        'កំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ',
        'គ្រប់គ្រងទម្រង់សង្កេត'
      ]
    },
    provincial: {
      name: 'ថ្នាក់ខេត្ត',
      capabilities: [
        'គ្រប់គ្រងសាលារៀនក្នុងខេត្ត',
        'មើលរបាយការណ៍ថ្នាក់ខេត្ត',
        'តាមដានការសង្កេត',
        'វាយតម្លៃគុណភាពអប់រំ'
      ]
    },
    director: {
      name: 'នាយកសាលា',
      capabilities: [
        'គ្រប់គ្រងគ្រូបង្រៀន',
        'មើលរបាយការណ៍សាលា',
        'អនុម័តការសង្កេត',
        'តាមដានវឌ្ឍនភាព'
      ]
    },
    teacher: {
      name: 'គ្រូបង្រៀន',
      capabilities: [
        'ធ្វើការសង្កេតថ្នាក់រៀន',
        'មើលមតិយោបល់',
        'បង្កើតផែនការកែលម្អ',
        'តាមដានការអភិវឌ្ឍផ្ទាល់ខ្លួន'
      ]
    }
  };

  const technologyStack = [
    { name: 'React + TypeScript', category: 'Frontend', icon: <ApiOutlined /> },
    { name: 'NestJS', category: 'Backend', icon: <DatabaseOutlined /> },
    { name: 'PostgreSQL', category: 'Database', icon: <DatabaseOutlined /> },
    { name: 'Ant Design', category: 'UI Library', icon: <BulbOutlined /> },
    { name: 'Docker', category: 'DevOps', icon: <CloudOutlined /> },
    { name: 'JWT Auth', category: 'Security', icon: <SafetyOutlined /> }
  ];

  const implementationPhases = [
    {
      title: 'ដំណាក់កាលទី ១',
      description: 'ការអភិវឌ្ឍមូលដ្ឋាន',
      status: 'finish'
    },
    {
      title: 'ដំណាក់កាលទី ២',
      description: 'ការសាកល្បងជាមួយសាលាគំរូ',
      status: 'finish'
    },
    {
      title: 'ដំណាក់កាលទី ៣',
      description: 'ការពង្រីកទៅខេត្តទាំងអស់',
      status: 'process'
    },
    {
      title: 'ដំណាក់កាលទី ៤',
      description: 'ការវាយតម្លៃ និងកែលម្អ',
      status: 'wait'
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
              ប្រព័ន្ធគ្រប់គ្រងការណែនាំទូទាំងប្រទេស
            </Title>
            <Paragraph style={{ color: 'white', fontSize: 18, marginBottom: 24 }}>
              វេទិកាឌីជីថលដ៏ទូលំទូលាយសម្រាប់ការណែនាំគ្រូបង្រៀន ការសង្កេតថ្នាក់រៀន 
              និងការកែលម្អគុណភាពអប់រំនៅទូទាំងប្រទេសកម្ពុជា
            </Paragraph>
            <Space size="large">
              <Button type="primary" size="large" icon={<RocketOutlined />}>
                ចាប់ផ្តើមសាកល្បង
              </Button>
              <Button size="large" ghost style={{ color: 'white', borderColor: 'white' }}>
                មើលឯកសារ
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="អ្នកប្រើប្រាស់សកម្ម"
                    value={platformStats.users}
                    prefix={<UserOutlined />}
                    formatter={(value) => <CountUp end={value as number} duration={2} />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="សាលារៀន"
                    value={platformStats.schools}
                    prefix={<GlobalOutlined />}
                    formatter={(value) => <CountUp end={value as number} duration={2} />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="ការសង្កេត"
                    value={platformStats.observations}
                    prefix={<BookOutlined />}
                    formatter={(value) => <CountUp end={value as number} duration={2} />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="កំណើនគុណភាព"
                    value={platformStats.improvement}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    formatter={(value) => <CountUp end={value as number} duration={2} />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Core Features */}
      <Title level={2} style={{ marginBottom: 24 }}>មុខងារសំខាន់ៗ</Title>
      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        {coreFeatures.map((feature, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    height: 120, 
                    background: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 48, color: 'white' }}>
                      {feature.icon}
                    </div>
                  </div>
                }
              >
                <Card.Meta
                  title={feature.title}
                  description={feature.description}
                />
                <List
                  size="small"
                  dataSource={feature.details}
                  renderItem={item => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: feature.color, marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                  style={{ marginTop: 16 }}
                />
              </Card>
          </Col>
        ))}
      </Row>

      {/* Role-Based Access */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>ការចូលប្រើតាមតួនាទី</Title>
        <Tabs activeKey={activeRole} onChange={setActiveRole}>
          {Object.entries(roleCapabilities).map(([key, role]) => (
            <TabPane tab={role.name} key={key}>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Card>
                    <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                    <Title level={4}>{role.name}</Title>
                    <List
                      dataSource={role.capabilities}
                      renderItem={item => (
                        <List.Item>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={16}>
                  <Card style={{ background: '#f5f5f5' }}>
                    <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Space direction="vertical" align="center">
                        <Avatar size={64} style={{ backgroundColor: '#1890ff' }}>
                          <UserOutlined />
                        </Avatar>
                        <Title level={4}>{role.name} Interface</Title>
                        <Text type="secondary">ចំណុចប្រទាក់ពិសេសសម្រាប់តួនាទី {role.name}</Text>
                      </Space>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* Technology Stack */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>បច្ចេកវិទ្យាដែលប្រើ</Title>
        <Row gutter={[16, 16]}>
          {technologyStack.map((tech, index) => (
            <Col xs={12} sm={8} md={4} key={index}>
              <Card 
                hoverable
                style={{ textAlign: 'center' }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }}>
                  {tech.icon}
                </div>
                <Text strong>{tech.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{tech.category}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Implementation Timeline */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>ផែនការអនុវត្ត</Title>
        <Steps current={2} style={{ marginBottom: 24 }}>
          {implementationPhases.map((phase, index) => (
            <Steps.Step 
              key={index}
              title={phase.title}
              description={phase.description}
              status={phase.status as any}
            />
          ))}
        </Steps>
        <Alert
          message="ការអនុវត្តបច្ចុប្បន្ន"
          description="ប្រព័ន្ធកំពុងត្រូវបានពង្រីកទៅកាន់សាលារៀនទូទាំងខេត្តចំនួន ១៥ ជាមួយនឹងគ្រូបង្រៀនជាង ៥,០០០ នាក់កំពុងប្រើប្រាស់សកម្ម។"
          type="info"
          showIcon
        />
      </Card>

      {/* Key Benefits */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <HeartOutlined style={{ fontSize: 48, color: '#eb2f96', marginBottom: 16 }} />
            <Title level={4}>កែលម្អគុណភាពអប់រំ</Title>
            <Paragraph>
              ជួយគ្រូបង្រៀនអភិវឌ្ឍជំនាញបង្រៀនតាមរយៈមតិយោបល់ជាក់លាក់ 
              និងផែនការកែលម្អដែលអាចអនុវត្តបាន។
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <ThunderboltOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
            <Title level={4}>ប្រសិទ្ធភាពប្រតិបត្តិការ</Title>
            <Paragraph>
              កាត់បន្ថយពេលវេលាសម្រាប់ការងាររដ្ឋបាល ៧០% 
              តាមរយៈដំណើរការឌីជីថលនិងស្វ័យប្រវត្តិកម្ម។
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <BulbOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>ការសម្រេចចិត្តដោយទិន្នន័យ</Title>
            <Paragraph>
              ផ្តល់ការយល់ដឹងតាមពេលវេលាជាក់ស្តែងសម្រាប់អ្នកដឹកនាំអប់រំ
              ដើម្បីធ្វើការសម្រេចចិត្តប្រកបដោយប្រសិទ្ធភាព។
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Card style={{ textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Title level={2}>ត្រៀមខ្លួនដើម្បីផ្លាស់ប្តូរការអប់រំ?</Title>
        <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
          ចូលរួមជាមួយរាប់ពាន់គ្រូបង្រៀននិងអ្នកអប់រំដែលកំពុងប្រើប្រាស់ប្រព័ន្ធរបស់យើង
          ដើម្បីកែលម្អគុណភាពអប់រំនៅកម្ពុជា។
        </Paragraph>
        <Space size="large">
          <Button type="primary" size="large" icon={<UserOutlined />}>
            ចុះឈ្មោះឥឡូវនេះ
          </Button>
          <Button size="large" icon={<BookOutlined />}>
            អានឯកសារណែនាំ
          </Button>
          <Button size="large" icon={<TeamOutlined />}>
            ទាក់ទងក្រុមគាំទ្រ
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ShowcasePage;