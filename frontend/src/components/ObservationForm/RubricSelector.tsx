import React, { useEffect } from 'react';
import {
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
  Typography,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Indicator, Rubric } from '../../types/observation';
import { isTouchDevice, provideTouchFeedback } from '../../utils/deviceDetection';

interface RubricSelectorProps {
  indicator: Indicator;
  selectedRubricId?: string;
  selectedScore?: number;
  onChange: (rubricId: string, score: number) => void;
  error?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const RubricSelector: React.FC<RubricSelectorProps> = ({
  indicator,
  selectedRubricId,
  selectedScore,
  onChange,
  error = false,
  layout = 'horizontal',
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isKhmer = i18n.language === 'km';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTouch = isTouchDevice();
  
  // Force vertical layout on mobile devices
  const effectiveLayout = isMobile ? 'vertical' : layout;

  // Sort rubrics by level value (highest to lowest)
  const sortedRubrics = [...indicator.rubrics].sort((a, b) => b.levelValue - a.levelValue);

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'excellent':
        return theme.palette.success.main;
      case 'good':
        return theme.palette.info.main;
      case 'satisfactory':
        return theme.palette.warning.main;
      case 'needs_improvement':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getLevelLabel = (level: string): string => {
    return t(`observation.rubric.levels.${level}`);
  };

  const handleChange = (rubric: Rubric) => {
    // Provide haptic feedback on touch devices
    if (isTouch) {
      provideTouchFeedback();
    }
    onChange(rubric.id, rubric.levelValue);
  };

  // For indicators with binary (yes/no) options
  if (indicator.rubrics.length === 2) {
    return (
      <ToggleButtonGroup
        value={selectedRubricId}
        exclusive
        onChange={(_, value) => {
          if (value) {
            const rubric = indicator.rubrics.find((r) => r.id === value);
            if (rubric) {
              handleChange(rubric);
            }
          }
        }}
        size={isMobile ? "medium" : "small"}
        fullWidth={effectiveLayout === 'vertical'}
        sx={{
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            borderColor: error ? 'error.main' : undefined,
            // Enhanced touch targets for mobile
            height: isMobile ? 56 : 'auto',
            padding: isMobile ? '12px 16px' : '6px 12px',
            fontSize: isMobile ? '1rem' : 'inherit',
          },
        }}
      >
        {sortedRubrics.map((rubric) => (
          <ToggleButton
            key={rubric.id}
            value={rubric.id}
            sx={{
              '&.Mui-selected': {
                backgroundColor: getLevelColor(rubric.level),
                color: 'white',
                '&:hover': {
                  backgroundColor: getLevelColor(rubric.level),
                },
              },
              // Add ripple effect for touch feedback
              '&:active': {
                transform: isTouch ? 'scale(0.98)' : 'none',
                transition: 'transform 0.1s',
              },
            }}
          >
            {isKhmer ? rubric.descriptionKh : rubric.description}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  // For indicators with scale options (4 levels)
  if (effectiveLayout === 'horizontal') {
    return (
      <FormControl component="fieldset" error={error} fullWidth>
        <RadioGroup
          value={selectedRubricId || ''}
          onChange={(e) => {
            const rubric = indicator.rubrics.find((r) => r.id === e.target.value);
            if (rubric) {
              handleChange(rubric);
            }
          }}
          row
        >
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {sortedRubrics.map((rubric) => (
              <Box
                key={rubric.id}
                sx={{
                  border: 1,
                  borderColor: selectedRubricId === rubric.id ? getLevelColor(rubric.level) : 'divider',
                  borderRadius: 1,
                  p: isTablet ? 1.5 : 1,
                  backgroundColor: selectedRubricId === rubric.id ? `${getLevelColor(rubric.level)}10` : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: getLevelColor(rubric.level),
                    backgroundColor: `${getLevelColor(rubric.level)}05`,
                  },
                  // Add ripple effect for touch feedback
                  '&:active': {
                    transform: isTouch ? 'scale(0.98)' : 'none',
                    transition: 'transform 0.1s',
                  },
                }}
              >
                <FormControlLabel
                  value={rubric.id}
                  control={
                    <Radio 
                      size={isTablet ? "medium" : "small"} 
                      sx={{ 
                        p: isTablet ? 1 : 0.5,
                      }} 
                    />
                  }
                  label={
                    <Box>
                      <Chip
                        label={`${rubric.levelValue} - ${getLevelLabel(rubric.level)}`}
                        size={isTablet ? "medium" : "small"}
                        sx={{
                          backgroundColor: getLevelColor(rubric.level),
                          color: 'white',
                          mb: 0.5,
                          height: isTablet ? 28 : 24,
                          '& .MuiChip-label': {
                            px: isTablet ? 2 : 1,
                            fontSize: isTablet ? '0.875rem' : '0.75rem',
                          },
                        }}
                      />
                      <Typography variant={isTablet ? "body2" : "caption"} display="block">
                        {isKhmer ? rubric.descriptionKh : rubric.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            ))}
          </Stack>
        </RadioGroup>
      </FormControl>
    );
  }

  // Vertical layout for mobile
  return (
    <FormControl component="fieldset" error={error} fullWidth>
      <RadioGroup
        value={selectedRubricId || ''}
        onChange={(e) => {
          const rubric = indicator.rubrics.find((r) => r.id === e.target.value);
          if (rubric) {
            handleChange(rubric);
          }
        }}
      >
        <Stack spacing={1.5}>
          {sortedRubrics.map((rubric) => (
            <Box
              key={rubric.id}
              sx={{
                border: 1,
                borderColor: selectedRubricId === rubric.id ? getLevelColor(rubric.level) : 'divider',
                borderRadius: 2,
                p: isMobile ? 2 : 1.5,
                backgroundColor: selectedRubricId === rubric.id ? `${getLevelColor(rubric.level)}10` : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: getLevelColor(rubric.level),
                  backgroundColor: `${getLevelColor(rubric.level)}05`,
                },
                // Add ripple effect for touch feedback
                '&:active': {
                  transform: isTouch ? 'scale(0.98)' : 'none',
                  transition: 'transform 0.1s',
                },
                // Add shadow for selected item on mobile
                boxShadow: isMobile && selectedRubricId === rubric.id ? 
                  `0 2px 8px ${getLevelColor(rubric.level)}40` : 'none',
              }}
              onClick={() => {
                // Make the entire box clickable for better touch targets
                if (isMobile) {
                  handleChange(rubric);
                }
              }}
            >
              <FormControlLabel
                value={rubric.id}
                control={
                  <Radio 
                    sx={{ 
                      p: isMobile ? 1.5 : 1,
                      // Make radio button more prominent on mobile
                      '& .MuiSvgIcon-root': {
                        fontSize: isMobile ? 24 : 20,
                      },
                    }} 
                  />
                }
                label={
                  <Box sx={{ width: '100%' }}>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1} 
                      sx={{ mb: isMobile ? 1 : 0.5 }}
                    >
                      <Chip
                        label={rubric.levelValue}
                        size={isMobile ? "medium" : "small"}
                        sx={{
                          backgroundColor: getLevelColor(rubric.level),
                          color: 'white',
                          fontWeight: 'bold',
                          height: isMobile ? 32 : 24,
                          width: isMobile ? 32 : 24,
                          '& .MuiChip-label': {
                            px: 0,
                            fontSize: isMobile ? '1rem' : '0.75rem',
                          },
                        }}
                      />
                      <Typography 
                        variant={isMobile ? "subtitle1" : "subtitle2"} 
                        color={getLevelColor(rubric.level)}
                        fontWeight={isMobile ? 500 : 400}
                      >
                        {getLevelLabel(rubric.level)}
                      </Typography>
                    </Stack>
                    <Typography 
                      variant={isMobile ? "body1" : "body2"}
                      sx={{ 
                        ml: isMobile ? 1 : 0,
                        mt: isMobile ? 0.5 : 0
                      }}
                    >
                      {isKhmer ? rubric.descriptionKh : rubric.description}
                    </Typography>
                    {isKhmer && rubric.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: isMobile ? 1 : 0.5,
                          ml: isMobile ? 1 : 0,
                          display: 'block'
                        }}
                      >
                        {rubric.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ 
                  m: 0, 
                  alignItems: 'flex-start',
                  width: '100%',
                  // Improve touch target size
                  '& .MuiFormControlLabel-label': {
                    width: '100%',
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
};

export default RubricSelector;

export default RubricSelector;