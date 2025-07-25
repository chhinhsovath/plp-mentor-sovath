import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, message } from 'antd';
import SurveyBuilder from '../../components/surveys/SurveyBuilder';
import surveyService from '../../services/survey.service';
import { Survey } from '../../types/survey';

const SurveyBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchSurvey();
    }
  }, [id]);

  const fetchSurvey = async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);
      const data = await surveyService.getSurveyById(id);
      setSurvey(data);
    } catch (error) {
      message.error('Failed to load survey');
      navigate('/admin/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (surveyData: Partial<Survey>) => {
    try {
      if (id && id !== 'new') {
        // Update existing survey
        await surveyService.updateSurvey(id, surveyData);
        message.success('Survey updated successfully');
      } else {
        // Create new survey
        const newSurvey = await surveyService.createSurvey(surveyData as any);
        message.success('Survey created successfully');
        navigate(`/admin/surveys/${newSurvey.id}/edit`);
      }
    } catch (error) {
      message.error('Failed to save survey');
      throw error;
    }
  };

  const handlePublish = async (surveyData: Partial<Survey>) => {
    try {
      if (id && id !== 'new') {
        // Update and publish existing survey
        await surveyService.updateSurvey(id, { ...surveyData, status: 'published' });
        message.success('Survey published successfully');
        navigate('/admin/surveys');
      } else {
        // Create and publish new survey
        const newSurvey = await surveyService.createSurvey({
          ...surveyData,
          status: 'published',
        } as any);
        message.success('Survey created and published successfully');
        navigate('/admin/surveys');
      }
    } catch (error) {
      message.error('Failed to publish survey');
      throw error;
    }
  };

  const handleBack = () => {
    navigate('/admin/surveys');
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <div className="survey-builder-page">
      <SurveyBuilder
        survey={survey}
        onSave={handleSave}
        onPublish={handlePublish}
        onBack={handleBack}
      />
    </div>
  );
};

export default SurveyBuilderPage;