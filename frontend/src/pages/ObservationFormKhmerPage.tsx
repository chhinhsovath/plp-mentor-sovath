import React from 'react';
import { Typography } from 'antd';
import ObservationFormKhmer from '../components/ObservationFormKhmer';

const { Title } = Typography;

const ObservationFormKhmerPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <ObservationFormKhmer />
    </div>
  );
};

export default ObservationFormKhmerPage;