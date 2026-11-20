import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  assignments,
  certificates,
  courses,
  dispatchInquiries,
  enrollments,
  examSubmissions,
  instructors,
  lessonProgress,
  lessons,
  resources,
} from './schema.ts';
import { ensureSeedData } from './seed.ts';

export async function getCoursesWithLessons() {
  try {
    await ensureSeedData();
    const courseRows = await db.select().from(courses).orderBy(desc(courses.id));
    const lessonRows = await db
      .select()
      .from(lessons)
      .orderBy(asc(lessons.courseId), asc(lessons.lessonOrder));

    // Order Grade 2 first, then Grade 1 for gentle learning progression
    const sortedCourses = [...courseRows].sort((a, b) =>
      a.code === 'GRADE_2' ? -1 : b.code === 'GRADE_2' ? 1 : 0
    );

    return sortedCourses.map((course) => ({
      ...course,
      lessons: lessonRows.filter((l) => l.courseId === course.id),
    }));
  } catch (error) {
    console.error('Database query failed in getCoursesWithLessons:', error);
    throw new Error('교육 과정 정보를 불러오지 못했습니다.', { cause: error });
  }
}

export async function getResources() {
  try {
    await ensureSeedData();
    return await db.select().from(resources).orderBy(asc(resources.id));
  } catch (error) {
    console.error('Database query failed in getResources:', error);
    throw new Error('자료실 목록을 불러오지 못했습니다.', { cause: error });
  }
}

export async function getInstructors() {
  try {
    await ensureSeedData();
    return await db.select().from(instructors).orderBy(desc(instructors.id));
  } catch (error) {
    console.error('Database query failed in getInstructors:', error);
    throw new Error('강사 목록을 불러오지 못했습니다.', { cause: error });
  }
}

export async function verifyCertificatePublic(certNumber: string, holderName?: string) {
  try {
    await ensureSeedData();
    const normalized = certNumber.trim().toUpperCase();
    const rows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certNumber, normalized))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const cert = rows[0];
    if (holderName && holderName.trim().length > 0) {
      if (cert.holderName.trim() !== holderName.trim()) {
        return null;
      }
    }

    return {
      certNumber: cert.certNumber,
      holderName: cert.holderName,
      birthDateMasked:
        cert.birthDate.length >= 7
          ? `${cert.birthDate.slice(0, 4)}.**.${cert.birthDate.slice(-2)}`
          : cert.birthDate,
      gradeLabel: cert.gradeLabel,
      courseTitle: cert.courseTitle,
      issuedAt: cert.issuedAt,
      issuerName: cert.issuerName,
      status: cert.status,
    };
  } catch (error) {
    console.error('Database query failed in verifyCertificatePublic:', error);
    throw new Error('자격증 진위 조회 중 오류가 발생했습니다.', { cause: error });
  }
}

export async function createDispatchInquiry(input: {
  organizationName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  region: string;
  inquiryType: string;
  targetInstructorName?: string;
  preferredDate: string;
  details: string;
}) {
  try {
    await ensureSeedData();
    const inserted = await db
      .insert(dispatchInquiries)
      .values({
        organizationName: input.organizationName.trim(),
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone.trim(),
        contactEmail: (input.contactEmail ?? '').trim(),
        region: input.region.trim(),
        inquiryType: input.inquiryType.trim(),
        targetInstructorName: (input.targetInstructorName ?? '').trim(),
        preferredDate: input.preferredDate.trim(),
        details: input.details.trim(),
        status: '접수 완료',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed in createDispatchInquiry:', error);
    throw new Error('출강 및 단체 교육 문의 접수에 실패했습니다.', { cause: error });
  }
}

export async function getRecentInquiries() {
  try {
    await ensureSeedData();
    return await db
      .select()
      .from(dispatchInquiries)
      .orderBy(desc(dispatchInquiries.id))
      .limit(10);
  } catch (error) {
    console.error('Database query failed in getRecentInquiries:', error);
    throw new Error('문의 내역을 불러오지 못했습니다.', { cause: error });
  }
}

export async function getUserDashboard(userId: number) {
  try {
    await ensureSeedData();
    const userEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.id));

    const allProgress = await db.select().from(lessonProgress);
    const allAssignments = await db.select().from(assignments);
    const allExams = await db.select().from(examSubmissions);
    const userCerts = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.id));

    const enrichedEnrollments = userEnrollments.map((enr) => {
      const completedLessonIds = allProgress
        .filter((p) => p.enrollmentId === enr.id && p.completed)
        .map((p) => p.lessonId);
      const assignment =
        allAssignments.find((a) => a.enrollmentId === enr.id) ?? null;
      const latestExam =
        allExams
          .filter((e) => e.enrollmentId === enr.id)
          .sort((a, b) => b.id - a.id)[0] ?? null;

      return {
        ...enr,
        completedLessonIds,
        assignment,
        latestExam,
      };
    });

    return {
      enrollments: enrichedEnrollments,
      certificates: userCerts,
    };
  } catch (error) {
    console.error('Database query failed in getUserDashboard:', error);
    throw new Error('나의 강의실 데이터를 불러오지 못했습니다.', { cause: error });
  }
}

