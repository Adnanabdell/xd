import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BackendService } from '../services/mockBackend';
import { ClassGroup, Student, AttendanceRecord, Subject, AttendanceStatus, AbsentReason, AttendanceSession } from '../types';
import { 
  Save, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  User as UserIcon,
  Download,
  Eye,
  X,
  Lock,
  Unlock
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  
  // --- STEPS STATE ---
  // Step 1: Configuration (Class, Subject, Session, Date)
  // Step 2: Recording (List of students)
  const [step, setStep] = useState<1 | 2>(1);

  // --- CONFIG DATA ---
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [config, setConfig] = useState({
    classId: '',
    subjectId: '',
    sessionNumber: 1,
    date: new Date().toISOString().split('T')[0]
  });

  // --- SESSION DATA ---
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [existingSession, setExistingSession] = useState<AttendanceSession | null>(null);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // --- UNLOCK STATE ---
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (user) {
      Promise.all([
        BackendService.getClasses(user),
        BackendService.getSubjects(user)
      ]).then(([cls, subs]) => {
        setClasses(cls);
        setSubjects(subs);
        // Defaults
        if (cls.length) setConfig(p => ({ ...p, classId: cls[0].id }));
        if (subs.length) setConfig(p => ({ ...p, subjectId: subs[0].id }));
      });
    }
  }, [user]);

  // --- STEP 1: CONFIGURATION HANDLERS ---
  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const studs = await BackendService.getStudentsByClass(config.classId);
      setStudents(studs);

      // 2. Check for existing session (Draft or Submitted)
      const session = await BackendService.findSession(config.classId, config.date, config.sessionNumber);
      setExistingSession(session);

      // 3. Initialize Records
      const initialRecords: Record<string, AttendanceRecord> = {};
      studs.forEach(s => {
        const found = session?.records.find(r => r.studentId === s.id);
        if (found) {
          initialRecords[s.id] = found;
        } else {
          // Default to PRESENT for new sessions
          initialRecords[s.id] = { studentId: s.id, status: 'PRESENT' };
        }
      });
      setRecords(initialRecords);
      setStep(2);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: RECORDING HANDLERS ---
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        // Reset reason if switching back to present/late
        absentReason: status === 'ABSENT' ? prev[studentId].absentReason : undefined
      }
    }));
  };

  const updateReason = (studentId: string, reason: AbsentReason) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], absentReason: reason }
    }));
  };

  const updateNote = (studentId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: note }
    }));
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    // Validation for SUBMIT
    if (status === 'SUBMITTED') {
      const missingReasons = Object.values(records).filter(r => r.status === 'ABSENT' && !r.absentReason);
      if (missingReasons.length > 0) {
        setError(`Please provide reasons for ${missingReasons.length} absent students.`);
        return;
      }
    }

    setLoading(true);
    try {
      const recordArray = Object.values(records);
      const session = await BackendService.saveAttendance(
        user!, 
        config.classId, 
        config.subjectId, 
        config.sessionNumber, 
        config.date, 
        recordArray, 
        status
      );
      
      setExistingSession(session);

      if (status === 'SUBMITTED') {
        alert("Attendance submitted successfully!");
        setStep(1); // Reset flow
      } else {
        alert("Draft saved.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!existingSession) return;
    if (!unlockReason.trim()) {
      alert("Please provide a reason to unlock.");
      return;
    }

    setLoading(true);
    try {
      await BackendService.unlockSession(user!, existingSession.id, unlockReason);
      alert("Session unlocked.");
      setShowUnlockModal(false);
      setUnlockReason('');
      
      // Refresh session data
      const refreshedSession = await BackendService.findSession(config.classId, config.date, config.sessionNumber);
      setExistingSession(refreshedSession);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPUTED STATS ---
  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(records).filter(r => r.status === 'PRESENT').length;
    const absent = Object.values(records).filter(r => r.status === 'ABSENT').length;
    const late = Object.values(records).filter(r => r.status === 'LATE').length;
    return { total, present, absent, late, percent: total ? Math.round((present / total) * 100) : 0 };
  }, [records, students]);

  const selectedClass = classes.find(c => c.id === config.classId);
  const selectedSubject = subjects.find(s => s.id === config.subjectId);

  // --- RENDER CONFIGURATION (STEP 1) ---
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="mr-3 text-blue-600" /> 
            Start Attendance Session
          </h2>

          <div className="space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={config.subjectId}
                onChange={e => setConfig({ ...config, subjectId: e.target.value })}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Group</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={config.classId}
                onChange={e => setConfig({ ...config, classId: e.target.value })}
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Session Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session (1-8)</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={config.sessionNumber}
                  onChange={e => setConfig({ ...config, sessionNumber: Number(e.target.value) })}
                >
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Session {n}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={config.date}
                  onChange={e => setConfig({ ...config, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleStartSession}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-lg"
              >
                {loading ? 'Initializing...' : (
                  <>Start Recording <ChevronRight className="ml-2" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER RECORDING (STEP 2) ---
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {selectedClass?.name} <span className="text-gray-300">|</span> {selectedSubject?.name}
          </h1>
          <div className="text-sm text-gray-500 mt-1 flex gap-4">
             <span className="flex items-center"><Clock size={14} className="mr-1"/> Session {config.sessionNumber}</span>
             <span className="flex items-center"><UserIcon size={14} className="mr-1"/> {config.date}</span>
             {existingSession && (
               <span className={`px-2 py-0.5 rounded text-xs font-bold ${existingSession.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                 {existingSession.status}
               </span>
             )}
          </div>
        </div>
        <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline mt-2 md:mt-0">
          Change Session
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200 animate-pulse">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Locked Status Banner */}
      {existingSession?.isLocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center text-orange-800">
            <Lock size={20} className="mr-2" />
            <span className="font-semibold">This session is locked due to time restrictions.</span>
          </div>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium text-sm flex items-center"
            >
              <Unlock size={16} className="mr-2" /> Unlock Session
            </button>
          )}
        </div>
      )}

      {/* Unlocked By Admin Banner */}
      {!existingSession?.isLocked && existingSession?.unlockedByAdminId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm flex items-center">
          <Unlock size={16} className="mr-2" />
          <span>Unlocked by Admin. Reason: {existingSession.unlockReason}</span>
        </div>
      )}

      {/* Student List */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 ${existingSession?.isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
        {students.map(student => {
          const record = records[student.id];
          const isAbsent = record.status === 'ABSENT';

          return (
            <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Student Info */}
                <div className="flex items-center min-w-[200px]">
                  <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.rollNumber}</p>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-2">
                  <StatusButton 
                    status="PRESENT" 
                    current={record.status} 
                    onClick={() => updateStatus(student.id, 'PRESENT')} 
                  />
                  <StatusButton 
                    status="LATE" 
                    current={record.status} 
                    onClick={() => updateStatus(student.id, 'LATE')} 
                  />
                  <StatusButton 
                    status="ABSENT" 
                    current={record.status} 
                    onClick={() => updateStatus(student.id, 'ABSENT')} 
                  />
                </div>

                {/* Conditional Reason Input */}
                <div className="flex-1 flex flex-col md:flex-row gap-2">
                  {isAbsent && (
                    <>
                      <select 
                        className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                        value={record.absentReason || ''}
                        onChange={(e) => updateReason(student.id, e.target.value as AbsentReason)}
                      >
                        <option value="">Select Reason *</option>
                        <option value="SICK">Sickness</option>
                        <option value="FAMILY">Family Emergency</option>
                        <option value="MEDICAL">Medical Appt</option>
                        <option value="TRUANT">Truant/Unknown</option>
                        <option value="OTHER">Other</option>
                      </select>
                      
                      <input 
                        type="text"
                        placeholder="Optional note..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={record.remarks || ''}
                        onChange={(e) => updateNote(student.id, e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10 lg:pl-64">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Real-time Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center text-green-700 font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              Present: {stats.present}
            </div>
            <div className="flex items-center text-red-700 font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
              Absent: {stats.absent}
            </div>
            <div className="flex items-center text-gray-500">
              Attendance: <span className="ml-1 font-bold text-gray-800">{stats.percent}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleSave('DRAFT')}
              disabled={loading || existingSession?.isLocked}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Draft
            </button>
            
            <button 
              onClick={() => setShowPreview(true)}
              className="flex-1 md:flex-none px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center justify-center"
            >
              <Eye size={18} className="mr-2" /> Preview
            </button>

            <button 
              onClick={() => handleSave('SUBMITTED')}
              disabled={loading || existingSession?.isLocked}
              className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (existingSession?.isLocked ? 'Locked' : 'Submit')}
            </button>
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Unlock size={20} className="mr-2 text-blue-600" /> Unlock Session
              </h3>
              <button onClick={() => setShowUnlockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Unlocking this session will allow edits. This action will be recorded in the audit log.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for unlocking</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="e.g., Teacher made a mistake, System error..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowUnlockModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button 
                  onClick={handleUnlock}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                >
                  {loading ? 'Processing...' : 'Confirm Unlock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal 
          onClose={() => setShowPreview(false)}
          data={{
            className: selectedClass?.name,
            subjectName: selectedSubject?.name,
            teacherName: user?.name,
            date: config.date,
            session: config.sessionNumber,
            stats,
            records,
            students
          }}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StatusButton = ({ status, current, onClick }: { status: string, current: string, onClick: () => void }) => {
  let baseClass = "px-3 py-1.5 rounded-md text-xs font-bold transition-all border ";
  let activeClass = "";
  let inactiveClass = "bg-white border-gray-200 text-gray-400 hover:bg-gray-50";

  switch (status) {
    case 'PRESENT':
      activeClass = "bg-green-100 border-green-200 text-green-700 shadow-sm ring-1 ring-green-300";
      break;
    case 'LATE':
      activeClass = "bg-yellow-100 border-yellow-200 text-yellow-700 shadow-sm ring-1 ring-yellow-300";
      break;
    case 'ABSENT':
      activeClass = "bg-red-100 border-red-200 text-red-700 shadow-sm ring-1 ring-red-300";
      break;
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseClass} ${current === status ? activeClass : inactiveClass}`}
    >
      {status.charAt(0)}
    </button>
  );
};

const PreviewModal = ({ onClose, data }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-gray-800">Attendance Report Preview</h3>
           <p className="text-sm text-gray-500">Review details before submission</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      {/* Report Content */}
      <div className="p-8 overflow-y-auto flex-1 font-mono text-sm">
        <div className="border-2 border-gray-800 p-6 mb-6">
          <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
             <h2 className="text-2xl font-bold uppercase tracking-widest">ScholarFlow Academy</h2>
             <p>Daily Attendance Record</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p><span className="font-bold">Class:</span> {data.className}</p>
              <p><span className="font-bold">Subject:</span> {data.subjectName}</p>
              <p><span className="font-bold">Teacher:</span> {data.teacherName}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Date:</span> {data.date}</p>
              <p><span className="font-bold">Session:</span> {data.session}</p>
              <p><span className="font-bold">Generated:</span> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <table className="w-full text-left mb-6 border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-2">Student</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s: any) => {
                const rec = data.records[s.id];
                return (
                  <tr key={s.id} className="border-b border-gray-200">
                    <td className="py-2">{s.name} ({s.rollNumber})</td>
                    <td className="py-2 font-bold">{rec.status}</td>
                    <td className="py-2 text-gray-600 italic">
                      {rec.status === 'ABSENT' ? (rec.absentReason || 'No Reason') : '-'}
                      {rec.remarks ? ` (${rec.remarks})` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between items-center bg-gray-100 p-4 font-bold">
             <span>Total: {data.stats.total}</span>
             <span>Present: {data.stats.present}</span>
             <span>Absent: {data.stats.absent}</span>
             <span>Percentage: {data.stats.percent}%</span>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
        <button onClick={() => alert('Simulating PDF Download...')} className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          <FileText size={16} className="mr-2" /> PDF
        </button>
        <button onClick={() => alert('Simulating Excel Download...')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <Download size={16} className="mr-2" /> Excel
        </button>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-white">
          Close
        </button>
      </div>
    </div>
  </div>
);