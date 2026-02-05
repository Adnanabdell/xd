import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackendService } from '../services/mockBackend';
import { ClassGroup, Subject, Student } from '../types';
import { 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  
  // Filters
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]); // For Admin specific student search

  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    studentId: '',
    startDate: '',
    endDate: ''
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        BackendService.getClasses(user),
        BackendService.getSubjects(user),
        user.role === 'ADMIN' ? BackendService.getStudentsByClass('c1') : Promise.resolve([]) // Mock fetching all students for admin filter
      ]).then(([c, sub, st]) => {
        setClasses(c);
        setSubjects(sub);
        if(st) setStudents(st);
      });
    }
  }, [user]);

  const handleSearch = async () => {
    setLoading(true);
    const result = await BackendService.getReportData(filters);
    setData(result);
    setLoading(false);
  };

  const exportData = (type: 'pdf' | 'excel') => {
    alert(`Exporting to ${type.toUpperCase()}... (Mock functionality)\nRecords: ${data.length}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('reports')}</h2>
          <p className="text-gray-500 text-sm">Generate advanced statistics and export data.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => exportData('pdf')} 
             className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition"
           >
             <FileText size={16} className="me-2" /> {t('exportPDF')}
           </button>
           <button 
             onClick={() => exportData('excel')}
             className="flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium text-sm transition"
           >
             <FileSpreadsheet size={16} className="me-2" /> {t('exportExcel')}
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center text-sm uppercase tracking-wide">
          <Filter size={16} className="me-2" /> {t('filterBy')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select 
            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFilters({...filters, classId: e.target.value})}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFilters({...filters, subjectId: e.target.value})}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <input 
            type="date" 
            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={t('dateRange')}
            onChange={e => setFilters({...filters, startDate: e.target.value})}
          />
           <input 
            type="date" 
            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFilters({...filters, endDate: e.target.value})}
          />

          <button 
            onClick={handleSearch}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
          >
             {loading ? <RefreshCw className="animate-spin" /> : t('apply')}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('student')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('class')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('dateRange')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('reason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    {loading ? 'Processing...' : 'No data matches filter criteria.'}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.student}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{row.class} - {row.subject}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{row.date}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold
                        ${row.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 
                          row.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {t(row.status.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{row.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};