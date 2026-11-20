import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull().default('학습자'),
  birthDate: text('birth_date').notNull().default('1970-01-01'),
  phone: text('phone').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  gradeLabel: text('grade_label').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  tuitionKrw: integer('tuition_krw').notNull(),
  totalLessons: integer('total_lessons').notNull(),
  durationHours: integer('duration_hours').notNull(),
  eligibility: text('eligibility').notNull(),
  examCriteria: text('exam_criteria').notNull(),
  pqiCode: text('pqi_code').notNull(),
  imageUrl: text('image_url').notNull(),
});

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  lessonOrder: integer('lesson_order').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  learningGoal: text('learning_goal').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  lectureNotes: text('lecture_notes').notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  paymentMethod: text('payment_method').notNull().default('card'),
  paymentStatus: text('payment_status').notNull().default('paid'),
  progressPercent: integer('progress_percent').notNull().default(0),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
});

export const lessonProgress = pgTable('lesson_progress', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id')
    .references(() => enrollments.id)
    .notNull(),
  lessonId: integer('lesson_id')
    .references(() => lessons.id)
    .notNull(),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id')
    .references(() => enrollments.id)
    .notNull(),
  programTitle: text('program_title').notNull(),
  targetAudience: text('target_audience').notNull(),
  materials: text('materials').notNull(),
  planContent: text('plan_content').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const examSubmissions = pgTable('exam_submissions', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id')
    .references(() => enrollments.id)
    .notNull(),
  answersJson: text('answers_json').notNull(),
  essayAnswer: text('essay_answer').notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  certNumber: text('cert_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  holderName: text('holder_name').notNull(),
  birthDate: text('birth_date').notNull(),
  gradeLabel: text('grade_label').notNull(),
  courseTitle: text('course_title').notNull(),
  issuedAt: text('issued_at').notNull(),
  issuerName: text('issuer_name').notNull(),
  status: text('status').notNull().default('유효'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  seasonOrTag: text('season_or_tag').notNull(),
  summary: text('summary').notNull(),
  imageUrl: text('image_url').notNull().default(''),
  contentBody: text('content_body').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const instructors = pgTable('instructors', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  certNumber: text('cert_number').notNull(),
  gradeLabel: text('grade_label').notNull(),
  region: text('region').notNull(),
  specialty: text('specialty').notNull(),
  bio: text('bio').notNull(),
  experienceYears: integer('experience_years').notNull().default(1),
  availableForDispatch: boolean('available_for_dispatch').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dispatchInquiries = pgTable('dispatch_inquiries', {
  id: serial('id').primaryKey(),
  organizationName: text('organization_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  contactEmail: text('contact_email').notNull().default(''),
  region: text('region').notNull(),
  inquiryType: text('inquiry_type').notNull(),
  targetInstructorName: text('target_instructor_name').notNull().default(''),
  preferredDate: text('preferred_date').notNull(),
  details: text('details').notNull(),
  status: text('status').notNull().default('접수 완료'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  enrollments: many(enrollments),
  certificates: many(certificates),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  progress: many(lessonProgress),
  assignments: many(assignments),
  exams: many(examSubmissions),
}));
