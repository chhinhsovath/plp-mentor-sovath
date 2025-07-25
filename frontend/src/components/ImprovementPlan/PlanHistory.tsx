import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Stack,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  LinearProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Tab,
  Tabs,
} from '@mui/material';
import {
  History as HistoryIcon,
  CompareArrows as CompareIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as ActiveIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as DateIcon,
  TrendingUp as ProgressIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as ModifiedIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import {
  ImprovementPlan,
  ImprovementGoal,
  FollowUpActivity,
  PlanComparison,
} from '../../types/improvement';

interface PlanHistoryProps {
  plans: ImprovementPlan[];
  currentPlanId?: string;
  onPlanView: (planId: string) => void;
  onPlanCopy: (planId: string) => void;
  onPlanDelete: (planId: string) => void;
  onPlanArchive: (planId: string) => void;
  onPlanCompare: (planId1: string, planId2: string) => void;
  readOnly?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PlanHistory: React.FC<PlanHistoryProps> = ({
  plans,
  currentPlanId,
  onPlanView,
  onPlanCopy,
  onPlanDelete,
  onPlanArchive,
  onPlanCompare,
  readOnly = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState({
    status: 'all',
    teacher: 'all',
    school: 'all',
    dateRange: 'all',
  });
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<PlanComparison | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'cancelled':
        return <CancelIcon color="error" />;
      case 'active':
      case 'in_progress':
        return <ActiveIcon color="primary" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'active':
      case 'in_progress':
        return 'primary';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string): any => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const calculatePlanProgress = (plan: ImprovementPlan): number => {
    const totalGoals = plan.goals.length;
    const completedGoals = plan.goals.filter(g => g.status === 'achieved').length;
    const totalActivities = plan.activities.length;
    const completedActivities = plan.activities.filter(a => a.status === 'completed').length;

    if (totalGoals === 0 && totalActivities === 0) return 0;

    const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 50 : 0;
    const activityProgress = totalActivities > 0 ? (completedActivities / totalActivities) * 50 : 0;

    return Math.round(goalProgress + activityProgress);
  };

  const filterPlans = (): ImprovementPlan[] => {
    let filtered = [...plans];

    // Status filter
    if (filter.status !== 'all') {
      filtered = filtered.filter(p => p.status === filter.status);
    }

    // Teacher filter
    if (filter.teacher !== 'all') {
      filtered = filtered.filter(p => p.teacherId === filter.teacher);
    }

    // School filter
    if (filter.school !== 'all') {
      filtered = filtered.filter(p => p.schoolId === filter.school);
    }

    // Date range filter
    if (filter.dateRange !== 'all') {
      const now = new Date();
      switch (filter.dateRange) {
        case 'last30':
          filtered = filtered.filter(p => 
            isAfter(new Date(p.createdDate), new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
          );
          break;
        case 'last90':
          filtered = filtered.filter(p => 
            isAfter(new Date(p.createdDate), new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
          );
          break;
        case 'thisYear':
          filtered = filtered.filter(p => 
            new Date(p.createdDate).getFullYear() === now.getFullYear()
          );
          break;
      }
    }

    // Sort by created date descending
    return filtered.sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  };

  const handleCompare = () => {
    if (selectedPlans.length === 2) {
      const [plan1, plan2] = selectedPlans.map(id => plans.find(p => p.id === id)!);
      const comparison = comparePlans(plan1, plan2);
      setComparisonResult(comparison);
      setShowCompareDialog(true);
    }
  };

  const comparePlans = (plan1: ImprovementPlan, plan2: ImprovementPlan): PlanComparison => {
    const differences: PlanComparison['differences'] = [];

    // Compare basic fields
    if (plan1.priority !== plan2.priority) {
      differences.push({
        field: 'priority',
        value1: plan1.priority,
        value2: plan2.priority,
        type: 'modified',
      });
    }

    if (plan1.targetDate !== plan2.targetDate) {
      differences.push({
        field: 'targetDate',
        value1: plan1.targetDate,
        value2: plan2.targetDate,
        type: 'modified',
      });
    }

    // Compare goals
    const plan1GoalIds = plan1.goals.map(g => g.id);
    const plan2GoalIds = plan2.goals.map(g => g.id);

    plan1.goals.forEach(goal => {
      if (!plan2GoalIds.includes(goal.id)) {
        differences.push({
          field: 'goal',
          value1: goal.title,
          value2: null,
          type: 'removed',
        });
      }
    });

    plan2.goals.forEach(goal => {
      if (!plan1GoalIds.includes(goal.id)) {
        differences.push({
          field: 'goal',
          value1: null,
          value2: goal.title,
          type: 'added',
        });
      }
    });

    // Compare activities
    const plan1ActivityIds = plan1.activities.map(a => a.id);
    const plan2ActivityIds = plan2.activities.map(a => a.id);

    plan1.activities.forEach(activity => {
      if (!plan2ActivityIds.includes(activity.id)) {
        differences.push({
          field: 'activity',
          value1: activity.title,
          value2: null,
          type: 'removed',
        });
      }
    });

    plan2.activities.forEach(activity => {
      if (!plan1ActivityIds.includes(activity.id)) {
        differences.push({
          field: 'activity',
          value1: null,
          value2: activity.title,
          type: 'added',
        });
      }
    });

    return {
      planId1: plan1.id,
      planId2: plan2.id,
      planName1: plan1.title,
      planName2: plan2.title,
      differences,
      progressComparison: {
        plan1Progress: calculatePlanProgress(plan1),
        plan2Progress: calculatePlanProgress(plan2),
        plan1Status: plan1.status,
        plan2Status: plan2.status,
      },
    };
  };

  const handleExport = () => {
    // Export filtered plans to CSV or PDF
    const filteredPlans = filterPlans();
    console.log('Exporting plans:', filteredPlans);
  };

  const renderTableView = () => {
    const filteredPlans = filterPlans();
    const paginatedPlans = filteredPlans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {!readOnly && (
                  <TableCell padding="checkbox">
                    {t('history.select')}
                  </TableCell>
                )}
                <TableCell>{t('history.plan')}</TableCell>
                <TableCell>{t('history.teacher')}</TableCell>
                <TableCell>{t('history.school')}</TableCell>
                <TableCell>{t('history.status')}</TableCell>
                <TableCell>{t('history.priority')}</TableCell>
                <TableCell>{t('history.progress')}</TableCell>
                <TableCell>{t('history.created')}</TableCell>
                <TableCell>{t('history.target')}</TableCell>
                <TableCell align="right">{t('history.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPlans.map((plan) => {
                const progress = calculatePlanProgress(plan);
                const isSelected = selectedPlans.includes(plan.id);
                const isCurrent = plan.id === currentPlanId;

                return (
                  <TableRow
                    key={plan.id}
                    selected={isSelected}
                    sx={{
                      backgroundColor: isCurrent ? 'action.selected' : undefined,
                    }}
                  >
                    {!readOnly && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedPlans.length < 2) {
                                setSelectedPlans([...selectedPlans, plan.id]);
                              }
                            } else {
                              setSelectedPlans(selectedPlans.filter(id => id !== plan.id));
                            }
                          }}
                          disabled={!isSelected && selectedPlans.length >= 2}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {i18n.language === 'km' ? plan.titleKh || plan.title : plan.title}
                        </Typography>
                        {isCurrent && (
                          <Chip label={t('history.current')} size="small" color="primary" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{plan.teacherName}</TableCell>
                    <TableCell>{plan.schoolName}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(plan.status)}
                        label={t(`planStatus.${plan.status}`)}
                        size="small"
                        color={getStatusColor(plan.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<PriorityIcon />}
                        label={t(`priority.${plan.priority}`)}
                        size="small"
                        color={getPriorityColor(plan.priority)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2">{progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.createdDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.targetDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={t('history.view')}>
                          <IconButton size="small" onClick={() => onPlanView(plan.id)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {!readOnly && (
                          <>
                            <Tooltip title={t('history.copy')}>
                              <IconButton size="small" onClick={() => onPlanCopy(plan.id)}>
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('history.archive')}>
                              <IconButton size="small" onClick={() => onPlanArchive(plan.id)}>
                                <ArchiveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('history.delete')}>
                              <IconButton 
                                size="small" 
                                onClick={() => onPlanDelete(plan.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredPlans.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </>
    );
  };

  const renderTimelineView = () => {
    const filteredPlans = filterPlans();

    return (
      <Timeline position="alternate">
        {filteredPlans.map((plan, index) => {
          const progress = calculatePlanProgress(plan);
          const isCurrent = plan.id === currentPlanId;

          return (
            <TimelineItem key={plan.id}>
              <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(plan.createdDate), 'MMM d, yyyy')}
                </Typography>
                <Chip
                  label={plan.teacherName}
                  size="small"
                  icon={<PersonIcon />}
                  variant="outlined"
                />
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
                <TimelineDot color={getStatusColor(plan.status)}>
                  {getStatusIcon(plan.status)}
                </TimelineDot>
                <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card 
                  elevation={isCurrent ? 4 : 1}
                  sx={{
                    border: isCurrent ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" component="span">
                          {i18n.language === 'km' ? plan.titleKh || plan.title : plan.title}
                        </Typography>
                        {isCurrent && (
                          <Chip 
                            label={t('history.current')} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {i18n.language === 'km' ? plan.descriptionKh || plan.description : plan.description}
                      </Typography>

                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={<SchoolIcon />}
                          label={plan.schoolName}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<PriorityIcon />}
                          label={t(`priority.${plan.priority}`)}
                          size="small"
                          color={getPriorityColor(plan.priority)}
                          variant="outlined"
                        />
                      </Stack>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            {t('history.progress')}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {progress}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <GoalIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {plan.goals.length} {t('goals')}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ActivityIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {plan.activities.length} {t('activities')}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => onPlanView(plan.id)}
                        >
                          {t('history.view')}
                        </Button>
                        {!readOnly && (
                          <Button
                            size="small"
                            startIcon={<CopyIcon />}
                            onClick={() => onPlanCopy(plan.id)}
                          >
                            {t('history.copy')}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    );
  };

  const renderStatistics = () => {
    const allPlans = filterPlans();
    const stats = {
      total: allPlans.length,
      active: allPlans.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completed: allPlans.filter(p => p.status === 'completed').length,
      cancelled: allPlans.filter(p => p.status === 'cancelled').length,
      avgProgress: allPlans.reduce((sum, p) => sum + calculatePlanProgress(p), 0) / (allPlans.length || 1),
      totalGoals: allPlans.reduce((sum, p) => sum + p.goals.length, 0),
      totalActivities: allPlans.reduce((sum, p) => sum + p.activities.length, 0),
    };

    const teachers = Array.from(new Set(allPlans.map(p => p.teacherName)));
    const schools = Array.from(new Set(allPlans.map(p => p.schoolName)));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('statistics.totalPlans')}
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <Chip
                  label={`${stats.active} ${t('active')}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`${stats.completed} ${t('completed')}`}
                  size="small"
                  color="success"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('statistics.avgProgress')}
              </Typography>
              <Typography variant="h4">{Math.round(stats.avgProgress)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={stats.avgProgress}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('statistics.totalGoals')}
              </Typography>
              <Typography variant="h4">{stats.totalGoals}</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {t('statistics.acrossAllPlans')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('statistics.totalActivities')}
              </Typography>
              <Typography variant="h4">{stats.totalActivities}</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {t('statistics.scheduled')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('statistics.coverage')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('statistics.teachers')} ({teachers.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {teachers.map(teacher => (
                    <Chip key={teacher} label={teacher} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('statistics.schools')} ({schools.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {schools.map(school => (
                    <Chip key={school} label={school} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const Checkbox = ({ checked, onChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={{ width: 18, height: 18 }}
    />
  );

  const GoalIcon = () => <Box>🎯</Box>;
  const ActivityIcon = () => <Box>📋</Box>;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">{t('history.title')}</Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {/* Show filter dialog */}}
          >
            {t('history.filter')}
          </Button>
          
          {selectedPlans.length === 2 && (
            <Button
              variant="contained"
              startIcon={<CompareIcon />}
              onClick={handleCompare}
            >
              {t('history.compare')}
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            {t('history.export')}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={t('history.allPlans')} />
          <Tab label={t('history.statistics')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, mode) => mode && setViewMode(mode)}
            size="small"
          >
            <ToggleButton value="table">
              <TableIcon />
            </ToggleButton>
            <ToggleButton value="timeline">
              <TimelineIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {viewMode === 'table' ? renderTableView() : renderTimelineView()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderStatistics()}
      </TabPanel>

      {/* Comparison Dialog */}
      <Dialog open={showCompareDialog} onClose={() => setShowCompareDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('history.comparisonResults')}</DialogTitle>
        <DialogContent>
          {comparisonResult && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {comparisonResult.planName1}
                      </Typography>
                      <Stack spacing={1}>
                        <Chip
                          label={`${t('progress')}: ${comparisonResult.progressComparison.plan1Progress}%`}
                          color="primary"
                        />
                        <Chip
                          label={t(`planStatus.${comparisonResult.progressComparison.plan1Status}`)}
                          size="small"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {comparisonResult.planName2}
                      </Typography>
                      <Stack spacing={1}>
                        <Chip
                          label={`${t('progress')}: ${comparisonResult.progressComparison.plan2Progress}%`}
                          color="primary"
                        />
                        <Chip
                          label={t(`planStatus.${comparisonResult.progressComparison.plan2Status}`)}
                          size="small"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('history.differences')}
                </Typography>
                <List>
                  {comparisonResult.differences.map((diff, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {diff.type === 'added' ? <AddIcon color="success" /> :
                         diff.type === 'removed' ? <RemoveIcon color="error" /> :
                         <ModifiedIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={t(`history.fields.${diff.field}`)}
                        secondary={
                          diff.type === 'added' ? `${t('added')}: ${diff.value2}` :
                          diff.type === 'removed' ? `${t('removed')}: ${diff.value1}` :
                          `${diff.value1} → ${diff.value2}`
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const TableIcon = () => <Box>⊞</Box>;
const TimelineIcon = () => <Box>↕</Box>;

export default PlanHistory;