import React from 'react';
import { Form, Switch, InputNumber, DatePicker, Space, Typography, Card } from 'antd';
import dayjs from 'dayjs';
import { Survey } from '../../types/survey';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface SurveySettingsProps {
  settings?: Survey['settings'];
  onUpdate: (settings: Survey['settings']) => void;
}

const SurveySettings: React.FC<SurveySettingsProps> = ({ settings, onUpdate }) => {
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues: any, allValues: any) => {
    // Convert date range if present
    if (changedValues.dateRange) {
      const [startDate, endDate] = changedValues.dateRange;
      onUpdate({
        ...settings,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
    } else {
      onUpdate({
        ...settings,
        ...changedValues,
      });
    }
  };

  const initialValues = {
    ...settings,
    dateRange: settings?.startDate && settings?.endDate
      ? [dayjs(settings.startDate), dayjs(settings.endDate)]
      : undefined,
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="ការគ្រប់គ្រងការចូលប្រើ">
          <Form.Item
            name="allowAnonymous"
            label="អនុញ្ញាតការឆ្លើយតបដោយអនាមិក"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="requireAuth"
            label="តម្រូវការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="allowMultipleSubmissions"
            label="អនុញ្ញាតការបញ្ជូនច្រើនដង"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card title="ជម្រើសការបង្ហាញ">
          <Form.Item
            name="showProgressBar"
            label="បង្ហាញរបារដំណើរការ"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="shuffleQuestions"
            label="លាយតាមលំដាប់សំណួរ"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card title="កម្រិតពេលវេលា">
          <Form.Item
            name="timeLimit"
            label="ពេលវេលាកំណត់ (នាទី)"
            help="ទុកទទេសម្រាប់គ្មានការកំណត់ពេល"
          >
            <InputNumber
              min={1}
              max={180}
              placeholder="គ្មានកម្រិត"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="រយៈពេលសកម្ម"
            help="ការស្ទង់មតិនឹងទទួលយកចម្លើយតែក្នុងរយៈពេលនេះប៉ុណ្ណោះ"
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </Space>
    </Form>
  );
};

export default SurveySettings;