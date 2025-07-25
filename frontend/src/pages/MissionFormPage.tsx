import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  InputNumber,
  Divider,
  Alert,
  Spin,
  Tag,
  App,
  Statistic,
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  EnvironmentOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  CarOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { EnhancedLocationPicker } from '../components/EnhancedLocationPicker';
import { 
  MissionType, 
  MissionStatus, 
  CreateMissionInput, 
  UpdateMissionInput,
  Mission,
} from '../types/mission';
import missionService from '../services/mission.service';
import { useAuth } from '../contexts/AuthContext';
import { calculateTravelInfo, formatDuration, formatDistance } from '../utils/distanceCalculator';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const MissionFormPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [travelInfo, setTravelInfo] = useState<{ distance: number; durationByCar: number; durationByBus: number } | null>(null);
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  
  // Watch form values for location
  const latitude = Form.useWatch('latitude', form);
  const longitude = Form.useWatch('longitude', form);

  const getMissionStatusInKhmer = (status: MissionStatus): string => {
    const statusMap: Record<MissionStatus, string> = {
      [MissionStatus.DRAFT]: 'សេចក្តីព្រាង',
      [MissionStatus.SUBMITTED]: 'បានដាក់ស្នើ',
      [MissionStatus.APPROVED]: 'បានអនុម័ត',
      [MissionStatus.REJECTED]: 'បានបដិសេធ',
      [MissionStatus.IN_PROGRESS]: 'កំពុងដំណើរការ',
      [MissionStatus.COMPLETED]: 'បានបញ្ចប់',
      [MissionStatus.CANCELLED]: 'បានលុបចោល',
    };
    return statusMap[status] || status;
  };

  // Fetch mission data if editing
  useEffect(() => {
    if (id) {
      fetchMission();
    }
  }, [id]);

  // Calculate travel info when location changes
  useEffect(() => {
    if (latitude && longitude && user?.officeLatitude && user?.officeLongitude) {
      const info = calculateTravelInfo(
        user.officeLatitude,
        user.officeLongitude,
        latitude,
        longitude
      );
      setTravelInfo(info);
    } else {
      setTravelInfo(null);
    }
  }, [latitude, longitude, user]);

  const fetchMission = async () => {
    if (!id) return;
    
    setInitialLoading(true);
    try {
      const data = await missionService.getMissionById(id);
      setMission(data);
      
      // Set form values
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        purpose: data.purpose,
        objectives: data.objectives,
        expectedOutcomes: data.expectedOutcomes,
        budget: data.budget,
        transportationDetails: data.transportationDetails,
        accommodationDetails: data.accommodationDetails,
      });
    } catch (error) {
      console.error('Error fetching mission:', error);
      message.error('មិនអាចផ្ទុកព័ត៌មានលម្អិតបេសកកម្មបានទេ');
      navigate('/missions');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Prepare data
      const missionData = {
        title: values.title,
        description: values.description,
        type: values.type,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        location: values.location,
        latitude: values.latitude,
        longitude: values.longitude,
        purpose: values.purpose,
        objectives: values.objectives,
        expectedOutcomes: values.expectedOutcomes,
        budget: values.budget,
        transportationDetails: values.transportationDetails,
        accommodationDetails: values.accommodationDetails,
      };

      if (isEditing && id) {
        await missionService.updateMission(id, missionData as UpdateMissionInput);
        message.success('បានធ្វើបច្ចុប្បន្នភាពបេសកកម្មដោយជោគជ័យ');
      } else {
        await missionService.createMission(missionData as CreateMissionInput);
        message.success('បានបង្កើតបេសកកម្មដោយជោគជ័យ');
      }
      
      navigate('/missions');
    } catch (error: any) {
      console.error('Error saving mission:', error);
      message.error(error.response?.data?.message || 'មិនអាចរក្សាទុកបេសកកម្មបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    form.setFieldsValue({
      latitude: lat,
      longitude: lng,
      location: address || form.getFieldValue('location'),
    });
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/missions')}
              >
                ត្រឡប់ទៅបេសកកម្ម
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {isEditing ? 'កែសម្រួលបេសកកម្ម' : 'បង្កើតបេសកកម្មថ្មី'}
              </Title>
            </Space>
          </Col>
          {mission && mission.status && (
            <Col>
              <Tag color={
                mission.status === MissionStatus.APPROVED ? 'green' :
                mission.status === MissionStatus.REJECTED ? 'red' :
                mission.status === MissionStatus.IN_PROGRESS ? 'blue' :
                mission.status === MissionStatus.COMPLETED ? 'purple' :
                'default'
              }>
                {getMissionStatusInKhmer(mission.status)}
              </Tag>
            </Col>
          )}
        </Row>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          type: MissionType.FIELD_TRIP,
          latitude: null,
          longitude: null,
        }}
      >
        {/* Basic Information */}
        <Card title={<Space><FileTextOutlined /> ព័ត៌មានមូលដ្ឋាន</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="title"
                label="ចំណងជើងបេសកកម្ម"
                rules={[{ required: true, message: 'សូមបញ្ចូលចំណងជើងបេសកកម្ម' }]}
              >
                <Input 
                  placeholder="បញ្ចូលចំណងជើងបេសកកម្ម" 
                  prefix={<FileTextOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="type"
                label="ប្រភេទបេសកកម្ម"
                rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទបេសកកម្ម' }]}
              >
                <Select placeholder="ជ្រើសរើសប្រភេទបេសកកម្ម">
                  <Option value={MissionType.FIELD_TRIP}>ទស្សនកិច្ច</Option>
                  <Option value={MissionType.TRAINING}>វគ្គបណ្តុះបណ្តាល</Option>
                  <Option value={MissionType.MEETING}>កិច្ចប្រជុំ</Option>
                  <Option value={MissionType.MONITORING}>ការត្រួតពិនិត្យ</Option>
                  <Option value={MissionType.OTHER}>ផ្សេងៗ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="ការពិពណ៌នា"
          >
            <TextArea 
              rows={4} 
              placeholder="បញ្ចូលការពិពណ៌នាបេសកកម្ម..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label="កាលបរិច្ឆេទចាប់ផ្តើម"
                rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="ជ្រើសរើសកាលបរិច្ឆេទ និងពេលវេលា"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label="កាលបរិច្ឆេទបញ្ចប់"
                rules={[
                  { required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទបញ្ចប់' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('startDate') || value.isAfter(getFieldValue('startDate'))) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('កាលបរិច្ឆេទបញ្ចប់ត្រូវតែក្រោយពីកាលបរិច្ឆេទចាប់ផ្តើម'));
                    },
                  }),
                ]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="ជ្រើសរើសកាលបរិច្ឆេទ និងពេលវេលា"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Location Information */}
        <Card title={<Space><EnvironmentOutlined /> ព័ត៌មានទីតាំង</Space>} style={{ marginBottom: 16 }}>
          <Alert
            message="ចុចលើផែនទី ឬស្វែងរកទីតាំងដើម្បីកំណត់គោលដៅបេសកកម្ម"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="location"
            label="ឈ្មោះទីតាំង/អាសយដ្ឋាន"
          >
            <Input 
              placeholder="បញ្ចូលឈ្មោះទីតាំង ឬអាសយដ្ឋាន" 
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="Latitude"
                hidden
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label="Longitude"
                hidden
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues.latitude !== currentValues.latitude || 
            prevValues.longitude !== currentValues.longitude
          }>
            {() => (
              <div style={{ marginTop: 16 }}>
                <EnhancedLocationPicker
                  latitude={form.getFieldValue('latitude')}
                  longitude={form.getFieldValue('longitude')}
                  onLocationChange={handleLocationChange}
                  height={400}
                  placeholder="ស្វែងរកទីតាំង ឬអាសយដ្ឋាន..."
                  showCoordinates={true}
                  showSearchHistory={true}
                />
              </div>
            )}
          </Form.Item>

          {/* Travel Information */}
          {travelInfo && user?.officeLocation && (
            <Alert
              message="ព័ត៌មានការធ្វើដំណើរ"
              description={
                <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="ចម្ងាយពីការិយាល័យ"
                        value={formatDistance(travelInfo.distance)}
                        prefix={<EnvironmentOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ពី: {user.officeLocation}
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="រយៈពេលដោយរថយន្ត"
                        value={formatDuration(travelInfo.durationByCar)}
                        prefix={<CarOutlined />}
                        valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="រយៈពេលដោយរថយន្តក្រុង"
                        value={formatDuration(travelInfo.durationByBus)}
                        prefix={<DashboardOutlined />}
                        valueStyle={{ fontSize: '16px', color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                </Row>
              }
              type="info"
              showIcon
              icon={<ClockCircleOutlined />}
              style={{ marginTop: 16 }}
            />
          )}

          {/* No office location warning */}
          {!user?.officeLatitude && latitude && longitude && (
            <Alert
              message="ព័ត៌មានការិយាល័យមិនមាន"
              description="អ្នកប្រើប្រាស់នេះមិនមានទីតាំងការិយាល័យ/សាលារៀនដែលបានកំណត់ទេ។ សូមធ្វើបច្ចុប្បន្នភាពទីតាំងនៅក្នុងទំព័រប្រវត្តិរូប។"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {/* Mission Details */}
        <Card title={<Space><FileTextOutlined /> ព័ត៌មានលម្អិតបេសកកម្ម</Space>} style={{ marginBottom: 16 }}>
          <Form.Item
            name="purpose"
            label="គោលបំណង"
          >
            <TextArea 
              rows={3} 
              placeholder="ពិពណ៌នាគោលបំណងនៃបេសកកម្មនេះ..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            name="objectives"
            label="គោលដៅ"
          >
            <TextArea 
              rows={3} 
              placeholder="រាយគោលដៅសំខាន់ៗ..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item
            name="expectedOutcomes"
            label="លទ្ធផលរំពឹងទុក"
          >
            <TextArea 
              rows={3} 
              placeholder="តើអ្វីជាលទ្ធផលរំពឹងទុក?"
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Card>

        {/* Logistics Information */}
        <Card title={<Space><CarOutlined /> ព័ត៌មានអំពីភស្តុភារ</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="budget"
                label="ថវិកា (រៀល)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `៛ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/៛\s?|(,*)/g, '')}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="transportationDetails"
            label="ព័ត៌មានលម្អិតអំពីការធ្វើដំណើរ"
          >
            <TextArea 
              rows={2} 
              placeholder="ពិពណ៌នាការរៀបចំការធ្វើដំណើរ..."
              prefix={<CarOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="accommodationDetails"
            label="ព័ត៌មានលម្អិតអំពីកន្លែងស្នាក់នៅ"
          >
            <TextArea 
              rows={2} 
              placeholder="ពិពណ៌នាការរៀបចំកន្លែងស្នាក់នៅ..."
              prefix={<HomeOutlined />}
            />
          </Form.Item>
        </Card>

        {/* Form Actions */}
        <Card>
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                icon={<SaveOutlined />}
                size="large"
              >
                {isEditing ? 'ធ្វើបច្ចុប្បន្នភាពបេសកកម្ម' : 'បង្កើតបេសកកម្ម'}
              </Button>
              <Button 
                onClick={() => navigate('/missions')}
                size="large"
              >
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default MissionFormPage;