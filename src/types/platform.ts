export interface LessonItem {
  id: number;
  courseId: number;
  lessonOrder: number;
  title: string;
  summary: string;
  learningGoal: string;
  durationMinutes: number;
  lectureNotes: string;
}

export interface CourseItem {
  id: number;
  code: string;
  gradeLabel: string;
  title: string;
  subtitle: string;
  description: string;
  tuitionKrw: number;
  totalLessons: number;
  durationHours: number;
  eligibility: string;
  examCriteria: string;
  pqiCode: string;
  imageUrl: string;
  lessons: LessonItem[];
}

export interface AssignmentRecord {
  id: number;
  enrollmentId: number;
  programTitle: string;
  targetAudience: string;
  materials: string;
  planContent: string;
  submittedAt: string;
}

export interface ExamSubmissionRecord {
  id: number;
  enrollmentId: number;
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface EnrollmentItem {
  id: number;
  userId: number;
  courseId: number;
  paymentMethod: string;
  paymentStatus: string;
  progressPercent: number;
  enrolledAt: string;
  completedLessonIds: number[];
  assignment: AssignmentRecord | null;
  latestExam: ExamSubmissionRecord | null;
}

export interface CertificateRecord {
  id: number;
  certNumber: string;
  holderName: string;
  birthDate: string;
  gradeLabel: string;
  courseTitle: string;
  issuedAt: string;
  issuerName: string;
  status: string;
}

export interface VerifiedCertificate {
  certNumber: string;
  holderName: string;
  birthDateMasked: string;
  gradeLabel: string;
  courseTitle: string;
  issuedAt: string;
  issuerName: string;
  status: string;
}

export interface ResourceItem {
  id: number;
  category: string;
  title: string;
  seasonOrTag: string;
  summary: string;
  imageUrl: string;
  contentBody: string;
}

export interface InstructorItem {
  id: number;
  name: string;
  certNumber: string;
  gradeLabel: string;
  region: string;
  specialty: string;
  bio: string;
  experienceYears: number;
  availableForDispatch: boolean;
}

export interface DispatchInquiryItem {
  id: number;
  organizationName: string;
  contactName: string;
  contactPhone: string;
  region: string;
  inquiryType: string;
  targetInstructorName: string;
  preferredDate: string;
  details: string;
  status: string;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  birthDate: string;
  phone: string;
}

export interface GeneratedLessonPlan {
  title: string;
  emotionalGoal: string;
  materialsList: string[];
  openingQuestions: string[];
  steps: {
    phase: string;
    duration: string;
    guide: string;
  }[];
  supervisorTip: string;
}
