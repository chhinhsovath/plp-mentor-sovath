import axios from 'axios';
import {
  Mission,
  CreateMissionInput,
  UpdateMissionInput,
  UpdateMissionStatusInput,
  AddParticipantInput,
  MissionTrackingInput,
  MissionFilter,
  MissionsResponse,
  MissionParticipant,
  MissionTracking,
} from '../types/mission';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class MissionService {
  private getAuthHeaders() {
    const tokensStr = localStorage.getItem('auth_tokens');
    if (!tokensStr) {
      return {};
    }
    try {
      const tokens = JSON.parse(tokensStr);
      return {
        Authorization: `Bearer ${tokens.accessToken}`,
      };
    } catch (error) {
      console.error('Failed to parse auth tokens:', error);
      return {};
    }
  }

  // Create a new mission
  async createMission(data: CreateMissionInput): Promise<Mission> {
    const response = await axios.post(`${API_BASE_URL}/missions`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Get all missions with filtering
  async getMissions(filter?: MissionFilter): Promise<MissionsResponse> {
    const params = filter ? { ...filter } : {};
    const response = await axios.get(`${API_BASE_URL}/missions`, {
      headers: this.getAuthHeaders(),
      params,
    });
    return response.data;
  }

  // Get a single mission by ID
  async getMissionById(id: string): Promise<Mission> {
    const response = await axios.get(`${API_BASE_URL}/missions/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Update a mission
  async updateMission(id: string, data: UpdateMissionInput): Promise<Mission> {
    const response = await axios.patch(`${API_BASE_URL}/missions/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Delete a mission
  async deleteMission(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/missions/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update mission status
  async updateMissionStatus(id: string, data: UpdateMissionStatusInput): Promise<Mission> {
    const response = await axios.patch(`${API_BASE_URL}/missions/${id}/status`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Add participant to mission
  async addParticipant(missionId: string, data: AddParticipantInput): Promise<MissionParticipant> {
    const response = await axios.post(
      `${API_BASE_URL}/missions/${missionId}/participants`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Remove participant from mission
  async removeParticipant(missionId: string, participantId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/missions/${missionId}/participants/${participantId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Confirm participation in mission
  async confirmParticipation(missionId: string): Promise<MissionParticipant> {
    const response = await axios.post(
      `${API_BASE_URL}/missions/${missionId}/confirm`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Check in to mission
  async checkIn(missionId: string): Promise<MissionParticipant> {
    const response = await axios.post(
      `${API_BASE_URL}/missions/${missionId}/check-in`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Check in participant to mission (for administrators)
  async checkInParticipant(missionId: string, participantId: string): Promise<MissionParticipant> {
    const response = await axios.post(
      `${API_BASE_URL}/missions/${missionId}/participants/${participantId}/check-in`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Add tracking data
  async addTracking(missionId: string, data: MissionTrackingInput): Promise<MissionTracking> {
    const response = await axios.post(
      `${API_BASE_URL}/missions/${missionId}/tracking`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Get user's missions
  async getMyMissions(filter?: MissionFilter): Promise<MissionsResponse> {
    const currentUserId = this.getCurrentUserId();
    return this.getMissions({
      ...filter,
      participantId: currentUserId,
    });
  }

  // Get missions I created
  async getMissionsCreatedByMe(filter?: MissionFilter): Promise<MissionsResponse> {
    const currentUserId = this.getCurrentUserId();
    return this.getMissions({
      ...filter,
      createdBy: currentUserId,
    });
  }

  // Get missions pending approval
  async getMissionsPendingApproval(filter?: MissionFilter): Promise<MissionsResponse> {
    return this.getMissions({
      ...filter,
      status: 'submitted' as any,
    });
  }

  // Get available users for adding to mission
  async getAvailableUsers(): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/users/available`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // Submit mission for approval
  async submitMission(id: string): Promise<Mission> {
    return this.updateMissionStatus(id, { status: 'submitted' as any });
  }

  // Approve mission
  async approveMission(id: string, comments?: string): Promise<Mission> {
    return this.updateMissionStatus(id, {
      status: 'approved' as any,
      approvalComments: comments,
    });
  }

  // Reject mission
  async rejectMission(id: string, reason: string): Promise<Mission> {
    return this.updateMissionStatus(id, {
      status: 'rejected' as any,
      rejectionReason: reason,
    });
  }

  // Start mission
  async startMission(id: string): Promise<Mission> {
    return this.updateMissionStatus(id, { status: 'in_progress' as any });
  }

  // Complete mission
  async completeMission(id: string, completionReport?: string): Promise<Mission> {
    const response = await axios.patch(
      `${API_BASE_URL}/missions/${id}`,
      {
        status: 'completed',
        completionReport,
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  // Cancel mission
  async cancelMission(id: string): Promise<Mission> {
    return this.updateMissionStatus(id, { status: 'cancelled' as any });
  }

  // Helper method to get current user ID
  private getCurrentUserId(): string {
    // This should be retrieved from your auth context or state
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    throw new Error('User not authenticated');
  }

  // Format date for display
  formatMissionDates(mission: Mission): string {
    const start = new Date(mission.startDate).toLocaleDateString();
    const end = new Date(mission.endDate).toLocaleDateString();
    return start === end ? start : `${start} - ${end}`;
  }

  // Get mission status color
  getMissionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      submitted: 'info',
      approved: 'success',
      rejected: 'error',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  }

  // Check if user can edit mission
  canEditMission(mission: Mission, userId: string): boolean {
    return mission.createdBy.id === userId && mission.status === 'draft';
  }

  // Check if user can approve mission
  canApproveMission(userRole?: { hierarchyAccess?: { canApproveMissions?: boolean } }): boolean {
    return userRole?.hierarchyAccess?.canApproveMissions || false;
  }
}

export const missionService = new MissionService();
export default missionService;