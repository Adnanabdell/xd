import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar' | 'fr';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    reports: 'Reports & Stats',
    adminAudit: 'Audit Logs',
    systemConfig: 'System Config',
    myStudents: 'My Students',
    aiStudio: 'AI Studio',
    signOut: 'Sign Out',
    welcomeBack: 'Welcome back',
    todaysAttendance: "Today's Attendance",
    monthlyAttendance: 'Monthly Avg',
    pendingReports: 'Pending Reports',
    atRiskStudents: 'At Risk Students',
    attendanceByClass: 'Attendance by Class',
    recentActivity: 'Recent Activity',
    saveDraft: 'Save Draft',
    submit: 'Submit',
    preview: 'Preview',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    totalStudents: 'Total Students',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No new notifications',
    startSession: 'Start Session',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    filterBy: 'Filter By',
    class: 'Class',
    subject: 'Subject',
    student: 'Student',
    dateRange: 'Date Range',
    apply: 'Apply Filters',
    status: 'Status',
    reason: 'Reason',
    myClasses: 'My Classes',
    activeSessions: 'Active Sessions',
    // Management
    manageStudents: 'Manage Students',
    manageTeachers: 'Manage Teachers',
    manageClasses: 'Manage Classes',
    manageSubjects: 'Manage Subjects',
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search...',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    code: 'Code',
    gradeLevel: 'Grade Level',
    rollNumber: 'Roll No.',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this item?',
    errorDeleteLinked: 'Cannot delete: Item is linked to other records.',
    successSaved: 'Saved successfully.',
    successDeleted: 'Deleted successfully.',
    adminManagement: 'Administration',
    // AI Editor
    aiEditorTitle: 'Nano Banana Editor',
    aiEditorSubtitle: 'Transform images using generative AI prompts.',
    uploadImage: 'Upload Image',
    dragDrop: 'Drag & drop or click to upload',
    promptLabel: 'Magic Prompt',
    promptPlaceholder: 'E.g., "Add a retro filter" or "Turn the background into a forest"',
    generate: 'Generate Magic',
    original: 'Original',
    result: 'AI Result',
    processing: 'Processing...'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    attendance: 'تسجيل الحضور',
    reports: 'التقارير والإحصائيات',
    adminAudit: 'سجلات النظام',
    systemConfig: 'إعدادات النظام',
    myStudents: 'طلابي',
    aiStudio: 'ستوديو الذكاء الاصطناعي',
    signOut: 'تسجيل الخروج',
    welcomeBack: 'مرحباً بعودتك',
    todaysAttendance: 'حضور اليوم',
    monthlyAttendance: 'المعدل الشهري',
    pendingReports: 'تقارير معلقة',
    atRiskStudents: 'طلاب في دائرة الخطر',
    attendanceByClass: 'الحضور حسب الفصل',
    recentActivity: 'النشاط الأخير',
    saveDraft: 'حفظ مسودة',
    submit: 'إرسال',
    preview: 'معاينة',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    totalStudents: 'إجمالي الطلاب',
    notifications: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة',
    startSession: 'بدء الجلسة',
    exportPDF: 'تصدير PDF',
    exportExcel: 'تصدير Excel',
    filterBy: 'تصفية حسب',
    class: 'الفصل',
    subject: 'المادة',
    student: 'الطالب',
    dateRange: 'التاريخ',
    apply: 'تطبيق التصفية',
    status: 'الحالة',
    reason: 'السبب',
    myClasses: 'فصولي',
    activeSessions: 'جلسات نشطة',
    // Management
    manageStudents: 'إدارة الطلاب',
    manageTeachers: 'إدارة المعلمين',
    manageClasses: 'إدارة الفصول',
    manageSubjects: 'إدارة المواد',
    add: 'إضافة جديد',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث...',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    role: 'الدور',
    code: 'الكود',
    gradeLevel: 'المرحلة الدراسية',
    rollNumber: 'رقم القيد',
    actions: 'الإجراءات',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    errorDeleteLinked: 'لا يمكن الحذف: العنصر مرتبط بسجلات أخرى.',
    successSaved: 'تم الحفظ بنجاح.',
    successDeleted: 'تم الحذف بنجاح.',
    adminManagement: 'الإدارة',
    // AI Editor
    aiEditorTitle: 'محرر نانو بنانا',
    aiEditorSubtitle: 'حول الصور باستخدام أوامر الذكاء الاصطناعي.',
    uploadImage: 'رفع صورة',
    dragDrop: 'اسحب وأفلت أو انقر للرفع',
    promptLabel: 'الأمر السحري',
    promptPlaceholder: 'مثال: "أضف طابع قديم" أو "اجعل الخلفية غابة"',
    generate: 'توليد السحر',
    original: 'الأصلية',
    result: 'النتيجة',
    processing: 'جاري المعالجة...'
  },
  fr: {
    dashboard: 'Tableau de bord',
    attendance: 'Présence',
    reports: 'Rapports & Stats',
    adminAudit: 'Journaux d\'audit',
    systemConfig: 'Config système',
    myStudents: 'Mes étudiants',
    aiStudio: 'Studio IA',
    signOut: 'Déconnexion',
    welcomeBack: 'Bon retour',
    todaysAttendance: 'Présence d\'aujourd\'hui',
    monthlyAttendance: 'Moyenne mensuelle',
    pendingReports: 'Rapports en attente',
    atRiskStudents: 'Étudiants à risque',
    attendanceByClass: 'Présence par classe',
    recentActivity: 'Activité récente',
    saveDraft: 'Enregistrer brouillon',
    submit: 'Soumettre',
    preview: 'Aperçu',
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    totalStudents: 'Total Étudiants',
    notifications: 'Notifications',
    markAllRead: 'Tout marquer comme lu',
    noNotifications: 'Pas de nouvelles notifications',
    startSession: 'Démarrer session',
    exportPDF: 'Exporter PDF',
    exportExcel: 'Exporter Excel',
    filterBy: 'Filtrer par',
    class: 'Classe',
    subject: 'Matière',
    student: 'Étudiant',
    dateRange: 'Plage de dates',
    apply: 'Appliquer filtres',
    status: 'Statut',
    reason: 'Raison',
    myClasses: 'Mes classes',
    activeSessions: 'Sessions actives',
    // Management
    manageStudents: 'Gérer les étudiants',
    manageTeachers: 'Gérer les enseignants',
    manageClasses: 'Gérer les classes',
    manageSubjects: 'Gérer les matières',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    search: 'Chercher...',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    role: 'Rôle',
    code: 'Code',
    gradeLevel: 'Niveau',
    rollNumber: 'Matricule',
    actions: 'Actions',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
    errorDeleteLinked: 'Suppression impossible : Élément lié à d\'autres enregistrements.',
    successSaved: 'Enregistré avec succès.',
    successDeleted: 'Supprimé avec succès.',
    adminManagement: 'Administration',
    // AI Editor
    aiEditorTitle: 'Éditeur Nano Banana',
    aiEditorSubtitle: 'Transformez vos images avec l\'IA.',
    uploadImage: 'Télécharger Image',
    dragDrop: 'Glisser-déposer ou cliquer',
    promptLabel: 'Prompt Magique',
    promptPlaceholder: 'Ex: "Ajouter un filtre rétro" ou "Changer le fond en forêt"',
    generate: 'Générer',
    original: 'Original',
    result: 'Résultat IA',
    processing: 'Traitement...'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [direction, setDirection] = useState<Direction>('ltr');

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(dir);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
