import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Space, Button, Result } from 'antd';
import { CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import SurveyForm from '../../components/surveys/SurveyForm';
import surveyService from '../../services/survey.service';
import { Survey, SurveyResponse } from '../../types/survey';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const PublicSurveyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseUuid, setResponseUuid] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSurvey();
    }
  }, [slug]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const data = await surveyService.getSurveyBySlug(slug!);
      setSurvey(data);
      
      // Check if authentication is required
      if (data.settings?.requireAuth && !user) {
        setError('This survey requires authentication. Please log in to continue.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { answers: any[]; metadata?: any }) => {
    try {
      const response = await surveyService.submitResponse(survey!.id, data);
      setResponseUuid(response.uuid);
      setSubmitted(true);
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  const handleSaveDraft = async (data: { answers: any[]; metadata?: any }) => {
    try {
      const response = await surveyService.saveDraftResponse(survey!.id, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <Alert
          message="Survey Not Available"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/')}>
              Go Home
            </Button>
          }
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <Result
          status="success"
          title="Thank You!"
          subTitle="Your response has been submitted successfully."
          extra={[
            <Button key="home" onClick={() => navigate('/')} icon={<HomeOutlined />}>
              Go Home
            </Button>,
            responseUuid && (
              <Text key="uuid" type="secondary">
                Response ID: {responseUuid}
              </Text>
            ),
          ]}
        />
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>{survey.title}</Title>
            {survey.description && (
              <Text type="secondary">{survey.description}</Text>
            )}
          </div>

          <SurveyForm
            survey={survey}
            onSubmit={handleSubmit}
            onSaveDraft={survey.settings?.allowAnonymous || user ? handleSaveDraft : undefined}
          />
        </Space>
      </Card>
    </div>
  );
};

export default PublicSurveyPage;