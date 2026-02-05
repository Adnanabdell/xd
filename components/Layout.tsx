import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackendService } from '../services/mockBackend';
import { Notification } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Settings, 
  LogOut, 
  ShieldAlert,
  Menu,
  X,
  Bell,
  Globe,
  BarChart,
  UserPlus,
  BookOpen,
  Briefcase
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentPage }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, direction, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);

  // Fetch Notifications periodically (Simulated WebSocket)
  useEffect(() => {
    if (user) {
      const fetchNotifs = () => BackendService.getNotifications(user).then(setNotifications);
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return <>{children}</>;

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-colors ${
        currentPage === page 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium text-start">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir={direction}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 start-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold flex items-center space-x-2 rtl:space-x-reverse">
              <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">S</span>
              <span>ScholarFlow</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 mx-10">Manager v2.0</p>
          </div>

          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavItem page="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItem page="attendance" icon={CalendarCheck} label={t('attendance')} />
            <NavItem page="reports" icon={BarChart} label={t('reports')} />
            
            {user.role === 'ADMIN' && (
              <>
                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('adminManagement')}
                </div>
                <NavItem page="students" icon={Users} label={t('manageStudents')} />
                <NavItem page="teachers" icon={Briefcase} label={t('manageTeachers')} />
                <NavItem page="classes" icon={UserPlus} label={t('manageClasses')} />
                <NavItem page="subjects" icon={BookOpen} label={t('manageSubjects')} />
                <NavItem page="admin-audit" icon={ShieldAlert} label={t('adminAudit')} />
              </>
            )}
            
            {user.role === 'TEACHER' && (
              <NavItem page="my-students" icon={Users} label={t('myStudents')} />
            )}
          </div>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 px-2">
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <LogOut size={16} />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 lg:hidden me-4">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
              {t(currentPage === 'dashboard' ? 'dashboard' : currentPage)}
            </h2>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Language Switcher */}
            <div className="relative">
              <button onClick={() => setShowLang(!showLang)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <Globe size={20} />
              </button>
              {showLang && (
                <div className="absolute top-10 end-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                  <button onClick={() => { setLanguage('en'); setShowLang(false); }} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-50">English</button>
                  <button onClick={() => { setLanguage('ar'); setShowLang(false); }} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-50 font-arabic">العربية</button>
                  <button onClick={() => { setLanguage('fr'); setShowLang(false); }} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-50">Français</button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute top-10 end-0 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-semibold text-sm">{t('notifications')}</span>
                    <button className="text-xs text-blue-600 hover:underline">{t('markAllRead')}</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">{t('noNotifications')}</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 text-end">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};