'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/user';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart2, 
  Calendar, 
  MessageSquare, 
  Shield, 
  AlertTriangle, 
  FileCheck, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== UserRole.ADMIN)) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'User Management', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Case Management', href: '/admin/cases', icon: <FileText className="h-5 w-5" /> },
    { name: 'Expert Management', href: '/admin/experts', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Form Builder', href: '/admin/forms/builder', icon: <FileCheck className="h-5 w-5" /> },
    { name: 'Security & Compliance', href: '/admin/security', icon: <Shield className="h-5 w-5" /> },
    { name: 'Analytics', href: '/admin/analytics', icon: <BarChart2 className="h-5 w-5" /> },
    { name: 'Reports', href: '/admin/reports', icon: <FileText className="h-5 w-5" /> },
    { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const securitySubItems = [
    { name: 'Security Dashboard', href: '/admin/security' },
    { name: 'Security Alerts', href: '/admin/security/alerts' },
    { name: 'Data Subject Requests', href: '/admin/security/data-subject-requests' },
    { name: 'Security Policies', href: '/admin/security/policies' },
    { name: 'Access Reviews', href: '/admin/security/access-reviews' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/admin" className="text-xl font-bold text-blue-600">
                Career Ireland
              </Link>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigationItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`mr-3 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                  
                  {/* Security sub-items */}
                  {item.href === '/admin/security' && isActive('/admin/security') && (
                    <div className="ml-8 mt-2 space-y-1">
                      {securitySubItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`group flex items-center px-2 py-2 text-xs font-medium rounded-md ${
                            pathname === subItem.href
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {session?.user?.name || 'Admin User'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 text-xs text-gray-500 group-hover:text-gray-700 flex items-center"
                    onClick={() => router.push('/api/auth/signout')}
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="bg-white shadow">
          <div className="px-4 py-2 flex items-center justify-between">
            <Link href="/admin" className="text-xl font-bold text-blue-600">
              Career Ireland
            </Link>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col h-full">
                  <div className="flex-1 py-6 overflow-y-auto">
                    <div className="px-4 mb-8">
                      <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                    </div>
                    <div className="space-y-1">
                      {navigationItems.map((item) => (
                        <div key={item.href}>
                          <Link
                            href={item.href}
                            className={`group flex items-center px-4 py-2 text-sm font-medium ${
                              isActive(item.href)
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className={`mr-3 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                              {item.icon}
                            </div>
                            {item.name}
                          </Link>
                          
                          {/* Security sub-items */}
                          {item.href === '/admin/security' && isActive('/admin/security') && (
                            <div className="ml-8 mt-2 space-y-1">
                              {securitySubItems.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className={`group flex items-center px-2 py-2 text-xs font-medium rounded-md ${
                                    pathname === subItem.href
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 border-t border-gray-200 p-4">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {session?.user?.name || 'Admin User'}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 text-xs text-gray-500 flex items-center"
                          onClick={() => router.push('/api/auth/signout')}
                        >
                          <LogOut className="h-3 w-3 mr-1" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
