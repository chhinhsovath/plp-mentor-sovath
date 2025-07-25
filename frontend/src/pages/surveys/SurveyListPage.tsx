import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Tooltip,
  Typography,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  ExportOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Survey, SurveyFilterParams } from '../../types/survey';
import surveyService from '../../services/survey.service';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SurveyListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SurveyFilterParams>({});

  useEffect(() => {
    fetchSurveys();
  }, [filters]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await surveyService.getSurveys(filters);
      setSurveys(data);
    } catch (error: any) {
      console.error('Failed to fetch surveys:', error);
      // Only show error message if it's not a 401 (handled by auth interceptor)
      if (error.response?.status !== 401) {
        message.error('មិនអាចទាញយកការស្ទង់មតិបានទេ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (surveyId: string) => {
    Modal.confirm({
      title: 'លុបការស្ទង់មតិ',
      content: 'តើអ្នកប្រាកដថាចង់លុបការស្ទង់មតិនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
      okText: 'លុប',
      okType: 'danger',
      onOk: async () => {
        try {
          await surveyService.deleteSurvey(surveyId);
          message.success('បានលុបការស្ទង់មតិដោយជោគជ័យ');
          fetchSurveys();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'មិនអាចលុបការស្ទង់មតិបានទេ');
        }
      },
    });
  };

  const handleExport = async (surveyId: string, format: 'csv' | 'json') => {
    try {
      await surveyService.exportResponses(surveyId, format);
      message.success(`បាននាំចេញចម្លើយជាទម្រង់ ${format.toUpperCase()}`);
    } catch (error) {
      message.error('មិនអាចនាំចេញចម្លើយបានទេ');
    }
  };

  const copyPublicLink = (slug: string) => {
    const link = `${window.location.origin}/survey/${slug}`;
    navigator.clipboard.writeText(link);
    message.success('បានចម្លងតំណសាធារណៈទៅក្តារតម្បៀតខ្ទាស់');
  };

  const columns = [
    {
      title: 'ចំណងជើង',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Survey) => (
        <a onClick={() => navigate(`/admin/surveys/${record.id}`)}>{title}</a>
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'red';
        const statusText = status === 'published' ? 'បានផ្សព្វផ្សាយ' : status === 'draft' ? 'សេចក្តីព្រាង' : 'បានបិទ';
        return <Tag color={color}>{statusText}</Tag>;
      },
    },
    {
      title: 'សំណួរ',
      dataIndex: 'questions',
      key: 'questions',
      render: (questions: any[]) => questions?.length || 0,
    },
    {
      title: 'បានបង្កើត',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: Survey) => (
        <Space size="small">
          <Tooltip title="កែសម្រួល">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/surveys/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="ស្ថិតិ">
            <Button
              type="link"
              icon={<BarChartOutlined />}
              onClick={() => navigate(`/admin/surveys/${record.id}/statistics`)}
            />
          </Tooltip>
          <Tooltip title="មើលជាមុន">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/survey/${record.slug}`, '_blank')}
            />
          </Tooltip>
          <Tooltip title="ចម្លងតំណសាធារណៈ">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => copyPublicLink(record.slug)}
              disabled={record.status !== 'published'}
            />
          </Tooltip>
          <Tooltip title="នាំចេញ">
            <Button.Group>
              <Button
                type="link"
                icon={<ExportOutlined />}
                onClick={() => handleExport(record.id, 'csv')}
              />
            </Button.Group>
          </Tooltip>
          <Tooltip title="លុប">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="survey-list-page">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24 
          }}>
            <Title level={2} style={{ margin: 0 }}>ការស្ទង់មតិ</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/surveys/new')}
            >
              បង្កើតការស្ទង់មតិ
            </Button>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 16, 
            alignItems: 'stretch',
            flexWrap: 'wrap'
          }}>
            <Search
              placeholder="ស្វែងរកការស្ទង់មតិ..."
              size="middle"
              style={{ 
                width: 250
              }}
              onSearch={(value) => setFilters({ ...filters, search: value })}
            />
            <Select
              placeholder="ស្ថានភាព"
              size="middle"
              style={{ 
                width: 150
              }}
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="draft">សេចក្តីព្រាង</Option>
              <Option value="published">បានផ្សព្វផ្សាយ</Option>
              <Option value="closed">បានបិទ</Option>
            </Select>
            <RangePicker
              size="middle"
              onChange={(dates) => {
                if (dates) {
                  setFilters({
                    ...filters,
                    createdFrom: dates[0]?.toISOString(),
                    createdTo: dates[1]?.toISOString(),
                  });
                } else {
                  setFilters({
                    ...filters,
                    createdFrom: undefined,
                    createdTo: undefined,
                  });
                }
              }}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={surveys}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `សរុប ${total} ការស្ទង់មតិ`,
          }}
        />
      </Card>
    </div>
  );
};

export default SurveyListPage;