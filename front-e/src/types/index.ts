// ===========================
// ENUMS
// ===========================

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum JobStatus {
  PENDING = 'PENDING',
  TRAVELING = 'TRAVELING',
  STARTED = 'STARTED',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCEL = 'CANCEL',
}

export enum JobCardType {
  SERVICE = 'SERVICE',
  REPAIR = 'REPAIR',
  MAINTENANCE = 'MAINTENANCE',
  VISIT = 'VISIT',
  EMERGENCY = 'EMERGENCY',
}

// ===========================
// AUTHENTICATION TYPES
// ===========================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
}

// ===========================
// USER TYPES
// ===========================

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
}

export interface UserRequest {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  active?: boolean;
}

// ===========================
// GENERATOR TYPES
// ===========================

export interface Generator {
  id: number;
  model: string;
  name: string;
  capacity?: string;
  locationName: string;
  ownerEmail?: string;
  whatsAppNumber?: string;
  landlineNumber?: string;
  note?: string;
  createdAt: string;
}

export interface GeneratorRequest {
  model: string;
  name: string;
  capacity?: string;
  locationName: string;
  ownerEmail?: string;
  whatsAppNumber?: string;
  landlineNumber?: string;
  note?: string;
}

export interface GeneratorStatistics {
  totalTickets: number;
  completedTickets: number;
  pendingTickets: number;
  totalServiceMinutes: number;
  lastServiceDate?: string;
  averageScore?: number;
}

// ===========================
// TICKET TYPES
// ===========================

export interface MainTicket {
  id: number;
  ticketNumber: string;
  generator: Generator;
  title: string;
  description?: string;
  type: JobCardType;
  weight: number;
  status: JobStatus;
  scheduledDate: string;
  scheduledTime: string;
  createdBy: string;
  createdAt: string;
}

export interface MainTicketRequest {
  generatorId: number;
  title: string;
  description?: string;
  type: JobCardType;
  weight: number;
  scheduledDate: string;
  scheduledTime: string;
  employeeIds: number[];
}

export interface TicketAssignment {
  id: number;
  mainTicket: MainTicket;
  employee: User;
  assignedAt: string;
}

// ===========================
// JOB CARD TYPES
// ===========================

export interface MiniJobCard {
  id: number;
  mainTicket: MainTicket;
  employee: User;
  status: JobStatus;
  startTime?: string;
  endTime?: string;
  approved: boolean;
  workMinutes: number;
  imageUrl?: string;
  createdAt: string;
}

export interface StatusUpdateRequest {
  newStatus: JobStatus;
  latitude: number;
  longitude: number;
}

export interface JobStatusLog {
  id: number;
  miniJobCard: MiniJobCard;
  employeeEmail: string;
  prevStatus?: JobStatus;
  newStatus: JobStatus;
  latitude: number;
  longitude: number;
  loggedAt: string;
}

// ===========================
// ATTENDANCE TYPES
// ===========================

export interface EmployeeDayAttendance {
  id: number;
  employee: User;
  date: string;
  dayStartTime?: string;
  dayEndTime?: string;
  totalWorkMinutes: number;
  morningOtMinutes: number;
  eveningOtMinutes: number;
}

// ===========================
// DASHBOARD TYPES
// ===========================

export interface EmployeeDashboardResponse {
  pendingJobCardsCount: number;
  inProgressJobCardsCount: number;
  completedJobCardsCount: number;
  totalJobCardsCount: number;
  totalWorkMinutes: number;
  totalOTMinutes: number;
  morningOTMinutes: number;
  eveningOTMinutes: number;
  averageScore: number;
  totalScores: number;
  recentJobCards: MiniJobCard[];
  dayStarted: boolean;
  dayEnded: boolean;
  currentStatus: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalWorkDays: number;
  totalWorkMinutes: number;
  totalOTMinutes: number;
  completedJobs: number;
  averageScore: number;
}

// ===========================
// APPROVAL TYPES
// ===========================

export interface EmployeeScore {
  id: number;
  employee: User;
  miniJobCard: MiniJobCard;
  workDate: string; // Date when work was completed
  weight: number; // Weight is the score (1-5) - consolidated
  approvedBy: string;
  approvedAt: string;
}

