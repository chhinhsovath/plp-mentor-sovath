import React from 'react';
import { Button, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ObservationEntryForm from '../../components/observations/ObservationEntryForm';

const { Title, Text } = Typography;

const ObservationEntry: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="observation-entry-page">
      <div style={{ 
        padding: '16px 24px', 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '24px'
      }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            type="text"
            style={{ padding: '4px 0' }}
          >
            ត្រឡប់ក្រោយ
          </Button>
          <Title level={3} style={{ margin: 0 }}>បញ្ចូលទម្រង់វាយតម្លៃ</Title>
          <Text type="secondary">ទម្រង់វាយតម្លៃការបង្រៀននិងរៀនជំនាន់ថ្មី ២</Text>
        </Space>
      </div>
      
      <div style={{ padding: '24px' }}>
        <ObservationEntryForm />
      </div>
    </div>
  );
};

export default ObservationEntry;