'use client';

import React, { useState, useEffect } from 'react';

interface SystemService {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  lastChecked: string;
}

export default function AdminSystemHealth() {
  const [services, setServices] = useState<SystemService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        // In a real application, you would fetch this data from your API
        // For now, we'll simulate a successful response after a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setServices([
          {
            name: 'API Server',
            status: 'healthy',
            uptime: '99.98%',
            lastChecked: '2 minutes ago',
          },
          {
            name: 'Database',
            status: 'healthy',
            uptime: '99.95%',
            lastChecked: '2 minutes ago',
          },
          {
            name: 'Redis Cache',
            status: 'healthy',
            uptime: '99.99%',
            lastChecked: '2 minutes ago',
          },
          {
            name: 'Storage Service',
            status: 'degraded',
            uptime: '98.75%',
            lastChecked: '2 minutes ago',
          },
          {
            name: 'Email Service',
            status: 'healthy',
            uptime: '99.90%',
            lastChecked: '2 minutes ago',
          },
          {
            name: 'SMS Service',
            status: 'healthy',
            uptime: '99.85%',
            lastChecked: '2 minutes ago',
          },
        ]);
      } catch (err) {
        console.error('Error fetching system health:', err);
        setError('Failed to load system health information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSystemHealth();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (error) {
    return (
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
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">System Health</h2>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Last checked: {service.lastChecked}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
