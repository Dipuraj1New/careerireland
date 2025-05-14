/**
 * Analytics Dashboard Repository
 * 
 * Handles database operations for analytics dashboards and widgets
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  AnalyticsDashboard,
  AnalyticsDashboardCreateData,
  AnalyticsDashboardWidget,
  AnalyticsDashboardWidgetCreateData
} from '@/types/analytics';

/**
 * Map database row to AnalyticsDashboard object
 */
function mapAnalyticsDashboardFromDb(row: any): AnalyticsDashboard {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    layout: row.layout,
    isSystem: row.is_system,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to AnalyticsDashboardWidget object
 */
function mapAnalyticsDashboardWidgetFromDb(row: any): AnalyticsDashboardWidget {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    title: row.title,
    widgetType: row.widget_type,
    configuration: row.configuration,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new analytics dashboard
 */
export async function createAnalyticsDashboard(
  data: AnalyticsDashboardCreateData
): Promise<AnalyticsDashboard> {
  const id = uuidv4();
  const isSystem = data.isSystem !== undefined ? data.isSystem : false;
  
  const result = await db.query(
    `INSERT INTO analytics_dashboards (
      id, name, description, layout, is_system, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      id, data.name, data.description, data.layout, 
      isSystem, data.createdBy
    ]
  );
  
  return mapAnalyticsDashboardFromDb(result.rows[0]);
}

/**
 * Get analytics dashboard by ID
 */
export async function getAnalyticsDashboardById(id: string): Promise<AnalyticsDashboard | null> {
  const result = await db.query(
    `SELECT * FROM analytics_dashboards WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsDashboardFromDb(result.rows[0]);
}

/**
 * Get all analytics dashboards
 */
export async function getAllAnalyticsDashboards(
  includeSystem: boolean = true
): Promise<AnalyticsDashboard[]> {
  let query = `SELECT * FROM analytics_dashboards`;
  
  if (!includeSystem) {
    query += ` WHERE is_system = FALSE`;
  }
  
  query += ` ORDER BY name ASC`;
  
  const result = await db.query(query);
  
  return result.rows.map(mapAnalyticsDashboardFromDb);
}

/**
 * Get dashboards by created by
 */
export async function getDashboardsByCreatedBy(
  userId: string
): Promise<AnalyticsDashboard[]> {
  const result = await db.query(
    `SELECT * FROM analytics_dashboards 
     WHERE created_by = $1
     ORDER BY name ASC`,
    [userId]
  );
  
  return result.rows.map(mapAnalyticsDashboardFromDb);
}

/**
 * Update analytics dashboard
 */
export async function updateAnalyticsDashboard(
  id: string,
  data: {
    name?: string;
    description?: string;
    layout?: Record<string, any>;
  }
): Promise<AnalyticsDashboard | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  
  if (data.layout !== undefined) {
    updates.push(`layout = $${paramIndex++}`);
    values.push(data.layout);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing dashboard
  if (updates.length === 1) {
    return getAnalyticsDashboardById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_dashboards 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsDashboardFromDb(result.rows[0]);
}

/**
 * Delete analytics dashboard
 */
export async function deleteAnalyticsDashboard(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM analytics_dashboards WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Create a new dashboard widget
 */
export async function createDashboardWidget(
  data: AnalyticsDashboardWidgetCreateData
): Promise<AnalyticsDashboardWidget> {
  const id = uuidv4();
  
  const result = await db.query(
    `INSERT INTO analytics_dashboard_widgets (
      id, dashboard_id, title, widget_type, configuration, position
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      id, data.dashboardId, data.title, data.widgetType, 
      data.configuration, data.position
    ]
  );
  
  return mapAnalyticsDashboardWidgetFromDb(result.rows[0]);
}

/**
 * Get dashboard widget by ID
 */
export async function getDashboardWidgetById(id: string): Promise<AnalyticsDashboardWidget | null> {
  const result = await db.query(
    `SELECT * FROM analytics_dashboard_widgets WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsDashboardWidgetFromDb(result.rows[0]);
}

/**
 * Get widgets by dashboard ID
 */
export async function getWidgetsByDashboardId(
  dashboardId: string
): Promise<AnalyticsDashboardWidget[]> {
  const result = await db.query(
    `SELECT * FROM analytics_dashboard_widgets 
     WHERE dashboard_id = $1
     ORDER BY position->>'y' ASC, position->>'x' ASC`,
    [dashboardId]
  );
  
  return result.rows.map(mapAnalyticsDashboardWidgetFromDb);
}

/**
 * Update dashboard widget
 */
export async function updateDashboardWidget(
  id: string,
  data: {
    title?: string;
    widgetType?: string;
    configuration?: Record<string, any>;
    position?: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  }
): Promise<AnalyticsDashboardWidget | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  
  if (data.widgetType !== undefined) {
    updates.push(`widget_type = $${paramIndex++}`);
    values.push(data.widgetType);
  }
  
  if (data.configuration !== undefined) {
    updates.push(`configuration = $${paramIndex++}`);
    values.push(data.configuration);
  }
  
  if (data.position !== undefined) {
    updates.push(`position = $${paramIndex++}`);
    values.push(data.position);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing widget
  if (updates.length === 1) {
    return getDashboardWidgetById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_dashboard_widgets 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsDashboardWidgetFromDb(result.rows[0]);
}

/**
 * Delete dashboard widget
 */
export async function deleteDashboardWidget(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM analytics_dashboard_widgets WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}
