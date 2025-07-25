import { useState, useEffect } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space,
  Button,
  List,
  Avatar,
  Badge,
  Progress,
  Divider,
  Timeline,
} from 'antd'
import {
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

const HomePage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalObservations: 24,
    completedPlans: 12,
    activeUsers: 156,
    recentActivity: 8,
  })

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'observation',
      title: t('dashboard.activities.newObservation'),
      description: t('dashboard.activities.gradeThreeMath'),
      time: t('dashboard.activities.twoHoursAgo'),
      user: 'សុខ សុភា',
    },
    {
      id: 2,
      type: 'plan',
      title: t('dashboard.activities.planCompleted'),
      description: t('dashboard.activities.teachingEnhancement'),
      time: t('dashboard.activities.fourHoursAgo'),
      user: 'លី សុខលីម',
    },
    {
      id: 3,
      type: 'user',
      title: t('dashboard.activities.newTeacher'),
      description: t('dashboard.activities.welcomePlatform'),
      time: t('dashboard.activities.oneDay'),
      user: 'ចាន់ សុភាព',
    },
  ]

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.goodMorning')
    if (hour < 17) return t('dashboard.goodAfternoon')
    return t('dashboard.goodEvening')
  }

  return (
    <div>
      {/* Welcome Section */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ color: 'white' }}>
          <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
            {getWelcomeMessage()}, {user?.fullName || user?.username}!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
            {t('dashboard.welcomeMessage')}
          </Text>
        </div>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.totalObservations')}
              value={stats.totalObservations}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 12%
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.completedPlans')}
              value={stats.completedPlans}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 8%
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.activeUsers')}
              value={stats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> 24%
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.recentActivity')}
              value={stats.recentActivity}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#fa541c' }}>
                  <ArrowDownOutlined /> 2%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.quickActions')} style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button type="primary" block icon={<EyeOutlined />} size="large">
                {t('dashboard.newObservation')}
              </Button>
              <Button block icon={<BookOutlined />} size="large">
                {t('dashboard.viewReports')}
              </Button>
              <Button block icon={<UserOutlined />} size="large">
                {t('dashboard.manageUsers')}
              </Button>
              <Button block icon={<CalendarOutlined />} size="large">
                {t('dashboard.scheduleMeeting')}
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.recentActivities')} style={{ height: '400px' }}>
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: item.type === 'observation' ? '#1890ff' : 
                                           item.type === 'plan' ? '#52c41a' : '#722ed1' 
                        }}
                      >
                        {item.type === 'observation' ? <EyeOutlined /> :
                         item.type === 'plan' ? <CheckCircleOutlined /> : <UserOutlined />}
                      </Avatar>
                    }
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <div>
                        <Text type="secondary">{item.description}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.time} • {item.user}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Performance Overview */}
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.performanceOverview')} style={{ height: '400px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t('dashboard.monthlyGoal')}</Text>
                <Progress percent={75} status="active" />
                <Text type="secondary">{t('dashboard.performance.percentCompleted', { percent: 75 })}</Text>
              </div>
              
              <div>
                <Text strong>{t('dashboard.qualityScore')}</Text>
                <Progress percent={88} strokeColor="#52c41a" />
                <Text type="secondary">{t('dashboard.performance.excellent')}</Text>
              </div>
              
              <div>
                <Text strong>{t('dashboard.responseTime')}</Text>
                <Progress percent={92} strokeColor="#1890ff" />
                <Text type="secondary">{t('dashboard.performance.veryResponsive')}</Text>
              </div>

              <Divider />
              
              <Timeline 
                size="small"
                items={[
                  {
                    color: 'green',
                    children: <Text type="secondary">{t('dashboard.timeline.completedObservations', { count: 3 })}</Text>,
                  },
                  {
                    color: 'blue',
                    children: <Text type="secondary">{t('dashboard.timeline.submittedPlans', { count: 2 })}</Text>,
                  },
                  {
                    children: <Text type="secondary">{t('dashboard.timeline.reviewedProfiles', { count: 5 })}</Text>,
                  },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default HomePage