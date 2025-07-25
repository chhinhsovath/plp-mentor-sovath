import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Alert,
  Descriptions,
  Timeline,
  Empty,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { observationService } from '../services/observation.service';
import { ObservationSession } from '../types/observation';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ObservationViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [observation, setObservation] = useState<ObservationSession | null>(null);

  useEffect(() => {
    if (id) {
      loadObservation();
    }
  }, [id]);

  const loadObservation = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await observationService.getObservationById(id);
      setObservation(data);
    } catch (error) {
      console.error('Error loading observation:', error);
      message.error(t('observations.loadError'));
      navigate('/observations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/observations/${id}/edit`);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t('observations.deleteConfirmTitle'),
      content: t('observations.deleteConfirmMessage'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await observationService.deleteObservation(id!);
          message.success(t('observations.deleteSuccess'));
          navigate('/observations');
        } catch (error) {
          console.error('Delete error:', error);
          message.error(t('observations.deleteError'));
        }
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const blob = await observationService.exportToPDF(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `observation-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success(t('observations.downloadSuccess'));
    } catch (error) {
      console.error('Download error:', error);
      message.error(t('observations.downloadError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'draft': return 'default';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircleOutlined />;
      case 'in_progress':
        return <ClockCircleOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!observation) {
    return (
      <Card style={{ margin: '24px' }}>
        <Empty description={t('observations.notFound')} />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button onClick={() => navigate('/observations')}>
            {t('common.backToList')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/observations')}
                    type="text"
                  >
                    {t('common.back')}
                  </Button>
                  <Title level={2} style={{ margin: 0 }}>
                    {t('observations.observationDetails')}
                  </Title>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    {t('common.print')}
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                    {t('common.download')}
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    onClick={handleEdit}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={handleDelete}
                  >
                    {t('common.delete')}
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Status Badge */}
          <div>
            <Tag 
              color={getStatusColor(observation.status)} 
              icon={getStatusIcon(observation.status)}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {t(`observations.status${observation.status.charAt(0).toUpperCase() + observation.status.slice(1)}`)}
            </Tag>
          </div>

          {/* Basic Information */}
          <Card type="inner" title={t('observations.basicInfo')}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
              <Descriptions.Item label={
                <Space><UserOutlined />{t('observations.teacher')}</Space>
              }>
                <Text strong>{observation.teacherName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={
                <Space><UserOutlined />{t('observations.observer')}</Space>
              }>
                <Text strong>{observation.observerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={
                <Space><EnvironmentOutlined />{t('observations.school')}</Space>
              }>
                {observation.schoolName}
              </Descriptions.Item>
              <Descriptions.Item label={t('observations.subject')}>
                <Tag color="blue">{observation.subject}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('observations.grade')}>
                {t('observations.gradeLevel', { level: observation.gradeLevel || observation.grade })}
              </Descriptions.Item>
              <Descriptions.Item label={
                <Space><CalendarOutlined />{t('observations.date')}</Space>
              }>
                {observation.observationDate ? 
                  format(new Date(observation.observationDate), 'dd/MM/yyyy') : 
                  '-'
                }
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Time and Duration */}
          <Card type="inner" title={t('observations.timeInfo')}>
            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <div>
                  <Text type="secondary">{t('observations.startTime')}</Text>
                  <br />
                  <Text strong style={{ fontSize: '16px' }}>
                    {observation.startTime || '-'}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div>
                  <Text type="secondary">{t('observations.endTime')}</Text>
                  <br />
                  <Text strong style={{ fontSize: '16px' }}>
                    {observation.endTime || '-'}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div>
                  <Text type="secondary">{t('observations.duration')}</Text>
                  <br />
                  <Text strong style={{ fontSize: '16px' }}>
                    {observation.startTime && observation.endTime ? 
                      `${Math.round((new Date(`2000-01-01 ${observation.endTime}`).getTime() - 
                        new Date(`2000-01-01 ${observation.startTime}`).getTime()) / 60000)} ${t('observations.minutes')}` : 
                      '-'
                    }
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Student Information */}
          <Card type="inner" title={t('observations.studentInfo')}>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <div>
                  <Text type="secondary">{t('observations.totalStudents')}</Text>
                  <br />
                  <Text strong style={{ fontSize: '20px' }}>
                    {observation.numberOfStudents || 0}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <Text type="secondary">{t('observations.femaleStudents')}</Text>
                  <br />
                  <Text strong style={{ fontSize: '20px' }}>
                    {observation.numberOfFemaleStudents || 0}
                  </Text>
                  {observation.numberOfStudents && observation.numberOfFemaleStudents && (
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ({Math.round((observation.numberOfFemaleStudents / observation.numberOfStudents) * 100)}%)
                    </Text>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Reflections */}
          {observation.reflections && observation.reflections.length > 0 && (
            <Card type="inner" title={t('observations.reflections')}>
              <Timeline>
                {observation.reflections.map((reflection, index) => (
                  <Timeline.Item key={index} color="blue">
                    <Text strong>{t(`observations.${reflection.type}`)}</Text>
                    <br />
                    <Paragraph>{reflection.content}</Paragraph>
                    {reflection.contentKh && (
                      <Paragraph type="secondary">{reflection.contentKh}</Paragraph>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}

          {/* Indicator Responses */}
          {observation.responses && observation.responses.length > 0 && (
            <Card type="inner" title={t('observations.indicatorResponses')}>
              <Alert
                message={t('observations.responsesCount', { count: observation.responses.length })}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              {/* In a full implementation, you would display the detailed responses here */}
            </Card>
          )}

          {/* Signatures */}
          {observation.signatures && observation.signatures.length > 0 && (
            <Card type="inner" title={t('observations.signatures')}>
              <Row gutter={[16, 16]}>
                {observation.signatures.map((signature, index) => (
                  <Col xs={24} sm={8} key={index}>
                    <Card size="small">
                      <Text type="secondary">{t(`observations.${signature.role}`)}</Text>
                      <br />
                      <Text strong>{signature.signerName}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {signature.signedDate ? 
                          format(new Date(signature.signedDate), 'dd/MM/yyyy HH:mm') : 
                          '-'
                        }
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* Metadata */}
          <Card type="inner" title={t('observations.metadata')} size="small">
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Text type="secondary">{t('common.createdAt')}: </Text>
                <Text>
                  {observation.createdAt ? 
                    format(new Date(observation.createdAt), 'dd/MM/yyyy HH:mm') : 
                    '-'
                  }
                </Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary">{t('common.updatedAt')}: </Text>
                <Text>
                  {observation.updatedAt ? 
                    format(new Date(observation.updatedAt), 'dd/MM/yyyy HH:mm') : 
                    '-'
                  }
                </Text>
              </Col>
            </Row>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default ObservationViewPage;