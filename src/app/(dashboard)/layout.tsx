'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Calendar, 
  ChevronDown, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  MessageSquare, 
  Settings, 
  User, 
  Users, 
  X 
} from 'lucide-react';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  useEffect(() => {
    // Fetch unread notifications count
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/unread/count');
        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.count);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    if (session) {
      fetchNotifications();
    }
  }, [session]);
  
  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session) {
    return <>{children}</>;
  }
  
  const isApplicant = session.user.role === UserRole.APPLICANT;
  const isAgent = session.user.role === UserRole.AGENT;
  const isExpert = session.user.role === UserRole.EXPERT;
  const isAdmin = session.user.role === UserRole.ADMIN;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
          <h1 className="text-xl font-bold ml-2">Career Ireland</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                    {unreadNotifications}
                  </Badge>
                )}
              </div>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-card shadow-lg p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1">
              {/* Common Navigation Links */}
              <Link 
                href="/dashboard" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/dashboard' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
              
              {/* Role-specific Links */}
              {isApplicant && (
                <>
                  <Link 
                    href="/cases/new" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/cases/new' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    New Application
                  </Link>
                  <Link 
                    href="/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Consultations
                  </Link>
                </>
              )}
              
              {(isAgent || isAdmin) && (
                <>
                  <Link 
                    href="/agent/cases" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/agent/cases' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Case Queue
                  </Link>
                  <Link 
                    href="/agent/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/agent/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Consultations
                  </Link>
                </>
              )}
              
              {isExpert && (
                <>
                  <Link 
                    href="/expert/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/expert/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    My Consultations
                  </Link>
                  <Link 
                    href="/expert/availability" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/expert/availability' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Availability
                  </Link>
                </>
              )}
              
              {/* Common Links */}
              <Link 
                href="/messages" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/messages' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Messages
              </Link>
              
              <Link 
                href="/profile" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/profile' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <User className="mr-2 h-5 w-5" />
                Profile
              </Link>
              
              <Link 
                href="/settings" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/settings' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Link>
              
              <Link 
                href="/logout" 
                className="flex items-center px-3 py-2 rounded-md text-red-500 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Link>
            </nav>
          </div>
        </div>
      )}
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:static lg:block`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold">Career Ireland</h1>
              <p className="text-sm text-muted-foreground">
                {session.user.role === UserRole.APPLICANT && 'Applicant Portal'}
                {session.user.role === UserRole.AGENT && 'Agent Portal'}
                {session.user.role === UserRole.EXPERT && 'Expert Portal'}
                {session.user.role === UserRole.ADMIN && 'Admin Portal'}
              </p>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {/* Common Navigation Links */}
              <Link 
                href="/dashboard" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/dashboard' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
              
              {/* Role-specific Links */}
              {isApplicant && (
                <>
                  <Link 
                    href="/cases/new" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/cases/new' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    New Application
                  </Link>
                  <Link 
                    href="/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Consultations
                  </Link>
                </>
              )}
              
              {(isAgent || isAdmin) && (
                <>
                  <Link 
                    href="/agent/cases" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/agent/cases' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Case Queue
                  </Link>
                  <Link 
                    href="/agent/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/agent/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Consultations
                  </Link>
                </>
              )}
              
              {isExpert && (
                <>
                  <Link 
                    href="/expert/consultations" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/expert/consultations' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    My Consultations
                  </Link>
                  <Link 
                    href="/expert/availability" 
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === '/expert/availability' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Availability
                  </Link>
                </>
              )}
              
              {/* Common Links */}
              <Link 
                href="/messages" 
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === '/messages' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Messages
              </Link>
            </nav>
            
            <div className="p-4 border-t">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
