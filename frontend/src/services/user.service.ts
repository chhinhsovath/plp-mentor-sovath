import axios from 'axios';
import { authService } from './auth.service';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  profilePicture?: string;
  preferredLanguage?: string;
  bio?: string;
  permissions?: string[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId: string;
  status?: 'active' | 'inactive';
  preferredLanguage?: string;
  bio?: string;
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  preferredLanguage?: string;
  bio?: string;
}

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class UserService {
  private getAuthHeader() {
    const token = authService.getAccessToken();
    console.log('Getting auth token for request:', token);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    try {
      // Build params object, only including non-empty values
      const queryParams: any = {
        page: params.page || 1,
        limit: params.limit || 10,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
      };

      // Only add optional params if they have values
      if (params.search) queryParams.search = params.search;
      if (params.roleId) queryParams.roleId = params.roleId;
      if (params.status) queryParams.status = params.status;

      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: queryParams,
        headers: this.getAuthHeader(),
      });

      if (response.data.success) {
        return {
          users: response.data.data || [],
          total: response.data.meta?.total || 0,
          page: response.data.meta?.page || 1,
          limit: response.data.meta?.limit || 10,
          totalPages: response.data.meta?.totalPages || 0,
        };
      }

      throw new Error('Failed to fetch users');
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error.response?.data || error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, {
        headers: this.getAuthHeader(),
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to fetch user');
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw error.response?.data || error;
    }
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users`,
        userData,
        { headers: this.getAuthHeader() }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to create user');
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error.response?.data || error;
    }
  }

  async updateUser(id: string, userData: UpdateUserDto | FormData): Promise<User> {
    try {
      const headers = this.getAuthHeader();
      
      // If FormData is passed (for file upload), let axios set the content-type
      if (userData instanceof FormData) {
        const response = await axios.put(
          `${API_BASE_URL}/users/${id}`,
          userData,
          { headers }
        );

        if (response.data.success) {
          return response.data.data;
        }
      } else {
        const response = await axios.put(
          `${API_BASE_URL}/users/${id}`,
          userData,
          { headers }
        );

        if (response.data.success) {
          return response.data.data;
        }
      }

      throw new Error('Failed to update user');
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error.response?.data || error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/${id}`, {
        headers: this.getAuthHeader(),
      });

      if (!response.data.success) {
        throw new Error('Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error.response?.data || error;
    }
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/${id}/change-password`,
        { oldPassword, newPassword },
        { headers: this.getAuthHeader() }
      );

      if (!response.data.success) {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error.response?.data || error;
    }
  }

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/${id}/reset-password`,
        {},
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw error.response?.data || error;
    }
  }

  async toggleUserStatus(id: string): Promise<User> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/${id}/toggle-status`,
        {},
        { headers: this.getAuthHeader() }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Failed to toggle user status');
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      throw error.response?.data || error;
    }
  }

  async getRoles(): Promise<Array<{ id: string; name: string; displayName: string }>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/roles`, {
        headers: this.getAuthHeader(),
      });

      if (response.data.success) {
        return response.data.data || [];
      }

      throw new Error('Failed to fetch roles');
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      // Return default roles if API fails
      return [
        { id: 'TEACHER', name: 'teacher', displayName: 'Teacher' },
        { id: 'PROVINCIAL', name: 'provincial', displayName: 'Provincial' },
        { id: 'ADMINISTRATOR', name: 'administrator', displayName: 'Administrator' },
        { id: 'ZONE', name: 'zone', displayName: 'Zone' },
        { id: 'DIRECTOR', name: 'director', displayName: 'Director' },
        { id: 'CLUSTER', name: 'cluster', displayName: 'Cluster' },
        { id: 'DEPARTMENT', name: 'department', displayName: 'Department' },
      ];
    }
  }
}

export const userService = new UserService();