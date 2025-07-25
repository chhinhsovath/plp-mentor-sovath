import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  Tag,
  Typography,
  Switch,
  InputNumber,
  Tooltip,
  Divider,
} from 'antd';
import {
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  MissionType,
  MissionStatus,
  MissionFilter,
} from '../types/mission';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Text } = Typography;

interface MissionAdvancedFiltersProps {
  filters: MissionFilter;
  onFiltersChange: (filters: MissionFilter) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const MissionAdvancedFilters: React.FC<MissionAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  React.useEffect(() => {
    // Count active filters
    const count = Object.keys(filters).filter(key => {
      const value = filters[key as keyof MissionFilter];
      return value !== undefined && value !== null && value !== '';
    }).length;
    setActiveFilterCount(count);
  }, [filters]);

  const handleFormChange = (changedValues: any, allValues: any) => {
    // Remove empty values
    const cleanValues = Object.keys(allValues).reduce((acc, key) => {
      const value = allValues[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          return acc;
        }
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onFiltersChange(cleanValues);
  };

  const handleDateRangeChange = (dates: any, dateStrings: string[]) => {
    const values = form.getFieldsValue();
    if (dates && dates.length === 2) {
      const updatedValues = {
        ...values,
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      };
      onFiltersChange(updatedValues);
    } else {
      const { startDate, endDate, ...rest } = values;
      onFiltersChange(rest);
    }
  };

  const handleClear = () => {
    form.resetFields();
    onClearFilters();
  };

  const getStatusColor = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.DRAFT: return 'default';
      case MissionStatus.SUBMITTED: return 'processing';
      case MissionStatus.APPROVED: return 'success';
      case MissionStatus.REJECTED: return 'error';
      case MissionStatus.IN_PROGRESS: return 'processing';
      case MissionStatus.COMPLETED: return 'success';
      case MissionStatus.CANCELLED: return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type: MissionType) => {
    switch (type) {
      case MissionType.FIELD_TRIP: return 'blue';
      case MissionType.TRAINING: return 'green';
      case MissionType.MEETING: return 'orange';
      case MissionType.MONITORING: return 'purple';
      default: return 'default';
    }
  };

  return (
    <Card size="small">
      <Form
        form={form}
        onValuesChange={handleFormChange}
        initialValues={filters}
        layout="vertical"
      >
        {/* Quick Filters Row */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="search" style={{ marginBottom: 0 }}>
              <Input
                placeholder="ស្វែងរកបេសកកម្ម..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item name="type" style={{ marginBottom: 0 }}>
              <Select
                placeholder="ប្រភេទ"
                allowClear
              >
                <Option value={MissionType.FIELD_TRIP}>
                  <Tag color={getTypeColor(MissionType.FIELD_TRIP)}>
                    ទស្សនកិច្ច
                  </Tag>
                </Option>
                <Option value={MissionType.TRAINING}>
                  <Tag color={getTypeColor(MissionType.TRAINING)}>
                    វគ្គបណ្តុះបណ្តាល
                  </Tag>
                </Option>
                <Option value={MissionType.MEETING}>
                  <Tag color={getTypeColor(MissionType.MEETING)}>
                    កិច្ចប្រជុំ
                  </Tag>
                </Option>
                <Option value={MissionType.MONITORING}>
                  <Tag color={getTypeColor(MissionType.MONITORING)}>
                    ការត្រួតពិនិត្យ
                  </Tag>
                </Option>
                <Option value={MissionType.OTHER}>
                  <Tag color={getTypeColor(MissionType.OTHER)}>
                    ផ្សេងៗ
                  </Tag>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item name="status" style={{ marginBottom: 0 }}>
              <Select
                placeholder="ស្ថានភាព"
                allowClear
              >
                <Option value={MissionStatus.DRAFT}>
                  <Tag color={getStatusColor(MissionStatus.DRAFT)}>
                    សេចក្តីព្រាង
                  </Tag>
                </Option>
                <Option value={MissionStatus.SUBMITTED}>
                  <Tag color={getStatusColor(MissionStatus.SUBMITTED)}>
                    បានដាក់ស្នើ
                  </Tag>
                </Option>
                <Option value={MissionStatus.APPROVED}>
                  <Tag color={getStatusColor(MissionStatus.APPROVED)}>
                    បានអនុម័ត
                  </Tag>
                </Option>
                <Option value={MissionStatus.REJECTED}>
                  <Tag color={getStatusColor(MissionStatus.REJECTED)}>
                    បានបដិសេធ
                  </Tag>
                </Option>
                <Option value={MissionStatus.IN_PROGRESS}>
                  <Tag color={getStatusColor(MissionStatus.IN_PROGRESS)}>
                    កំពុងដំណើរការ
                  </Tag>
                </Option>
                <Option value={MissionStatus.COMPLETED}>
                  <Tag color={getStatusColor(MissionStatus.COMPLETED)}>
                    បានបញ្ចប់
                  </Tag>
                </Option>
                <Option value={MissionStatus.CANCELLED}>
                  <Tag color={getStatusColor(MissionStatus.CANCELLED)}>
                    បានលុបចោល
                  </Tag>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Form.Item style={{ marginBottom: 0 }}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={[
                  'ចាប់ផ្តើម',
                  'បញ្ចប់'
                ]}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Space>
              <Tooltip title="តម្រងកម្រិតខ្ពស់">
                <Button
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  កម្រិតខ្ពស់
                  {activeFilterCount > 0 && (
                    <Tag color="blue" style={{ marginLeft: 4 }}>
                      {activeFilterCount}
                    </Tag>
                  )}
                </Button>
              </Tooltip>
              <Tooltip title="សម្អាត">
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  disabled={activeFilterCount === 0}
                >
                  សម្អាត
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Advanced Filters Collapse */}
        {isExpanded && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="createdBy"
                  label={
                    <Space>
                      <UserOutlined />
                      បង្កើតដោយ
                    </Space>
                  }
                >
                  <Select
                    placeholder="ជ្រើសរើសអ្នកប្រើប្រាស់"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {/* This would be populated with actual users */}
                    <Option value="user1">John Smith</Option>
                    <Option value="user2">Sarah Johnson</Option>
                    <Option value="user3">Mike Chen</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="participantId"
                  label={
                    <Space>
                      <TeamOutlined />
                      អ្នកចូលរួម
                    </Space>
                  }
                >
                  <Select
                    placeholder="ជ្រើសរើសអ្នកចូលរួម"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {/* This would be populated with actual users */}
                    <Option value="user1">John Smith</Option>
                    <Option value="user2">Sarah Johnson</Option>
                    <Option value="user3">Mike Chen</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label={
                    <Space>
                      <DollarOutlined />
                      ចំនួនថវិកា
                    </Space>
                  }
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="budgetMin" style={{ width: '50%', marginBottom: 0 }}>
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="អប្បបរមា"
                        min={0}
                        formatter={value => `៛ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/៛\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                    <Form.Item name="budgetMax" style={{ width: '50%', marginBottom: 0 }}>
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="អតិបរមា"
                        min={0}
                        formatter={value => `៛ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/៛\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="sortBy"
                  label="តម្រៀបតាម"
                >
                  <Select placeholder="ជ្រើសរើសការតម្រៀប" allowClear>
                    <Option value="createdAt">កាលបរិច្ឆេទបង្កើត</Option>
                    <Option value="startDate">កាលបរិច្ឆេទចាប់ផ្តើម</Option>
                    <Option value="endDate">កាលបរិច្ឆេទបញ្ចប់</Option>
                    <Option value="title">ចំណងជើង</Option>
                    <Option value="budget">ថវិកា</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="sortOrder"
                  label="លំដាប់តម្រៀប"
                >
                  <Select placeholder="ជ្រើសរើសលំដាប់" allowClear>
                    <Option value="DESC">ថ្មីទៅចាស់</Option>
                    <Option value="ASC">ចាស់ទៅថ្មី</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="hasLocation"
                  label={
                    <Space>
                      <EnvironmentOutlined />
                      មានទីតាំង
                    </Space>
                  }
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <>
          <Divider style={{ margin: '16px 0 8px 0' }} />
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              តម្រងសកម្ម: {activeFilterCount}
            </Text>
            <div style={{ marginTop: 4 }}>
              {Object.entries(filters).map(([key, value]) => {
                if (value === undefined || value === null || value === '') return null;
                
                let displayValue = value as string;
                let label = key;
                
                // Format specific filter types and translate to Khmer
                const labelMap: Record<string, string> = {
                  type: 'ប្រភេទ',
                  status: 'ស្ថានភាព',
                  search: 'ស្វែងរក',
                  createdBy: 'បង្កើតដោយ',
                  participantId: 'អ្នកចូលរួម',
                  budgetMin: 'ថវិកាអប្បបរមា',
                  budgetMax: 'ថវិកាអតិបរមា',
                  sortBy: 'តម្រៀបតាម',
                  sortOrder: 'លំដាប់តម្រៀប',
                  hasLocation: 'មានទីតាំង',
                  startDate: 'កាលបរិច្ឆេទចាប់ផ្តើម',
                  endDate: 'កាលបរិច្ឆេទបញ្ចប់'
                };
                
                label = labelMap[key] || key;
                
                // Format values for display
                switch (key) {
                  case 'type':
                    const typeMap: Record<string, string> = {
                      field_trip: 'ទស្សនកិច្ច',
                      training: 'វគ្គបណ្តុះបណ្តាល',
                      meeting: 'កិច្ចប្រជុំ',
                      monitoring: 'ការត្រួតពិនិត្យ',
                      other: 'ផ្សេងៗ'
                    };
                    displayValue = typeMap[value as string] || value as string;
                    break;
                  case 'status':
                    const statusMap: Record<string, string> = {
                      draft: 'សេចក្តីព្រាង',
                      submitted: 'បានដាក់ស្នើ',
                      approved: 'បានអនុម័ត',
                      rejected: 'បានបដិសេធ',
                      in_progress: 'កំពុងដំណើរការ',
                      completed: 'បានបញ្ចប់',
                      cancelled: 'បានលុបចោល'
                    };
                    displayValue = statusMap[value as string] || value as string;
                    break;
                  case 'sortOrder':
                    displayValue = value === 'DESC' ? 'ថ្មីទៅចាស់' : 'ចាស់ទៅថ្មី';
                    break;
                  case 'hasLocation':
                    displayValue = value ? 'បាទ/ចាស' : 'ទេ';
                    break;
                }
                
                return (
                  <Tag
                    key={key}
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key as keyof MissionFilter];
                      onFiltersChange(newFilters);
                    }}
                    style={{ marginBottom: 4 }}
                  >
                    {label}: {displayValue}
                  </Tag>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default MissionAdvancedFilters;