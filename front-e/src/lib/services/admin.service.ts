import apiClient from '../api';
import {
  User,
  UserRequest,
  Generator,
  GeneratorRequest,
  GeneratorStatistics,
  MainTicket,
  MainTicketRequest,
  TicketAssignment,
  MiniJobCard,
  EmployeeScore,
  ScoreRequest,
  ApprovalStatistics,
  TimeTrackingReportResponse,
  OTReportResponse,
  DailyTimeTrackingReportDTO,
  DailyTimeTrackingAndPerformanceReportDTO,
  EmployeeAchievementReportDTO,
  EmployeeDailyWorkTimeReportDTO,
  DashboardStats,
  EmployeeWorkReportDTO,
  PageResponse,
  PageRequest,
  JobStatus,
  UserRole,
  ActivityLogResponse,
  ActivityLogFilterRequest,
} from '@/types';

// ===========================
// USER MANAGEMENT ENDPOINTS
// ===========================

export const userService = {
  async create(data: UserRequest): Promise<User> {
    const response = await apiClient.post<User>('/admin/users', data);
    return response.data;
  },

  async getAll(params: PageRequest = {}): Promise<PageResponse<User>> {
    const response = await apiClient.get<PageResponse<User>>('/admin/users', {
      params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc', ...params },
    });
    return response.data;
  },

  async getEmployees(params: PageRequest & { activeOnly?: boolean } = {}): Promise<PageResponse<User>> {
    const response = await apiClient.get<PageResponse<User>>('/admin/users/employees', {
      params: { page: 0, size: 10, activeOnly: true, ...params },
    });
    return response.data;
  },

  async getAdmins(params: PageRequest = {}): Promise<PageResponse<User>> {
    const response = await apiClient.get<PageResponse<User>>('/admin/users/admins', {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  async update(id: number, data: UserRequest): Promise<User> {
    const response = await apiClient.put<User>(`/admin/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async activate(id: number): Promise<User> {
    const response = await apiClient.put<User>(`/admin/users/${id}/activate`);
    return response.data;
  },

  async deactivate(id: number): Promise<User> {
    const response = await apiClient.put<User>(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  async search(query: string, params: PageRequest = {}): Promise<PageResponse<User>> {
    const response = await apiClient.get<PageResponse<User>>('/admin/users/search', {
      params: { query, page: 0, size: 10, ...params },
    });
    return response.data;
  },
};

// ===========================
// GENERATOR MANAGEMENT ENDPOINTS
// ===========================

export const generatorService = {
  async create(data: GeneratorRequest): Promise<Generator> {
    const response = await apiClient.post<Generator>('/admin/generators', data);
    return response.data;
  },

  async getAll(params: PageRequest = {}): Promise<PageResponse<Generator>> {
    const response = await apiClient.get<PageResponse<Generator>>('/admin/generators', {
      params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc', ...params },
    });
    return response.data;
  },

  async getById(id: number): Promise<Generator> {
    const response = await apiClient.get<Generator>(`/admin/generators/${id}`);
    return response.data;
  },

  async update(id: number, data: GeneratorRequest): Promise<Generator> {
    const response = await apiClient.put<Generator>(`/admin/generators/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/generators/${id}`);
  },

  async searchByName(name: string, params: PageRequest = {}): Promise<PageResponse<Generator>> {
    const response = await apiClient.get<PageResponse<Generator>>('/admin/generators/search/name', {
      params: { name, page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async searchByLocation(location: string, params: PageRequest = {}): Promise<PageResponse<Generator>> {
    const response = await apiClient.get<PageResponse<Generator>>('/admin/generators/search/location', {
      params: { location, page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getTickets(id: number, params: PageRequest = {}): Promise<PageResponse<MainTicket>> {
    const response = await apiClient.get<PageResponse<MainTicket>>(`/admin/generators/${id}/tickets`, {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getStatistics(id: number): Promise<GeneratorStatistics> {
    const response = await apiClient.get<GeneratorStatistics>(`/admin/generators/${id}/statistics`);
    return response.data;
  },
};

// ===========================
// TICKET MANAGEMENT ENDPOINTS
// ===========================

export const ticketService = {
  async create(data: MainTicketRequest): Promise<MainTicket> {
    const response = await apiClient.post<MainTicket>('/admin/tickets', data);
    return response.data;
  },

  async getAll(params: PageRequest = {}): Promise<PageResponse<MainTicket>> {
    const response = await apiClient.get<PageResponse<MainTicket>>('/admin/tickets', {
      params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc', ...params },
    });
    return response.data;
  },

  async getById(id: number): Promise<MainTicket> {
    const response = await apiClient.get<MainTicket>(`/admin/tickets/${id}`);
    return response.data;
  },

  async update(id: number, data: MainTicketRequest): Promise<MainTicket> {
    const response = await apiClient.put<MainTicket>(`/admin/tickets/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/tickets/${id}`);
  },

  async getMiniJobs(id: number, params: PageRequest = {}): Promise<PageResponse<MiniJobCard>> {
    const response = await apiClient.get<PageResponse<MiniJobCard>>(`/admin/tickets/${id}/mini-jobs`, {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getAssignments(id: number): Promise<TicketAssignment[]> {
    const response = await apiClient.get<TicketAssignment[]>(`/admin/tickets/${id}/assignments`);
    return response.data;
  },

  async assignEmployee(ticketId: number, employeeId: number): Promise<MiniJobCard> {
    const response = await apiClient.post<MiniJobCard>(`/admin/tickets/${ticketId}/assign/${employeeId}`);
    return response.data;
  },

  async unassignEmployee(ticketId: number, employeeId: number): Promise<void> {
    await apiClient.delete(`/admin/tickets/${ticketId}/unassign/${employeeId}`);
  },

  async getByStatus(status: JobStatus, params: PageRequest = {}): Promise<PageResponse<MainTicket>> {
    const response = await apiClient.get<PageResponse<MainTicket>>(`/admin/tickets/status/${status}`, {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getByDateRange(startDate: string, endDate: string, params: PageRequest = {}): Promise<PageResponse<MainTicket>> {
    const response = await apiClient.get<PageResponse<MainTicket>>('/admin/tickets/date-range', {
      params: { startDate, endDate, page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async getByCreator(createdBy: string, params: PageRequest = {}): Promise<PageResponse<MainTicket>> {
    const response = await apiClient.get<PageResponse<MainTicket>>(`/admin/tickets/created-by/${createdBy}`, {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async cancel(id: number): Promise<MainTicket> {
    const response = await apiClient.put<MainTicket>(`/admin/tickets/${id}/cancel`);
    return response.data;
  },

  async sendNotification(id: number, data: { ticketId: number; message: string; sendEmail: boolean; sendWhatsApp: boolean }): Promise<any> {
    const response = await apiClient.post(`/admin/tickets/${id}/send-notification`, data);
    return response.data;
  },
};

// ===========================
// APPROVAL ENDPOINTS
// ===========================

export const approvalService = {
  async getPending(params: PageRequest = {}): Promise<PageResponse<MiniJobCard>> {
    const response = await apiClient.get<PageResponse<MiniJobCard>>('/admin/approvals/pending', {
      params: { page: 0, size: 10, ...params },
    });
    return response.data;
  },

  async approve(id: number): Promise<MiniJobCard> {
    const response = await apiClient.put<MiniJobCard>(`/admin/approvals/mini-jobs/${id}/approve`);
    return response.data;
  },

  async reject(id: number, rejectionNote: string): Promise<MiniJobCard> {
    const response = await apiClient.put<MiniJobCard>(`/admin/approvals/mini-jobs/${id}/reject`, null, {
      params: { rejectionNote },
    });
    return response.data;
  },

  async bulkApprove(ids: number[]): Promise<MiniJobCard[]> {
    const response = await apiClient.put<MiniJobCard[]>('/admin/approvals/bulk-approve', ids);
    return response.data;
  },

  async addScore(data: ScoreRequest): Promise<EmployeeScore> {
    const response = await apiClient.post<EmployeeScore>('/admin/approvals/score', data);
    return response.data;
  },

  async getTicketScores(ticketId: number): Promise<EmployeeScore[]> {
    const response = await apiClient.get<EmployeeScore[]>(`/admin/approvals/tickets/${ticketId}/scores`);
    return response.data;
  },

  async getEmployeeScores(employeeId: number): Promise<EmployeeScore[]> {
    const response = await apiClient.get<EmployeeScore[]>(`/admin/approvals/employees/${employeeId}/scores`);
    return response.data;
  },

  async updateScore(scoreId: number, newScore: number): Promise<EmployeeScore> {
    const response = await apiClient.put<EmployeeScore>(`/admin/approvals/scores/${scoreId}`, null, {
      params: { newScore },
    });
    return response.data;
  },

  async deleteScore(scoreId: number): Promise<void> {
    await apiClient.delete(`/admin/approvals/scores/${scoreId}`);
  },

  async getStatistics(): Promise<ApprovalStatistics> {
    const response = await apiClient.get<ApprovalStatistics>('/admin/approvals/statistics');
    return response.data;
  },
};

// ===========================
// REPORT ENDPOINTS
// ===========================

export const reportService = {
  async getTimeTracking(startDate: string, endDate: string, employeeId?: number): Promise<TimeTrackingReportResponse[]> {
    const response = await apiClient.get<TimeTrackingReportResponse[]>('/admin/reports/time-tracking', {
      params: { startDate, endDate, employeeId },
    });
    return response.data;
  },

  async getOvertime(startDate: string, endDate: string, employeeId?: number): Promise<OTReportResponse[]> {
    const response = await apiClient.get<OTReportResponse[]>('/admin/reports/overtime', {
      params: { startDate, endDate, employeeId },
    });
    return response.data;
  },

  async getOvertimeByGenerator(startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get('/admin/reports/overtime-by-generator', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getEmployeeScore(employeeId: number): Promise<any> {
    const response = await apiClient.get(`/admin/reports/employee-score/${employeeId}`);
    return response.data;
  },

  async getTicketCompletion(startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get('/admin/reports/ticket-completion', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getEmployeeProductivity(startDate: string, endDate: string, employeeId?: number): Promise<any> {
    const response = await apiClient.get('/admin/reports/employee-productivity', {
      params: { startDate, endDate, employeeId },
    });
    return response.data;
  },

  async getGeneratorServiceHistory(generatorId: number): Promise<any> {
    const response = await apiClient.get(`/admin/reports/generator-service-history/${generatorId}`);
    return response.data;
  },

  async getDailyAttendance(date: string): Promise<any> {
    const response = await apiClient.get('/admin/reports/daily-attendance', {
      params: { date },
    });
    return response.data;
  },

  async getMonthlySummary(year: number, month: number): Promise<any> {
    const response = await apiClient.get('/admin/reports/monthly-summary', {
      params: { year, month },
    });
    return response.data;
  },

  async exportTimeTracking(startDate: string, endDate: string, employeeId?: number): Promise<Blob> {
    const response = await apiClient.get('/admin/reports/time-tracking/export', {
      params: { startDate, endDate, employeeId },
      responseType: 'blob',
    });
    return response.data;
  },

  async exportOvertime(startDate: string, endDate: string, employeeId?: number): Promise<Blob> {
    const response = await apiClient.get('/admin/reports/overtime/export', {
      params: { startDate, endDate, employeeId },
      responseType: 'blob',
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/admin/reports/dashboard-stats');
    return response.data;
  },

  async getEmployeeWorkReport(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<EmployeeWorkReportDTO> {
    const response = await apiClient.get<EmployeeWorkReportDTO>(
      `/admin/reports/employee-work-report/${employeeId}`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  async getDailyTimeTracking(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<DailyTimeTrackingReportDTO[]> {
    const response = await apiClient.get<DailyTimeTrackingReportDTO[]>(
      '/admin/reports/daily-time-tracking',
      {
        params: { startDate, endDate, employeeId },
      }
    );
    return response.data;
  },

  async getEmployeeDailyWorkTime(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<EmployeeDailyWorkTimeReportDTO[]> {
    const response = await apiClient.get<EmployeeDailyWorkTimeReportDTO[]>(
      `/admin/reports/employee-daily-work-time/${employeeId}`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  /**
   * Get Daily Time Tracking and Performance Report (Merged Report)
   * Combines time tracking metrics with OT and performance data
   */
  async getDailyTimeTrackingAndPerformance(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<DailyTimeTrackingAndPerformanceReportDTO[]> {
    const response = await apiClient.get<DailyTimeTrackingAndPerformanceReportDTO[]>(
      '/admin/reports/daily-time-tracking-and-performance',
      {
        params: { startDate, endDate, employeeId },
      }
    );
    return response.data;
  },

  /**
   * Get Employee Achievement Report
   * Shows ticket-level daily progress with detailed time tracking per ticket
   */
  async getEmployeeAchievement(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<EmployeeAchievementReportDTO[]> {
    const response = await apiClient.get<EmployeeAchievementReportDTO[]>(
      `/admin/reports/employee-achievement/${employeeId}`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },
};

// ===========================
// LOGS ENDPOINTS
// ===========================

export const logsService = {
  async getAll(filters: ActivityLogFilterRequest = {}): Promise<PageResponse<ActivityLogResponse>> {
    const response = await apiClient.get<PageResponse<ActivityLogResponse>>('/admin/logs', {
      params: {
        employeeId: filters.employeeId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page || 0,
        size: filters.size || 20,
      },
    });
    return response.data;
  },

  async getByEmployee(employeeId: number, params: PageRequest = {}): Promise<PageResponse<ActivityLogResponse>> {
    const response = await apiClient.get<PageResponse<ActivityLogResponse>>('/admin/logs', {
      params: {
        employeeId,
        page: params.page || 0,
        size: params.size || 20,
      },
    });
    return response.data;
  },

  async getByDateRange(startDate: string, endDate: string, params: PageRequest = {}): Promise<PageResponse<ActivityLogResponse>> {
    const response = await apiClient.get<PageResponse<ActivityLogResponse>>('/admin/logs', {
      params: {
        startDate,
        endDate,
        page: params.page || 0,
        size: params.size || 20,
      },
    });
    return response.data;
  },
};
