/**
 * Visualization Service
 * 
 * Handles data visualization for analytics
 */
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import {
  AnalyticsDashboard,
  AnalyticsDashboardCreateData,
  AnalyticsDashboardWidget,
  AnalyticsDashboardWidgetCreateData,
  DashboardData
} from '@/types/analytics';
import * as analyticsDashboardRepository from './analyticsDashboardRepository';
import * as analyticsMetricRepository from './analyticsMetricRepository';

/**
 * Create a new dashboard
 */
export async function createDashboard(
  data: AnalyticsDashboardCreateData,
  userId: string
): Promise<{ success: boolean; dashboard?: AnalyticsDashboard; message?: string }> {
  try {
    // Create the dashboard
    const dashboard = await analyticsDashboardRepository.createAnalyticsDashboard({
      ...data,
      createdBy: userId
    });
    
    // Log the creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.DASHBOARD,
      entityId: dashboard.id,
      userId,
      metadata: {
        name: dashboard.name
      }
    });
    
    return { success: true, dashboard };
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return {
      success: false,
      message: `Failed to create dashboard: ${error.message}`
    };
  }
}

/**
 * Add widget to dashboard
 */
export async function addWidgetToDashboard(
  data: AnalyticsDashboardWidgetCreateData,
  userId: string
): Promise<{ success: boolean; widget?: AnalyticsDashboardWidget; message?: string }> {
  try {
    // Validate that the dashboard exists
    const dashboard = await analyticsDashboardRepository.getAnalyticsDashboardById(data.dashboardId);
    if (!dashboard) {
      return { success: false, message: 'Dashboard not found' };
    }
    
    // Create the widget
    const widget = await analyticsDashboardRepository.createDashboardWidget(data);
    
    // Log the creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.DASHBOARD_WIDGET,
      entityId: widget.id,
      userId,
      metadata: {
        dashboardId: data.dashboardId,
        widgetType: data.widgetType,
        title: data.title
      }
    });
    
    return { success: true, widget };
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    return {
      success: false,
      message: `Failed to add widget to dashboard: ${error.message}`
    };
  }
}

/**
 * Get dashboard data
 */
export async function getDashboardData(
  dashboardId: string
): Promise<{ success: boolean; data?: DashboardData; message?: string }> {
  try {
    // Get the dashboard
    const dashboard = await analyticsDashboardRepository.getAnalyticsDashboardById(dashboardId);
    if (!dashboard) {
      return { success: false, message: 'Dashboard not found' };
    }
    
    // Get the widgets
    const widgets = await analyticsDashboardRepository.getWidgetsByDashboardId(dashboardId);
    
    // Get data for each widget
    const widgetsWithData = await Promise.all(widgets.map(async widget => {
      const data = await getWidgetData(widget);
      return {
        ...widget,
        data
      };
    }));
    
    return {
      success: true,
      data: {
        dashboard,
        widgets: widgetsWithData
      }
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return {
      success: false,
      message: `Failed to get dashboard data: ${error.message}`
    };
  }
}

/**
 * Get data for a widget
 */
async function getWidgetData(widget: AnalyticsDashboardWidget): Promise<any> {
  try {
    switch (widget.widgetType) {
      case 'metric':
        return getMetricWidgetData(widget);
        
      case 'chart':
        return getChartWidgetData(widget);
        
      case 'table':
        return getTableWidgetData(widget);
        
      case 'kpi':
        return getKPIWidgetData(widget);
        
      default:
        throw new Error(`Unknown widget type: ${widget.widgetType}`);
    }
  } catch (error) {
    console.error(`Error getting data for widget ${widget.id}:`, error);
    return {
      error: `Failed to get widget data: ${error.message}`
    };
  }
}

/**
 * Get data for a metric widget
 */
async function getMetricWidgetData(widget: AnalyticsDashboardWidget): Promise<any> {
  const { metricId } = widget.configuration;
  
  if (!metricId) {
    throw new Error('Metric ID is required for metric widgets');
  }
  
  // Get the metric
  const metric = await analyticsMetricRepository.getAnalyticsMetricById(metricId);
  if (!metric) {
    throw new Error('Metric not found');
  }
  
  // Get the latest value
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30); // Last 30 days
  
  const values = await analyticsMetricRepository.getMetricValues(
    metricId,
    startDate,
    now
  );
  
  // Get the latest value
  const latestValue = values.length > 0
    ? values.sort((a, b) => b.dateKey.getTime() - a.dateKey.getTime())[0].value
    : null;
  
  return {
    metric,
    value: latestValue,
    timestamp: values.length > 0 ? values[0].dateKey : null
  };
}

/**
 * Get data for a chart widget
 */
async function getChartWidgetData(widget: AnalyticsDashboardWidget): Promise<any> {
  const { chartType, query, metricIds, startDate, endDate } = widget.configuration;
  
  if (query) {
    // Execute the custom query
    const result = await db.query(query);
    return {
      chartType,
      data: result.rows
    };
  } else if (metricIds && Array.isArray(metricIds)) {
    // Get data for multiple metrics
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const metricsData = await Promise.all(metricIds.map(async metricId => {
      const metric = await analyticsMetricRepository.getAnalyticsMetricById(metricId);
      if (!metric) {
        return null;
      }
      
      const values = await analyticsMetricRepository.getMetricValues(
        metricId,
        start,
        end
      );
      
      return {
        metric,
        values: values.map(v => ({
          date: v.dateKey,
          value: v.value
        }))
      };
    }));
    
    return {
      chartType,
      data: metricsData.filter(Boolean)
    };
  } else {
    throw new Error('Either query or metricIds is required for chart widgets');
  }
}

/**
 * Get data for a table widget
 */
async function getTableWidgetData(widget: AnalyticsDashboardWidget): Promise<any> {
  const { query, columns } = widget.configuration;
  
  if (!query) {
    throw new Error('Query is required for table widgets');
  }
  
  // Execute the query
  const result = await db.query(query);
  
  return {
    columns: columns || Object.keys(result.rows[0] || {}),
    data: result.rows
  };
}

/**
 * Get data for a KPI widget
 */
async function getKPIWidgetData(widget: AnalyticsDashboardWidget): Promise<any> {
  const { kpiType } = widget.configuration;
  
  // In a real implementation, these would be calculated from the data warehouse
  // For this example, we'll return simulated data
  
  switch (kpiType) {
    case 'activeCases':
      return {
        value: 42,
        change: 5,
        changePercentage: 13.5,
        trend: 'up'
      };
      
    case 'documentsProcessed':
      return {
        value: 156,
        change: -12,
        changePercentage: -7.1,
        trend: 'down'
      };
      
    case 'consultationsScheduled':
      return {
        value: 18,
        change: 3,
        changePercentage: 20,
        trend: 'up'
      };
      
    case 'averageProcessingTime':
      return {
        value: 3.5, // days
        change: -0.5,
        changePercentage: -12.5,
        trend: 'down' // down is good for processing time
      };
      
    case 'revenueThisMonth':
      return {
        value: 4250, // euros
        change: 750,
        changePercentage: 21.4,
        trend: 'up'
      };
      
    case 'customerSatisfaction':
      return {
        value: 4.7, // out of 5
        change: 0.2,
        changePercentage: 4.4,
        trend: 'up'
      };
      
    default:
      throw new Error(`Unknown KPI type: ${kpiType}`);
  }
}
