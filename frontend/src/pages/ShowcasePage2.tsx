import React, { useState } from 'react';
import { 
  Layout,
  Menu,
  Typography,
  Button,
  Space,
  Anchor,
  BackTop,
  FloatButton
} from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  CodeOutlined,
  PhoneOutlined,
  ArrowUpOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  ApiOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Card, Row, Col, Statistic, Avatar } from 'antd';
import InteractiveDemo from '../components/Showcase/InteractiveDemo';
import PlatformMetrics from '../components/Showcase/PlatformMetrics';
import ShowcasePage from './ShowcasePage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ShowcasePage2: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const menuItems = [
    { key: 'overview', icon: <HomeOutlined />, label: 'ទិដ្ឋភាពទូទៅ' },
    { key: 'features', icon: <AppstoreOutlined />, label: 'មុខងារ' },
    { key: 'metrics', icon: <BarChartOutlined />, label: 'ទិន្នន័យ' },
    { key: 'roles', icon: <TeamOutlined />, label: 'តួនាទី' },
    { key: 'tech', icon: <CodeOutlined />, label: 'បច្ចេកវិទ្យា' },
    { key: 'contact', icon: <PhoneOutlined />, label: 'ទំនាក់ទំនង' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <ShowcasePage />;
      case 'features':
        return <InteractiveDemo />;
      case 'metrics':
        return <PlatformMetrics />;
      case 'roles':
        return <RoleExplorer />;
      case 'tech':
        return <TechArchitecture />;
      case 'contact':
        return <ContactSection />;
      default:
        return <ShowcasePage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        position: 'fixed', 
        zIndex: 1000, 
        width: '100%',
        background: '#001529',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{ color: 'white', fontSize: 20, marginRight: 40 }}>
          PLP Mentor Platform
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[activeSection]}
          onClick={({ key }) => setActiveSection(key)}
          items={menuItems}
          style={{ flex: 1 }}
        />
        <Space>
          <Button type="primary">ចូលប្រើ</Button>
          <Button ghost style={{ color: 'white', borderColor: 'white' }}>
            ចុះឈ្មោះ
          </Button>
        </Space>
      </Header>
      
      <Content style={{ marginTop: 64, background: '#f0f2f5' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {renderContent()}
        </div>
      </Content>

      <BackTop />
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<QuestionCircleOutlined />}
      >
        <FloatButton tooltip="ទំនាក់ទំនងជំនួយ" />
        <FloatButton tooltip="មើលឯកសារ" />
        <FloatButton tooltip="សាកល្បងភ្លាម" />
      </FloatButton.Group>
    </Layout>
  );
};

