import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  createDispatchInquiry,
  enrollInCourse,
  getCoursesWithLessons,
  getInstructors,
  getRecentInquiries,
  getResources,
  getUserDashboard,
  registerInstructor,
  submitAssignmentPlan,
  submitOnlineExam,
  toggleLessonCompletion,
  verifyCertificatePublic,
} from './src/db/queries.ts';
import { getOrCreateUser, updateUserProfile } from './src/db/users.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Public Catalog & Pamphlet Routes
  app.get('/api/courses', async (_req, res) => {
    try {
      const data = await getCoursesWithLessons();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '과정 조회 실패' });
    }
  });

  app.get('/api/resources', async (_req, res) => {
    try {
      const data = await getResources();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '자료 조회 실패' });
    }
  });

  app.get('/api/instructors', async (_req, res) => {
    try {
      const data = await getInstructors();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '강사 목록 조회 실패' });
    }
  });

  app.get('/api/inquiries', async (_req, res) => {
    try {
      const data = await getRecentInquiries();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '의뢰 목록 조회 실패' });
    }
  });

  app.post('/api/inquiries', async (req, res) => {
    try {
      const {
        organizationName,
        contactName,
        contactPhone,
        contactEmail,
        region,
        inquiryType,
        targetInstructorName,
        preferredDate,
        details,
      } = req.body ?? {};

      if (!organizationName || !contactName || !contactPhone || !region || !details) {
        return res
          .status(400)
          .json({ error: '기관명, 담당자명, 연락처, 지역, 문의 내용을 모두 입력해 주세요.' });
      }

      const created = await createDispatchInquiry({
        organizationName,
        contactName,
        contactPhone,
        contactEmail,
        region,
        inquiryType: inquiryType || '강사 출강 의뢰',
        targetInstructorName,
        preferredDate: preferredDate || '협의 후 결정',
        details,
      });

      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '문의 접수 실패' });
    }
  });

  // Public Certificate Authenticity Verification
  app.get('/api/certificates/verify', async (req, res) => {
    try {
      const certNumber = String(req.query.certNumber || '').trim();
      const holderName = String(req.query.holderName || '').trim();

      if (!certNumber) {
        return res.status(400).json({ error: '자격증 발급번호를 입력해 주세요.' });
      }

      const verified = await verifyCertificatePublic(certNumber, holderName);
      if (!verified) {
        return res.status(404).json({
          valid: false,
          error: '입력하신 번호와 일치하는 정식 발급 자격증이 조회되지 않습니다.',
        });
      }

      res.json({ valid: true, certificate: verified });
    } catch (error: any) {
      res.status(500).json({ error: error.message || '자격증 조회 실패' });
    }
  });

  // Authenticated User & LMS Routes
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const name = req.user!.name || '';
      const user = await getOrCreateUser(uid, email, name);
      const dashboard = await getUserDashboard(user.id);
      res.json({ user, ...dashboard });
    } catch (error: any) {
      res.status(500).json({ error: error.message || '내 정보 조회 실패' });
    }
  });

  app.put('/api/me/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      await getOrCreateUser(uid, email, req.user!.name);
      const { name, birthDate, phone } = req.body ?? {};
      if (!name || !birthDate) {
        return res.status(400).json({ error: '성명과 생년월일을 입력해 주세요.' });
      }
      const updated = await updateUserProfile(uid, {
        name: String(name).trim(),
        birthDate: String(birthDate).trim(),
        phone: String(phone || '').trim(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '프로필 저장 실패' });
    }
  });

  app.post('/api/enrollments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const user = await getOrCreateUser(uid, req.user!.email || '', req.user!.name);
      const { courseId, paymentMethod } = req.body ?? {};
      if (!courseId) {
        return res.status(400).json({ error: '신청할 과정을 선택해 주세요.' });
      }
      const enrollment = await enrollInCourse(
        user.id,
        Number(courseId),
        paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card'
      );
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '수강 신청 실패' });
    }
  });

  app.post('/api/lms/progress', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const { enrollmentId, lessonId } = req.body ?? {};
      if (!enrollmentId || !lessonId) {
        return res.status(400).json({ error: '강의 정보가 올바르지 않습니다.' });
      }
      const result = await toggleLessonCompletion(
        user.id,
        Number(enrollmentId),
        Number(lessonId)
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || '진도 저장 실패' });
    }
  });

  app.post('/api/lms/assignment', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const { enrollmentId, programTitle, targetAudience, materials, planContent } =
        req.body ?? {};
      if (!enrollmentId || !programTitle || !planContent) {
        return res.status(400).json({ error: '프로그램명과 활동 내용을 입력해 주세요.' });
      }
      const saved = await submitAssignmentPlan(user.id, Number(enrollmentId), {
        programTitle,
        targetAudience: targetAudience || '복지관 어르신',
        materials: materials || '수채 색연필, 도화지',
        planContent,
      });
      res.status(201).json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message || '과제 제출 실패' });
    }
  });

  app.post('/api/lms/exam', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const { enrollmentId, answers, essayAnswer, holderName, birthDate } = req.body ?? {};
      if (!enrollmentId || !answers) {
        return res.status(400).json({ error: '시험 답안을 모두 선택해 주세요.' });
      }
      const result = await submitOnlineExam(
        user.id,
        holderName || user.name,
        birthDate || user.birthDate,
        Number(enrollmentId),
        answers,
        String(essayAnswer || '')
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || '시험 제출 실패' });
    }
  });

  app.post('/api/instructors', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const { name, certNumber, gradeLabel, region, specialty, bio, experienceYears } =
        req.body ?? {};
      if (!name || !certNumber || !region || !specialty || !bio) {
        return res
          .status(400)
          .json({ error: '성함, 자격번호, 활동 지역, 전문 분야, 소개를 모두 입력해 주세요.' });
      }
      const created = await registerInstructor(user.id, {
        name,
        certNumber,
        gradeLabel: gradeLabel || '2급 기초·이론',
        region,
        specialty,
        bio,
        experienceYears: Number(experienceYears || 1),
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || '강사 등록 실패' });
    }
  });

  // Server-Side Gemini API: Warm Reminiscence Art Lesson Plan Helper
  app.post('/api/lesson-plans/generate', async (req, res) => {
    try {
      const { season, targetGroup, material, memoryTheme } = req.body ?? {};
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'AI 교안 생성 키가 설정되지 않아 기본 도안 자료실을 이용해 주세요.',
        });
      }

      const prompt = `당신은 한국의 따뜻한 회상미술 지도사 슈퍼바이저입니다.
다음 조건에 맞춰 어르신 회상미술 60분 수업 계획안을 따뜻하고 읽기 쉬운 한국어로 작성해 주세요.
- 계절/분위기: ${season || '봄'}
- 대상 어르신: ${targetGroup || '복지관 일반 어르신'}
- 주요 미술 재료: ${material || '수채 색연필과 도화지'}
- 회상 주제: ${memoryTheme || '고향의 꽃과 나들이 기억'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            '어르신 돌봄 현장에서 강사가 바로 사용할 수 있도록 따뜻하고 존중 어린 어조로 구체적인 질문과 단계별 활동 순서를 JSON으로 작성하세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: '수업 프로그램 제목' },
              emotionalGoal: { type: Type.STRING, description: '기대되는 정서·인지 효과' },
              materialsList: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '준비물 목록',
              },
              openingQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '도입 단계 회상 질문 3가지',
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    guide: { type: Type.STRING },
                  },
                },
                description: '도입·전개·마무리 3단계 진행 안내',
              },
              supervisorTip: { type: Type.STRING, description: '강사를 위한 현장 주의 팁' },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: any) {
      console.error('Gemini lesson plan generation failed:', error);
      res.status(500).json({
        error: '교안 생성 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
