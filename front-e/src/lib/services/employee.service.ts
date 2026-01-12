import apiClient from '../api';
import {
  EmployeeDayAttendance,
  MiniJobCard,
  StatusUpdateRequest,
  JobStatusLog,
  EmployeeDashboardResponse,
  MonthlyStats,
  PageResponse,
  PageRequest,
  JobStatus,
} from '@/types';

// ===========================
// ATTENDANCE ENDPOINTS
// ===========================

export const attendanceService = {
  async startDay(): Promise<EmployeeDayAttendance> {
    const response = await apiClient.post<EmployeeDayAttendance>('/employee/attendance/start');
    return response.data;
  },

  async endDay(): Promise<EmployeeDayAttendance> {
    const response = await apiClient.post<EmployeeDayAttendance>('/employee/attendance/end');
    return response.data;
  },

  async getToday(): Promise<EmployeeDayAttendance | null> {
    try {
      const response = await apiClient.get<EmployeeDayAttendance>('/employee/attendance/today');
      return response.data;
    } catch {
      return null;
    }
  },

  async getHistory(params: PageRequest = {}): Promise<PageResponse<EmployeeDayAttendance>> {
    const response = await apiClient.get<PageResponse<EmployeeDayAttendance>>('/employee/attendance/history', {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getByRange(startDate: string, endDate: string): Promise<EmployeeDayAttendance[]> {
    const response = await apiClient.get<EmployeeDayAttendance[]>('/employee/attendance/range', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// ===========================
// JOB CARDS ENDPOINTS
// ===========================

export const jobCardService = {
  async getAll(params: PageRequest = {}): Promise<PageResponse<MiniJobCard>> {
    const response = await apiClient.get<PageResponse<MiniJobCard>>('/employee/job-cards', {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getById(id: number): Promise<MiniJobCard> {
    const response = await apiClient.get<MiniJobCard>(`/employee/job-cards/${id}`);
    return response.data;
  },

  async updateStatus(id: number, statusUpdate: StatusUpdateRequest): Promise<MiniJobCard> {
    const response = await apiClient.put<MiniJobCard>(`/employee/job-cards/${id}/status`, statusUpdate);
    return response.data;
  },

  async getLogs(id: number): Promise<JobStatusLog[]> {
    const response = await apiClient.get<JobStatusLog[]>(`/employee/job-cards/${id}/logs`);
    return response.data;
  },

  async getByStatus(status: JobStatus, params: PageRequest = {}): Promise<PageResponse<MiniJobCard>> {
    const response = await apiClient.get<PageResponse<MiniJobCard>>(`/employee/job-cards/status/${status}`, {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getByDate(date: string, status?: string, params: PageRequest = {}): Promise<PageResponse<MiniJobCard>> {
    const response = await apiClient.get<PageResponse<MiniJobCard>>('/employee/job-cards/by-date', {
      params: { date, status, page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<number>('/employee/job-cards/pending/count');
    return response.data;
  },

  async uploadImage(id: number, file: File): Promise<{ message: string; success: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ message: string; success: string }>(
      `/employee/job-cards/${id}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

// ===========================
// DASHBOARD ENDPOINTS
// ===========================

export const employeeDashboardService = {
  async getSummary(): Promise<EmployeeDashboardResponse> {
    const response = await apiClient.get<EmployeeDashboardResponse>('/employee/dashboard/summary');
    return response.data;
  },

  async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const response = await apiClient.get<MonthlyStats>('/employee/dashboard/monthly-stats', {
      params: { year, month },
    });
    return response.data;
  },
};
