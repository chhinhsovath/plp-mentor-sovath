import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  CopyOutlined,
  ExportOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FormTemplate } from '../types/form';
import { formService } from '../services/form.service';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

const FormsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchForms();
  }, [searchText, selectedCategory, selectedStatus, pagination.current]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const { forms: fetchedForms, total } = await formService.getForms({
        search: searchText,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setForms(fetchedForms);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      message.error(t('forms.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    createForm.validateFields().then(async (values) => {
      try {
        await formService.createForm({
          ...values,
          nameKm: values.name,
          descriptionKm: values.description,
        });
        message.success(t('forms.messages.created'));
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchForms();
      } catch (error) {
        message.error(t('forms.messages.createError'));
      }
    });
  };

  const handleDeleteForm = async (id: string) => {
    try {
      await formService.deleteForm(id);
      message.success(t('forms.messages.deleted'));
      fetchForms();
    } catch (error) {
      message.error(t('forms.messages.deleteError'));
    }
  };

  const handleDuplicateForm = async (form: FormTemplate) => {
    try {
      await formService.duplicateForm(form.id, `${form.nameKm} (${t('common.copy')})`);
      message.success(t('forms.messages.duplicated'));
      fetchForms();
    } catch (error) {
      message.error(t('forms.messages.duplicateError'));
    }
  };

  const handlePublishForm = async (id: string) => {
    try {
      await formService.publishForm(id);
      message.success(t('forms.messages.published'));
      fetchForms();
    } catch (error) {
      message.error(t('forms.messages.publishError'));
    }
  };

  const handleArchiveForm = async (id: string) => {
    try {
      await formService.archiveForm(id);
      message.success(t('forms.messages.archived'));
      fetchForms();
    } catch (error) {
      message.error(t('forms.messages.archiveError'));
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', icon: <FileTextOutlined /> },
      published: { color: 'success', icon: <CheckCircleOutlined /> },
      archived: { color: 'warning', icon: <FileProtectOutlined /> },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Tag color={config.color} icon={config.icon}>
        {t(`forms.status.${status}`)}
      </Tag>
    );
  };

  const columns: ColumnsType<FormTemplate> = [
    {
      title: t('forms.columns.name'),
      dataIndex: 'nameKm',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.descriptionKm}
          </span>
        </Space>
      ),
    },
    {
      title: t('forms.columns.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag>{t(`forms.categories.${category}`)}</Tag>
      ),
    },
    {
      title: t('forms.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: t('forms.columns.submissions'),
      key: 'submissions',
      render: (_, record) => (
        <Badge count={record.submissionCount || 0} showZero>
          <FileTextOutlined style={{ fontSize: '16px' }} />
        </Badge>
      ),
    },
    {
      title: t('forms.columns.updatedAt'),
      dataIndex: ['metadata', 'updatedAt'],
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleDateString('km-KH'),
    },
    {
      title: t('forms.columns.actions'),
      key: 'actions',
      fixed: 'right',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('common.edit'),
            onClick: () => navigate(`/forms/builder/${record.id}`),
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: t('forms.actions.duplicate'),
            onClick: () => handleDuplicateForm(record),
          },
          {
            key: 'divider1',
            type: 'divider' as const,
          },
        ];

        if (record.status === 'draft') {
          menuItems.push({
            key: 'publish',
            icon: <CheckCircleOutlined />,
            label: t('forms.actions.publish'),
            onClick: () => handlePublishForm(record.id),
          });
        } else if (record.status === 'published') {
          menuItems.push({
            key: 'archive',
            icon: <FileProtectOutlined />,
            label: t('forms.actions.archive'),
            onClick: () => handleArchiveForm(record.id),
          });
        }

        menuItems.push(
          {
            key: 'divider2',
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('common.delete'),
            danger: true,
            onClick: () => {},
          }
        );

        return (
          <Space size="middle">
            <Tooltip title={t('forms.actions.preview')}>
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/forms/preview/${record.id}`)}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: menuItems.filter(item => item.key !== 'delete'),
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
            {record.status === 'draft' && (
              <Popconfirm
                title={t('forms.messages.deleteConfirm')}
                onConfirm={() => handleDeleteForm(record.id)}
                okText={t('common.yes')}
                cancelText={t('common.no')}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                {t('forms.title')}
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ExportOutlined />}
                  onClick={() => navigate('/forms/templates')}
                >
                  {t('forms.actions.templates')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  {t('forms.create')}
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col flex="auto">
              <Search
                placeholder={t('forms.searchPlaceholder')}
                onSearch={setSearchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col>
              <Select
                style={{ width: 200 }}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder={t('forms.filterByCategory')}
              >
                <Select.Option value="all">{t('common.all')}</Select.Option>
                <Select.Option value="observation">{t('forms.categories.observation')}</Select.Option>
                <Select.Option value="survey">{t('forms.categories.survey')}</Select.Option>
                <Select.Option value="assessment">{t('forms.categories.assessment')}</Select.Option>
                <Select.Option value="feedback">{t('forms.categories.feedback')}</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 150 }}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder={t('forms.filterByStatus')}
              >
                <Select.Option value="all">{t('common.all')}</Select.Option>
                <Select.Option value="draft">{t('forms.status.draft')}</Select.Option>
                <Select.Option value="published">{t('forms.status.published')}</Select.Option>
                <Select.Option value="archived">{t('forms.status.archived')}</Select.Option>
              </Select>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={forms}
            loading={loading}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => t('common.totalItems', { count: total }),
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || prev.pageSize,
                }));
              },
            }}
          />
        </Space>
      </Card>

      <Modal
        title={t('forms.createTitle')}
        open={createModalVisible}
        onOk={handleCreateForm}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label={t('forms.fields.name')}
            rules={[{ required: true, message: t('forms.validation.nameRequired') }]}
          >
            <Input placeholder={t('forms.placeholders.name')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('forms.fields.description')}
            rules={[{ required: true, message: t('forms.validation.descriptionRequired') }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder={t('forms.placeholders.description')} 
            />
          </Form.Item>
          <Form.Item
            name="category"
            label={t('forms.fields.category')}
            rules={[{ required: true, message: t('forms.validation.categoryRequired') }]}
          >
            <Select placeholder={t('forms.placeholders.category')}>
              <Select.Option value="observation">{t('forms.categories.observation')}</Select.Option>
              <Select.Option value="survey">{t('forms.categories.survey')}</Select.Option>
              <Select.Option value="assessment">{t('forms.categories.assessment')}</Select.Option>
              <Select.Option value="feedback">{t('forms.categories.feedback')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FormsPage;