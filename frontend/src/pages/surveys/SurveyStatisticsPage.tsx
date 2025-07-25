import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Spin,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Button,
  Space,
  message,
} from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import surveyService from '../../services/survey.service';
import { SurveyStatistics } from '../../types/survey';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const { Title } = Typography;

const SurveyStatisticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<SurveyStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStatistics();
    }
  }, [id]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await surveyService.getSurveyStatistics(id!);
      setStatistics(data);
    } catch (error) {
      message.error('Failed to load statistics');
      navigate('/admin/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await surveyService.exportResponses(id!, format);
      message.success(`Responses exported as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export responses');
    }
  };

  if (loading || !statistics) {
    return (
      <Card style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </Card>
    );
  }

  const renderQuestionStatistics = (stat: any) => {
    if (!stat.value_distribution || stat.value_distribution.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#999' }}>
          No distribution data available
        </div>
      );
    }

    const chartData = {
      labels: stat.value_distribution.map((v: any) => v.value || 'Empty'),
      datasets: [
        {
          data: stat.value_distribution.map((v: any) => v.count),
          backgroundColor: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#f5222d',
            '#722ed1',
            '#13c2c2',
            '#fa8c16',
            '#eb2f96',
          ],
        },
      ],
    };

    if (stat.type === 'radio' || stat.type === 'select') {
      return (
        <div style={{ maxWidth: 300, margin: '0 auto' }}>
          <Pie data={chartData} options={{ plugins: { legend: { position: 'right' } } }} />
        </div>
      );
    }

    return (
      <Bar
        data={chartData}
        options={{
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
            },
          },
        }}
      />
    );
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'label',
      key: 'label',
      width: '40%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '15%',
    },
    {
      title: 'Responses',
      dataIndex: 'response_count',
      key: 'response_count',
      width: '15%',
      render: (count: number) => (
        <Progress
          percent={(count / statistics.totalResponses) * 100}
          format={() => count}
          size="small"
        />
      ),
    },
    {
      title: 'Distribution',
      key: 'distribution',
      width: '30%',
      render: (_: any, record: any) => renderQuestionStatistics(record),
    },
  ];

  return (
    <div className="survey-statistics-page">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/surveys')}
            style={{ marginBottom: 16 }}
          >
            Back to Surveys
          </Button>
          
          <Title level={2}>{statistics.survey.title} - Statistics</Title>
          
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')}>
              Export JSON
            </Button>
          </Space>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Questions"
                value={statistics.survey.totalQuestions}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Responses"
                value={statistics.totalResponses}
                prefix={<PieChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Average Completion Rate"
                value={
                  statistics.survey.totalQuestions > 0
                    ? Math.round(
                        (statistics.questionStats.reduce((sum, q) => sum + q.response_count, 0) /
                          (statistics.survey.totalQuestions * statistics.totalResponses)) *
                          100
                      )
                    : 0
                }
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Card title="Question Statistics">
          <Table
            columns={columns}
            dataSource={statistics.questionStats}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </Card>
    </div>
  );
};

export default SurveyStatisticsPage;