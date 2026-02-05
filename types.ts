export type Role = 'ADMIN' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  gradeLevel: string;
  classId?: string; // Link to ClassGroup
  dob?: string;
  avatarUrl?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  gradeLevel: string;
  teacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId?: string; // Teacher qualified to teach this
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type AbsentReason = 'SICK' | 'FAMILY' | 'TRUANT' | 'MEDICAL' | 'OTHER' | null;
export type SessionStatus = 'DRAFT' | 'SUBMITTED';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  absentReason?: AbsentReason; // Mandatory if status is ABSENT
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  subjectId: string;
  sessionNumber: number; // 1-8
  date: string; // YYYY-MM-DD
  teacherId: string;
  records: AttendanceRecord[];
  status: SessionStatus; // Draft or Submitted
  isLocked: boolean;
  lockedAt?: string;
  unlockedByAdminId?: string;
  unlockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  role: Role;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

export interface DBState {
  users: User[];
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  attendanceSessions: AttendanceSession[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}