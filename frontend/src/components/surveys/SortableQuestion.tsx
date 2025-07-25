import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, Space, Tag, Typography } from 'antd';
import {
  DragOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Question } from '../../types/survey';

const { Text } = Typography;

interface SortableQuestionProps {
  question: Question;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const questionTypeLabels: Record<string, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  number: 'Number',
  date: 'Date',
  time: 'Time',
  select: 'Dropdown',
  radio: 'Radio',
  checkbox: 'Checkbox',
  file: 'File Upload',
  location: 'Location',
  audio: 'Audio',
  video: 'Video',
};

const SortableQuestion: React.FC<SortableQuestionProps> = ({
  question,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`question-card ${isSelected ? 'selected' : ''}`}
        style={{
          marginBottom: 16,
          cursor: 'pointer',
          border: isSelected ? '2px solid #1890ff' : undefined,
        }}
        onClick={onClick}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', marginTop: 4 }}
          >
            <DragOutlined style={{ fontSize: 20, color: '#999' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Tag color="blue">{questionTypeLabels[question.type]}</Tag>
                {question.required && <Tag color="red">Required</Tag>}
                {question.parentQuestionId && <Tag color="orange">Conditional</Tag>}
              </Space>
            </div>

            <Text strong style={{ fontSize: 16 }}>
              {question.label}
            </Text>

            {question.description && (
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                {question.description}
              </Text>
            )}

            {question.options && (
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {question.options.slice(0, 3).map((option, index) => (
                    <Tag key={index}>{option.label}</Tag>
                  ))}
                  {question.options.length > 3 && (
                    <Tag>+{question.options.length - 3} more</Tag>
                  )}
                </Space>
              </div>
            )}
          </div>

          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default SortableQuestion;