'use client';

import React from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

export default function NotificationSettingsPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center">
            <Link
              href="/settings"
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Manage how you receive notifications from Career Ireland Immigration.
          </p>
        </div>
        
        <NotificationPreferences />
      </div>
    </AuthenticatedLayout>
  );
}
