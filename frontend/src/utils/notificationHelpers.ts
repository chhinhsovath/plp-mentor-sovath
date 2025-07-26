import { notificationService, NotificationType } from '../services/notification.service';

// Helper functions to trigger common notifications

export const notifyMissionCreated = async (missionId: string, missionTitle: string) => {
  // This would typically be called from the backend, but for demo purposes:
  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type: NotificationType.MISSION_CREATED,
      title: 'បេសកកម្មថ្មី',
      message: `បេសកកម្ម "${missionTitle}" ត្រូវបានបង្កើត`,
      data: { missionId },
      read: false,
      createdAt: new Date().toISOString(),
      priority: 'medium',
      actions: [{
        label: 'មើលបេសកកម្ម',
        url: `/missions/${missionId}`,
        primary: true,
      }],
      category: 'mission',
    },
  }));
};

export const notifyObservationCompleted = async (observationId: string, teacherName: string) => {
  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type: NotificationType.OBSERVATION_COMPLETED,
      title: 'ការសង្កេតបានបញ្ចប់',
      message: `ការសង្កេតលើគ្រូ ${teacherName} ត្រូវបានបញ្ចប់`,
      data: { observationId },
      read: false,
      createdAt: new Date().toISOString(),
      priority: 'high',
      actions: [{
        label: 'មើលការសង្កេត',
        url: `/observations/${observationId}`,
        primary: true,
      }],
      category: 'observation',
    },
  }));
};

export const notifyApprovalRequired = async (itemId: string, itemType: string, itemTitle: string) => {
  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type: NotificationType.APPROVAL_REQUIRED,
      title: 'ត្រូវការការអនុម័ត',
      message: `${itemType} "${itemTitle}" ត្រូវការការអនុម័តរបស់អ្នក`,
      data: { itemId, itemType },
      read: false,
      createdAt: new Date().toISOString(),
      priority: 'urgent',
      actions: [{
        label: 'អនុម័ត',
        url: `/approvals/${itemId}`,
        primary: true,
      }, {
        label: 'បដិសេធ',
        url: `/approvals/${itemId}?action=reject`,
      }],
      category: 'approval',
    },
  }));
};

export const notifySystemAlert = async (title: string, message: string) => {
  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
      data: {},
      read: false,
      createdAt: new Date().toISOString(),
      priority: 'high',
      actions: [],
      category: 'system',
    },
  }));
};

export const notifyAnnouncement = async (title: string, message: string, link?: string) => {
  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type: NotificationType.ANNOUNCEMENT,
      title,
      message,
      data: { link },
      read: false,
      createdAt: new Date().toISOString(),
      priority: 'medium',
      actions: link ? [{
        label: 'អានបន្ថែម',
        url: link,
        primary: true,
      }] : [],
      category: 'announcement',
    },
  }));
};

// Test notification function
export const sendTestNotification = async (type: NotificationType = NotificationType.SYSTEM_ALERT) => {
  const testNotifications = {
    [NotificationType.MISSION_CREATED]: {
      title: 'បេសកកម្មថ្មី',
      message: 'បេសកកម្ម "ការសង្កេតការបង្រៀនគណិតវិទ្យា" ត្រូវបានបង្កើត',
      priority: 'medium' as const,
      category: 'mission' as const,
    },
    [NotificationType.OBSERVATION_COMPLETED]: {
      title: 'ការសង្កេតបានបញ្ចប់',
      message: 'ការសង្កេតលើគ្រូ សុខ សារ៉ាត់ ត្រូវបានបញ្ចប់',
      priority: 'high' as const,
      category: 'observation' as const,
    },
    [NotificationType.APPROVAL_REQUIRED]: {
      title: 'ត្រូវការការអនុម័ត',
      message: 'បេសកកម្ម "ទស្សនកិច្ចសាលា" ត្រូវការការអនុម័តរបស់អ្នក',
      priority: 'urgent' as const,
      category: 'approval' as const,
    },
    [NotificationType.SYSTEM_ALERT]: {
      title: 'ការជូនដំណឹងប្រព័ន្ធ',
      message: 'នេះគឺជាការជូនដំណឹងសាកល្បងពីប្រព័ន្ធ',
      priority: 'high' as const,
      category: 'system' as const,
    },
  };

  const notification = testNotifications[type] || testNotifications[NotificationType.SYSTEM_ALERT];

  window.dispatchEvent(new CustomEvent('new-notification', {
    detail: {
      id: Date.now().toString(),
      userId: 'current-user',
      type,
      ...notification,
      data: { test: true },
      read: false,
      createdAt: new Date().toISOString(),
      actions: [{
        label: 'មើលលម្អិត',
        url: '#',
        primary: true,
      }],
    },
  }));
};