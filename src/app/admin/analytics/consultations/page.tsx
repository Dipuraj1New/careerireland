'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronLeftIcon, DownloadIcon, BarChart3Icon, PieChartIcon, LineChartIcon, CalendarIcon, UserIcon, DollarSignIcon, ClockIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { ConsultationStatus } from '@/types/consultation';

// Mock data for analytics
const mockAnalytics = {
  totalConsultations: 256,
  totalRevenue: 28750,
  averageRating: 4.7,
  completionRate: 92,
  consultationsByStatus: {
    [ConsultationStatus.SCHEDULED]: 45,
    [ConsultationStatus.CONFIRMED]: 32,
    [ConsultationStatus.IN_PROGRESS]: 8,
    [ConsultationStatus.COMPLETED]: 156,
    [ConsultationStatus.CANCELLED]: 12,
    [ConsultationStatus.NO_SHOW]: 3,
  },
  consultationsByMonth: [
    { month: 'Jan', count: 18, revenue: 2025 },
    { month: 'Feb', count: 22, revenue: 2475 },
    { month: 'Mar', count: 25, revenue: 2800 },
    { month: 'Apr', count: 30, revenue: 3375 },
    { month: 'May', count: 35, revenue: 3950 },
    { month: 'Jun', count: 42, revenue: 4725 },
    { month: 'Jul', count: 38, revenue: 4275 },
    { month: 'Aug', count: 46, revenue: 5125 },
  ],
  topExperts: [
    { id: '1', name: 'John Doe', consultations: 48, revenue: 5400, rating: 4.9 },
    { id: '2', name: 'Jane Smith', consultations: 42, revenue: 4725, rating: 4.8 },
    { id: '3', name: 'Michael Johnson', consultations: 36, revenue: 4050, rating: 4.7 },
    { id: '4', name: 'Sarah Williams', consultations: 32, revenue: 3600, rating: 4.6 },
    { id: '5', name: 'Robert Brown', consultations: 28, revenue: 3150, rating: 4.5 },
  ],
  topServices: [
    { id: '101', name: 'Initial Consultation', count: 86, revenue: 6450, averageDuration: 30 },
    { id: '102', name: 'Comprehensive Case Review', count: 64, revenue: 9600, averageDuration: 60 },
    { id: '103', name: 'Document Preparation Assistance', count: 52, revenue: 6240, averageDuration: 45 },
    { id: '104', name: 'Visa Application Review', count: 38, revenue: 4560, averageDuration: 45 },
    { id: '105', name: 'Appeal Strategy Session', count: 16, revenue: 2400, averageDuration: 60 },
  ],
};

export default function ConsultationAnalyticsPage() {
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
  
  // Calculate month-over-month growth
  const calculateGrowth = () => {
    if (analytics.consultationsByMonth.length < 2) return 0;
    
    const currentMonth = analytics.consultationsByMonth[analytics.consultationsByMonth.length - 1];
    const previousMonth = analytics.consultationsByMonth[analytics.consultationsByMonth.length - 2];
    
    return ((currentMonth.count - previousMonth.count) / previousMonth.count) * 100;
  };
  
  const growth = calculateGrowth();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Button variant="outline" asChild className="mr-4">
              <Link href="/admin/analytics">
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Back to Analytics
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Consultation Analytics</h1>
          </div>
          <p className="text-gray-500">Insights and metrics for expert consultations</p>
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
                <CardTitle className="text-sm font-medium text-gray-500">Total Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.totalConsultations}</div>
                  <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {growth > 0 ? (
                    <>
                      <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">{growth.toFixed(1)}% increase</span>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{Math.abs(growth).toFixed(1)}% decrease</span>
                    </>
                  )}
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">€{analytics.totalRevenue.toLocaleString()}</div>
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <DollarSignIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Average €{(analytics.totalRevenue / analytics.totalConsultations).toFixed(2)} per consultation
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                  <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                    <UserIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(analytics.averageRating)
                            ? 'text-yellow-500'
                            : i < analytics.averageRating
                            ? 'text-yellow-300'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{analytics.completionRate}%</div>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {analytics.consultationsByStatus[ConsultationStatus.COMPLETED]} completed out of {analytics.totalConsultations} total
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Consultations by Status</CardTitle>
                <CardDescription>
                  Distribution of consultations by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <PieChartIcon className="h-32 w-32 text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {Object.entries(analytics.consultationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge
                          variant="outline"
                          className={`mr-2 ${
                            status === ConsultationStatus.CONFIRMED
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : status === ConsultationStatus.COMPLETED
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : status === ConsultationStatus.SCHEDULED
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : status === ConsultationStatus.CANCELLED
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : status === ConsultationStatus.IN_PROGRESS
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Consultations Over Time</CardTitle>
                <CardDescription>
                  Monthly consultation count and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <LineChartIcon className="h-32 w-32 text-gray-300" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {analytics.consultationsByMonth.map((data) => (
                    <div key={data.month} className="text-center">
                      <div className="font-medium">{data.month}</div>
                      <div className="text-sm text-gray-500">{data.count}</div>
                      <div className="text-xs text-green-600">€{data.revenue}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="experts" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="experts">Top Experts</TabsTrigger>
              <TabsTrigger value="services">Top Services</TabsTrigger>
            </TabsList>
            
            <TabsContent value="experts">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Experts</CardTitle>
                  <CardDescription>
                    Experts with the highest number of consultations and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expert</TableHead>
                        <TableHead className="text-right">Consultations</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topExperts.map((expert) => (
                        <TableRow key={expert.id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/experts/${expert.id}`} className="text-indigo-600 hover:underline">
                              {expert.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">{expert.consultations}</TableCell>
                          <TableCell className="text-right">€{expert.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <span className="mr-1">{expert.rating}</span>
                              <svg
                                className="h-4 w-4 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/admin/experts">
                      View All Experts
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Top Services</CardTitle>
                  <CardDescription>
                    Most popular consultation services by count and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg. Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.name}
                          </TableCell>
                          <TableCell className="text-right">{service.count}</TableCell>
                          <TableCell className="text-right">€{service.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{service.averageDuration} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/admin/services">
                      Manage Services
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
