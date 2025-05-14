'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AuditAction, AuditEntityType } from '@/types/audit';

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  details: any;
  timestamp: string;
}

export default function AdminRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // In a real application, you would fetch this data from your API
        // For now, we'll simulate a successful response after a delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Sample data
        const now = new Date();
        const sampleActivities: ActivityItem[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            entityType: AuditEntityType.CASE,
            entityId: 'case1',
            action: AuditAction.UPDATE_STATUS,
            details: { oldStatus: 'submitted', newStatus: 'in_review' },
            timestamp: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 minutes ago
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Jane Smith',
            entityType: AuditEntityType.DOCUMENT,
            entityId: 'doc1',
            action: AuditAction.UPLOAD,
            details: { fileName: 'passport.pdf', fileSize: 1024 * 1024 },
            timestamp: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 minutes ago
          },
          {
            id: '3',
            userId: 'user3',
            userName: 'Michael Johnson',
            entityType: AuditEntityType.USER,
            entityId: 'user4',
            action: AuditAction.CREATE,
            details: { email: 'new.user@example.com', role: 'applicant' },
            timestamp: new Date(now.getTime() - 45 * 60000).toISOString(), // 45 minutes ago
          },
          {
            id: '4',
            userId: 'user5',
            userName: 'Sarah Williams',
            entityType: AuditEntityType.CASE,
            entityId: 'case2',
            action: AuditAction.ASSIGN_AGENT,
            details: { agentId: 'agent1', agentName: 'Agent Smith' },
            timestamp: new Date(now.getTime() - 120 * 60000).toISOString(), // 2 hours ago
          },
          {
            id: '5',
            userId: 'user6',
            userName: 'David Brown',
            entityType: AuditEntityType.DOCUMENT,
            entityId: 'doc2',
            action: AuditAction.UPDATE_STATUS,
            details: { oldStatus: 'pending', newStatus: 'approved' },
            timestamp: new Date(now.getTime() - 180 * 60000).toISOString(), // 3 hours ago
          },
        ];
        
        setActivities(sampleActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError('Failed to load recent activity');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, []);
  
  const getActionDescription = (activity: ActivityItem): string => {
    switch (activity.action) {
      case AuditAction.CREATE:
        return `created a new ${activity.entityType}`;
      case AuditAction.UPDATE:
        return `updated a ${activity.entityType}`;
      case AuditAction.DELETE:
        return `deleted a ${activity.entityType}`;
      case AuditAction.UPDATE_STATUS:
        return `updated status of a ${activity.entityType} from "${activity.details.oldStatus}" to "${activity.details.newStatus}"`;
      case AuditAction.ASSIGN_AGENT:
        return `assigned a ${activity.entityType} to ${activity.details.agentName}`;
      case AuditAction.UPDATE_PRIORITY:
        return `updated priority of a ${activity.entityType}`;
      case AuditAction.UPLOAD:
        return `uploaded a document "${activity.details.fileName}"`;
      case AuditAction.DOWNLOAD:
        return `downloaded a ${activity.entityType}`;
      case AuditAction.LOGIN:
        return `logged in`;
      case AuditAction.LOGOUT:
        return `logged out`;
      default:
        return `performed action ${activity.action} on a ${activity.entityType}`;
    }
  };
  
  const getEntityLink = (activity: ActivityItem): string => {
    switch (activity.entityType) {
      case AuditEntityType.USER:
        return `/admin/users/${activity.entityId}`;
      case AuditEntityType.CASE:
        return `/cases/${activity.entityId}`;
      case AuditEntityType.DOCUMENT:
        return `/documents?id=${activity.entityId}`;
      default:
        return '#';
    }
  };
  
  const getActionIcon = (activity: ActivityItem) => {
    switch (activity.action) {
      case AuditAction.CREATE:
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case AuditAction.UPDATE:
      case AuditAction.UPDATE_STATUS:
      case AuditAction.UPDATE_PRIORITY:
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case AuditAction.DELETE:
        return (
          <div className="bg-red-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      case AuditAction.ASSIGN_AGENT:
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case AuditAction.UPLOAD:
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        );
      case AuditAction.DOWNLOAD:
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
        );
      case AuditAction.LOGIN:
      case AuditAction.LOGOUT:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Recent Activity</h2>
        <Link
          href="/admin/logs"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex space-x-4">
                <div className="flex-shrink-0">
                  {getActionIcon(activity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {activity.userName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {getActionDescription(activity)}
                  </p>
                  <div className="mt-2">
                    <Link
                      href={getEntityLink(activity)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
