'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3Icon, PieChartIcon, LineChartIcon, UsersIcon, FileTextIcon, CalendarIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon, DownloadIcon } from 'lucide-react';

// Mock data for analytics
const mockAnalytics = {
  users: {
    total: 1250,
    newThisMonth: 85,
    activeThisMonth: 720,
    byRole: {
      applicant: 980,
      agent: 45,
      expert: 25,
      admin: 5,
    },
    growth: 12.5,
  },
  cases: {
    total: 850,
    activeThisMonth: 320,
    completedThisMonth: 45,
    byStatus: {
      draft: 120,
      submitted: 280,
      inReview: 210,
      approved: 180,
      rejected: 60,
    },
    growth: 8.2,
  },
  consultations: {
    total: 256,
    scheduledThisMonth: 48,
    completedThisMonth: 32,
    revenue: 28750,
    growth: 15.3,
  },
  documents: {
    total: 3250,
    uploadedThisMonth: 420,
    processedThisMonth: 380,
    byType: {
      passport: 520,
      visa: 480,
      workPermit: 320,
      birthCertificate: 280,
      educationCertificate: 420,
      employmentLetter: 380,
      other: 850,
    },
    growth: 10.8,
  },
  monthlyStats: [
    { month: 'Jan', users: 45, cases: 32, consultations: 18, documents: 210 },
    { month: 'Feb', users: 52, cases: 38, consultations: 22, documents: 245 },
    { month: 'Mar', users: 58, cases: 42, consultations: 25, documents: 280 },
    { month: 'Apr', users: 65, cases: 48, consultations: 30, documents: 320 },
    { month: 'May', users: 72, cases: 55, consultations: 35, documents: 360 },
    { month: 'Jun', users: 80, cases: 62, consultations: 42, documents: 410 },
    { month: 'Jul', users: 85, cases: 68, consultations: 38, documents: 420 },
    { month: 'Aug', users: 92, cases: 75, consultations: 46, documents: 450 },
  ],
};

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState('last6months');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate fetching data when time range changes
  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      // In a real implementation, this would call an API endpoint with the selected time range
      // For now, we'll just use the mock data
      setAnalytics(mockAnalytics);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeRange]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Key metrics and insights for your platform</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.users.total}</div>
                  <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {analytics.users.growth > 0 ? (
                    <>
                      <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{analytics.users.growth}% increase</span>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{Math.abs(analytics.users.growth)}% decrease</span>
                    </>
                  )}
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.cases.total}</div>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <FileTextIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {analytics.cases.growth > 0 ? (
                    <>
                      <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{analytics.cases.growth}% increase</span>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{Math.abs(analytics.cases.growth)}% decrease</span>
                    </>
                  )}
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.consultations.total}</div>
                  <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {analytics.consultations.growth > 0 ? (
                    <>
                      <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{analytics.consultations.growth}% increase</span>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{Math.abs(analytics.consultations.growth)}% decrease</span>
                    </>
                  )}
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">€{analytics.consultations.revenue.toLocaleString()}</div>
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <DollarSignIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  From {analytics.consultations.total} consultations
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>
                  Monthly growth across key metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <LineChartIcon className="h-32 w-32 text-gray-300" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {analytics.monthlyStats.map((data) => (
                    <div key={data.month} className="text-center">
                      <div className="font-medium">{data.month}</div>
                      <div className="text-xs text-indigo-600">{data.users} users</div>
                      <div className="text-xs text-blue-600">{data.cases} cases</div>
                      <div className="text-xs text-purple-600">{data.consultations} consults</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>
                  Breakdown of users by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <PieChartIcon className="h-32 w-32 text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {Object.entries(analytics.users.byRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="capitalize">{role}</div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                  Recent user engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">New Users This Month</div>
                  <div className="font-medium">{analytics.users.newThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Active Users This Month</div>
                  <div className="font-medium">{analytics.users.activeThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Active Rate</div>
                  <div className="font-medium">{((analytics.users.activeThisMonth / analytics.users.total) * 100).toFixed(1)}%</div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/users">
                    View User Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Case Activity</CardTitle>
                <CardDescription>
                  Recent case processing metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Active Cases This Month</div>
                  <div className="font-medium">{analytics.cases.activeThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Completed Cases This Month</div>
                  <div className="font-medium">{analytics.cases.completedThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Completion Rate</div>
                  <div className="font-medium">{((analytics.cases.completedThisMonth / analytics.cases.activeThisMonth) * 100).toFixed(1)}%</div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/cases">
                    View Case Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Consultation Activity</CardTitle>
                <CardDescription>
                  Recent consultation metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Scheduled This Month</div>
                  <div className="font-medium">{analytics.consultations.scheduledThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Completed This Month</div>
                  <div className="font-medium">{analytics.consultations.completedThisMonth}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Completion Rate</div>
                  <div className="font-medium">{((analytics.consultations.completedThisMonth / analytics.consultations.scheduledThisMonth) * 100).toFixed(1)}%</div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/analytics/consultations">
                    View Consultation Analytics
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Processing</CardTitle>
                <CardDescription>
                  Document processing metrics and distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="h-64 flex items-center justify-center">
                      <BarChart3Icon className="h-32 w-32 text-gray-300" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Total Documents</div>
                      <div className="font-medium">{analytics.documents.total}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Uploaded This Month</div>
                      <div className="font-medium">{analytics.documents.uploadedThisMonth}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Processed This Month</div>
                      <div className="font-medium">{analytics.documents.processedThisMonth}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Processing Rate</div>
                      <div className="font-medium">{((analytics.documents.processedThisMonth / analytics.documents.uploadedThisMonth) * 100).toFixed(1)}%</div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Document Types</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(analytics.documents.byType).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <div className="text-sm capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="text-sm font-medium">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/documents">
                    View Document Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
