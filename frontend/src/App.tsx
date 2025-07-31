import { Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import { antdTheme } from './theme/antdTheme'
import { useTranslation } from 'react-i18next'
import enUS from 'antd/es/locale/en_US'
import kmKH from 'antd/es/locale/km_KH'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import RoleBasedRoute from './components/Auth/RoleBasedRoute'
import AntdLayout from './components/Layout/AntdLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ObservationsPage from './pages/ObservationsPage'
import ObservationEditPage from './pages/ObservationEditPage'
import ObservationViewPage from './pages/ObservationViewPage'
import ReportsPage from './pages/ReportsPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import PerformancePage from './pages/PerformancePage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import BackupPage from './pages/BackupPage'
import SecurityPage from './pages/SecurityPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import FormsPageWithData from './pages/FormsPageWithData'
import FormBuilderPage from './pages/FormBuilderPage'
import FormViewPage from './pages/FormViewPage'
import FormStatisticsPage from './pages/FormStatisticsPage'
import SampleFormCreation from './pages/SampleFormCreation'
import TestI18n from './pages/TestI18n'
import { MissionsPage } from './pages/MissionsPage'
import { MissionFormPage } from './pages/MissionFormPage'
import { MissionDetailPage } from './pages/MissionDetailPage'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import SurveyListPage from './pages/surveys/SurveyListPage'
import SurveyBuilderPage from './pages/surveys/SurveyBuilderPage'
import PublicSurveyPage from './pages/surveys/PublicSurveyPage'
import SurveyStatisticsPage from './pages/surveys/SurveyStatisticsPage'
import MobileDeviceManager from './components/MobileIntegration/MobileDeviceManager'
import { DevConsole } from './components/DevConsole'
import ResultsChain from './pages/ResultsChain'
import ImpactDashboard from './pages/ImpactDashboard'
import SuccessStories from './pages/SuccessStories'
import DonorPortal from './pages/DonorPortal'
import ROICalculator from './pages/ROICalculator'
import ComparativeAnalytics from './pages/ComparativeAnalytics'
import PresentationDashboard from './pages/PresentationDashboard'
import SchoolsPage from './pages/SchoolsPage'
import ObservationFormKhmerPage from './pages/ObservationFormKhmerPage'
import RoleHierarchyDemo from './pages/RoleHierarchyDemo'
import AssessmentAccessDemo from './pages/AssessmentAccessDemo'
import NotificationsPage from './pages/NotificationsPage'
import ShowcasePage2 from './pages/ShowcasePage2'
import ObservationEntry from './pages/observations/ObservationEntry'
// import './utils/test-login' // Removed for production build

// Define role groups for easier management
// const ADMIN_ROLES = ['administrator', 'Administrator']
const MANAGEMENT_ROLES = ['administrator', 'zone', 'provincial', 'department', 'Administrator', 'Zone', 'Provincial', 'Department']
const OBSERVER_ROLES = ['teacher', 'observer', 'director', 'cluster', 'department', 'provincial', 'zone', 'administrator',
  'Teacher', 'Director', 'Cluster', 'Department', 'Provincial', 'Zone', 'Administrator']
const REPORT_VIEWER_ROLES = ['director', 'cluster', 'department', 'provincial', 'zone', 'administrator',
  'Director', 'Cluster', 'Department', 'Provincial', 'Zone', 'Administrator']

function App() {
  const { i18n } = useTranslation()
  
  // Get the appropriate Ant Design locale based on current language
  const getAntdLocale = () => {
    switch (i18n.language) {
      case 'km':
        return kmKH
      default:
        return enUS
    }
  }

  return (
    <ErrorBoundary>
      <ConfigProvider theme={antdTheme} locale={getAntdLocale()}>
        <ThemeProvider>
          <AntApp>
            <MobileDeviceManager enableOptimizations>
              <AuthProvider>
                <div style={{ direction: i18n.language === 'km' ? 'ltr' : 'ltr' }}>
                  <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/survey/:slug" element={<PublicSurveyPage />} />
                <Route
            path="/"
            element={
              <ProtectedRoute>
                <AntdLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            
            {/* Observations - Available to teachers and all management roles */}
            <Route 
              path="observations" 
              element={
                <RoleBasedRoute 
                  allowedRoles={OBSERVER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ObservationsPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="observations/new" 
              element={
                <RoleBasedRoute 
                  allowedRoles={OBSERVER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ObservationEditPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="observations/entry" 
              element={
                <RoleBasedRoute 
                  allowedRoles={OBSERVER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ObservationEntry />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="observations/:id" 
              element={
                <RoleBasedRoute 
                  allowedRoles={OBSERVER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ObservationViewPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="observations/:id/edit" 
              element={
                <RoleBasedRoute 
                  allowedRoles={OBSERVER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ObservationEditPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Reports - Available to directors and above */}
            <Route 
              path="reports" 
              element={
                <RoleBasedRoute 
                  allowedRoles={REPORT_VIEWER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ReportsPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Analytics Dashboard - Available to directors and above */}
            <Route 
              path="analytics" 
              element={
                <RoleBasedRoute 
                  allowedRoles={REPORT_VIEWER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <AnalyticsDashboardPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Performance Monitoring - Available to directors and above */}
            <Route 
              path="performance" 
              element={
                <RoleBasedRoute 
                  allowedRoles={REPORT_VIEWER_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <PerformancePage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Users - Available to management roles only */}
            <Route 
              path="users" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <UsersPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Forms - Available to management roles only */}
            <Route 
              path="forms" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <FormsPageWithData />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="forms/new" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <FormBuilderPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="forms/:id" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <FormViewPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="forms/:id/edit" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <FormBuilderPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="forms/sample" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SampleFormCreation />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="forms/:id/statistics" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <FormStatisticsPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Missions - Available to all authenticated users */}
            <Route path="missions" element={<MissionsPage />} />
            <Route path="missions/create" element={<MissionFormPage />} />
            <Route path="missions/:id" element={<MissionDetailPage />} />
            <Route path="missions/:id/edit" element={<MissionFormPage />} />
            
            {/* Surveys - Admin routes */}
            <Route 
              path="admin/surveys" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SurveyListPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="admin/surveys/new" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SurveyBuilderPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="admin/surveys/:id/edit" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SurveyBuilderPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="admin/surveys/:id/statistics" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SurveyStatisticsPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Backup - Available to administrators only */}
            <Route 
              path="backup" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <BackupPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Security - Available to administrators only */}
            <Route 
              path="security" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <SecurityPage />
                </RoleBasedRoute>
              } 
            />
            
            {/* Settings - Available to all authenticated users */}
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Notifications - Available to all authenticated users */}
            <Route path="notifications" element={<NotificationsPage />} />
            
            {/* Role Hierarchy Demo - Available to all authenticated users */}
            <Route path="role-demo" element={<RoleHierarchyDemo />} />
            
            {/* Assessment Access Demo - Available to all authenticated users */}
            <Route path="assessment-demo" element={<AssessmentAccessDemo />} />
            
            {/* Results Chain - Available to management roles */}
            <Route 
              path="results-chain" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ResultsChain />
                </RoleBasedRoute>
              } 
            />
            
            {/* Impact Dashboard - Available to all authenticated users */}
            <Route path="impact" element={<ImpactDashboard />} />
            
            {/* Success Stories - Available to all authenticated users */}
            <Route path="success-stories" element={<SuccessStories />} />
            
            {/* Donor Portal - Available to management roles */}
            <Route 
              path="donor-portal" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <DonorPortal />
                </RoleBasedRoute>
              } 
            />
            
            {/* ROI Calculator - Available to all authenticated users */}
            <Route path="roi-calculator" element={<ROICalculator />} />
            
            {/* Comparative Analytics - Available to management roles */}
            <Route 
              path="comparative-analytics" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <ComparativeAnalytics />
                </RoleBasedRoute>
              } 
            />
            
            {/* Presentation Dashboard - Available to management roles */}
            <Route 
              path="presentation" 
              element={
                <RoleBasedRoute 
                  allowedRoles={MANAGEMENT_ROLES}
                  fallback={<UnauthorizedPage />}
                >
                  <PresentationDashboard />
                </RoleBasedRoute>
              } 
            />
            
            {/* Schools - Available to all authenticated users */}
            <Route path="schools" element={<SchoolsPage />} />
            
            {/* Test i18n - Temporary */}
            <Route path="test-i18n" element={<TestI18n />} />
          </Route>
          
          {/* Showcase - Public route */}
          <Route path="/showcase" element={<ShowcasePage2 />} />
                </Routes>
              </div>
            </AuthProvider>
          </MobileDeviceManager>
        </AntApp>
        </ThemeProvider>
      </ConfigProvider>
      <DevConsole />
    </ErrorBoundary>
  )
}

export default App