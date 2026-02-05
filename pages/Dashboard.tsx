import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackendService } from '../services/mockBackend';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      BackendService.getDashboardStats(user).then(setStats);
    }
  }, [user]);

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('welcomeBack')}, {user?.name.split(' ')[0]}</h2>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('todaysAttendance')} 
          value={`${stats.dailyRate}%`} 
          icon={TrendingUp} 
          color="bg-green-500" 
        />
        <StatsCard 
          title={user?.role === 'ADMIN' ? t('totalStudents') : t('myClasses')} 
          value={user?.role === 'ADMIN' ? stats.totalStudents : stats.totalClasses} 
          icon={user?.role === 'ADMIN' ? GraduationCap : Users} 
          color="bg-blue-500" 
        />
        <StatsCard 
          title={user?.role === 'ADMIN' ? t('monthlyAttendance') : t('pendingReports')} 
          value={user?.role === 'ADMIN' ? `${stats.monthlyRate}%` : stats.pendingDrafts} 
          icon={Calendar} 
          color="bg-purple-500" 
        />
        <StatsCard 
          title={user?.role === 'ADMIN' ? t('atRiskStudents') : t('activeSessions')} 
          value={user?.role === 'ADMIN' ? stats.atRiskStudents.length : stats.todaySessions.length} 
          icon={user?.role === 'ADMIN' ? AlertTriangle : Clock} 
          color="bg-orange-500" 
        />
      </div>

      {/* ROLE BASED CONTENT */}
      {user?.role === 'ADMIN' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Attendance By Class */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">{t('attendanceByClass')}</h3>
            <div className="h-64" dir="ltr"> {/* Force LTR for Charts */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* At Risk List */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center text-red-600">
              <AlertTriangle size={18} className="me-2" />
              {t('atRiskStudents')}
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {stats.atRiskStudents.length === 0 ? (
                <p className="text-gray-400 text-sm">No students above threshold.</p>
              ) : (
                stats.atRiskStudents.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center">
                      <img src={s.avatarUrl} className="w-8 h-8 rounded-full bg-red-200 me-3" alt="" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.rollNumber}</p>
                      </div>
                    </div>
                    <div className="text-red-700 font-bold text-sm">
                      {s.absenceCount} Abs
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Teacher Schedule */}
           <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4">{t('todaysAttendance')}</h3>
             <div className="space-y-3">
               {stats.todaySessions.length === 0 ? (
                 <p className="text-gray-400">No sessions recorded today.</p>
               ) : (
                 stats.todaySessions.map((s: any) => (
                   <div key={s.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                     <div>
                       <h4 className="font-bold text-gray-800">{s.subjectName} - {s.className}</h4>
                       <p className="text-sm text-gray-500">Session {s.sessionNumber} • {s.date}</p>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                       {s.status}
                     </span>
                   </div>
                 ))
               )}
             </div>
             <button className="mt-4 w-full py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 text-sm flex items-center justify-center">
                {t('startSession')} <ChevronRight size={16} className="ms-2" />
             </button>
           </div>
           
           {/* Drafts Summary */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center">
               <FileText size={18} className="me-2 text-gray-500" />
               {t('pendingReports')}
             </h3>
             <div className="flex flex-col items-center justify-center h-48">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.pendingDrafts}</div>
                <p className="text-gray-500 text-center text-sm">Drafts waiting for submission</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4 rtl:space-x-reverse">
    <div className={`p-4 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);