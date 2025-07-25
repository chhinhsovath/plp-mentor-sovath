import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import {
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Mission, MissionStatus, MissionType } from '../types/mission';

const { Title, Text } = Typography;

interface MissionStatsProps {
  missions: Mission[];
  loading?: boolean;
}

interface MissionStatistics {
  total: number;
  byStatus: Record<MissionStatus, number>;
  byType: Record<MissionType, number>;
  totalBudget: number;
  totalParticipants: number;
  thisMonth: number;
  thisWeek: number;
  completionRate: number;
  averageDuration: number;
}

export const MissionStats: React.FC<MissionStatsProps> = ({
  missions,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<MissionStatistics | null>(null);

  useEffect(() => {
    if (missions.length === 0) {
      setStats(null);
      return;
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const statistics: MissionStatistics = {
      total: missions.length,
      byStatus: {
        [MissionStatus.DRAFT]: 0,
        [MissionStatus.SUBMITTED]: 0,
        [MissionStatus.APPROVED]: 0,
        [MissionStatus.REJECTED]: 0,
        [MissionStatus.IN_PROGRESS]: 0,
        [MissionStatus.COMPLETED]: 0,
        [MissionStatus.CANCELLED]: 0,
      },
      byType: {
        [MissionType.FIELD_TRIP]: 0,
        [MissionType.TRAINING]: 0,
        [MissionType.MEETING]: 0,
        [MissionType.MONITORING]: 0,
        [MissionType.OTHER]: 0,
      },
      totalBudget: 0,
      totalParticipants: 0,
      thisMonth: 0,
      thisWeek: 0,
      completionRate: 0,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let completedMissions = 0;

    missions.forEach(mission => {
      // Count by status
      statistics.byStatus[mission.status]++;

      // Count by type
      statistics.byType[mission.type]++;

      // Total budget
      if (mission.budget) {
        statistics.totalBudget += Number(mission.budget) || 0;
      }

      // Total participants
      if (mission.missionParticipants) {
        statistics.totalParticipants += mission.missionParticipants.length;
      }

      // This month missions
      const createdAt = new Date(mission.createdAt);
      if (createdAt >= thisMonth) {
        statistics.thisMonth++;
      }

      // This week missions
      if (createdAt >= thisWeek) {
        statistics.thisWeek++;
      }

      // Duration calculation
      const startDate = new Date(mission.startDate);
      const endDate = new Date(mission.endDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      totalDuration += duration;

      // Completion rate
      if (mission.status === MissionStatus.COMPLETED) {
        completedMissions++;
      }
    });

    statistics.completionRate = missions.length > 0 ? (completedMissions / missions.length) * 100 : 0;
    statistics.averageDuration = missions.length > 0 ? totalDuration / missions.length : 0;

    setStats(statistics);
  }, [missions]);

  if (loading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Spin style={{ display: 'block', textAlign: 'center', padding: '20px' }} />
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Empty
          description="មិនមានទិន្នន័យបេសកកម្ម"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const getStatusColor = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.COMPLETED: return '#52c41a';
      case MissionStatus.IN_PROGRESS: return '#1890ff';
      case MissionStatus.APPROVED: return '#13c2c2';
      case MissionStatus.SUBMITTED: return '#faad14';
      case MissionStatus.REJECTED: return '#ff4d4f';
      case MissionStatus.CANCELLED: return '#8c8c8c';
      case MissionStatus.DRAFT: return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const getTypeColor = (type: MissionType) => {
    switch (type) {
      case MissionType.FIELD_TRIP: return '#1890ff';
      case MissionType.TRAINING: return '#52c41a';
      case MissionType.MEETING: return '#fa8c16';
      case MissionType.MONITORING: return '#722ed1';
      case MissionType.OTHER: return '#8c8c8c';
      default: return '#d9d9d9';
    }
  };

  return (
    <Card 
      title={
        <Space>
          <BarChartOutlined />
          សារព័ត៌មានបេសកកម្ម
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        {/* Key Metrics */}
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="សរុប"
              value={stats.total}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="បានបញ្ចប់"
              value={stats.byStatus[MissionStatus.COMPLETED]}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="កំពុងដំណើរការ"
              value={stats.byStatus[MissionStatus.IN_PROGRESS]}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="អ្នកចូលរួម"
              value={stats.totalParticipants}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="ថវិកាសរុប"
              value={stats.totalBudget}
              prefix="៛"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="រយៈពេលមធ្យម"
              value={stats.averageDuration}
              suffix="ថ្ងៃ"
              prefix={<CalendarOutlined />}
              precision={1}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Completion Rate */}
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>អត្រាបញ្ចប់</Text>
              <Progress
                percent={Math.round(stats.completionRate)}
                status="active"
                strokeColor="#52c41a"
              />
            </Space>
          </Card>
        </Col>

        {/* Status Distribution */}
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>ការចែកចាយតាមស្ថានភាព</Text>
              <Space wrap>
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  if (count === 0) return null;
                  const statusLabels: Record<string, string> = {
                    draft: 'សេចក្តីព្រាង',
                    submitted: 'បានដាក់ស្នើ',
                    approved: 'បានអនុម័ត',
                    rejected: 'បានបដិសេធ',
                    in_progress: 'កំពុងដំណើរការ',
                    completed: 'បានបញ្ចប់',
                    cancelled: 'បានលុបចោល'
                  };
                  return (
                    <Tooltip 
                      key={status}
                      title={`${statusLabels[status] || status}: ${count}`}
                    >
                      <Tag color={getStatusColor(status as MissionStatus)}>
                        {count}
                      </Tag>
                    </Tooltip>
                  );
                })}
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Type Distribution */}
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>ការចែកចាយតាមប្រភេទ</Text>
              <Space wrap>
                {Object.entries(stats.byType).map(([type, count]) => {
                  if (count === 0) return null;
                  const typeLabels: Record<string, string> = {
                    field_trip: 'ទស្សនកិច្ច',
                    training: 'វគ្គបណ្តុះបណ្តាល',
                    meeting: 'កិច្ចប្រជុំ',
                    monitoring: 'ការត្រួតពិនិត្យ',
                    other: 'ផ្សេងៗ'
                  };
                  return (
                    <Tooltip 
                      key={type}
                      title={`${typeLabels[type] || type}: ${count}`}
                    >
                      <Tag color={getTypeColor(type as MissionType)}>
                        {count}
                      </Tag>
                    </Tooltip>
                  );
                })}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="សប្តាហ៍នេះ"
              value={stats.thisWeek}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="ខែនេះ"
              value={stats.thisMonth}
              valueStyle={{ color: '#52c41a', fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default MissionStats;