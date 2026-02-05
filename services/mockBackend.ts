import { 
  User, 
  DBState, 
  AttendanceSession, 
  AttendanceRecord, 
  Role, 
  AuditLog,
  ClassGroup,
  Student,
  Subject,
  Notification
} from '../types';

// --- INITIAL SEED DATA ---

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Principal Skinner', email: 'admin@school.com', role: 'ADMIN', phone: '555-0100', avatarUrl: 'https://ui-avatars.com/api/?name=Principal+Skinner&background=random' },
  { id: 'u2', name: 'Edna Krabappel', email: 'teacher@school.com', role: 'TEACHER', phone: '555-0101', avatarUrl: 'https://ui-avatars.com/api/?name=Edna+Krabappel&background=random' },
  { id: 'u3', name: 'Dewey Largo', email: 'music@school.com', role: 'TEACHER', phone: '555-0102', avatarUrl: 'https://ui-avatars.com/api/?name=Dewey+Largo&background=random' },
];

const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'c1', name: 'Class 4-A', gradeLevel: '4', teacherId: 'u2' },
  { id: 'c2', name: 'Class 5-B', gradeLevel: '5', teacherId: 'u3' },
  { id: 'c3', name: 'Science Club', gradeLevel: 'Mixed', teacherId: 'u2' },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics', code: 'MATH101', teacherId: 'u2' },
  { id: 'sub2', name: 'English Literature', code: 'ENG202', teacherId: 'u2' },
  { id: 'sub3', name: 'Music Theory', code: 'MUS101', teacherId: 'u3' },
  { id: 'sub4', name: 'General Science', code: 'SCI101', teacherId: 'u2' },
];

const INITIAL_STUDENTS: Student[] = Array.from({ length: 25 }, (_, i) => ({
  id: `s${i + 1}`,
  name: `Student ${i + 1}`,
  rollNumber: `R-${100 + i}`,
  gradeLevel: i < 15 ? '4' : '5',
  classId: i < 15 ? 'c1' : 'c2',
  avatarUrl: `https://ui-avatars.com/api/?name=Student+${i+1}&background=random&size=128`
}));

// Mock Notifications
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'High Absence Alert', message: 'Class 4-A has exceeded 15% absence rate today.', type: 'WARNING', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'u2', title: 'Draft Reminder', message: 'You have 2 pending attendance drafts.', type: 'INFO', isRead: false, createdAt: new Date().toISOString() }
];

// Mock Database
const LOAD_DB = (): DBState => {
  const stored = localStorage.getItem('scholarflow_db_v6');
  if (stored) return JSON.parse(stored);
  return {
    users: INITIAL_USERS,
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    students: INITIAL_STUDENTS,
    attendanceSessions: [],
    auditLogs: [],
    notifications: INITIAL_NOTIFICATIONS
  };
};

const SAVE_DB = (db: DBState) => {
  localStorage.setItem('scholarflow_db_v6', JSON.stringify(db));
};

// --- BACKEND SERVICES ---

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 600));
    const db = LOAD_DB();
    const user = db.users.find(u => u.email === email);
    
    // Simple mock password check
    if (!user || password !== 'password') {
      throw new Error('Invalid credentials');
    }
    
    BackendService.logAudit(user, 'LOGIN', 'User logged into the system');
    return user;
  }
};

