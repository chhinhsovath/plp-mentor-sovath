import React from 'react';
import { List, Button, Tag, Typography, Space } from 'antd';
import {
  HolderOutlined,
  EditOutlined,
  DeleteOutlined,
  FieldStringOutlined,
  FieldNumberOutlined,
  CheckSquareOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  StarOutlined,
  SliderOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { FormField, FieldType } from '../../types/form';

interface SortableFormFieldProps {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
}

const { Text } = Typography;

const fieldIcons: Record<FieldType, React.ReactElement> = {
  text: <FieldStringOutlined />,
  number: <FieldNumberOutlined />,
  email: <FieldStringOutlined />,
  tel: <FieldStringOutlined />,
  textarea: <FieldStringOutlined />,
  select: <CheckSquareOutlined />,
  multiselect: <CheckSquareOutlined />,
  checkbox: <CheckSquareOutlined />,
  radio: <CheckCircleOutlined />,
  date: <CalendarOutlined />,
  time: <CalendarOutlined />,
  datetime: <CalendarOutlined />,
  file: <PaperClipOutlined />,
  rating: <StarOutlined />,
  scale: <SliderOutlined />,
  section: <FieldStringOutlined />,
  divider: <FieldStringOutlined />,
};

const SortableFormField: React.FC<SortableFormFieldProps> = ({
  field,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Helper to translate values that look like translation keys
  const translateIfKey = (value: string | undefined): string | undefined => {
    if (!value) return value;
    // Check if value looks like a translation key (contains dots)
    if (value.includes('.') && !value.includes(' ')) {
      return t(value);
    }
    return value;
  };

  const label = translateIfKey(field.label) || field.label;

  return (
    <List.Item
      ref={setNodeRef}
      style={style}
      actions={[
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={onEdit}
          size="small"
        />,
        <Button
          key="delete"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onDelete}
          size="small"
        />,
      ]}
    >
      <List.Item.Meta
        avatar={
          <div
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <HolderOutlined style={{ fontSize: '16px' }} />
            {fieldIcons[field.type]}
          </div>
        }
        title={label || t('forms.untitled')}
        description={
          <Space wrap>
            <Tag>{t(`forms.fields.${field.type}`)}</Tag>
            {field.validation?.required && (
              <Tag color="error">{t('forms.required')}</Tag>
            )}
            {field.name && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {field.name}
              </Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );
};

export default SortableFormField;