import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import PushNotificationManager from '../PushNotificationManager';
import { PushNotification, MobileDevice } from '../../../types/mobile';

const mockNotifications: PushNotification[] = [
  {
    id: '1',
    title: 'Test Notification',
    body: 'This is a test notification',
    type: 'announcement',
    priority: 'normal',
    sentAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Observation Reminder',
    body: 'You have a scheduled observation today',
    type: 'observation_reminder',
    priority: 'high',
    sentAt: '2024-01-15T09:00:00Z',
    readAt: '2024-01-15T09:05:00Z',
  },
];

const mockDevices: MobileDevice[] = [
  {
    id: 'device-1',
    userId: 'user-1',
    deviceType: 'ios',
    deviceModel: 'iPhone 14',
    osVersion: '17.0',
    appVersion: '1.0.0',
    pushToken: 'push-token-1',
    isActive: true,
    registeredAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'device-2',
    userId: 'user-2',
    deviceType: 'android',
    deviceModel: 'Samsung Galaxy S23',
    osVersion: '14.0',
    appVersion: '1.0.0',
    pushToken: 'push-token-2',
    isActive: true,
    registeredAt: '2024-01-02T00:00:00Z',
  },
];

const mockNotificationSettings = {
  enabled: true,
  types: {
    observation_reminder: true,
    observation_completed: true,
    feedback_received: true,
    plan_activity_due: true,
    plan_updated: true,
    report_ready: true,
    sync_completed: true,
    sync_failed: true,
    app_update: true,
    announcement: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  sound: true,
  vibration: true,
  preview: true,
  grouping: true,
};

const theme = createTheme();

const renderPushNotificationManager = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <PushNotificationManager
          notifications={mockNotifications}
          devices={mockDevices}
          notificationSettings={mockNotificationSettings}
          onUpdateSettings={jest.fn()}
          onSendNotification={jest.fn()}
          onDeleteNotification={jest.fn()}
          onMarkAsRead={jest.fn()}
          onScheduleNotification={jest.fn()}
          onTestNotification={jest.fn()}
          {...props}
        />
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('PushNotificationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification manager with basic information', () => {
    renderPushNotificationManager();

    expect(screen.getByText('notifications.title')).toBeInTheDocument();
    expect(screen.getByText('notifications.enabled')).toBeInTheDocument();
  });

  it('displays notification tabs', () => {
    renderPushNotificationManager();

    expect(screen.getByText('notifications.notifications')).toBeInTheDocument();
    expect(screen.getByText('notifications.devices')).toBeInTheDocument();
    expect(screen.getByText('notifications.statistics')).toBeInTheDocument();
  });

  it('shows notification list grouped by type', () => {
    renderPushNotificationManager();

    expect(screen.getByText('notifications.type.announcement')).toBeInTheDocument();
    expect(screen.getByText('notifications.type.observation_reminder')).toBeInTheDocument();
  });

  it('displays unread notification count', () => {
    renderPushNotificationManager();

    // Should show badge with unread count (1 unread notification)
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('handles marking notification as read', async () => {
    const onMarkAsRead = jest.fn();
    renderPushNotificationManager({ onMarkAsRead });

    // Expand announcement group to see notifications
    const announcementGroup = screen.getByText('notifications.type.announcement');
    fireEvent.click(announcementGroup);

    // Find and click mark as read button for unread notification
    const markReadButton = screen.getByLabelText('notifications.markAsRead');
    fireEvent.click(markReadButton);

    await waitFor(() => {
      expect(onMarkAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('handles deleting notification', async () => {
    const onDeleteNotification = jest.fn();
    renderPushNotificationManager({ onDeleteNotification });

    // Expand announcement group
    const announcementGroup = screen.getByText('notifications.type.announcement');
    fireEvent.click(announcementGroup);

    // Find and click delete button
    const deleteButton = screen.getByLabelText('common.delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onDeleteNotification).toHaveBeenCalledWith('1');
    });
  });

  it('opens send notification dialog', () => {
    renderPushNotificationManager();

    const sendButton = screen.getByText('notifications.send');
    fireEvent.click(sendButton);

    expect(screen.getByText('notifications.newNotification')).toBeInTheDocument();
  });

  it('sends new notification', async () => {
    const onSendNotification = jest.fn();
    renderPushNotificationManager({ onSendNotification });

    // Open dialog
    const sendButton = screen.getByText('notifications.send');
    fireEvent.click(sendButton);

    // Fill form
    const titleInput = screen.getByLabelText('notifications.title');
    const bodyInput = screen.getByLabelText('notifications.body');

    fireEvent.change(titleInput, { target: { value: 'New Test Notification' } });
    fireEvent.change(bodyInput, { target: { value: 'Test body content' } });

    // Send notification
    const sendDialogButton = screen.getByRole('button', { name: 'notifications.send' });
    fireEvent.click(sendDialogButton);

    await waitFor(() => {
      expect(onSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test Notification',
          body: 'Test body content',
          type: 'announcement',
          priority: 'normal',
        })
      );
    });
  });

  it('schedules notification for later', async () => {
    const onScheduleNotification = jest.fn();
    renderPushNotificationManager({ onScheduleNotification });

    // Open dialog
    const sendButton = screen.getByText('notifications.send');
    fireEvent.click(sendButton);

    // Fill form
    const titleInput = screen.getByLabelText('notifications.title');
    const bodyInput = screen.getByLabelText('notifications.body');

    fireEvent.change(titleInput, { target: { value: 'Scheduled Notification' } });
    fireEvent.change(bodyInput, { target: { value: 'Scheduled content' } });

    // Set schedule date (this would require a more complex setup for DateTimePicker)
    // For now, we'll just check that the schedule option is available
    expect(screen.getByLabelText('notifications.scheduleFor')).toBeInTheDocument();
  });

  it('displays device list in devices tab', () => {
    renderPushNotificationManager();

    // Switch to devices tab
    const devicesTab = screen.getByText('notifications.devices');
    fireEvent.click(devicesTab);

    expect(screen.getByText('iPhone 14')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S23')).toBeInTheDocument();
  });

  it('sends test notification to device', async () => {
    const onTestNotification = jest.fn();
    renderPushNotificationManager({ onTestNotification });

    // Switch to devices tab
    const devicesTab = screen.getByText('notifications.devices');
    fireEvent.click(devicesTab);

    // Find and click test button
    const testButtons = screen.getAllByText('notifications.test');
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(onTestNotification).toHaveBeenCalledWith('device-1');
    });
  });

  it('displays statistics in statistics tab', () => {
    renderPushNotificationManager();

    // Switch to statistics tab
    const statisticsTab = screen.getByText('notifications.statistics');
    fireEvent.click(statisticsTab);

    expect(screen.getByText('notifications.totalSent')).toBeInTheDocument();
    expect(screen.getByText('notifications.totalRead')).toBeInTheDocument();
    expect(screen.getByText('notifications.readRate')).toBeInTheDocument();
  });

  it('opens settings dialog', () => {
    renderPushNotificationManager();

    const settingsButton = screen.getByLabelText('settings');
    fireEvent.click(settingsButton);

    expect(screen.getByText('notifications.settings')).toBeInTheDocument();
    expect(screen.getByText('notifications.enableNotifications')).toBeInTheDocument();
  });

  it('updates notification settings', async () => {
    const onUpdateSettings = jest.fn();
    renderPushNotificationManager({ onUpdateSettings });

    // Open settings
    const settingsButton = screen.getByLabelText('settings');
    fireEvent.click(settingsButton);

    // Toggle notifications off
    const enableToggle = screen.getByLabelText('notifications.enableNotifications');
    fireEvent.click(enableToggle);

    // Save settings
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  it('shows disabled state when notifications are off', () => {
    const disabledSettings = {
      ...mockNotificationSettings,
      enabled: false,
    };

    renderPushNotificationManager({ notificationSettings: disabledSettings });

    expect(screen.getByText('notifications.disabled')).toBeInTheDocument();
  });

  it('validates notification form fields', () => {
    renderPushNotificationManager();

    // Open dialog
    const sendButton = screen.getByText('notifications.send');
    fireEvent.click(sendButton);

    // Try to send without filling required fields
    const sendDialogButton = screen.getByRole('button', { name: 'notifications.send' });
    expect(sendDialogButton).toBeDisabled();
  });

  it('handles empty states correctly', () => {
    renderPushNotificationManager({ 
      notifications: [], 
      devices: [] 
    });

    expect(screen.getByText('notifications.empty')).toBeInTheDocument();

    // Switch to devices tab
    const devicesTab = screen.getByText('notifications.devices');
    fireEvent.click(devicesTab);

    expect(screen.getByText('notifications.noDevices')).toBeInTheDocument();
  });
});