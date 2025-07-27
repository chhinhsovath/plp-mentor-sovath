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
  QuestionCircleOutlined
} from '@ant-design/icons';
import InteractiveDemo from '../components/Showcase/InteractiveDemo';
import PlatformMetrics from '../components/Showcase/PlatformMetrics';
import ShowcasePage from './ShowcasePage';

const { Header, Content } = Layout;
const { Title } = Typography;

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
      screenshot: '/api/placeholder/800/500'
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
      screenshot: '/api/placeholder/800/500'
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
      screenshot: '/api/placeholder/800/500'
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

          <img 
            src={currentRole.screenshot} 
            alt={`${currentRole.title} interface`}
            style={{ width: '100%', maxWidth: 800, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
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
      
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <img 
          src="/api/placeholder/1000/600" 
          alt="System Architecture"
          style={{ maxWidth: '100%', borderRadius: 8 }}
        />
      </div>

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