import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackendService } from '../services/mockBackend';
import { Student, ClassGroup } from '../types';
import { Search, Plus, Edit, Trash2, X, Check } from 'lucide-react';

export const Students: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (user?.role === 'ADMIN') {
      const [allStudents, allClasses] = await Promise.all([
        BackendService.getAllStudents(),
        BackendService.getAllClasses()
      ]);
      setStudents(allStudents);
      setClasses(allClasses);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await BackendService.saveStudent(user, editingStudent);
      setMessage({ type: 'success', text: t('successSaved') });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving student' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm(t('confirmDelete'))) return;
    try {
      await BackendService.deleteStudent(user, id);
      setMessage({ type: 'success', text: t('successDeleted') });
      loadData();
    } catch (err: any) {
      alert(t('errorDeleteLinked'));
    }
  };

  const openModal = (student?: Student) => {
    setEditingStudent(student || {});
    setIsModalOpen(true);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('manageStudents')}</h2>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition"
        >
          <Plus size={18} className="me-2" /> {t('add')}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <Search size={18} className="text-gray-400 me-3" />
          <input 
            type="text"
            placeholder={t('search')}
            className="flex-1 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('name')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('rollNumber')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('class')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img src={student.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-200 me-3" />
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {classes.find(c => c.id === student.classId)?.name || '-'}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openModal(student)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingStudent.id ? t('edit') : t('add')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input 
                  required
                  className="w-full border rounded-lg p-2"
                  value={editingStudent.name || ''}
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('rollNumber')}</label>
                <input 
                  className="w-full border rounded-lg p-2"
                  value={editingStudent.rollNumber || ''}
                  onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('class')}</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={editingStudent.classId || ''}
                  onChange={e => setEditingStudent({...editingStudent, classId: e.target.value})}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date"
                  className="w-full border rounded-lg p-2"
                  value={editingStudent.dob || ''}
                  onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};