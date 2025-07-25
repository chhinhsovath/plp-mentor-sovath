import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  LessonPhase,
  Indicator,
  IndicatorResponse,
  FormValidationError,
} from '../../types/observation';
import RubricSelector from './RubricSelector';
import CommentField from './CommentField';

interface IndicatorTableProps {
  phase: LessonPhase;
  responses: IndicatorResponse[];
  onResponseChange: (response: IndicatorResponse) => void;
  errors?: FormValidationError[];
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  phase,
  responses,
  onResponseChange,
  errors = [],
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isKhmer = i18n.language === 'km';

  const getResponse = (indicatorId: string): IndicatorResponse | undefined => {
    return responses.find((r) => r.indicatorId === indicatorId);
  };

  const getIndicatorError = (indicatorId: string): string | undefined => {
    const error = errors.find((e) => e.indicatorId === indicatorId);
    return error?.message;
  };

  const handleRubricChange = (indicator: Indicator, rubricId: string, score: number) => {
    const existingResponse = getResponse(indicator.id);
    onResponseChange({
      ...existingResponse,
      indicatorId: indicator.id,
      rubricId,
      score,
    });
  };

  const handleCommentChange = (indicatorId: string, field: 'comments' | 'evidence', value: string) => {
    const existingResponse = getResponse(indicatorId);
    onResponseChange({
      ...existingResponse,
      indicatorId,
      [field]: value,
    });
  };

  // Mobile Card Layout
  if (isMobile) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {phase.name}
        </Typography>
        
        {phase.indicators.map((indicator, index) => {
          const response = getResponse(indicator.id);
          const error = getIndicatorError(indicator.id);
          
          return (
            <Paper key={indicator.id} sx={{ p: 2, mb: 2 }} elevation={2}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {indicator.code}
                </Typography>
                <Typography variant="body2" paragraph>
                  {isKhmer ? indicator.descriptionKh : indicator.description}
                </Typography>
                {isKhmer && indicator.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {indicator.description}
                  </Typography>
                )}
              </Box>

              <RubricSelector
                indicator={indicator}
                selectedRubricId={response?.rubricId}
                selectedScore={response?.score}
                onChange={(rubricId, score) => handleRubricChange(indicator, rubricId, score)}
                error={!!error}
                layout="vertical"
              />

              {error && (
                <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 2 }}>
                <CommentField
                  label={t('observation.indicator.comments')}
                  value={response?.comments || ''}
                  onChange={(value) => handleCommentChange(indicator.id, 'comments', value)}
                  placeholder={t('observation.indicator.commentsPlaceholder')}
                  multiline
                  rows={2}
                />
              </Box>

              <Box sx={{ mt: 1 }}>
                <CommentField
                  label={t('observation.indicator.evidence')}
                  value={response?.evidence || ''}
                  onChange={(value) => handleCommentChange(indicator.id, 'evidence', value)}
                  placeholder={t('observation.indicator.evidencePlaceholder')}
                  multiline
                  rows={2}
                />
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Desktop Table Layout
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {phase.name}
      </Typography>
      
      <TableContainer component={Paper}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell width="5%">{t('observation.indicator.code')}</TableCell>
              <TableCell width="30%">{t('observation.indicator.description')}</TableCell>
              <TableCell width="35%">{t('observation.indicator.rubric')}</TableCell>
              <TableCell width="15%">{t('observation.indicator.comments')}</TableCell>
              <TableCell width="15%">{t('observation.indicator.evidence')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {phase.indicators.map((indicator, index) => {
              const response = getResponse(indicator.id);
              const error = getIndicatorError(indicator.id);
              
              return (
                <TableRow
                  key={indicator.id}
                  sx={{
                    backgroundColor: error ? 'error.lighter' : 'inherit',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {indicator.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {isKhmer ? indicator.descriptionKh : indicator.description}
                    </Typography>
                    {isKhmer && indicator.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {indicator.description}
                      </Typography>
                    )}
                    {error && (
                      <Alert severity="error" sx={{ mt: 1 }} icon={false}>
                        <Typography variant="caption">{error}</Typography>
                      </Alert>
                    )}
                  </TableCell>
                  <TableCell>
                    <RubricSelector
                      indicator={indicator}
                      selectedRubricId={response?.rubricId}
                      selectedScore={response?.score}
                      onChange={(rubricId, score) => handleRubricChange(indicator, rubricId, score)}
                      error={!!error}
                      layout="horizontal"
                    />
                  </TableCell>
                  <TableCell>
                    <CommentField
                      value={response?.comments || ''}
                      onChange={(value) => handleCommentChange(indicator.id, 'comments', value)}
                      placeholder={t('observation.indicator.commentsPlaceholder')}
                      multiline
                      rows={2}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <CommentField
                      value={response?.evidence || ''}
                      onChange={(value) => handleCommentChange(indicator.id, 'evidence', value)}
                      placeholder={t('observation.indicator.evidencePlaceholder')}
                      multiline
                      rows={2}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('observation.indicator.errorsInPhase', { count: errors.length })}
        </Alert>
      )}
    </Box>
  );
};

export default IndicatorTable;