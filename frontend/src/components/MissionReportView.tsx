import React from 'react';
import {
  Card,
  Typography,
  Descriptions,
  List,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Timeline,
  Table,
  Badge,
  Alert,
  Empty,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  WarningOutlined,
  BulbOutlined,
  SafetyOutlined,
  CalendarOutlined,
  UserOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { MissionReport, MissionType } from '../types/mission';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface MissionReportViewProps {
  report: MissionReport;
}

export const MissionReportView: React.FC<MissionReportViewProps> = ({ report }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'processing';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleOutlined />;
      case 'rejected':
        return <CloseCircleOutlined />;
      case 'submitted':
        return <ClockCircleOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getComplianceStatusInKhmer = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'អនុលោមពេញលេញ';
      case 'partially_compliant':
        return 'អនុលោមផ្នែកខ្លះ';
      case 'non_compliant':
        return 'មិនអនុលោម';
      default:
        return status;
    }
  };

  const renderCommonInfo = () => (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                របាយការណ៍បេសកកម្ម
              </Title>
              <Tag color={getStatusColor(report.status)}>
                <Space>
                  {getStatusIcon(report.status)}
                  {report.status === 'draft' && 'សេចក្តីព្រាង'}
                  {report.status === 'submitted' && 'បានដាក់ស្នើ'}
                  {report.status === 'approved' && 'បានអនុម័ត'}
                  {report.status === 'rejected' && 'បានបដិសេធ'}
                </Space>
              </Tag>
            </Space>
          </Col>
          <Col>
            <Text type="secondary">
              ដាក់ស្នើដោយ: {report.submittedBy.fullName || report.submittedBy.username}
            </Text>
          </Col>
        </Row>
        <Divider />
        <Descriptions column={2}>
          <Descriptions.Item label="កាលបរិច្ឆេទដាក់ស្នើ">
            {dayjs(report.submittedAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="ប្រភេទបេសកកម្ម">
            <Tag>
              {report.reportType === MissionType.FIELD_TRIP && 'ទស្សនកិច្ច'}
              {report.reportType === MissionType.TRAINING && 'វគ្គបណ្តុះបណ្តាល'}
              {report.reportType === MissionType.MEETING && 'កិច្ចប្រជុំ'}
              {report.reportType === MissionType.MONITORING && 'ការត្រួតពិនិត្យ'}
              {report.reportType === MissionType.OTHER && 'ផ្សេងៗ'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<Space><FileTextOutlined /> សេចក្តីសង្ខេប</Space>} style={{ marginBottom: 16 }}>
        <Paragraph>{report.summary}</Paragraph>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card title={<Space><TrophyOutlined /> សមិទ្ធផល</Space>}>
            {report.achievements.length > 0 ? (
              <List
                size="small"
                dataSource={report.achievements}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="គ្មានសមិទ្ធផល" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Space><WarningOutlined /> បញ្ហាប្រឈម</Space>}>
            {report.challenges.length > 0 ? (
              <List
                size="small"
                dataSource={report.challenges}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="គ្មានបញ្ហាប្រឈម" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Space><BulbOutlined /> អនុសាសន៍</Space>}>
            {report.recommendations.length > 0 ? (
              <List
                size="small"
                dataSource={report.recommendations}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <BulbOutlined style={{ color: '#faad14' }} />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="គ្មានអនុសាសន៍" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderFieldTripReport = () => (
    <Card title={<Space><EnvironmentOutlined /> ព័ត៌មានទស្សនកិច្ច</Space>} style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="ចំនួនមនុស្សដែលបានជួប"
            value={report.peopleMetCount || 0}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="ចំនួនទីតាំងទស្សនកិច្ច"
            value={report.placesVisited?.length || 0}
            prefix={<EnvironmentOutlined />}
          />
        </Col>
      </Row>
      <Divider />
      
      {report.placesVisited && report.placesVisited.length > 0 && (
        <>
          <Title level={5}>ទីតាំងដែលបានទៅទស្សនា</Title>
          <List
            size="small"
            dataSource={report.placesVisited}
            renderItem={(place) => (
              <List.Item>
                <Space>
                  <EnvironmentOutlined />
                  <Text>{place}</Text>
                </Space>
              </List.Item>
            )}
          />
        </>
      )}

      {report.keyFindings && report.keyFindings.length > 0 && (
        <>
          <Divider />
          <Title level={5}>របកគំហើញសំខាន់ៗ</Title>
          <Timeline>
            {report.keyFindings.map((finding, index) => (
              <Timeline.Item key={index} color="blue">
                <Text>{finding}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}
    </Card>
  );

  const renderTrainingReport = () => (
    <Card title={<Space><TeamOutlined /> ព័ត៌មានវគ្គបណ្តុះបណ្តាល</Space>} style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="ចំនួនអ្នកចូលរួម"
            value={report.participantsCount || 0}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="ប្រធានបទបង្រៀន"
            value={report.topicsCovered?.length || 0}
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="ជំនាញទទួលបាន"
            value={report.skillsAcquired?.length || 0}
            prefix={<TrophyOutlined />}
          />
        </Col>
      </Row>
      <Divider />

      {report.topicsCovered && report.topicsCovered.length > 0 && (
        <>
          <Title level={5}>ប្រធានបទដែលបានបង្រៀន</Title>
          <List
            size="small"
            dataSource={report.topicsCovered}
            renderItem={(topic) => (
              <List.Item>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>{topic}</Text>
                </Space>
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {report.skillsAcquired && report.skillsAcquired.length > 0 && (
        <>
          <Title level={5}>ជំនាញដែលអ្នកចូលរួមទទួលបាន</Title>
          <List
            size="small"
            dataSource={report.skillsAcquired}
            renderItem={(skill) => (
              <List.Item>
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <Text>{skill}</Text>
                </Space>
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {report.participantFeedback && (
        <>
          <Title level={5}>មតិយោបល់របស់អ្នកចូលរួម</Title>
          <Alert
            message="មតិយោបល់"
            description={report.participantFeedback}
            type="info"
            showIcon
          />
        </>
      )}
    </Card>
  );

  const renderMeetingReport = () => (
    <Card title={<Space><TeamOutlined /> ព័ត៌មានកិច្ចប្រជុំ</Space>} style={{ marginBottom: 16 }}>
      <Statistic
        title="ចំនួនអ្នកចូលរួម"
        value={report.attendeesCount || 0}
        prefix={<TeamOutlined />}
        style={{ marginBottom: 16 }}
      />

      {report.agendaItems && report.agendaItems.length > 0 && (
        <>
          <Title level={5}>របៀបវារៈកិច្ចប្រជុំ</Title>
          <List
            size="small"
            dataSource={report.agendaItems}
            renderItem={(item, index) => (
              <List.Item>
                <Text>{index + 1}. {item}</Text>
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {report.decisions && report.decisions.length > 0 && (
        <>
          <Title level={5}>សេចក្តីសម្រេចចិត្ត</Title>
          <Timeline>
            {report.decisions.map((decision, index) => (
              <Timeline.Item key={index} color="green">
                <Text>{decision}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}

      {report.actionItems && report.actionItems.length > 0 && (
        <>
          <Title level={5}>សកម្មភាពត្រូវអនុវត្ត</Title>
          <Table
            size="small"
            dataSource={report.actionItems}
            columns={[
              {
                title: 'ភារកិច្ច',
                dataIndex: 'task',
                key: 'task',
              },
              {
                title: 'អ្នកទទួលខុសត្រូវ',
                dataIndex: 'responsible',
                key: 'responsible',
                render: (text) => <Tag icon={<UserOutlined />}>{text}</Tag>,
              },
              {
                title: 'ថ្ងៃកំណត់',
                dataIndex: 'deadline',
                key: 'deadline',
                render: (date) => (
                  <Space>
                    <CalendarOutlined />
                    {dayjs(date).format('DD/MM/YYYY')}
                  </Space>
                ),
              },
            ]}
            pagination={false}
          />
        </>
      )}
    </Card>
  );

  const renderMonitoringReport = () => (
    <Card title={<Space><SafetyOutlined /> ព័ត៌មានការត្រួតពិនិត្យ</Space>} style={{ marginBottom: 16 }}>
      {report.complianceStatus && (
        <Alert
          message="ស្ថានភាពអនុលោមភាព"
          description={
            <Space>
              <Badge
                status={
                  report.complianceStatus === 'compliant' ? 'success' :
                  report.complianceStatus === 'partially_compliant' ? 'warning' :
                  'error'
                }
              />
              <Text strong>{getComplianceStatusInKhmer(report.complianceStatus)}</Text>
            </Space>
          }
          type={
            report.complianceStatus === 'compliant' ? 'success' :
            report.complianceStatus === 'partially_compliant' ? 'warning' :
            'error'
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {report.sitesMonitored && report.sitesMonitored.length > 0 && (
        <>
          <Title level={5}>ទីតាំងដែលបានត្រួតពិនិត្យ</Title>
          <List
            size="small"
            dataSource={report.sitesMonitored}
            renderItem={(site) => (
              <List.Item>
                <Space>
                  <EnvironmentOutlined />
                  <Text>{site}</Text>
                </Space>
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {report.issuesIdentified && report.issuesIdentified.length > 0 && (
        <>
          <Title level={5}>បញ្ហាដែលរកឃើញ</Title>
          <List
            size="small"
            dataSource={report.issuesIdentified}
            renderItem={(issue) => (
              <List.Item>
                <Alert
                  message={issue}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {report.correctiveActions && report.correctiveActions.length > 0 && (
        <>
          <Title level={5}>វិធានការកែតម្រូវ</Title>
          <Timeline>
            {report.correctiveActions.map((action, index) => (
              <Timeline.Item key={index} color="blue">
                <Text>{action}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}
    </Card>
  );

  const renderImpactMetrics = () => {
    if (!report.impactMetrics) return null;

    return (
      <Card title={<Space><RocketOutlined /> ការវាយតម្លៃផលប៉ះពាល់</Space>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Statistic
              title="ចំនួនមនុស្សដែលទទួលផលប្រយោជន៍"
              value={report.impactMetrics.peopleImpacted}
              prefix={<TeamOutlined />}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        {report.impactMetrics.areasImproved && report.impactMetrics.areasImproved.length > 0 && (
          <>
            <Title level={5}>វិស័យដែលមានការកែលម្អ</Title>
            <List
              size="small"
              dataSource={report.impactMetrics.areasImproved}
              renderItem={(area) => (
                <List.Item>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>{area}</Text>
                  </Space>
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        {report.impactMetrics.quantifiableResults && report.impactMetrics.quantifiableResults.length > 0 && (
          <>
            <Title level={5}>លទ្ធផលដែលអាចវាស់វែងបាន</Title>
            <Row gutter={[16, 16]}>
              {report.impactMetrics.quantifiableResults.map((result, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card size="small">
                    <Statistic
                      title={result.metric}
                      value={result.value}
                      suffix={result.unit}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>
    );
  };

  const renderTypeSpecificReport = () => {
    switch (report.reportType) {
      case MissionType.FIELD_TRIP:
        return renderFieldTripReport();
      case MissionType.TRAINING:
        return renderTrainingReport();
      case MissionType.MEETING:
        return renderMeetingReport();
      case MissionType.MONITORING:
        return renderMonitoringReport();
      default:
        return null;
    }
  };

  return (
    <div>
      {renderCommonInfo()}
      {renderTypeSpecificReport()}
      {renderImpactMetrics()}
    </div>
  );
};

export default MissionReportView;