export interface ScoreRequest {
  miniJobCardId: number;
  // Score is automatically set to the weight from MainTicket
}

export interface ApprovalStatistics {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageApprovalTime: number;
}

// ===========================
// REPORT TYPES
// ===========================

export interface TimeTrackingReportResponse {
  employeeName: string;
  date: string;
  dayStartTime?: string;
  dayEndTime?: string;
  workMinutes: number;
  idleMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
}

export interface OTReportResponse {
  employeeName: string;
  date: string;
  morningOtMinutes: number;
  eveningOtMinutes: number;
  totalOtMinutes: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface DailyTimeTrackingReportDTO {
  employeeId: number;
  employeeName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  dailyWorkingMinutes: number;
  idleMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  locationPath?: LocationPoint[];
}

export interface EmployeeDailyWorkTimeReportDTO {
  employeeId: number;
  employeeName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  morningOtMinutes: number;
  eveningOtMinutes: number;
  totalOtMinutes: number;
  workingMinutes: number;
  totalWeightEarned: number;
  jobsCompleted: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalGenerators: number;
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  pendingApprovals: number;
  totalWorkMinutesThisMonth: number;
  totalOTMinutesThisMonth: number;
}

// ===========================
// EMPLOYEE WORK REPORT TYPES
// ===========================

export interface EmployeeWorkReportDTO {
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  reportStartDate: string;
  reportEndDate: string;
  dailyRecords: DailyWorkRecord[];
  summary: SummaryStatistics;
}

export interface DailyWorkRecord {
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkMinutes: number;
  morningOtMinutes: number;
  eveningOtMinutes: number;
  totalOtMinutes: number;
  jobs: JobDetail[];
  dailyScore?: number;
  dailyTotalWeight?: number;
  dailyAverageScore?: number;
}

export interface JobDetail {
  miniJobCardId: number;
  mainTicketId: number;
  ticketNumber: string;
  ticketTitle: string;
  jobType: string;
  jobStatus: string;
  generatorId: number;
  generatorName: string;
  generatorModel: string;
  generatorLocation: string;
  startTime?: string;
  endTime?: string;
  workMinutes: number;
  weight: number; // Weight is the score (1-5) - consolidated
  score?: number; // Same as weight
  weightedScore?: number; // Same as weight (since weight = score)
  scored: boolean;
  approved: boolean;
}

export interface SummaryStatistics {
  totalDaysWorked: number;
  totalWorkMinutes: number;
  totalOtMinutes: number;
  totalJobsCompleted: number;
  totalJobsScored: number;
  totalJobsPending: number;
  totalWeightedScore: number;
  totalWeight: number;
  overallAverageScore: number;
  maxDailyScore?: number;
  minDailyScore?: number;
  averageDailyScore?: number;
}

// ===========================
// PAGINATION TYPES
// ===========================

export interface PageRequest {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

// ===========================
// ACTIVITY LOG TYPES
// ===========================

export enum ActivityType {
  DAY_START = 'DAY_START',
  DAY_END = 'DAY_END',
  STATUS_UPDATE = 'STATUS_UPDATE',
  JOB_APPROVED = 'JOB_APPROVED',
  JOB_REJECTED = 'JOB_REJECTED',
  JOB_ASSIGNED = 'JOB_ASSIGNED',
  JOB_CREATED = 'JOB_CREATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  OTHER = 'OTHER',
}

export interface ActivityLogResponse {
  id: number;
  employeeId?: number;
  employeeFullName?: string;
  employeeEmail?: string;
  performerId?: number;
  performerFullName?: string;
  performerEmail?: string;
  activityType: ActivityType;
  activityDescription: string;
  miniJobCardId?: number;
  mainTicketId?: number;
  ticketNumber?: string;
  generatorId?: number;
  generatorName?: string;
  generatorLocationName?: string;
  oldStatus?: JobStatus;
  newStatus?: JobStatus;
  latitude?: number;
  longitude?: number;
  locationMapUrl?: string;
  details?: string;
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
}

export interface ActivityLogFilterRequest {
  employeeId?: number | null;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
