import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  InputNumber,
  Space,
  Typography,
  Divider,
  Modal,
  Tabs,
  App,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Question, QuestionType, Survey } from '../../types/survey';
import QuestionEditor from './QuestionEditor';
import SortableQuestion from './SortableQuestion';
import SurveySettings from './SurveySettings';
import SurveyPreview from './SurveyPreview';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SurveyBuilderProps {
  survey?: Survey;
  onSave: (survey: Partial<Survey>) => Promise<void>;
  onPublish?: (survey: Partial<Survey>) => Promise<void>;
  onBack?: () => void;
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'អត្ថបទខ្លី' },
  { value: 'textarea', label: 'អត្ថបទវែង' },
  { value: 'number', label: 'លេខ' },
  { value: 'date', label: 'កាលបរិច្ឆេទ' },
  { value: 'time', label: 'ពេលវេលា' },
  { value: 'select', label: 'ជម្រើសទម្លាក់ចុះ' },
  { value: 'radio', label: 'ប៊ូតុងរង្វង់' },
  { value: 'checkbox', label: 'ប្រអប់ធីក' },
  { value: 'file', label: 'បង្ហោះឯកសារ' },
  { value: 'location', label: 'ទីតាំង' },
  { value: 'audio', label: 'ថតសំឡេង' },
  { value: 'video', label: 'ថតវីដេអូ' },
];

