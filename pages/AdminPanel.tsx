import React, { useEffect, useState } from 'react';
import { BackendService } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { AuditLog } from '../types';
import { Shield, Clock, FileText, Search } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      BackendService.getAuditLogs(user).then(setLogs);
    }
  }, [user]);

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-10 rounded-lg">
                <Shield size={24} className="text-blue-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold">Security Audit Log</h2>
                <p className="text-slate-400 text-sm">Monitor all sensitive system actions and overrides.</p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 flex items-center">
                <FileText size={18} className="mr-2" /> Recent Events
            </h3>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 text-sm">
                            <td className="px-6 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-3 font-medium text-gray-900">{log.userName}</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {log.role}
                                </span>
                            </td>
                            <td className="px-6 py-3">
                                <span className={`font-semibold ${log.action.includes('UNLOCK') ? 'text-red-600' : 'text-blue-600'}`}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-gray-600 max-w-md truncate" title={log.details}>
                                {log.details}
                            </td>
                        </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                No logs found matching your criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};