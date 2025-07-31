import React from 'react';
import { Card, PageHeader } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ObservationEntryForm from '../../components/observations/ObservationEntryForm';

const ObservationEntry: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="observation-entry-page">
      <PageHeader
        ghost={false}
        onBack={() => navigate(-1)}
        title="បញ្ចូលទម្រង់វាយតម្លៃ"
        subTitle="ទម្រង់វាយតម្លៃការបង្រៀននិងរៀនជំនាន់ថ្មី ២"
        backIcon={<ArrowLeftOutlined />}
        className="site-page-header"
      />
      
      <div style={{ padding: '24px' }}>
        <ObservationEntryForm />
      </div>
    </div>
  );
};

export default ObservationEntry;