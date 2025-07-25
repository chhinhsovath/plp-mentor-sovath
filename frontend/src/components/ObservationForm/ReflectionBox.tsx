import React from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  EmojiObjects as StrengthsIcon,
  Build as ImprovementIcon,
  TrendingUp as NextStepsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ReflectionBoxProps {
  type: 'strengths' | 'areas_for_improvement' | 'next_steps';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
}

const ReflectionBox: React.FC<ReflectionBoxProps> = ({
  type,
  value,
  onChange,
  error,
  maxLength = 1000,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isKhmer = i18n.language === 'km';

  const getIcon = () => {
    switch (type) {
      case 'strengths':
        return <StrengthsIcon />;
      case 'areas_for_improvement':
        return <ImprovementIcon />;
      case 'next_steps':
        return <NextStepsIcon />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'strengths':
        return theme.palette.success.main;
      case 'areas_for_improvement':
        return theme.palette.warning.main;
      case 'next_steps':
        return theme.palette.info.main;
    }
  };

  const getTitle = () => {
    return t(`observation.reflections.${type}.title`);
  };

  const getDescription = () => {
    return t(`observation.reflections.${type}.description`);
  };

  const getPlaceholder = () => {
    return t(`observation.reflections.${type}.placeholder`);
  };

  const getSamplePrompts = (): string[] => {
    return t(`observation.reflections.${type}.prompts`, { returnObjects: true }) as string[];
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (value) {
      onChange(value + '\n\n' + prompt);
    } else {
      onChange(prompt);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderLeft: 4,
        borderLeftColor: getColor(),
        backgroundColor: error ? 'error.lighter' : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: `${getColor()}20`,
            color: getColor(),
          }}
        >
          {getIcon()}
        </Box>
        <Box flex={1}>
          <Typography variant="h6" color={getColor()}>
            {getTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getDescription()}
          </Typography>
        </Box>
      </Stack>

      <TextField
        fullWidth
        multiline
        rows={isKhmer ? 6 : 5}
        value={value}
        onChange={handleChange}
        placeholder={getPlaceholder()}
        error={!!error}
        helperText={error || `${value.length}/${maxLength}`}
        variant="outlined"
        sx={{
          mb: 2,
          '& .MuiInputBase-input': {
            fontSize: isKhmer ? '1.1rem' : '1rem',
            lineHeight: isKhmer ? 2 : 1.8,
          },
        }}
      />

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {t('observation.reflections.samplePrompts')}:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {getSamplePrompts().map((prompt, index) => (
            <Chip
              key={index}
              label={prompt}
              size="small"
              onClick={() => handlePromptClick(prompt)}
              sx={{
                cursor: 'pointer',
                backgroundColor: `${getColor()}10`,
                color: getColor(),
                '&:hover': {
                  backgroundColor: `${getColor()}20`,
                },
                mb: 1,
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default ReflectionBox;