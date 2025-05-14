/**
 * Metrics Service
 * 
 * Handles calculation and retrieval of analytics metrics
 */
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import {
  AnalyticsMetric,
  AnalyticsMetricCreateData,
  MetricTrend
} from '@/types/analytics';
import * as analyticsMetricRepository from './analyticsMetricRepository';

/**
 * Create a new metric
 */
export async function createMetric(
  data: AnalyticsMetricCreateData,
  userId: string
): Promise<{ success: boolean; metric?: AnalyticsMetric; message?: string }> {
  try {
    // Validate the calculation query
    try {
      // Execute the query with EXPLAIN to check if it's valid
      // This won't actually run the query, just check if it's valid
      await db.query(`EXPLAIN ${data.calculationQuery}`);
    } catch (error) {
      return {
        success: false,
        message: `Invalid calculation query: ${error.message}`
      };
    }
    
    // Create the metric
    const metric = await analyticsMetricRepository.createAnalyticsMetric({
      ...data,
      createdBy: userId
    });
    
    // Log the creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.METRIC,
      entityId: metric.id,
      userId,
      metadata: {
        name: metric.name,
        category: metric.category
      }
    });
    
    return { success: true, metric };
  } catch (error) {
    console.error('Error creating metric:', error);
    return {
      success: false,
      message: `Failed to create metric: ${error.message}`
    };
  }
}

/**
 * Get metrics by category
 */
export async function getMetricsByCategory(
  category: string
): Promise<AnalyticsMetric[]> {
  return analyticsMetricRepository.getAnalyticsMetricsByCategory(category);
}

/**
 * Get all metrics
 */
export async function getAllMetrics(): Promise<AnalyticsMetric[]> {
  return analyticsMetricRepository.getAllAnalyticsMetrics();
}

/**
 * Calculate metric value
 */
export async function calculateMetricValue(
  metricId: string
): Promise<{ success: boolean; value?: number; message?: string }> {
  try {
    // Get the metric
    const metric = await analyticsMetricRepository.getAnalyticsMetricById(metricId);
    if (!metric) {
      return { success: false, message: 'Metric not found' };
    }
    
    // Execute the calculation query
    const result = await db.query(metric.calculationQuery);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'Calculation query returned no results' };
    }
    
    const row = result.rows[0];
    const value = parseFloat(row.value);
    
    if (isNaN(value)) {
      return { success: false, message: 'Calculation query did not return a numeric value' };
    }
    
    // Store the metric value
    const dateKey = new Date();
    await analyticsMetricRepository.storeMetricValue(
      metricId,
      dateKey,
      value
    );
    
    return { success: true, value };
  } catch (error) {
    console.error('Error calculating metric value:', error);
    return {
      success: false,
      message: `Failed to calculate metric value: ${error.message}`
    };
  }
}

/**
 * Get metric trend
 */
export async function getMetricTrend(
  metricId: string,
  startDate: Date,
  endDate: Date,
  compareToPreviousPeriod: boolean = false
): Promise<{ success: boolean; trend?: MetricTrend; message?: string }> {
  try {
    // Get the metric
    const metric = await analyticsMetricRepository.getAnalyticsMetricById(metricId);
    if (!metric) {
      return { success: false, message: 'Metric not found' };
    }
    
    // Get metric values for the specified period
    const values = await analyticsMetricRepository.getMetricValues(
      metricId,
      startDate,
      endDate
    );
    
    // Map to the trend format
    const trendValues = values.map(v => ({
      date: v.dateKey,
      value: v.value
    }));
    
    // If comparing to previous period, get the previous period values
    let previousPeriodValues = undefined;
    let changePercentage = undefined;
    
    if (compareToPreviousPeriod && values.length > 0) {
      // Calculate the previous period date range
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      const previousEndDate = new Date(endDate.getTime() - periodLength);
      
      // Get previous period values
      const previousValues = await analyticsMetricRepository.getMetricValues(
        metricId,
        previousStartDate,
        previousEndDate
      );
      
      previousPeriodValues = previousValues.map(v => ({
        date: v.dateKey,
        value: v.value
      }));
      
      // Calculate change percentage
      if (previousValues.length > 0 && values.length > 0) {
        const currentAvg = values.reduce((sum, v) => sum + v.value, 0) / values.length;
        const previousAvg = previousValues.reduce((sum, v) => sum + v.value, 0) / previousValues.length;
        
        if (previousAvg !== 0) {
          changePercentage = ((currentAvg - previousAvg) / previousAvg) * 100;
        }
      }
    }
    
    const trend: MetricTrend = {
      metric,
      values: trendValues,
      previousPeriodValues,
      changePercentage
    };
    
    return { success: true, trend };
  } catch (error) {
    console.error('Error getting metric trend:', error);
    return {
      success: false,
      message: `Failed to get metric trend: ${error.message}`
    };
  }
}

/**
 * Get KPI dashboard data
 */
export async function getKPIDashboardData(): Promise<{
  success: boolean;
  data?: {
    activeCases: number;
    documentsProcessed: number;
    consultationsScheduled: number;
    averageProcessingTime: number;
    revenueThisMonth: number;
    customerSatisfaction: number;
  };
  message?: string;
}> {
  try {
    // In a real implementation, these would be calculated from the data warehouse
    // For this example, we'll return simulated data
    
    return {
      success: true,
      data: {
        activeCases: 42,
        documentsProcessed: 156,
        consultationsScheduled: 18,
        averageProcessingTime: 3.5, // days
        revenueThisMonth: 4250, // euros
        customerSatisfaction: 4.7 // out of 5
      }
    };
  } catch (error) {
    console.error('Error getting KPI dashboard data:', error);
    return {
      success: false,
      message: `Failed to get KPI dashboard data: ${error.message}`
    };
  }
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformanceMetrics(
  agentId: string
): Promise<{
  success: boolean;
  data?: {
    casesHandled: number;
    averageProcessingTime: number;
    documentsProcessed: number;
    consultationsScheduled: number;
    customerSatisfaction: number;
    casesByStatus: Record<string, number>;
  };
  message?: string;
}> {
  try {
    // In a real implementation, these would be calculated from the data warehouse
    // For this example, we'll return simulated data
    
    return {
      success: true,
      data: {
        casesHandled: 15,
        averageProcessingTime: 2.8, // days
        documentsProcessed: 45,
        consultationsScheduled: 7,
        customerSatisfaction: 4.5, // out of 5
        casesByStatus: {
          draft: 2,
          submitted: 5,
          in_review: 3,
          approved: 4,
          rejected: 1
        }
      }
    };
  } catch (error) {
    console.error('Error getting agent performance metrics:', error);
    return {
      success: false,
      message: `Failed to get agent performance metrics: ${error.message}`
    };
  }
}
