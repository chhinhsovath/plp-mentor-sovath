import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Divider,
  Upload,
  message,
  Tag,
  Alert,
  List,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  FileTextOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SafetyOutlined,
  BulbOutlined,
  TrophyOutlined,
  WarningOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Mission, MissionType, CreateMissionReportInput } from '../types/mission';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface MissionReportFormProps {
  mission: Mission;
  onSubmit: (values: CreateMissionReportInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MissionReportForm: React.FC<MissionReportFormProps> = ({
  mission,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const getMissionTypeInKhmer = (type: MissionType): string => {
    const typeMap: Record<MissionType, string> = {
      [MissionType.FIELD_TRIP]: 'ទស្សនកិច្ច',
      [MissionType.TRAINING]: 'វគ្គបណ្តុះបណ្តាល',
      [MissionType.MEETING]: 'កិច្ចប្រជុំ',
      [MissionType.MONITORING]: 'ការត្រួតពិនិត្យ',
      [MissionType.OTHER]: 'ផ្សេងៗ',
    };
    return typeMap[type] || type;
  };

  const handleFinish = async (values: any) => {
    const reportData: CreateMissionReportInput = {
      missionId: mission.id,
      summary: values.summary,
      achievements: values.achievements || [],
      challenges: values.challenges || [],
      recommendations: values.recommendations || [],
      ...values,
    };

    await onSubmit(reportData);
  };

  const renderCommonFields = () => (
    <>
      <Card title={<Space><FileTextOutlined /> សេចក្តីសង្ខេប</Space>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="summary"
          label="សេចក្តីសង្ខេបរបាយការណ៍"
          rules={[{ required: true, message: 'សូមបញ្ចូលសេចក្តីសង្ខេប' }]}
        >
          <TextArea
            rows={4}
            placeholder="សរសេរសេចក្តីសង្ខេបអំពីបេសកកម្ម..."
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Card>

      <Card title={<Space><TrophyOutlined /> សមិទ្ធផល និងបញ្ហាប្រឈម</Space>} style={{ marginBottom: 16 }}>
        <Form.List name="achievements">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 16 }}>
                <Text strong>សមិទ្ធផលសំខាន់ៗ</Text>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 8 }}
                  size="small"
                >
                  បន្ថែមសមិទ្ធផល
                </Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[{ required: true, message: 'សូមបញ្ចូលសមិទ្ធផល' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="សមិទ្ធផលទី..." />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
            </>
          )}
        </Form.List>

        <Divider />

        <Form.List name="challenges">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 16 }}>
                <Text strong>បញ្ហាប្រឈម</Text>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 8 }}
                  size="small"
                >
                  បន្ថែមបញ្ហាប្រឈម
                </Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[{ required: true, message: 'សូមបញ្ចូលបញ្ហាប្រឈម' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="បញ្ហាប្រឈមទី..." />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
            </>
          )}
        </Form.List>

        <Divider />

        <Form.List name="recommendations">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 16 }}>
                <Text strong>អនុសាសន៍</Text>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 8 }}
                  size="small"
                >
                  បន្ថែមអនុសាសន៍
                </Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[{ required: true, message: 'សូមបញ្ចូលអនុសាសន៍' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="អនុសាសន៍ទី..." />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
            </>
          )}
        </Form.List>
      </Card>
    </>
  );

  const renderFieldTripFields = () => (
    <Card title={<Space><EnvironmentOutlined /> ព័ត៌មានទស្សនកិច្ច</Space>} style={{ marginBottom: 16 }}>
      <Form.List name="placesVisited">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>ទីតាំងដែលបានទៅទស្សនា</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមទីតាំង
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលទីតាំង' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="ឈ្មោះទីតាំង..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.Item
        name="peopleMetCount"
        label="ចំនួនមនុស្សដែលបានជួប"
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          placeholder="0"
        />
      </Form.Item>

      <Form.List name="keyFindings">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>របកគំហើញសំខាន់ៗ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមរបកគំហើញ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលរបកគំហើញ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <TextArea rows={2} placeholder="របកគំហើញ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>
    </Card>
  );

  const renderTrainingFields = () => (
    <Card title={<Space><TeamOutlined /> ព័ត៌មានវគ្គបណ្តុះបណ្តាល</Space>} style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="participantsCount"
            label="ចំនួនអ្នកចូលរួម"
            rules={[{ required: true, message: 'សូមបញ្ចូលចំនួនអ្នកចូលរួម' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.List name="topicsCovered">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>ប្រធានបទដែលបានបង្រៀន</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមប្រធានបទ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលប្រធានបទ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="ប្រធានបទ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.List name="skillsAcquired">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>ជំនាញដែលទទួលបាន</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមជំនាញ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលជំនាញ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="ជំនាញ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.Item
        name="participantFeedback"
        label="មតិយោបល់របស់អ្នកចូលរួម"
      >
        <TextArea
          rows={3}
          placeholder="សង្ខេបមតិយោបល់របស់អ្នកចូលរួម..."
          showCount
          maxLength={500}
        />
      </Form.Item>
    </Card>
  );

  const renderMeetingFields = () => (
    <Card title={<Space><TeamOutlined /> ព័ត៌មានកិច្ចប្រជុំ</Space>} style={{ marginBottom: 16 }}>
      <Form.Item
        name="attendeesCount"
        label="ចំនួនអ្នកចូលរួម"
        rules={[{ required: true, message: 'សូមបញ្ចូលចំនួនអ្នកចូលរួម' }]}
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          placeholder="0"
        />
      </Form.Item>

      <Form.List name="agendaItems">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>របៀបវារៈកិច្ចប្រជុំ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមរបៀបវារៈ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលរបៀបវារៈ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="របៀបវារៈទី..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.List name="decisions">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>សេចក្តីសម្រេចចិត្ត</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមសេចក្តីសម្រេច
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលសេចក្តីសម្រេច' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <TextArea rows={2} placeholder="សេចក្តីសម្រេចចិត្ត..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.List name="actionItems">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>សកម្មភាពត្រូវអនុវត្ត</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមសកម្មភាព
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'task']}
                    label="ភារកិច្ច"
                    rules={[{ required: true, message: 'សូមបញ្ចូលភារកិច្ច' }]}
                  >
                    <Input placeholder="ភារកិច្ចត្រូវធ្វើ..." />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'responsible']}
                        label="អ្នកទទួលខុសត្រូវ"
                        rules={[{ required: true, message: 'សូមបញ្ចូលអ្នកទទួលខុសត្រូវ' }]}
                      >
                        <Input placeholder="ឈ្មោះអ្នកទទួលខុសត្រូវ..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'deadline']}
                        label="ថ្ងៃកំណត់"
                        rules={[{ required: true, message: 'សូមជ្រើសរើសថ្ងៃកំណត់' }]}
                      >
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    type="text"
                    danger
                    onClick={() => remove(name)}
                    icon={<MinusCircleOutlined />}
                  >
                    លុប
                  </Button>
                </Space>
              </Card>
            ))}
          </>
        )}
      </Form.List>
    </Card>
  );

  const renderMonitoringFields = () => (
    <Card title={<Space><SafetyOutlined /> ព័ត៌មានការត្រួតពិនិត្យ</Space>} style={{ marginBottom: 16 }}>
      <Form.List name="sitesMonitored">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>ទីតាំងដែលបានត្រួតពិនិត្យ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមទីតាំង
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលទីតាំង' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="ឈ្មោះទីតាំង..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.Item
        name="complianceStatus"
        label="ស្ថានភាពអនុលោមភាព"
        rules={[{ required: true, message: 'សូមជ្រើសរើសស្ថានភាព' }]}
      >
        <Select placeholder="ជ្រើសរើសស្ថានភាព">
          <Option value="compliant">អនុលោមពេញលេញ</Option>
          <Option value="partially_compliant">អនុលោមផ្នែកខ្លះ</Option>
          <Option value="non_compliant">មិនអនុលោម</Option>
        </Select>
      </Form.Item>

      <Form.List name="issuesIdentified">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>បញ្ហាដែលរកឃើញ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមបញ្ហា
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលបញ្ហា' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <TextArea rows={2} placeholder="បញ្ហាដែលរកឃើញ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.List name="correctiveActions">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>វិធានការកែតម្រូវ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមវិធានការ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលវិធានការ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <TextArea rows={2} placeholder="វិធានការកែតម្រូវ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>
    </Card>
  );

  const renderImpactMetrics = () => (
    <Card title={<Space><RocketOutlined /> ការវាយតម្លៃផលប៉ះពាល់</Space>} style={{ marginBottom: 16 }}>
      <Form.Item
        name={['impactMetrics', 'peopleImpacted']}
        label="ចំនួនមនុស្សដែលទទួលផលប្រយោជន៍"
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          placeholder="0"
        />
      </Form.Item>

      <Form.List name={['impactMetrics', 'areasImproved']}>
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>វិស័យដែលមានការកែលម្អ</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមវិស័យ
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name]}
                  rules={[{ required: true, message: 'សូមបញ្ចូលវិស័យ' }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="វិស័យដែលមានការកែលម្អ..." />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.List name={['impactMetrics', 'quantifiableResults']}>
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>លទ្ធផលដែលអាចវាស់វែងបាន</Text>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginLeft: 8 }}
                size="small"
              >
                បន្ថែមលទ្ធផល
              </Button>
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'metric']}
                    label="អ្វីដែលវាស់វែង"
                    rules={[{ required: true, message: 'សូមបញ្ចូលអ្វីដែលវាស់វែង' }]}
                  >
                    <Input placeholder="ឧ. ចំនួនសិស្សដែលបានបណ្តុះបណ្តាល" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        label="តម្លៃ"
                        rules={[{ required: true, message: 'សូមបញ្ចូលតម្លៃ' }]}
                      >
                        <InputNumber style={{ width: '100%' }} placeholder="0" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit']}
                        label="ឯកតា"
                        rules={[{ required: true, message: 'សូមបញ្ចូលឯកតា' }]}
                      >
                        <Input placeholder="ឧ. នាក់, គ្រួសារ, %" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    type="text"
                    danger
                    onClick={() => remove(name)}
                    icon={<MinusCircleOutlined />}
                  >
                    លុប
                  </Button>
                </Space>
              </Card>
            ))}
          </>
        )}
      </Form.List>
    </Card>
  );

  const renderTypeSpecificFields = () => {
    switch (mission.type) {
      case MissionType.FIELD_TRIP:
        return renderFieldTripFields();
      case MissionType.TRAINING:
        return renderTrainingFields();
      case MissionType.MEETING:
        return renderMeetingFields();
      case MissionType.MONITORING:
        return renderMonitoringFields();
      default:
        return null;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        achievements: [],
        challenges: [],
        recommendations: [],
      }}
    >
      <Alert
        message={`របាយការណ៍បេសកកម្ម - ${getMissionTypeInKhmer(mission.type)}`}
        description={`សូមបំពេញរបាយការណ៍លម្អិតសម្រាប់បេសកកម្ម: ${mission.title}`}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {renderCommonFields()}
      {renderTypeSpecificFields()}
      {renderImpactMetrics()}

      <Card>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<FileTextOutlined />}
            >
              ដាក់ស្នើរបាយការណ៍
            </Button>
            <Button onClick={onCancel} size="large">
              បោះបង់
            </Button>
          </Space>
        </Form.Item>
      </Card>
    </Form>
  );
};

export default MissionReportForm;