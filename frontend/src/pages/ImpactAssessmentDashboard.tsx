import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Spin,
  Empty,
  Modal,
  Descriptions,
  Popconfirm,
  Form,
  Input,
  InputNumber
} from 'antd';
import {
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import impactAssessmentService, { ImpactAssessmentData } from '../services/impactAssessment.service';
import dayjs from 'dayjs';
import { Column } from '@ant-design/plots';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Geographic data for display
const provinceNames: Record<string, string> = {
  'banteay-meanchey': 'បន្ទាយមានជ័យ',
  'battambang': 'បាត់ដំបង',
  'pailin': 'ប៉ៃលិន',
  'oddar-meanchey': 'ឧត្តរមានជ័យ',
  'preah-vihear': 'ព្រះវិហារ',
  'stung-treng': 'ស្ទឹងត្រែង',
  'ratanakiri': 'រតនគិរី',
  'mondulkiri': 'មណ្ឌលគិរី'
};

const schoolTypeNames: Record<string, string> = {
  'primary': 'បឋមសិក្សា',
  'lower-secondary': 'មធ្យមសិក្សាបឋមភូមិ',
  'upper-secondary': 'មធ្យមសិក្សាទុតិយភូមិ',
  'high-school': 'វិទ្យាល័យ',
  'technical': 'សាលាបច្ចេកទេស',
  'university': 'សាកលវិទ្យាល័យ',
  'pagoda': 'សាលាវត្ត'
};

const ImpactAssessmentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<ImpactAssessmentData[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});
  const [selectedAssessment, setSelectedAssessment] = useState<ImpactAssessmentData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assessmentsResponse, statsData] = await Promise.all([
        impactAssessmentService.getAssessments({
          ...filters,
          page: 1,
          limit: 100 // Get more records for display
        }),
        impactAssessmentService.getStatistics(filters)
      ]);
      setAssessments(assessmentsResponse.data);
      setStatistics(statsData);
    } catch (error) {
      message.error('មានកំហុសក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
    } else {
      const { startDate, endDate, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await impactAssessmentService.exportToCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impact-assessment-${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('ទាញយកទិន្នន័យជោគជ័យ');
    } catch (error) {
      message.error('មានកំហុសក្នុងការទាញយកទិន្នន័យ');
    }
  };

  const viewDetails = (record: ImpactAssessmentData) => {
    setSelectedAssessment(record);
    setDetailModalVisible(true);
  };

  const handleEdit = (record: ImpactAssessmentData) => {
    setSelectedAssessment(record);
    editForm.setFieldsValue({
      schoolName: record.schoolName,
      severity: record.severity,
      duration: record.duration,
      teacherAffected: record.teacherAffected,
      description: record.description
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await impactAssessmentService.deleteAssessment(id);
      message.success('លុបរបាយការណ៍ដោយជោគជ័យ');
      fetchData();
    } catch (error) {
      message.error('មានកំហុសក្នុងការលុបរបាយការណ៍');
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      await impactAssessmentService.updateAssessment(selectedAssessment!.id, values);
      message.success('កែប្រែរបាយការណ៍ដោយជោគជ័យ');
      setEditModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('មានកំហុសក្នុងការកែប្រែរបាយការណ៍');
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await impactAssessmentService.verifyAssessment(id, status);
      message.success(`របាយការណ៍ត្រូវបាន${status === 'verified' ? 'ផ្ទៀងផ្ទាត់' : 'បដិសេធ'}ដោយជោគជ័យ`);
      fetchData();
    } catch (error) {
      message.error('មានកំហុសក្នុងការផ្ទៀងផ្ទាត់របាយការណ៍');
    }
  };

  const getSeverityTag = (severity: number) => {
    const colors = ['green', 'gold', 'orange', 'red', 'red'];
    const labels = ['តិចតួចបំផុត', 'តិចតួច', 'មធ្យម', 'ធ្ងន់ធ្ងរ', 'ធ្ងន់ធ្ងរបំផុត'];
    return <Tag color={colors[severity - 1]}>{labels[severity - 1]}</Tag>;
  };

  const columns = [
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'incidentDate',
      key: 'incidentDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: any, b: any) => dayjs(a.incidentDate).unix() - dayjs(b.incidentDate).unix()
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'រង់ចាំ' },
          verified: { color: 'green', text: 'បានផ្ទៀងផ្ទាត់' },
          rejected: { color: 'red', text: 'បានបដិសេធ' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'សាលា',
      dataIndex: 'schoolName',
      key: 'schoolName',
      ellipsis: true
    },
    {
      title: 'ខេត្ត',
      dataIndex: 'province',
      key: 'province',
      render: (province: string) => provinceNames[province] || province
    },
    {
      title: 'ប្រភេទ',
      dataIndex: 'schoolType',
      key: 'schoolType',
      render: (type: string) => schoolTypeNames[type] || type
    },
    {
      title: 'សិស្សរងផលប៉ះពាល់',
      dataIndex: ['totals', 'totalAffected'],
      key: 'totalAffected',
      sorter: (a: any, b: any) => a.totals.totalAffected - b.totals.totalAffected,
      render: (value: number) => value.toLocaleString()
    },
    {
      title: 'កម្រិត',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: number) => getSeverityTag(severity),
      sorter: (a: any, b: any) => a.severity - b.severity
    },
    {
      title: 'សកម្មភាព',
      key: 'action',
      width: 280,
      render: (_: any, record: ImpactAssessmentData) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => viewDetails(record)}
          >
            មើល
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកពិតជាចង់លុបរបាយការណ៍នេះមែនទេ?"
            onConfirm={() => handleDelete(record.id)}
            okText="បាទ/ចាស"
            cancelText="ទេ"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              លុប
            </Button>
          </Popconfirm>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleVerify(record.id, 'verified')}
                style={{ color: '#52c41a' }}
              >
                ផ្ទៀងផ្ទាត់
              </Button>
              <Button
                type="link"
                icon={<CloseCircleOutlined />}
                onClick={() => handleVerify(record.id, 'rejected')}
                danger
              >
                បដិសេធ
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  // Prepare data for charts
  const provinceChartData = statistics ? Object.entries(statistics.byProvince).map(([key, value]) => ({
    province: provinceNames[key] || key,
    count: value as number
  })) : [];

  const severityChartData = statistics ? Object.entries(statistics.bySeverity).map(([key, value]) => ({
    severity: `កម្រិត ${key}`,
    count: value as number
  })) : [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>ទិដ្ឋភាពទូទៅផលប៉ះពាល់អប់រំពីជម្លោះព្រំដែន</Title>
      
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="របាយការណ៍សរុប"
              value={statistics?.totalReports || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="សាលារងផលប៉ះពាល់"
              value={statistics?.affectedSchools || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="សិស្សរងផលប៉ះពាល់"
              value={statistics?.totalAffectedStudents || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="គ្រូរងផលប៉ះពាល់"
              value={statistics?.totalAffectedTeachers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="របាយការណ៍តាមខេត្ត">
            {provinceChartData.length > 0 ? (
              <Column
                data={provinceChartData}
                xField='province'
                yField='count'
                label={{
                  position: 'middle',
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                }}
                meta={{
                  province: { alias: 'ខេត្ត' },
                  count: { alias: 'ចំនួនរបាយការណ៍' }
                }}
              />
            ) : (
              <Empty description="គ្មានទិន្នន័យ" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="របាយការណ៍តាមកម្រិតធ្ងន់ធ្ងរ">
            {severityChartData.length > 0 ? (
              <Column
                data={severityChartData}
                xField='severity'
                yField='count'
                color='#fa8c16'
                label={{
                  position: 'middle',
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                }}
                meta={{
                  severity: { alias: 'កម្រិតធ្ងន់ធ្ងរ' },
                  count: { alias: 'ចំនួនរបាយការណ៍' }
                }}
              />
            ) : (
              <Empty description="គ្មានទិន្នន័យ" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <Select
            placeholder="ជ្រើសរើសខេត្ត"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('province', value)}
          >
            {Object.entries(provinceNames).map(([key, name]) => (
              <Option key={key} value={key}>{name}</Option>
            ))}
          </Select>
          <Select
            placeholder="កម្រិតធ្ងន់ធ្ងរ"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('severity', value)}
          >
            <Option value={1}>១ - តិចតួចបំផុត</Option>
            <Option value={2}>២ - តិចតួច</Option>
            <Option value={3}>៣ - មធ្យម</Option>
            <Option value={4}>៤ - ធ្ងន់ធ្ងរ</Option>
            <Option value={5}>៥ - ធ្ងន់ធ្ងរបំផុត</Option>
          </Select>
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['ចាប់ពីថ្ងៃ', 'ដល់ថ្ងៃ']}
            onChange={handleDateRangeChange}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
          >
            ផ្ទុកឡើងវិញ
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExportCSV}
          >
            ទាញយក CSV
          </Button>
        </Space>
      </Card>

      {/* Reports Table */}
      <Card title={`របាយការណ៍លម្អិត (${assessments.length} កំណត់ត្រា)`}>
        <Table
          columns={columns}
          dataSource={assessments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `សរុប ${total} របាយការណ៍`
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="ព័ត៌មានលម្អិតរបាយការណ៍"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedAssessment && (
          <div>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="លេខសម្គាល់">{selectedAssessment.id}</Descriptions.Item>
              <Descriptions.Item label="កាលបរិច្ឆេទបញ្ជូន">
                {dayjs(selectedAssessment.submittedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="ឈ្មោះសាលា" span={2}>
                {selectedAssessment.schoolName}
              </Descriptions.Item>
              <Descriptions.Item label="ប្រភេទសាលា">
                {schoolTypeNames[selectedAssessment.schoolType]}
              </Descriptions.Item>
              <Descriptions.Item label="ទីតាំង">
                {selectedAssessment.village}, {selectedAssessment.commune}, {selectedAssessment.district}, {provinceNames[selectedAssessment.province]}
              </Descriptions.Item>
              <Descriptions.Item label="កាលបរិច្ឆេទកើតហេតុ">
                {dayjs(selectedAssessment.incidentDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="រយៈពេល">
                {selectedAssessment.duration} ថ្ងៃ
              </Descriptions.Item>
              <Descriptions.Item label="កម្រិតធ្ងន់ធ្ងរ">
                {getSeverityTag(selectedAssessment.severity)}
              </Descriptions.Item>
              <Descriptions.Item label="គ្រូរងផលប៉ះពាល់">
                {selectedAssessment.teacherAffected || 0} នាក់
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 16 }}>ព័ត៌មានសិស្សតាមថ្នាក់</Title>
            <Table
              dataSource={selectedAssessment.gradeData}
              columns={[
                { title: 'ថ្នាក់', dataIndex: 'grade', key: 'grade' },
                { title: 'សិស្សសរុប', dataIndex: 'totalStudents', key: 'totalStudents' },
                { title: 'រងផលប៉ះពាល់', dataIndex: 'affectedStudents', key: 'affectedStudents' },
                {
                  title: 'ភាគរយ',
                  key: 'percentage',
                  render: (_, record) => {
                    const pct = record.totalStudents > 0
                      ? Math.round((record.affectedStudents / record.totalStudents) * 100)
                      : 0;
                    return `${pct}%`;
                  }
                }
              ]}
              pagination={false}
              size="small"
              rowKey="grade"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>សរុប</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{selectedAssessment.totals.totalStudents}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>{selectedAssessment.totals.totalAffected}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>{selectedAssessment.totals.percentage}%</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />

            {selectedAssessment.description && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>ពិពណ៌នាលម្អិត</Title>
                <Paragraph>{selectedAssessment.description}</Paragraph>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="កែប្រែរបាយការណ៍"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdate}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            label="ឈ្មោះសាលា"
            name="schoolName"
            rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលា' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="កម្រិតធ្ងន់ធ្ងរ"
            name="severity"
            rules={[{ required: true, message: 'សូមជ្រើសរើសកម្រិតធ្ងន់ធ្ងរ' }]}
          >
            <Select>
              <Option value={1}>១ - តិចតួចបំផុត</Option>
              <Option value={2}>២ - តិចតួច</Option>
              <Option value={3}>៣ - មធ្យម</Option>
              <Option value={4}>៤ - ធ្ងន់ធ្ងរ</Option>
              <Option value={5}>៥ - ធ្ងន់ធ្ងរបំផុត</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="រយៈពេល (ថ្ងៃ)"
            name="duration"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="គ្រូរងផលប៉ះពាល់"
            name="teacherAffected"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="ពិពណ៌នា"
            name="description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ImpactAssessmentDashboard;