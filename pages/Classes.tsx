import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackendService } from '../services/mockBackend';
import { ClassGroup, User } from '../types';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';

export const Classes: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassGroup>>({});
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (user?.role === 'ADMIN') {
      const [allClasses, allTeachers] = await Promise.all([
        BackendService.getAllClasses(),
        BackendService.getAllTeachers()
      ]);
      setClasses(allClasses);
      setTeachers(allTeachers);
    }
  };

  const filtered = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await BackendService.saveClass(user, editingClass);
      setMessage({ type: 'success', text: t('successSaved') });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving class' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm(t('confirmDelete'))) return;
    try {
      await BackendService.deleteClass(user, id);
      setMessage({ type: 'success', text: t('successDeleted') });
      loadData();
    } catch (err: any) {
      alert(t('errorDeleteLinked'));
    }
  };

  const openModal = (cls?: ClassGroup) => {
    setEditingClass(cls || {});
    setIsModalOpen(true);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('manageClasses')}</h2>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition">
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
            type="text" placeholder={t('search')} className="flex-1 outline-none text-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('name')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('gradeLevel')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">Teacher</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-start">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(cls => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{cls.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cls.gradeLevel}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{teachers.find(t => t.id === cls.teacherId)?.name || '-'}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openModal(cls)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(cls.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
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
              <h3 className="text-xl font-bold">{editingClass.id ? t('edit') : t('add')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input required className="w-full border rounded-lg p-2"
                  value={editingClass.name || ''} onChange={e => setEditingClass({...editingClass, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('gradeLevel')}</label>
                <input required className="w-full border rounded-lg p-2"
                  value={editingClass.gradeLevel || ''} onChange={e => setEditingClass({...editingClass, gradeLevel: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select className="w-full border rounded-lg p-2"
                  value={editingClass.teacherId || ''} onChange={e => setEditingClass({...editingClass, teacherId: e.target.value})}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
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