// Role Explorer Component
const RoleExplorer: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('teacher');
  
  const roles = [
    {
      key: 'teacher',
      title: 'គ្រូបង្រៀន',
      description: 'អ្នកអប់រំនៅជួរមុខដែលប្រើប្រាស់ប្រព័ន្ធសម្រាប់ការអភិវឌ្ឍវិជ្ជាជីវៈ',
      features: [
        'ធ្វើការសង្កេតថ្នាក់រៀន',
        'ទទួលមតិយោបល់ពីអ្នកណែនាំ',
        'បង្កើតផែនការកែលម្អ',
        'តាមដានវឌ្ឍនភាពផ្ទាល់ខ្លួន'
      ],
      dashboardPreview: (
        <Card style={{ background: '#f5f5f5', padding: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic title="ការសង្កេតរបស់ខ្ញុំ" value={23} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ផែនការកែលម្អ" value={5} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ពិន្ទុមធ្យម" value={85} suffix="%" />
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'director',
      title: 'នាយកសាលា',
      description: 'អ្នកដឹកនាំសាលារៀនដែលគ្រប់គ្រងនិងគាំទ្រគ្រូបង្រៀន',
      features: [
        'គ្រប់គ្រងបុគ្គលិកគ្រូបង្រៀន',
        'មើលរបាយការណ៍សាលា',
        'អនុម័តការសង្កេត',
        'វាយតម្លៃការអនុវត្ត'
      ],
      dashboardPreview: (
        <Card style={{ background: '#f5f5f5', padding: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic title="ការសង្កេតរបស់ខ្ញុំ" value={23} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ផែនការកែលម្អ" value={5} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ពិន្ទុមធ្យម" value={85} suffix="%" />
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'provincial',
      title: 'ថ្នាក់ខេត្ត',
      description: 'អ្នកគ្រប់គ្រងការអប់រំថ្នាក់ខេត្តដែលមើលការខុសត្រូវលើសាលារៀនច្រើន',
      features: [
        'គ្រប់គ្រងសាលារៀនក្នុងខេត្ត',
        'វិភាគទិន្នន័យថ្នាក់ខេត្ត',
        'កំណត់គោលនយោបាយ',
        'តាមដានការអនុវត្ត'
      ],
      dashboardPreview: (
        <Card style={{ background: '#f5f5f5', padding: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic title="ការសង្កេតរបស់ខ្ញុំ" value={23} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ផែនការកែលម្អ" value={5} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="ពិន្ទុមធ្យម" value={85} suffix="%" />
              </Card>
            </Col>
          </Row>
        </Card>
      )
    }
  ];

  const currentRole = roles.find(r => r.key === selectedRole);

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2} style={{ marginBottom: 24 }}>ស្វែងយល់តាមតួនាទី</Title>
      
      <Menu
        mode="horizontal"
        selectedKeys={[selectedRole]}
        onClick={({ key }) => setSelectedRole(key)}
        style={{ marginBottom: 24 }}
      >
        {roles.map(role => (
          <Menu.Item key={role.key} icon={<TeamOutlined />}>
            {role.title}
          </Menu.Item>
        ))}
      </Menu>

      {currentRole && (
        <div>
          <Title level={3}>{currentRole.title}</Title>
          <p style={{ fontSize: 16, marginBottom: 24 }}>{currentRole.description}</p>
          
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>មុខងារសំខាន់ៗ</Title>
            <ul>
              {currentRole.features.map((feature, index) => (
                <li key={index} style={{ fontSize: 16, marginBottom: 8 }}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {currentRole.dashboardPreview}
        </div>
      )}
    </div>
  );
};

// Tech Architecture Component
const TechArchitecture: React.FC = () => {
  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2} style={{ marginBottom: 24 }}>ស្ថាបត្យកម្មបច្ចេកវិទ្យា</Title>
      
      <Card style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f5f5f5' }}>
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} md={8}>
              <Card>
                <Avatar size={64} style={{ backgroundColor: '#1890ff', marginBottom: 16 }}>
                  <CodeOutlined />
                </Avatar>
                <Title level={4}>Frontend Layer</Title>
                <Text>React + TypeScript + Vite</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Avatar size={64} style={{ backgroundColor: '#52c41a', marginBottom: 16 }}>
                  <ApiOutlined />
                </Avatar>
                <Title level={4}>Backend API</Title>
                <Text>NestJS + TypeORM</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Avatar size={64} style={{ backgroundColor: '#fa8c16', marginBottom: 16 }}>
                  <DatabaseOutlined />
                </Avatar>
                <Title level={4}>Database</Title>
                <Text>PostgreSQL + Redis</Text>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      <Title level={3}>បច្ចេកវិទ្យាសំខាន់ៗ</Title>
      <ul style={{ fontSize: 16 }}>
        <li><strong>Frontend:</strong> React 18, TypeScript, Ant Design, Vite</li>
        <li><strong>Backend:</strong> NestJS, PostgreSQL, TypeORM</li>
        <li><strong>Authentication:</strong> JWT with role-based access control</li>
        <li><strong>Infrastructure:</strong> Docker, Redis for caching</li>
        <li><strong>Features:</strong> Offline support, real-time updates, data export</li>
      </ul>
    </div>
  );
};

// Contact Section Component
const ContactSection: React.FC = () => {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <Title level={2} style={{ marginBottom: 24 }}>ទំនាក់ទំនងយើងខ្ញុំ</Title>
      
      <Space direction="vertical" size="large">
        <div>
          <Title level={4}>ក្រសួងអប់រំ យុវជន និងកីឡា</Title>
          <p>អាសយដ្ឋាន: ផ្លូវលេខ ១៦៩, សង្កាត់វាលវង់, ខណ្ឌ៧មករា, រាជធានីភ្នំពេញ</p>
        </div>
        
        <div>
          <Title level={4}>ទូរស័ព្ទទំនាក់ទំនង</Title>
          <p>+855 23 123 456</p>
        </div>
        
        <div>
          <Title level={4}>អ៊ីមែល</Title>
          <p>support@plp-mentor.edu.kh</p>
        </div>

        <Space size="large">
          <Button type="primary" size="large">ទំនាក់ទំនងភ្លាម</Button>
          <Button size="large">ទាញយកឯកសារ</Button>
        </Space>
      </Space>
    </div>
  );
};

export default ShowcasePage2;