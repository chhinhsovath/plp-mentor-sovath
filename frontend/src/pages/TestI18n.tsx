import { useTranslation } from 'react-i18next';
import { Card, Typography, Space, Button } from 'antd';
import i18n from '../i18n/i18n';

const { Title, Text } = Typography;

export default function TestI18n() {
  const { t } = useTranslation();
  
  const testKeys = [
    'observations.formSelection',
    'observations.basicInfo',
    'observations.school',
    'observations.dateTime',
    'observations.studentInfo',
    'observations.reflection'
  ];

  return (
    <Card title="i18n Test Page" style={{ margin: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Current Language: {i18n.language}</Title>
          <Text>Resources loaded: {Object.keys(i18n.options.resources || {}).join(', ')}</Text>
        </div>
        
        <div>
          <Title level={4}>Translation Keys Test:</Title>
          {testKeys.map(key => (
            <div key={key} style={{ marginBottom: 8 }}>
              <Text strong>{key}: </Text>
              <Text>{t(key)}</Text>
            </div>
          ))}
        </div>
        
        <Button onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </Space>
    </Card>
  );
}