'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/user';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import AdminRecentActivity from '@/components/admin/AdminRecentActivity';
import AdminUserTable from '@/components/admin/AdminUserTable';
import AdminSystemHealth from '@/components/admin/AdminSystemHealth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          throw new Error('User not authenticated');
        }
        
        const parsedUser = JSON.parse(userData);
        
        // Check if user is admin
        if (parsedUser.role !== UserRole.ADMIN) {
          throw new Error('Unauthorized access');
        }
        
        setUser(parsedUser);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('You do not have permission to access this page.');
        
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'You do not have permission to access this page.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          System overview and management
        </p>
      </div>
      
      {/* Admin Navigation */}
      <div className="mb-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto">
          <Link
            href="/admin"
            className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            User Management
          </Link>
          <Link
            href="/admin/cases"
            className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            Case Management
          </Link>
          <Link
            href="/admin/settings"
            className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            System Settings
          </Link>
          <Link
            href="/admin/security"
            className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            Security
          </Link>
          <Link
            href="/admin/logs"
            className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
          >
            Audit Logs
          </Link>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Dashboard Stats */}
        <AdminDashboardStats />
        
        {/* System Health */}
        <AdminSystemHealth />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <AdminRecentActivity />
          </div>
          
          {/* User Management */}
          <div>
            <AdminUserTable />
          </div>
        </div>
      </div>
    </div>
  );
}