export async function enrollInCourse(
  userId: number,
  courseId: number,
  paymentMethod: string
) {
  try {
    await ensureSeedData();
    const existing = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const inserted = await db
      .insert(enrollments)
      .values({
        userId,
        courseId,
        paymentMethod,
        paymentStatus: 'paid',
        progressPercent: 0,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed in enrollInCourse:', error);
    throw new Error('수강 신청 처리에 실패했습니다.', { cause: error });
  }
}

export async function toggleLessonCompletion(
  userId: number,
  enrollmentId: number,
  lessonId: number
) {
  try {
    const enrRows = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)))
      .limit(1);

    if (enrRows.length === 0) {
      throw new Error('수강 내역을 찾을 수 없습니다.');
    }

    const enr = enrRows[0];
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.enrollmentId, enrollmentId),
          eq(lessonProgress.lessonId, lessonId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(lessonProgress)
        .set({
          completed: !existing[0].completed,
          completedAt: !existing[0].completed ? new Date() : null,
        })
        .where(eq(lessonProgress.id, existing[0].id));
    } else {
      await db.insert(lessonProgress).values({
        enrollmentId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      });
    }

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, enr.courseId));

    const completedRows = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.enrollmentId, enrollmentId),
          eq(lessonProgress.completed, true)
        )
      );

    const total = Math.max(courseLessons.length, 1);
    const percent = Math.round((completedRows.length / total) * 100);

    const updated = await db
      .update(enrollments)
      .set({ progressPercent: percent })
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    return {
      enrollment: updated[0],
      completedLessonIds: completedRows.map((r) => r.lessonId),
    };
  } catch (error) {
    console.error('Database update failed in toggleLessonCompletion:', error);
    if (error instanceof Error && error.message === '수강 내역을 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('강의 진도 저장에 실패했습니다.', { cause: error });
  }
}

