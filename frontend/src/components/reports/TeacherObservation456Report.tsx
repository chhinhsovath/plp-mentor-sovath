import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Statistic, Progress, Select, DatePicker, Button, Space, Spin } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, PrinterOutlined } from '@ant-design/icons';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import teacherObservations456Service, { SchoolStatistics, DetailedReport } from '../../services/teacherObservations456.service';
import dayjs from 'dayjs';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportFilters {
  schoolCode?: string;
  grade?: string;
  subject?: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

const TeacherObservation456Report: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [statistics, setStatistics] = useState<SchoolStatistics | null>(null);
  const [detailedReport, setDetailedReport] = useState<DetailedReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        schoolCode: filters.schoolCode,
        grade: filters.grade,
        subject: filters.subject,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
      };

      // Fetch detailed report
      const report = await teacherObservations456Service.getDetailedReport(apiFilters);
      setDetailedReport(report);

      // If school code is selected, fetch school statistics
      if (filters.schoolCode) {
        const stats = await teacherObservations456Service.getSchoolStatistics(
          filters.schoolCode,
          apiFilters.startDate,
          apiFilters.endDate
        );
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'observationDate',
      key: 'observationDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'សាលារៀន',
      dataIndex: 'schoolName',
      key: 'schoolName',
    },
    {
      title: 'ថ្នាក់',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => `ថ្នាក់ទី ${grade}`,
    },
    {
      title: 'មុខវិជ្ជា',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'គ្រូបង្រៀន',
      dataIndex: 'teacherName',
      key: 'teacherName',
    },
    {
      title: 'អ្នកសង្កេត',
      dataIndex: 'observerName',
      key: 'observerName',
    },
    {
      title: 'ពិន្ទុសរុប',
      dataIndex: ['scores', 'overall'],
      key: 'overallScore',
      render: (score: number) => (
        <Progress
          percent={Math.round((score / 100) * 100)}
          size="small"
          strokeColor={{
            '0%': '#ff4d4f',
            '60%': '#faad14',
            '80%': '#52c41a',
          }}
        />
      ),
    },
  ];

  const pieChartData = statistics ? {
    labels: ['ល្អប្រសើរ', 'ល្អ', 'ត្រូវកែលម្អ'],
    datasets: [
      {
        data: [
          statistics.scoreDistribution.excellent,
          statistics.scoreDistribution.good,
          statistics.scoreDistribution.needsImprovement,
        ],
        backgroundColor: ['#52c41a', '#faad14', '#ff4d4f'],
      },
    ],
  } : null;

  const barChartData = statistics ? {
    labels: ['ផ្តើម', 'បង្រៀន', 'រៀន', 'វាយតម្លៃ'],
    datasets: [
      {
        label: 'ពិន្ទុមធ្យម',
        data: [
          statistics.averageScores.introduction,
          statistics.averageScores.teaching,
          statistics.averageScores.learning,
          statistics.averageScores.assessment,
        ],
        backgroundColor: '#1890ff',
      },
    ],
  } : null;

  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Export to Excel');
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Export to PDF');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="teacher-observation-report">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Filters */}
          <Row gutter={16}>
            <Col span={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="ជ្រើសរើសសាលារៀន"
                allowClear
                onChange={(value) => setFilters({ ...filters, schoolCode: value })}
              >
                <Option value="SCH001">សាលាបឋមសិក្សា ទី១</Option>
                <Option value="SCH002">សាលាបឋមសិក្សា ទី២</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="ថ្នាក់"
                allowClear
                onChange={(value) => setFilters({ ...filters, grade: value })}
              >
                <Option value="4">ថ្នាក់ទី៤</Option>
                <Option value="5">ថ្នាក់ទី៥</Option>
                <Option value="6">ថ្នាក់ទី៦</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="មុខវិជ្ជា"
                allowClear
                onChange={(value) => setFilters({ ...filters, subject: value })}
              >
                <Option value="khmer">ភាសាខ្មែរ</Option>
                <Option value="math">គណិតវិទ្យា</Option>
                <Option value="science">វិទ្យាសាស្ត្រ</Option>
                <Option value="social">សិក្សាសង្គម</Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['ពីថ្ងៃ', 'ដល់ថ្ងៃ']}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
              />
            </Col>
            <Col span={4}>
              <Space>
                <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>Excel</Button>
                <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>PDF</Button>
                <Button icon={<PrinterOutlined />} onClick={printReport}>បោះពុម្ព</Button>
              </Space>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              {statistics && (
                <Row gutter={16}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="ចំនួនការសង្កេតសរុប"
                        value={statistics.totalObservations}
                        suffix="ដង"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="ពិន្ទុមធ្យមសរុប"
                        value={statistics.averageScores.overall}
                        suffix="/ 100"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="ល្អប្រសើរ"
                        value={statistics.scoreDistribution.excellent}
                        suffix="ដង"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="ត្រូវកែលម្អ"
                        value={statistics.scoreDistribution.needsImprovement}
                        suffix="ដង"
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Charts */}
              {statistics && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="ការចែកចាយពិន្ទុ">
                      {pieChartData && (
                        <Pie
                          data={pieChartData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                            },
                          }}
                        />
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="ពិន្ទុមធ្យមតាមផ្នែក">
                      {barChartData && (
                        <Bar
                          data={barChartData}
                          options={{
                            responsive: true,
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 30,
                              },
                            },
                          }}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Detailed Table */}
              <Card title="តារាងលម្អិត">
                <Table
                  columns={columns}
                  dataSource={detailedReport?.data || []}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `សរុប ${total} កំណត់ត្រា`,
                  }}
                />
              </Card>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TeacherObservation456Report;