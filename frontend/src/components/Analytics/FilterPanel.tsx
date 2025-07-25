import React, { useState } from 'react';
import {
  Card,
  Collapse,
  Button,
  Space,
  Typography,
  DatePicker,
  Select,
  Input,
  Checkbox,
  Divider,
  Row,
  Col,
  Tag,
  Alert,
} from 'antd';
import {
  DownOutlined,
  CloseOutlined,
  FilterOutlined,
  CalendarOutlined,
  SchoolOutlined,
  UserOutlined,
  BookOutlined,
  ClearOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { DashboardFilter, TimeRangeFilter } from '../../types/analytics';

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  onFilterChange: (filters: DashboardFilter) => void;
  initialFilters?: DashboardFilter;
  loading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  open,
  onClose,
  onFilterChange,
  initialFilters,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DashboardFilter>(initialFilters || {
    timeRange: 'last30days',
    startDate: dayjs().subtract(30, 'days').toDate(),
    endDate: new Date(),
    schools: [],
    provinces: [],
    districts: [],
    teachers: [],
    observers: [],
    subjects: [],
    grades: [],
    indicators: [],
    performanceRange: [0, 100],
    includeIncomplete: false,
    groupBy: 'school',
    sortBy: 'performance',
    sortOrder: 'desc',
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: DashboardFilter = {
      timeRange: 'last30days',
      startDate: dayjs().subtract(30, 'days').toDate(),
      endDate: new Date(),
      schools: [],
      provinces: [],
      districts: [],
      teachers: [],
      observers: [],
      subjects: [],
      grades: [],
      indicators: [],
      performanceRange: [0, 100],
      includeIncomplete: false,
      groupBy: 'school',
      sortBy: 'performance',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
  };

  const timeRangeOptions = [
    { value: 'today', label: t('filters.today') },
    { value: 'yesterday', label: t('filters.yesterday') },
    { value: 'last7days', label: t('filters.last7days') },
    { value: 'last30days', label: t('filters.last30days') },
    { value: 'last3months', label: t('filters.last3months') },
    { value: 'lastyear', label: t('filters.lastyear') },
    { value: 'custom', label: t('filters.custom') },
  ];

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflow: 'auto',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FilterOutlined /> {t('analytics.filters.title')}
        </Title>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card size="small" title={t('filters.timeRange')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              value={filters.timeRange}
              onChange={(value: TimeRangeFilter) => setFilters({ ...filters, timeRange: value })}
              style={{ width: '100%' }}
            >
              {timeRangeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            
            {filters.timeRange === 'custom' && (
              <RangePicker
                value={[dayjs(filters.startDate), dayjs(filters.endDate)]}
                onChange={(dates) => {
                  if (dates) {
                    setFilters({
                      ...filters,
                      startDate: dates[0]?.toDate() || new Date(),
                      endDate: dates[1]?.toDate() || new Date(),
                    });
                  }
                }}
                style={{ width: '100%' }}
              />
            )}
          </Space>
        </Card>

        <Card size="small" title={t('filters.schools')}>
          <Select
            mode="multiple"
            placeholder={t('filters.selectSchools')}
            value={filters.schools}
            onChange={(schools: string[]) => setFilters({ ...filters, schools })}
            style={{ width: '100%' }}
          >
            <Option value="school1">Sample School 1</Option>
            <Option value="school2">Sample School 2</Option>
          </Select>
        </Card>

        <Card size="small" title={t('filters.location')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              mode="multiple"
              placeholder={t('filters.selectProvinces')}
              value={filters.provinces}
              onChange={(provinces: string[]) => setFilters({ ...filters, provinces })}
              style={{ width: '100%' }}
            >
              <Option value="province1">Sample Province 1</Option>
              <Option value="province2">Sample Province 2</Option>
            </Select>
            
            <Select
              mode="multiple"
              placeholder={t('filters.selectDistricts')}
              value={filters.districts}
              onChange={(districts: string[]) => setFilters({ ...filters, districts })}
              style={{ width: '100%' }}
            >
              <Option value="district1">Sample District 1</Option>
              <Option value="district2">Sample District 2</Option>
            </Select>
          </Space>
        </Card>

        <Card size="small" title={t('filters.academic')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              mode="multiple"
              placeholder={t('filters.selectSubjects')}
              value={filters.subjects}
              onChange={(subjects: string[]) => setFilters({ ...filters, subjects })}
              style={{ width: '100%' }}
            >
              <Option value="math">Mathematics</Option>
              <Option value="khmer">Khmer</Option>
              <Option value="science">Science</Option>
            </Select>
            
            <Select
              mode="multiple"
              placeholder={t('filters.selectGrades')}
              value={filters.grades}
              onChange={(grades: string[]) => setFilters({ ...filters, grades })}
              style={{ width: '100%' }}
            >
              <Option value="1">Grade 1</Option>
              <Option value="2">Grade 2</Option>
              <Option value="3">Grade 3</Option>
            </Select>
          </Space>
        </Card>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              style={{ width: '100%' }}
            >
              {t('common.clear')}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApplyFilters}
              loading={loading}
              style={{ width: '100%' }}
            >
              {t('common.apply')}
            </Button>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default FilterPanel;