export async function submitAssignmentPlan(
  userId: number,
  enrollmentId: number,
  input: {
    programTitle: string;
    targetAudience: string;
    materials: string;
    planContent: string;
  }
) {
  try {
    const enrRows = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)))
      .limit(1);

    if (enrRows.length === 0) {
      throw new Error('수강 내역을 찾을 수 없습니다.');
    }

    const existing = await db
      .select()
      .from(assignments)
      .where(eq(assignments.enrollmentId, enrollmentId))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(assignments)
        .set({
          programTitle: input.programTitle.trim(),
          targetAudience: input.targetAudience.trim(),
          materials: input.materials.trim(),
          planContent: input.planContent.trim(),
          submittedAt: new Date(),
        })
        .where(eq(assignments.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(assignments)
      .values({
        enrollmentId,
        programTitle: input.programTitle.trim(),
        targetAudience: input.targetAudience.trim(),
        materials: input.materials.trim(),
        planContent: input.planContent.trim(),
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in submitAssignmentPlan:', error);
    throw new Error('프로그램 계획안 과제 제출에 실패했습니다.', { cause: error });
  }
}

const EXAM_ANSWER_KEY: Record<number, number> = {
  1: 1, // 이야기 나눔과 공감 대화 우선
  2: 2, // 묵직한 도자기 물통과 잡기 편한 도구
  3: 0, // 긍정 피드백 및 열린 질문
  4: 2, // 한 번에 3~4가지 색 제공(선택 과부하 방지)
  5: 1, // 도입-표현-나눔 3단계 및 관찰 일지 기록
};

export async function submitOnlineExam(
  userId: number,
  userHolderName: string,
  userBirthDate: string,
  enrollmentId: number,
  answers: Record<number, number>,
  essayAnswer: string
) {
  try {
    const enrRows = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)))
      .limit(1);

    if (enrRows.length === 0) {
      throw new Error('수강 내역을 찾을 수 없습니다.');
    }

    const enr = enrRows[0];
    if (enr.progressPercent < 80) {
      throw new Error('온라인 진도율 80% 이상 달성 후 시험에 응시할 수 있습니다.');
    }

    const courseRows = await db
      .select()
      .from(courses)
      .where(eq(courses.id, enr.courseId))
      .limit(1);
    const course = courseRows[0];

    let mcScore = 0;
    for (const [qIdStr, correctIdx] of Object.entries(EXAM_ANSWER_KEY)) {
      const qId = Number(qIdStr);
      if (answers[qId] === correctIdx) {
        mcScore += 16;
      }
    }
    const essayScore = essayAnswer.trim().length >= 15 ? 20 : 8;
    const totalScore = mcScore + essayScore;
    const passingThreshold = course.code === 'GRADE_1' ? 75 : 70;
    const passed = totalScore >= passingThreshold;

    const submission = await db
      .insert(examSubmissions)
      .values({
        enrollmentId,
        answersJson: JSON.stringify(answers),
        essayAnswer: essayAnswer.trim(),
        score: totalScore,
        passed,
      })
      .returning();

    let issuedCertificate = null;

    if (passed) {
      const existingCert = await db
        .select()
        .from(certificates)
        .where(
          and(
            eq(certificates.userId, userId),
            eq(certificates.courseId, course.id)
          )
        )
        .limit(1);

      if (existingCert.length > 0) {
        issuedCertificate = existingCert[0];
      } else {
        const allCerts = await db.select().from(certificates);
        const gradeCode = course.code === 'GRADE_1' ? '01' : '02';
        const seqNum = String(allCerts.length + 15).padStart(4, '0');
        const certNumber = `2027-${gradeCode}-${seqNum}`;
        const today = new Date().toISOString().slice(0, 10);

        const certRows = await db
          .insert(certificates)
          .values({
            certNumber,
            userId,
            courseId: course.id,
            holderName: userHolderName.trim() || '학습자',
            birthDate: userBirthDate.trim() || '1970-01-01',
            gradeLabel: course.gradeLabel,
            courseTitle:
              course.code === 'GRADE_1' ? '회상미술 지도사 1급' : '회상미술 지도사 2급',
            issuedAt: today,
            issuerName: '메모리테라피회상미술 연구원',
            status: '유효',
          })
          .returning();

        issuedCertificate = certRows[0];
      }
    }

    return {
      submission: submission[0],
      certificate: issuedCertificate,
    };
  } catch (error) {
    console.error('Database error in submitOnlineExam:', error);
    if (error instanceof Error && error.message.includes('80%')) {
      throw error;
    }
    throw new Error('온라인 시험 채점 및 자격 발급 중 오류가 발생했습니다.', {
      cause: error,
    });
  }
}

export async function registerInstructor(
  userId: number,
  input: {
    name: string;
    certNumber: string;
    gradeLabel: string;
    region: string;
    specialty: string;
    bio: string;
    experienceYears: number;
  }
) {
  try {
    await ensureSeedData();
    const inserted = await db
      .insert(instructors)
      .values({
        userId,
        name: input.name.trim(),
        certNumber: input.certNumber.trim().toUpperCase(),
        gradeLabel: input.gradeLabel.trim(),
        region: input.region.trim(),
        specialty: input.specialty.trim(),
        bio: input.bio.trim(),
        experienceYears: Math.max(1, Number(input.experienceYears) || 1),
        availableForDispatch: true,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed in registerInstructor:', error);
    throw new Error('강사 프로필 등록에 실패했습니다.', { cause: error });
  }
}
