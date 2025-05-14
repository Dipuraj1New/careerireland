/**
 * Analytics Types
 * 
 * Type definitions for the analytics and reporting module
 */

export enum ReportType {
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel',
  JSON = 'json'
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  description?: string;
  category: string;
  calculationQuery: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsMetricValue {
  id: string;
  metricId: string;
  dateKey: Date;
  value: number;
  dimensionValues?: Record<string, any>;
  createdAt: Date;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  layout: Record<string, any>;
  isSystem: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDashboardWidget {
  id: string;
  dashboardId: string;
  title: string;
  widgetType: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  query?: string;
  parameters?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsReportSchedule {
  id: string;
  reportId: string;
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  format: ReportFormat;
  recipients: string[];
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsReportExecution {
  id: string;
  reportId: string;
  scheduleId?: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  resultFilePath?: string;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  createdBy?: string;
}

export interface AnalyticsMetricCreateData {
  name: string;
  description?: string;
  category: string;
  calculationQuery: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface AnalyticsDashboardCreateData {
  name: string;
  description?: string;
  layout: Record<string, any>;
  isSystem?: boolean;
  createdBy?: string;
}

export interface AnalyticsDashboardWidgetCreateData {
  dashboardId: string;
  title: string;
  widgetType: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface AnalyticsReportCreateData {
  name: string;
  description?: string;
  type: ReportType;
  query?: string;
  parameters?: Record<string, any>;
  createdBy?: string;
}

export interface AnalyticsReportScheduleCreateData {
  reportId: string;
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  format: ReportFormat;
  recipients: string[];
  isActive?: boolean;
  createdBy?: string;
}

export interface MetricTrend {
  metric: AnalyticsMetric;
  values: {
    date: Date;
    value: number;
  }[];
  previousPeriodValues?: {
    date: Date;
    value: number;
  }[];
  changePercentage?: number;
}

export interface DashboardData {
  dashboard: AnalyticsDashboard;
  widgets: (AnalyticsDashboardWidget & {
    data: any;
  })[];
}

export interface ReportResult {
  report: AnalyticsReport;
  data: any[];
  executionId: string;
  executedAt: Date;
}
