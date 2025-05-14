import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getComplianceTrends,
  getComplianceTrendsByDate,
  ComplianceTrendPeriod
} from '@/services/compliance/complianceMonitoringService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/compliance/trends
 *
 * Get compliance trends over time
 *
 * Query parameters:
 * - period: The time period to get trends for (1month, 3months, 6months, 1year)
 * - type: Optional filter by requirement type
 * - startDate: Optional start date (ISO format) for custom date range
 * - endDate: Optional end date (ISO format) for custom date range
 * - groupBy: Optional grouping (day, week, month) - defaults based on date range
 *
 * Returns:
 * - 200: Compliance trends data
 * - 400: Bad request (invalid parameters)
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization (admin only)
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period');
    const typeParam = searchParams.get('type');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const groupByParam = searchParams.get('groupBy');

    // Check if using custom date range
    if (startDateParam && endDateParam) {
      try {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
            { status: 400 }
          );
        }

        if (startDate > endDate) {
          return NextResponse.json(
            { error: 'Start date must be before end date' },
            { status: 400 }
          );
        }

        // Validate groupBy parameter
        const groupBy = groupByParam || 'auto';
        if (!['auto', 'day', 'week', 'month'].includes(groupBy)) {
          return NextResponse.json(
            { error: 'Invalid groupBy parameter. Use auto, day, week, or month' },
            { status: 400 }
          );
        }

        // Get trends by custom date range
        const trends = await getComplianceTrendsByDate(
          startDate,
          endDate,
          groupBy,
          typeParam || undefined
        );

        // Create audit log
        await createAuditLog({
          userId: session.user.id,
          entityType: AuditEntityType.COMPLIANCE_TREND,
          entityId: 'trends',
          action: AuditAction.VIEW,
          details: {
            startDate: startDateParam,
            endDate: endDateParam,
            groupBy,
            type: typeParam
          }
        });

        return NextResponse.json({ trends });
      } catch (error) {
        console.error('Error processing date parameters:', error);
        return NextResponse.json(
          { error: 'Invalid date parameters' },
          { status: 400 }
        );
      }
    } else {
      // Use predefined periods
      const periodValue = periodParam || '6months';

      // Validate period parameter
      let period: ComplianceTrendPeriod;
      switch (periodValue) {
        case '1month':
          period = ComplianceTrendPeriod.ONE_MONTH;
          break;
        case '3months':
          period = ComplianceTrendPeriod.THREE_MONTHS;
          break;
        case '6months':
          period = ComplianceTrendPeriod.SIX_MONTHS;
          break;
        case '1year':
          period = ComplianceTrendPeriod.ONE_YEAR;
          break;
        default:
          period = ComplianceTrendPeriod.SIX_MONTHS;
      }

      // Get compliance trends
      const trends = await getComplianceTrends(period, typeParam || undefined);

      // Create audit log
      await createAuditLog({
        userId: session.user.id,
        entityType: AuditEntityType.COMPLIANCE_TREND,
        entityId: 'trends',
        action: AuditAction.VIEW,
        details: { period: periodValue, type: typeParam }
      });

      return NextResponse.json({ trends });
    }

  } catch (error: any) {
    console.error('Error getting compliance trends:', error);
    return NextResponse.json(
      { error: 'Failed to get compliance trends' },
      { status: 500 }
    );
  }
}
