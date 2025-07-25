import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Typography, 
  Space, 
  Badge, 
  Avatar,
  List,
  Tag,
  Tooltip,
  Spin,
  Alert,
  Button
} from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  RiseOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
// Removed chart imports due to errors
import CountUp from 'react-countup';
import StaticCambodiaMap from '../components/StaticCambodiaMap';

const { Title, Text, Paragraph } = Typography;

// Animations
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

// Styled Components
const DashboardWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #52c41a;
    border-radius: 50%;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const MetricCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  animation: ${slideIn} 0.5s ease-out;
  animation-delay: ${props => props.delay || '0s'};
  animation-fill-mode: both;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
  
  .ant-statistic-content {
    font-size: 28px;
  }
`;

const ActivityFeed = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2);
    border-radius: 3px;
  }
`;

const MapContainer = styled.div`
  height: 400px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
`;

// Mock real-time data generator
const generateLiveData = () => ({
  activeMentors: Math.floor(Math.random() * 50) + 100,
  todayObservations: Math.floor(Math.random() * 200) + 300,
  weeklyProgress: Math.floor(Math.random() * 20) + 70,
  activeSchools: Math.floor(Math.random() * 10) + 35,
});

const ImpactDashboard: React.FC = () => {
  const [liveData, setLiveData] = useState(generateLiveData());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    
    const interval = setInterval(() => {
      setLiveData(generateLiveData());
      setLastUpdate(new Date());
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Chart data
  const weeklyTrendData = [
    { day: 'ច័ន្ទ', observations: 145, target: 150 },
    { day: 'អង្គារ', observations: 165, target: 150 },
    { day: 'ពុធ', observations: 135, target: 150 },
    { day: 'ព្រហស្បតិ៍', observations: 178, target: 150 },
    { day: 'សុក្រ', observations: 156, target: 150 },
    { day: 'សៅរ៍', observations: 45, target: 50 },
  ];

  const provinceData = [
    { province: 'ភ្នំពេញ', count: 45, percentage: 25 },
    { province: 'កណ្តាល', count: 38, percentage: 21 },
    { province: 'កំពង់ចាម', count: 32, percentage: 18 },
    { province: 'សៀមរាប', count: 28, percentage: 16 },
    { province: 'បាត់ដំបង', count: 22, percentage: 12 },
    { province: 'ផ្សេងៗ', count: 15, percentage: 8 },
  ];

  // Demographic data
  const demographicData = [
    { type: 'គ្រូបង្រៀន', value: 35, color: '#5B8FF9' },
    { type: 'នាយកសាលា', value: 20, color: '#61DDAA' },
    { type: 'អ្នកណែនាំ', value: 25, color: '#65789B' },
    { type: 'មន្ត្រីអប់រំ', value: 20, color: '#F6BD16' },
  ];

  const topUsersData = [
    { 
      rank: 1, 
      name: 'សុខ សុភាព', 
      role: 'អ្នកណែនាំ', 
      score: 4.9, 
      observations: 38,
      progress: 95,
      avatar: '🥇'
    },
    { 
      rank: 2, 
      name: 'លី សុខា', 
      role: 'នាយកសាលា', 
      score: 4.6, 
      observations: 36,
      progress: 88,
      avatar: '🥈'
    },
    { 
      rank: 3, 
      name: 'ពៅ ច័ន្ទថា', 
      role: 'គ្រូបង្រៀន', 
      score: 4.7, 
      observations: 35,
      progress: 82,
      avatar: '🥉'
    },
    { 
      rank: 4, 
      name: 'ហេង សំណាង', 
      role: 'មន្ត្រីអប់រំ', 
      score: 4.5, 
      observations: 33,
      progress: 78,
      avatar: '4'
    },
    { 
      rank: 5, 
      name: 'ចាន់ ដារា', 
      role: 'គ្រូបង្រៀន', 
      score: 4.4, 
      observations: 31,
      progress: 75,
      avatar: '5'
    },
  ];

  const mentorPerformance = [
    { name: 'សុខ សុភាព', observations: 45, rating: 4.8 },
    { name: 'ចាន់ ដារា', observations: 42, rating: 4.7 },
    { name: 'ហេង សំណាង', observations: 38, rating: 4.9 },
    { name: 'លី សុខា', observations: 36, rating: 4.6 },
    { name: 'ពៅ ច័ន្ទថា', observations: 35, rating: 4.7 },
  ];

  const recentActivities = [
    { 
      id: 1,
      mentor: 'សុខ សុភាព',
      action: 'បានបញ្ចប់ការសង្កេតថ្នាក់រៀន',
      school: 'សាលាបឋមសិក្សា ភ្នំពេញថ្មី',
      time: '2 នាទីមុន',
      type: 'observation'
    },
    {
      id: 2,
      mentor: 'ចាន់ ដារា',
      action: 'បានចាប់ផ្តើមបេសកកម្មថ្មី',
      school: 'សាលាបឋមសិក្សា កណ្តាល',
      time: '5 នាទីមុន',
      type: 'mission'
    },
    {
      id: 3,
      mentor: 'ហេង សំណាង',
      action: 'បានផ្តល់ការណែនាំដល់គ្រូ',
      school: 'សាលាបឋមសិក្សា កំពង់ចាម',
      time: '12 នាទីមុន',
      type: 'feedback'
    },
  ];

  // Chart configurations removed - using native Ant Design components instead

  if (loading) {
    return (
      <DashboardWrapper>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>កំពុងផ្ទុកទិន្នន័យ...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            ផ្ទាំងគ្រប់គ្រងផលប៉ះពាល់
          </Title>
          <Space>
            <LiveIndicator>
              <Text type="secondary">ទិន្នន័យបច្ចុប្បន្ន</Text>
            </LiveIndicator>
            <Text type="secondary">
              | ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ {lastUpdate.toLocaleTimeString('km-KH')}
            </Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<SyncOutlined spin />} 
              type="text"
              onClick={() => setLiveData(generateLiveData())}
            >
              ធ្វើបច្ចុប្បន្នភាព
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <MetricCard delay="0.1s">
            <Statistic
              title="អ្នកណែនាំសកម្ម"
              value={liveData.activeMentors}
              prefix={<UserOutlined />}
              suffix="នាក់"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <Progress 
              percent={85} 
              strokeColor="#52c41a" 
              showInfo={false}
              size="small"
            />
            <Text type="secondary">កំពុងធ្វើការងារនៅទីវាល</Text>
          </MetricCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard delay="0.2s">
            <Statistic
              title="ការសង្កេតថ្ងៃនេះ"
              value={liveData.todayObservations}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <Progress 
              percent={liveData.weeklyProgress} 
              strokeColor="#1890ff"
              size="small"
            />
            <Text type="secondary">
              <RiseOutlined /> កើនឡើង 23% ពីថ្ងៃមុន
            </Text>
          </MetricCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard delay="0.3s">
            <Statistic
              title="សាលារៀនសកម្ម"
              value={liveData.activeSchools}
              prefix={<BookOutlined />}
              suffix="សាលា"
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <Progress 
              percent={78} 
              strokeColor="#722ed1"
              size="small"
            />
            <Text type="secondary">ទទួលបានការណែនាំថ្ងៃនេះ</Text>
          </MetricCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard delay="0.4s">
            <Statistic
              title="គ្រូដែលបានកែលម្អ"
              value={234}
              prefix={<CheckCircleOutlined />}
              suffix="នាក់"
              valueStyle={{ color: '#fa8c16' }}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <Progress 
              percent={92} 
              strokeColor="#fa8c16"
              size="small"
            />
            <Text type="secondary">ក្នុងសប្តាហ៍នេះ</Text>
          </MetricCard>
        </Col>
      </Row>

      {/* Charts and Activity Feed */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="និន្នាការការសង្កេតប្រចាំសប្តាហ៍" 
            extra={<Tag color="blue">សប្តាហ៍នេះ</Tag>}
          >
            <div style={{ padding: '20px 0' }}>
              {weeklyTrendData.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.day}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.observations} ការសង្កេត</span>
                  </div>
                  <Progress 
                    percent={(item.observations / 200) * 100} 
                    showInfo={false}
                    strokeColor={item.observations >= item.target ? '#52c41a' : '#faad14'}
                  />
                </div>
              ))}
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary">គោលដៅ៖ 150 ការសង្កេត/ថ្ងៃ</Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title="សកម្មភាពថ្មីៗ" 
            extra={
              <Badge dot>
                <ClockCircleOutlined />
              </Badge>
            }
            styles={{ body: { padding: '12px' } }}
          >
            <ActivityFeed>
              <List
                dataSource={recentActivities}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: 
                              item.type === 'observation' ? '#52c41a' :
                              item.type === 'mission' ? '#1890ff' : '#fa8c16'
                          }}
                        >
                          {item.type === 'observation' ? <EyeOutlined /> :
                           item.type === 'mission' ? <EnvironmentOutlined /> : <TeamOutlined />}
                        </Avatar>
                      }
                      title={<Text strong>{item.mentor}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">{item.action}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.school} • {item.time}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </ActivityFeed>
          </Card>
        </Col>
      </Row>

      {/* Province Distribution and Top Performers */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="ការចែកចាយតាមខេត្ត">
            <List
              size="small"
              dataSource={provinceData}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.province}</span>
                      <span style={{ fontWeight: 'bold' }}>{item.percentage}%</span>
                    </div>
                    <Progress percent={item.percentage} showInfo={false} strokeColor="#1890ff" />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="អ្នកណែនាំល្អបំផុតប្រចាំសប្តាហ៍"
            extra={<Tag color="gold">ពានរង្វាន់</Tag>}
          >
            <List
              dataSource={mentorPerformance}
              renderItem={(item, index) => (
                <List.Item
                  extra={
                    <Space>
                      <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'default'}>
                        លេខ {index + 1}
                      </Tag>
                      <Badge count={item.observations} style={{ backgroundColor: '#52c41a' }} />
                    </Space>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={40}
                        style={{ 
                          backgroundColor: index === 0 ? '#ffd700' : 
                                         index === 1 ? '#c0c0c0' : '#cd7f32' 
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={item.name}
                    description={
                      <Space>
                        <Text type="secondary">ការវាយតម្លៃ: ⭐ {item.rating}</Text>
                        <Text type="secondary">• {item.observations} ការសង្កេត</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Demographic Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Title level={4} style={{ marginBottom: 24 }}>ចំនួនសរុបអ្នកប្រើប្រាស់តាមប្រភេទ</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={10}>
                <div style={{ padding: '20px 0' }}>
                  <List
                    size="small"
                    dataSource={demographicData}
                    renderItem={item => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: item.color 
                              }} />
                              {item.type}
                            </span>
                            <span style={{ fontWeight: 'bold', fontSize: 16 }}>{item.value}%</span>
                          </div>
                          <Progress 
                            percent={item.value} 
                            showInfo={false} 
                            strokeColor={item.color}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </Col>
              <Col xs={24} md={14}>
                <Title level={5} style={{ marginBottom: 16 }}>ចំណាត់ថ្នាក់អ្នកប្រើប្រាស់</Title>
                <List
                  dataSource={topUsersData}
                  renderItem={(user) => (
                    <List.Item
                      style={{ 
                        padding: '12px 16px',
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: user.rank <= 3 ? '#f6f8fa' : '#fff',
                        border: '1px solid #f0f0f0'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size={48}
                            style={{ 
                              backgroundColor: user.rank <= 3 ? '#fff' : '#f0f0f0',
                              fontSize: 24,
                              border: user.rank <= 3 ? '2px solid #1890ff' : '1px solid #d9d9d9'
                            }}
                          >
                            {user.avatar}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: 16 }}>{user.name}</Text>
                            <Tag color={
                              user.role === 'អ្នកណែនាំ' ? 'blue' :
                              user.role === 'នាយកសាលា' ? 'green' :
                              user.role === 'គ្រូបង្រៀន' ? 'purple' : 'orange'
                            }>
                              {user.role}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space size="large">
                            <span>ការវាយតម្លៃ: ⭐ {user.score}</span>
                            <span>• {user.observations} ការសង្កេត</span>
                          </Space>
                        }
                      />
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>លេខ {user.rank}</Text>
                        <Progress 
                          percent={user.progress} 
                          size="small" 
                          strokeColor={user.rank <= 3 ? '#52c41a' : '#1890ff'}
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Heat Map */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="ផែនទីសកម្មភាពតាមតំបន់"
            extra={
              <Space>
                <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                <Text type="secondary">សកម្មភាពខ្ពស់</Text>
              </Space>
            }
          >
            <StaticCambodiaMap />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Alert */}
      <Alert
        message="សមិទ្ធផលសំខាន់ៗ"
        description={
          <Space size="large">
            <Text>📈 ការសង្កេតកើនឡើង 45% ក្នុងខែនេះ</Text>
            <Text>🎯 សម្រេចគោលដៅ 89% សម្រាប់ត្រីមាសនេះ</Text>
            <Text>⭐ 95% គ្រូពេញចិត្តនឹងការណែនាំ</Text>
          </Space>
        }
        type="success"
        showIcon
        style={{ marginTop: 24 }}
      />
    </DashboardWrapper>
  );
};

export default ImpactDashboard;