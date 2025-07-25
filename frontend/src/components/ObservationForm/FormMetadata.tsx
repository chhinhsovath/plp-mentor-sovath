import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Box,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useTranslation } from 'react-i18next';
import { ObservationFormData } from '../../types/observation';
import { useQuery } from '@tanstack/react-query';
import { FormikErrors, FormikTouched } from 'formik';

interface FormMetadataProps {
  values: ObservationFormData;
  errors: FormikErrors<ObservationFormData>;
  touched: FormikTouched<ObservationFormData>;
  onChange: (e: React.ChangeEvent<any>) => void;
  onBlur: (e: React.FocusEvent<any>) => void;
  setFieldValue: (field: string, value: any) => void;
}

interface Teacher {
  id: string;
  fullName: string;
  school: {
    id: string;
    name: string;
  };
}

interface School {
  id: string;
  name: string;
  code: string;
}

const FormMetadata: React.FC<FormMetadataProps> = ({
  values,
  errors,
  touched,
  onChange,
  onBlur,
  setFieldValue,
}) => {
  const { t } = useTranslation();

  // Mock data - replace with actual API calls
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { id: '1', fullName: 'សុខ សុភា', school: { id: '1', name: 'សាលាបឋមសិក្សា ភូមិថ្មី' } },
        { id: '2', fullName: 'ចាន់ សុផល', school: { id: '1', name: 'សាលាបឋមសិក្សា ភូមិថ្មី' } },
        { id: '3', fullName: 'លី សុខា', school: { id: '2', name: 'សាលាបឋមសិក្សា ព្រែកតាសេក' } },
      ];
    },
  });

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { id: '1', name: 'សាលាបឋមសិក្សា ភូមិថ្មី', code: 'PS001' },
        { id: '2', name: 'សាលាបឋមសិក្សា ព្រែកតាសេក', code: 'PS002' },
        { id: '3', name: 'សាលាបឋមសិក្សា កំពង់ស្វាយ', code: 'PS003' },
      ];
    },
  });

  const handleTeacherChange = (teacherId: string) => {
    setFieldValue('teacherId', teacherId);
    
    // Auto-populate school when teacher is selected
    const selectedTeacher = teachers.find((t) => t.id === teacherId);
    if (selectedTeacher) {
      setFieldValue('schoolId', selectedTeacher.school.id);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFieldValue('observationDate', date.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime') => (time: Date | null) => {
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      setFieldValue(field, `${hours}:${minutes}`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('observation.metadata.title')}
        </Typography>
        
        <Grid container spacing={3}>
          {/* Teacher Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={touched.teacherId && !!errors.teacherId}>
              <InputLabel>{t('observation.metadata.teacher')}</InputLabel>
              <Select
                name="teacherId"
                value={values.teacherId}
                onChange={(e) => handleTeacherChange(e.target.value)}
                onBlur={onBlur}
                label={t('observation.metadata.teacher')}
              >
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </MenuItem>
                ))}
              </Select>
              {touched.teacherId && errors.teacherId && (
                <FormHelperText>{errors.teacherId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* School Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={touched.schoolId && !!errors.schoolId}>
              <InputLabel>{t('observation.metadata.school')}</InputLabel>
              <Select
                name="schoolId"
                value={values.schoolId}
                onChange={onChange}
                onBlur={onBlur}
                label={t('observation.metadata.school')}
              >
                {schools.map((school) => (
                  <MenuItem key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </MenuItem>
                ))}
              </Select>
              {touched.schoolId && errors.schoolId && (
                <FormHelperText>{errors.schoolId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Grade Level */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              name="gradeLevel"
              label={t('observation.metadata.gradeLevel')}
              value={values.gradeLevel}
              onChange={onChange}
              onBlur={onBlur}
              disabled
              variant="filled"
            />
          </Grid>

          {/* Subject */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              name="subject"
              label={t('observation.metadata.subject')}
              value={values.subject}
              onChange={onChange}
              onBlur={onBlur}
              disabled
              variant="filled"
            />
          </Grid>

          {/* Observation Date */}
          <Grid item xs={12} md={4}>
            <DatePicker
              label={t('observation.metadata.observationDate')}
              value={values.observationDate ? new Date(values.observationDate) : null}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: touched.observationDate && !!errors.observationDate,
                  helperText: touched.observationDate && errors.observationDate,
                },
              }}
            />
          </Grid>

          {/* Start Time */}
          <Grid item xs={12} md={3}>
            <TimePicker
              label={t('observation.metadata.startTime')}
              value={values.startTime ? new Date(`2000-01-01T${values.startTime}`) : null}
              onChange={handleTimeChange('startTime')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: touched.startTime && !!errors.startTime,
                  helperText: touched.startTime && errors.startTime,
                },
              }}
            />
          </Grid>

          {/* End Time */}
          <Grid item xs={12} md={3}>
            <TimePicker
              label={t('observation.metadata.endTime')}
              value={values.endTime ? new Date(`2000-01-01T${values.endTime}`) : null}
              onChange={handleTimeChange('endTime')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: touched.endTime && !!errors.endTime,
                  helperText: touched.endTime && errors.endTime,
                },
              }}
            />
          </Grid>

          {/* Number of Students */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              name="numberOfStudents"
              label={t('observation.metadata.numberOfStudents')}
              value={values.numberOfStudents}
              onChange={onChange}
              onBlur={onBlur}
              error={touched.numberOfStudents && !!errors.numberOfStudents}
              helperText={touched.numberOfStudents && errors.numberOfStudents}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Number of Female Students */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              name="numberOfFemaleStudents"
              label={t('observation.metadata.numberOfFemaleStudents')}
              value={values.numberOfFemaleStudents}
              onChange={onChange}
              onBlur={onBlur}
              error={touched.numberOfFemaleStudents && !!errors.numberOfFemaleStudents}
              helperText={touched.numberOfFemaleStudents && errors.numberOfFemaleStudents}
              inputProps={{ min: 0, max: values.numberOfStudents }}
            />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default FormMetadata;