const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ survey, onSave, onPublish, onBack }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>(survey?.questions || []);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const reorderedQuestions = arrayMove(items, oldIndex, newIndex);
        // Update order property
        return reorderedQuestions.map((q, index) => ({ ...q, order: index }));
      });
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: uuidv4(),
      type,
      label: `សំណួរ ${type} ថ្មី`,
      description: '',
      placeholder: '',
      required: false,
      order: questions.length,
      options: ['select', 'radio', 'checkbox'].includes(type)
        ? [
            { label: 'ជម្រើសទី១', value: 'option1' },
            { label: 'ជម្រើសទី២', value: 'option2' },
          ]
        : undefined,
    };

    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id!);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    );
  };

  const deleteQuestion = (questionId: string) => {
    Modal.confirm({
      title: 'លុបសំណួរ',
      content: 'តើអ្នកប្រាកដថាចង់លុបសំណួរនេះមែនទេ?',
      onOk() {
        setQuestions(questions.filter((q) => q.id !== questionId));
        if (selectedQuestion === questionId) {
          setSelectedQuestion(null);
        }
      },
    });
  };

  const duplicateQuestion = (questionId: string) => {
    const questionToDuplicate = questions.find((q) => q.id === questionId);
    if (questionToDuplicate) {
      const newQuestion: Question = {
        ...questionToDuplicate,
        id: uuidv4(),
        label: `${questionToDuplicate.label} (ច្បាប់ចម្លង)`,
        order: questions.length,
      };
      setQuestions([...questions, newQuestion]);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const surveyData: Partial<Survey> = {
        title: values.title,
        description: values.description,
        questions: questions.map(({ id, ...q }) => q),
        status: 'draft',
      };

      await onSave(surveyData);
      message.success('បានរក្សាទុកការស្ទង់មតិដោយជោគជ័យ');
    } catch (error) {
      message.error('មិនអាចរក្សាទុកការស្ទង់មតិបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      
      if (questions.length === 0) {
        message.error('សូមបន្ថែមសំណួរយ៉ាងតិចមួយ');
        return;
      }

      setLoading(true);

      const surveyData: Partial<Survey> = {
        title: values.title,
        description: values.description,
        questions: questions.map(({ id, ...q }) => q),
        status: 'published',
      };

      if (onPublish) {
        await onPublish(surveyData);
      } else {
        await onSave(surveyData);
      }
      
      message.success('បានផ្សព្វផ្សាយការស្ទង់មតិដោយជោគជ័យ');
    } catch (error) {
      message.error('មិនអាចផ្សព្វផ្សាយការស្ទង់មតិបានទេ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="survey-builder">
      <Card>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ marginRight: 16 }}
          >
            ត្រឡប់ក្រោយ
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {survey ? 'កែសម្រួលការស្ទង់មតិ' : 'បង្កើតការស្ទង់មតិថ្មី'}
          </Title>
        </div>
      </Card>
      
      <Card style={{ marginTop: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: survey?.title || '',
            description: survey?.description || '',
          }}
        >
          <Form.Item
            name="title"
            label="ចំណងជើងការស្ទង់មតិ"
            rules={[{ required: true, message: 'សូមបញ្ចូលចំណងជើងការស្ទង់មតិ' }]}
          >
            <Input placeholder="បញ្ចូលចំណងជើងការស្ទង់មតិ" size="large" />
          </Form.Item>

          <Form.Item name="description" label="ការពិពណ៌នា">
            <TextArea
              placeholder="បញ្ចូលការពិពណ៌នាការស្ទង់មតិ (ស្រេចចិត្ត)"
              rows={3}
            />
          </Form.Item>
        </Form>

        <Divider />

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: 'សំណួរ',
              children: (
                <>
                  <div className="question-toolbar">
                    <Space wrap>
                      <Text strong>បន្ថែមសំណួរ:</Text>
                      {questionTypes.map((type) => (
                        <Button
                          key={type.value}
                          onClick={() => addQuestion(type.value)}
                          icon={<PlusOutlined />}
                          size="small"
                        >
                          {type.label}
                        </Button>
                      ))}
                    </Space>
                  </div>

                  <div className="questions-container" style={{ marginTop: 24 }}>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={questions.map((q) => q.id!)}
                        strategy={verticalListSortingStrategy}
                      >
                        {questions.map((question) => (
                          <SortableQuestion
                            key={question.id}
                            question={question}
                            isSelected={selectedQuestion === question.id}
                            onClick={() => setSelectedQuestion(question.id!)}
                            onDelete={() => deleteQuestion(question.id!)}
                            onDuplicate={() => duplicateQuestion(question.id!)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {questions.length === 0 && (
                      <Card
                        style={{
                          textAlign: 'center',
                          padding: 40,
                          background: '#fafafa',
                        }}
                      >
                        <Text type="secondary">
                          មិនទាន់មានសំណួរត្រូវបានបន្ថែមនៅឡើយទេ។ ចុចលើប្រភេទសំណួរខាងលើដើម្បីបន្ថែម។
                        </Text>
                      </Card>
                    )}
                  </div>
                </>
              ),
            },
            {
              key: '2',
              label: 'ការកំណត់',
              children: (
                <SurveySettings
                  settings={survey?.settings}
                  onUpdate={(settings) => {
                    // Handle settings update
                  }}
                />
              ),
            },
            {
              key: '3',
              label: 'តក្កវិជ្ជា',
              children: (
                <Card>
                  <Text type="secondary">
                    តក្កវិជ្ជាតាមលក្ខខណ្ឌអនុញ្ញាតឱ្យអ្នកបង្ហាញឬលាក់សំណួរដោយផ្អែកលើចម្លើយមុន។
                    ជ្រើសរើសសំណួរដើម្បីកំណត់រចនាសម្ព័ន្ធតក្កវិជ្ជារបស់វា។
                  </Text>
                </Card>
              ),
            },
          ]}
        />

        <Divider />

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            រក្សាទុកសេចក្តីព្រាង
          </Button>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handlePublish}
            loading={loading}
          >
            ផ្សព្វផ្សាយការស្ទង់មតិ
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setShowPreview(true)}
          >
            មើលជាមុន
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(true)}
          >
            ការកំណត់
          </Button>
        </Space>
      </Card>

      {selectedQuestion && (
        <Modal
          title="កែសម្រួលសំណួរ"
          open={!!selectedQuestion}
          onCancel={() => setSelectedQuestion(null)}
          footer={null}
          width={600}
          destroyOnHidden
        >
          <QuestionEditor
            question={questions.find((q) => q.id === selectedQuestion)!}
            allQuestions={questions}
            onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
            onClose={() => setSelectedQuestion(null)}
          />
        </Modal>
      )}

      <Modal
        title="មើលការស្ទង់មតិជាមុន"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        width={800}
        footer={null}
      >
        {showPreview && (
          <SurveyPreview
            survey={{
              ...survey,
              title: form.getFieldValue('title'),
              description: form.getFieldValue('description'),
              questions,
            } as Survey}
          />
        )}
      </Modal>

      <Modal
        title="ការកំណត់ការស្ទង់មតិ"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        width={600}
        footer={null}
      >
        {showSettings && (
          <SurveySettings
            settings={survey?.settings}
            onUpdate={(settings) => {
              // Handle settings update
              setShowSettings(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default SurveyBuilder;