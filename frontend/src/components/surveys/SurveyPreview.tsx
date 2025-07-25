import React from 'react';
import { Typography, Space, Alert } from 'antd';
import { Survey } from '../../types/survey';
import SurveyForm from './SurveyForm';

const { Title, Text } = Typography;

interface SurveyPreviewProps {
  survey: Survey;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({ survey }) => {
  return (
    <div className="survey-preview">
      <Alert
        message="របៀបមើលជាមុន"
        description="នេះគឺជាការមើលជាមុន។ ចម្លើយតបនឹងមិនត្រូវបានរក្សាទុកទេ។"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>{survey.title}</Title>
          {survey.description && (
            <Text type="secondary">{survey.description}</Text>
          )}
        </div>

        <SurveyForm
          survey={survey}
          onSubmit={async (data) => {
            console.log('Preview submission:', data);
            return { uuid: 'preview' } as any;
          }}
          isPreview={true}
        />
      </Space>
    </div>
  );
};

export default SurveyPreview;