export const BackendService = {
  // --- CORE SERVICES ---
  logAudit: (user: User, action: string, details: string) => {
    const db = LOAD_DB();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      userId: user.id,
      userName: user.name,
      role: user.role,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    SAVE_DB(db);
  },

  getAuditLogs: async (user: User): Promise<AuditLog[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = LOAD_DB();
    if (user.role !== 'ADMIN') return [];
    return db.auditLogs;
  },

  // --- CRUD: STUDENTS ---
  getAllStudents: async (): Promise<Student[]> => {
    await new Promise(r => setTimeout(r, 200));
    return LOAD_DB().students;
  },

  saveStudent: async (user: User, student: Partial<Student>) => {
    await new Promise(r => setTimeout(r, 400));
    const db = LOAD_DB();
    
    if (student.id) {
      const idx = db.students.findIndex(s => s.id === student.id);
      if (idx > -1) {
        db.students[idx] = { ...db.students[idx], ...student } as Student;
        BackendService.logAudit(user, 'UPDATE_STUDENT', `Updated student ${student.name}`);
      }
    } else {
      const newStudent: Student = {
        id: Math.random().toString(36).substr(2, 9),
        name: student.name!,
        rollNumber: student.rollNumber || `R-${Math.floor(Math.random()*1000)}`,
        gradeLevel: student.gradeLevel || '1',
        classId: student.classId,
        dob: student.dob,
        avatarUrl: `https://ui-avatars.com/api/?name=${student.name}&background=random`
      };
      db.students.push(newStudent);
      BackendService.logAudit(user, 'CREATE_STUDENT', `Created student ${student.name}`);
    }
    SAVE_DB(db);
  },

  deleteStudent: async (user: User, studentId: string) => {
    await new Promise(r => setTimeout(r, 300));
    const db = LOAD_DB();
    
    // CASCADE: Remove this student's records from any attendance sessions
    db.attendanceSessions.forEach(session => {
        session.records = session.records.filter(r => r.studentId !== studentId);
    });

    // Delete the student
    db.students = db.students.filter(s => s.id !== studentId);
    
    BackendService.logAudit(user, 'DELETE_STUDENT', `Deleted student ${studentId} (and associated records)`);
    SAVE_DB(db);
  },

  // --- CRUD: TEACHERS (USERS) ---
  getAllTeachers: async (): Promise<User[]> => {
    return LOAD_DB().users.filter(u => u.role === 'TEACHER');
  },

  saveTeacher: async (user: User, teacher: Partial<User>) => {
    await new Promise(r => setTimeout(r, 400));
    const db = LOAD_DB();
    
    if (teacher.id) {
      const idx = db.users.findIndex(u => u.id === teacher.id);
      if (idx > -1) {
        db.users[idx] = { ...db.users[idx], ...teacher } as User;
        BackendService.logAudit(user, 'UPDATE_TEACHER', `Updated teacher ${teacher.name}`);
      }
    } else {
      const newTeacher: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: teacher.name!,
        email: teacher.email!,
        phone: teacher.phone,
        role: 'TEACHER',
        avatarUrl: `https://ui-avatars.com/api/?name=${teacher.name}&background=random`
      };
      db.users.push(newTeacher);
      BackendService.logAudit(user, 'CREATE_TEACHER', `Created teacher ${teacher.name}`);
    }
    SAVE_DB(db);
  },

  deleteTeacher: async (user: User, teacherId: string) => {
    await new Promise(r => setTimeout(r, 300));
    const db = LOAD_DB();
    
    // CASCADE: Unassign teacher from Classes
    db.classes.forEach(c => {
      if (c.teacherId === teacherId) c.teacherId = undefined;
    });

    // CASCADE: Unassign teacher from Subjects
    db.subjects.forEach(s => {
      if (s.teacherId === teacherId) s.teacherId = undefined;
    });

    // Delete the teacher
    db.users = db.users.filter(u => u.id !== teacherId);
    
    BackendService.logAudit(user, 'DELETE_TEACHER', `Deleted teacher ${teacherId} (Unassigned from Classes/Subjects)`);
    SAVE_DB(db);
  },

  // --- CRUD: CLASSES ---
  getAllClasses: async (): Promise<ClassGroup[]> => {
    return LOAD_DB().classes;
  },

  saveClass: async (user: User, cls: Partial<ClassGroup>) => {
    await new Promise(r => setTimeout(r, 400));
    const db = LOAD_DB();
    
    if (cls.id) {
      const idx = db.classes.findIndex(c => c.id === cls.id);
      if (idx > -1) {
        db.classes[idx] = { ...db.classes[idx], ...cls } as ClassGroup;
        BackendService.logAudit(user, 'UPDATE_CLASS', `Updated class ${cls.name}`);
      }
    } else {
      const newClass: ClassGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: cls.name!,
        gradeLevel: cls.gradeLevel!,
        teacherId: cls.teacherId
      };
      db.classes.push(newClass);
      BackendService.logAudit(user, 'CREATE_CLASS', `Created class ${cls.name}`);
    }
    SAVE_DB(db);
  },

  deleteClass: async (user: User, classId: string) => {
    await new Promise(r => setTimeout(r, 300));
    const db = LOAD_DB();
    
    // CASCADE: Unassign students from this class
    db.students.forEach(s => {
      if (s.classId === classId) s.classId = undefined;
    });
    
    // CASCADE: Delete attendance sessions associated with this class
    db.attendanceSessions = db.attendanceSessions.filter(s => s.classId !== classId);

    // Delete the class
    db.classes = db.classes.filter(c => c.id !== classId);
    
    BackendService.logAudit(user, 'DELETE_CLASS', `Deleted class ${classId} (Unassigned students, removed sessions)`);
    SAVE_DB(db);
  },

  // --- CRUD: SUBJECTS ---
  getAllSubjects: async (): Promise<Subject[]> => {
    return LOAD_DB().subjects;
  },

  saveSubject: async (user: User, sub: Partial<Subject>) => {
    await new Promise(r => setTimeout(r, 400));
    const db = LOAD_DB();
    
    if (sub.id) {
      const idx = db.subjects.findIndex(s => s.id === sub.id);
      if (idx > -1) {
        db.subjects[idx] = { ...db.subjects[idx], ...sub } as Subject;
        BackendService.logAudit(user, 'UPDATE_SUBJECT', `Updated subject ${sub.name}`);
      }
    } else {
      const newSubject: Subject = {
        id: Math.random().toString(36).substr(2, 9),
        name: sub.name!,
        code: sub.code!,
        teacherId: sub.teacherId
      };
      db.subjects.push(newSubject);
      BackendService.logAudit(user, 'CREATE_SUBJECT', `Created subject ${sub.name}`);
    }
    SAVE_DB(db);
  },

  deleteSubject: async (user: User, subId: string) => {
    await new Promise(r => setTimeout(r, 300));
    const db = LOAD_DB();
    
    // CASCADE: Delete attendance sessions associated with this subject
    db.attendanceSessions = db.attendanceSessions.filter(s => s.subjectId !== subId);

    // Delete the subject
    db.subjects = db.subjects.filter(s => s.id !== subId);
    
    BackendService.logAudit(user, 'DELETE_SUBJECT', `Deleted subject ${subId} (Removed associated sessions)`);
    SAVE_DB(db);
  },

  // --- EXISTING ATTENDANCE SERVICES ---

  getClasses: async (user: User): Promise<ClassGroup[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = LOAD_DB();
    if (user.role === 'ADMIN') return db.classes;
    return db.classes.filter(c => c.teacherId === user.id);
  },

  getSubjects: async (user: User): Promise<Subject[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = LOAD_DB();
    if (user.role === 'ADMIN') return db.subjects;
    return db.subjects.filter(s => s.teacherId === user.id);
  },

  getStudentsByClass: async (classId: string): Promise<Student[]> => {
    await new Promise(r => setTimeout(r, 300));
    const db = LOAD_DB();
    return db.students.filter(s => s.classId === classId || (!s.classId && classId === 'c1')); 
  },

  findSession: async (classId: string, date: string, sessionNumber: number): Promise<AttendanceSession | null> => {
    await new Promise(r => setTimeout(r, 200));
    const db = LOAD_DB();
    return db.attendanceSessions.find(s => 
      s.classId === classId && 
      s.date === date && 
      s.sessionNumber === sessionNumber
    ) || null;
  },

  unlockSession: async (user: User, sessionId: string, reason: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 500));
    const db = LOAD_DB();
    
    if (user.role !== 'ADMIN') {
      throw new Error("Unauthorized: Only Admins can unlock sessions.");
    }

    const idx = db.attendanceSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) throw new Error("Session not found");

    db.attendanceSessions[idx].isLocked = false;
    db.attendanceSessions[idx].unlockedByAdminId = user.id;
    db.attendanceSessions[idx].unlockReason = reason;

    BackendService.logAudit(user, 'UNLOCK_SESSION', `Unlocked session ${sessionId} - Reason: ${reason}`);
    SAVE_DB(db);
  },

  saveAttendance: async (
    user: User, 
    classId: string, 
    subjectId: string, 
    sessionNumber: number, 
    date: string, 
    records: AttendanceRecord[],
    status: 'DRAFT' | 'SUBMITTED'
  ): Promise<AttendanceSession> => {
    await new Promise(r => setTimeout(r, 600));
    const db = LOAD_DB();
    
    const existingIndex = db.attendanceSessions.findIndex(s => 
      s.classId === classId && s.date === date && s.sessionNumber === sessionNumber
    );
    
    let isLocked = false;
    let unlockedByAdminId = undefined;
    let unlockReason = undefined;

    // Check if previously unlocked by admin
    if (existingIndex > -1) {
      const prev = db.attendanceSessions[existingIndex];
      unlockedByAdminId = prev.unlockedByAdminId;
      unlockReason = prev.unlockReason;

      // Ensure we don't overwrite manual unlock
      if (prev.isLocked && !prev.unlockedByAdminId && user.role !== 'ADMIN') {
        throw new Error("This session is locked and cannot be modified.");
      }
    }
    
    // Apply locking logic only if NOT manually unlocked
    if (status === 'SUBMITTED' && !unlockedByAdminId) {
      const sessionDate = new Date(date);
      const now = new Date();
      const diffHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) isLocked = true;
    }

    const sessionData: AttendanceSession = {
      id: existingIndex > -1 ? db.attendanceSessions[existingIndex].id : Math.random().toString(36).substr(2, 9),
      classId,
      subjectId,
      sessionNumber,
      date,
      teacherId: user.id,
      records,
      status,
      isLocked,
      createdAt: existingIndex > -1 ? db.attendanceSessions[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unlockedByAdminId,
      unlockReason,
    };

    if (existingIndex > -1) {
      db.attendanceSessions[existingIndex] = sessionData;
      BackendService.logAudit(user, `UPDATE_${status}`, `Updated ${status} session ${sessionNumber} for Class ${classId}`);
    } else {
      db.attendanceSessions.push(sessionData);
      BackendService.logAudit(user, `CREATE_${status}`, `Created ${status} session ${sessionNumber} for Class ${classId}`);
    }
    
    if (status === 'SUBMITTED') {
      const absentCount = records.filter(r => r.status === 'ABSENT').length;
      if (absentCount > records.length * 0.2) {
         db.notifications.push({
           id: Math.random().toString(36).substr(2, 9),
           userId: 'u1', 
           title: 'High Absence Detected',
           message: `Class ${classId} has ${absentCount} absentees on ${date}.`,
           type: 'WARNING',
           isRead: false,
           createdAt: new Date().toISOString()
         });
      }
    }

    SAVE_DB(db);
    return sessionData;
  },

  getNotifications: async (user: User): Promise<Notification[]> => {
    await new Promise(r => setTimeout(r, 200));
    const db = LOAD_DB();
    return db.notifications.filter(n => n.userId === user.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead: async (notifId: string) => {
    const db = LOAD_DB();
    const idx = db.notifications.findIndex(n => n.id === notifId);
    if (idx > -1) {
      db.notifications[idx].isRead = true;
      SAVE_DB(db);
    }
  },

  getDashboardStats: async (user: User) => {
    const db = LOAD_DB();
    const today = new Date().toISOString().split('T')[0];
    
    const relevantSessions = user.role === 'ADMIN' 
      ? db.attendanceSessions 
      : db.attendanceSessions.filter(s => s.teacherId === user.id);

    const todaySessions = relevantSessions.filter(s => s.date === today);
    let todayPresent = 0, todayTotal = 0;
    todaySessions.forEach(s => {
      s.records.forEach(r => {
        todayTotal++;
        if (r.status === 'PRESENT') todayPresent++;
      });
    });
    const dailyRate = todayTotal ? Math.round((todayPresent / todayTotal) * 100) : 0;

    let allPresent = 0, allTotal = 0;
    relevantSessions.forEach(s => {
      s.records.forEach(r => {
        allTotal++;
        if (r.status === 'PRESENT') allPresent++;
      });
    });
    const monthlyRate = allTotal ? Math.round((allPresent / allTotal) * 100) : 0;

    const studentAbsences: Record<string, number> = {};
    db.attendanceSessions.forEach(s => {
      s.records.forEach(r => {
        if (r.status === 'ABSENT') {
          studentAbsences[r.studentId] = (studentAbsences[r.studentId] || 0) + 1;
        }
      });
    });
    
    const atRiskStudents = db.students
      .filter(s => (studentAbsences[s.id] || 0) > 2)
      .map(s => ({ ...s, absenceCount: studentAbsences[s.id] }));

    const chartData = db.classes.map(c => {
      const classSessions = db.attendanceSessions.filter(s => s.classId === c.id);
      let p = 0, t = 0;
      classSessions.forEach(s => { s.records.forEach(r => { t++; if(r.status === 'PRESENT') p++; }) });
      return {
        name: c.name,
        attendance: t ? Math.round((p/t)*100) : 0
      };
    });

    return {
      dailyRate,
      monthlyRate,
      totalStudents: db.students.length,
      totalClasses: db.classes.length,
      pendingDrafts: relevantSessions.filter(s => s.status === 'DRAFT').length,
      atRiskStudents: atRiskStudents,
      chartData,
      todaySessions: todaySessions.map(s => ({
        ...s,
        className: db.classes.find(c => c.id === s.classId)?.name,
        subjectName: db.subjects.find(sub => sub.id === s.subjectId)?.name
      }))
    };
  },

  getReportData: async (filters: any) => {
    await new Promise(r => setTimeout(r, 500));
    const db = LOAD_DB();
    let sessions = db.attendanceSessions;

    if (filters.classId) sessions = sessions.filter(s => s.classId === filters.classId);
    if (filters.subjectId) sessions = sessions.filter(s => s.subjectId === filters.subjectId);
    if (filters.startDate) sessions = sessions.filter(s => s.date >= filters.startDate);
    if (filters.endDate) sessions = sessions.filter(s => s.date <= filters.endDate);

    const rows: any[] = [];
    sessions.forEach(s => {
      const cls = db.classes.find(c => c.id === s.classId);
      const sub = db.subjects.find(sub => sub.id === s.subjectId);
      s.records.forEach(r => {
        if (filters.studentId && r.studentId !== filters.studentId) return; 
        const stu = db.students.find(st => st.id === r.studentId);
        rows.push({
          id: Math.random().toString(36),
          date: s.date,
          session: s.sessionNumber,
          student: stu?.name,
          class: cls?.name,
          subject: sub?.name,
          status: r.status,
          reason: r.absentReason || '-',
          remarks: r.remarks || '-'
        });
      });
    });

    return rows;
  }
};