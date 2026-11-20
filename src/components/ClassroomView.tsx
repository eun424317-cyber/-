import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  Lock,
  PlayCircle,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { CertificateRecord, CourseItem } from '../types/platform.ts';
import { CertificateSheet } from './CertificateSheet.tsx';

interface ClassroomViewProps {
  courses: CourseItem[];
  onNavigateTab: (tab: 'pamphlet' | 'verify') => void;
}

const EXAM_QUESTIONS = [
  {
    id: 1,
    question: '1. 어르신 회상미술 수업에서 강사가 가장 우선시해야 할 태도는 무엇인가요?',
    options: [
      '그림의 구도와 명암 완성도를 엄격히 교정해 준다.',
      '작품의 기술적 완성도보다 색채와 기억에 담긴 이야기 나눔을 따뜻하게 경청한다.',
      '제한 시간 안에 모든 참여자가 똑같은 결과물을 내도록 지시한다.',
    ],
  },
  {
    id: 2,
    question: '2. 손의 악력이 약한 어르신을 위한 재료 및 책상 세팅으로 가장 알맞은 것은?',
    options: [
      '가볍고 좁은 플라스틱 컵과 아주 가는 세필 붓을 사용한다.',
      '날카로운 공예용 칼과 가위를 매 차시 필수 도구로 배치한다.',
      '잡기 편한 굵은 수채 색연필·스펀지 붓과 쉽게 쓰러지지 않는 묵직한 도자기 물통을 사용한다.',
    ],
  },
  {
    id: 3,
    question: '3. 수업 중 소극적으로 망설이는 어르신에게 건네기 좋은 도입 대화법은?',
    options: [
      '"어르신, 어릴 적 고향 돌담길 옆에 어떤 꽃이 피어 있었는지 편하게 떠올려 보실까요?"처럼 열린 공감 질문을 건넨다.',
      '"다른 어르신들은 벌써 다 그리셨으니 빨리 시작하셔야 해요."라고 재촉한다.',
      '말을 걸지 않고 끝날 때까지 지켜보기만 한다.',
    ],
  },
  {
    id: 4,
    question: '4. 경도인지장애 또는 초기 치매 어르신 수업 시 색채 도구 제공 원칙으로 옳은 것은?',
    options: [
      '창의성을 위해 48색 이상의 물감을 한꺼번에 책상에 펼친다.',
      '회색과 검은색 위주로만 제한하여 제공한다.',
      '선택 과부하를 줄이기 위해 한 번에 3~4가지 따뜻한 대표 색상을 먼저 제시한다.',
    ],
  },
  {
    id: 5,
    question: '5. 회상미술 1회기 수업의 표준 진행 구조와 사후 기록 방법은?',
    options: [
      '별도 도입 없이 바로 채색만 진행하고 기록은 남기지 않는다.',
      '도입(기억 열기)-표현(미술 활동)-나눔(이야기 공유) 3단계로 진행하고 반응 관찰 일지를 기록한다.',
      '작품 평가 점수표만 매겨 기관에 제출한다.',
    ],
  },
];

export function ClassroomView({ courses, onNavigateTab }: ClassroomViewProps) {
  const {
    firebaseUser,
    profile,
    enrollments,
    certificates,
    signInWithGoogle,
    getToken,
    refreshDashboard,
  } = useAuth();

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<'lesson' | 'assignment' | 'exam'>('lesson');

  // Profile fields for certificate accuracy
  const [holderName, setHolderName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Assignment form
  const [programTitle, setProgramTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('복지관 어르신 (8~10명)');
  const [materials, setMaterials] = useState('수채 색연필, 한지, 도화지 8절');
  const [planContent, setPlanContent] = useState('');
  const [assignmentMsg, setAssignmentMsg] = useState<string | null>(null);

  // Exam form
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [essayAnswer, setEssayAnswer] = useState('');
  const [examMsg, setExamMsg] = useState<string | null>(null);
  const [newlyIssuedCert, setNewlyIssuedCert] = useState<CertificateRecord | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    if (profile) {
      setHolderName(profile.name || '');
      setBirthDate(profile.birthDate || '1970-01-01');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (enrollments.length > 0 && !selectedEnrollmentId) {
      setSelectedEnrollmentId(enrollments[0].id);
    }
  }, [enrollments, selectedEnrollmentId]);

  const activeEnrollment =
    enrollments.find((e) => e.id === selectedEnrollmentId) ?? enrollments[0] ?? null;
  const activeCourse = activeEnrollment
    ? courses.find((c) => c.id === activeEnrollment.courseId) ?? null
    : null;

  useEffect(() => {
    if (activeCourse && activeCourse.lessons.length > 0) {
      const stillExists = activeCourse.lessons.some((l) => l.id === selectedLessonId);
      if (!stillExists) {
        setSelectedLessonId(activeCourse.lessons[0].id);
      }
    }
    if (activeEnrollment?.assignment) {
      setProgramTitle(activeEnrollment.assignment.programTitle);
      setTargetAudience(activeEnrollment.assignment.targetAudience);
      setMaterials(activeEnrollment.assignment.materials);
      setPlanContent(activeEnrollment.assignment.planContent);
    }
  }, [activeCourse, activeEnrollment, selectedLessonId]);

  const activeLesson =
    activeCourse?.lessons.find((l) => l.id === selectedLessonId) ??
    activeCourse?.lessons[0] ??
    null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: holderName, birthDate, phone }),
      });
      if (!res.ok) throw new Error('저장 실패');
      await refreshDashboard();
      setProfileMessage('자격증 발급용 성명·생년월일이 저장되었습니다.');
    } catch {
      setProfileMessage('정보 저장 중 오류가 발생했습니다.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleQuickEnroll = async (courseId: number) => {
    setBusyAction(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId, paymentMethod: 'card' }),
      });
      if (res.ok) {
        const created = await res.json();
        await refreshDashboard();
        setSelectedEnrollmentId(created.id);
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleToggleLesson = async (lessonId: number) => {
    if (!activeEnrollment) return;
    setBusyAction(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/lms/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollmentId: activeEnrollment.id,
          lessonId,
        }),
      });
      if (res.ok) {
        await refreshDashboard();
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnrollment) return;
    setBusyAction(true);
    setAssignmentMsg(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/lms/assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollmentId: activeEnrollment.id,
          programTitle,
          targetAudience,
          materials,
          planContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshDashboard();
      setAssignmentMsg('회상미술 프로그램 계획안 과제가 제출되었습니다.');
    } catch (err: any) {
      setAssignmentMsg(err.message || '과제 제출에 실패했습니다.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnrollment) return;
    setBusyAction(true);
    setExamMsg(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/lms/exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollmentId: activeEnrollment.id,
          answers,
          essayAnswer,
          holderName: holderName || profile?.name,
          birthDate: birthDate || profile?.birthDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshDashboard();
      if (data.submission.passed) {
        setExamMsg(
          `축하합니다! ${data.submission.score}점으로 합격하셨습니다. 자격증이 발급되었습니다.`
        );
        if (data.certificate) {
          setNewlyIssuedCert(data.certificate);
        }
      } else {
        setExamMsg(
          `평가 점수는 ${data.submission.score}점입니다. 교안 핵심 내용을 복습하신 후 다시 응시해 주세요.`
        );
      }
    } catch (err: any) {
      setExamMsg(err.message || '시험 제출에 실패했습니다.');
    } finally {
      setBusyAction(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-[#E4DCEE] bg-white p-8 sm:p-12 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3ECF8] text-[#5B3765] flex items-center justify-center">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1F33]">
            나의 온라인 강의실
          </h2>
          <p className="text-sm sm:text-base text-[#5C4E68] leading-relaxed break-keep">
            Google 계정으로 간편하게 로그인하시면 수강 진도율 저장, 프로그램 계획안 제출,
            온라인 평가 및 본인 명의의 PDF 자격증 발급을 바로 이용하실 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-6 py-3 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium transition-colors"
          >
            Google 로그인으로 강의실 열기
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('pamphlet')}
            className="px-5 py-3 rounded-lg border border-[#E4DCEE] text-[#5C4E68] hover:bg-[#FAF6FC] text-sm font-medium"
          >
            팜플렛 안내로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isExamUnlocked = (activeEnrollment?.progressPercent ?? 0) >= 80;
  const courseCert = activeCourse
    ? certificates.find((c) => c.gradeLabel === activeCourse.gradeLabel) ?? null
    : null;

  return (
    <div className="space-y-8 pb-16">
      {/* 학습자 자격증 발급용 정보 바 */}
      <section className="rounded-2xl border border-[#E4DCEE] bg-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#9F5A6A] mb-1">
              자격증 발급 정보 설정
            </p>
            <h2 className="font-serif text-xl font-bold text-[#2B1F33]">
              {profile?.name || firebaseUser.displayName}님의 학습 공간
            </h2>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-xs text-[#7E6F8A] mb-1">
                자격증 성명
              </label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                required
                className="px-3 py-2 rounded-lg border border-[#E4DCEE] bg-[#FAF6FC] text-sm text-[#2B1F33] w-36"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7E6F8A] mb-1">
                생년월일
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="px-3 py-2 rounded-lg border border-[#E4DCEE] bg-[#FAF6FC] text-sm font-mono text-[#2B1F33]"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 rounded-lg border border-[#D4C4E3] bg-[#F3ECF8] hover:bg-[#EAE0F2] text-[#5B3765] text-sm font-medium whitespace-nowrap shrink-0"
            >
              {profileSaving ? '저장 중...' : '발급 정보 저장'}
            </button>
          </form>
        </div>
        {profileMessage && (
          <p className="mt-3 text-xs font-medium text-[#2F6B54]">{profileMessage}</p>
        )}
      </section>

      {enrollments.length === 0 ? (
        <section className="rounded-2xl border border-[#E4DCEE] bg-white p-8 sm:p-10 space-y-6">
          <div className="max-w-xl">
            <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
              아직 신청하신 자격 과정이 없습니다
            </h3>
            <p className="mt-2 text-sm sm:text-base text-[#5C4E68]">
              아래에서 원하시는 과정을 바로 신청하시면 6차시 온라인 강의와 교안 실습을
              즉시 시작하실 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-medium text-[#5B3765]">{c.gradeLabel}</p>
                  <h4 className="font-serif text-lg font-bold text-[#2B1F33] mt-1">
                    {c.title}
                  </h4>
                  <p className="text-xs text-[#5C4E68] mt-1">{c.subtitle}</p>
                </div>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => handleQuickEnroll(c.id)}
                  className="px-4 py-2.5 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium self-start"
                >
                  바로 수강 시작하기 ({c.tuitionKrw.toLocaleString('ko-KR')}원)
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        activeEnrollment &&
        activeCourse && (
          <div className="space-y-6">
            {/* 수강 중인 과정 선택 & 진도율 게이지 */}
            <div className="rounded-2xl border border-[#E4DCEE] bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {enrollments.map((enr) => {
                    const c = courses.find((item) => item.id === enr.courseId);
                    if (!c) return null;
                    const active = enr.id === activeEnrollment.id;
                    return (
                      <button
                        key={enr.id}
                        type="button"
                        onClick={() => setSelectedEnrollmentId(enr.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#5B3765] text-white'
                            : 'bg-[#F3ECF8] text-[#5C4E68] hover:text-[#2B1F33]'
                        }`}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#7E6F8A]">현재 학습 진도율</span>
                  <span className="font-mono tabular-nums text-lg font-bold text-[#5B3765]">
                    {activeEnrollment.progressPercent}%
                  </span>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-[#EFE7F5] overflow-hidden">
                <div
                  className="h-full bg-[#5B3765] transition-all duration-300"
                  style={{ width: `${activeEnrollment.progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <p className="text-xs sm:text-sm text-[#5C4E68] flex items-center gap-1.5">
                  {isExamUnlocked ? (
                    <>
                      <Unlock className="w-4 h-4 text-[#2F6B54]" />
                      <span className="text-[#2F6B54] font-medium">
                        진도율 80% 이상 달성 — 과제 제출과 온라인 평가가 활성화되었습니다.
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#9F5A6A]" />
                      <span>
                        각 차시 학습 완료를 누르시면 진도율 80% 달성 시 과제·시험이 열립니다.
                      </span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-1 p-1 bg-[#F3ECF8] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveWorkspace('lesson')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                      activeWorkspace === 'lesson'
                        ? 'bg-white text-[#2B1F33] shadow-xs'
                        : 'text-[#5C4E68]'
                    }`}
                  >
                    강의 시청
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspace('assignment')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                      activeWorkspace === 'assignment'
                        ? 'bg-white text-[#2B1F33] shadow-xs'
                        : 'text-[#5C4E68]'
                    }`}
                  >
                    프로그램 계획안 과제
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspace('exam')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                      activeWorkspace === 'exam'
                        ? 'bg-white text-[#2B1F33] shadow-xs'
                        : 'text-[#5C4E68]'
                    }`}
                  >
                    온라인 평가 · 발급
                  </button>
                </div>
              </div>
            </div>

            {activeWorkspace === 'lesson' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 차시 목차 */}
                <aside className="lg:col-span-4 rounded-2xl border border-[#E4DCEE] bg-white p-5 space-y-2">
                  <h3 className="font-serif text-base font-bold text-[#2B1F33] pb-2 border-b border-[#E4DCEE]">
                    강의 목차 ({activeEnrollment.completedLessonIds.length}/
                    {activeCourse.lessons.length} 완료)
                  </h3>
                  <div className="space-y-1.5">
                    {activeCourse.lessons.map((lesson) => {
                      const done = activeEnrollment.completedLessonIds.includes(
                        lesson.id
                      );
                      const selected = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-2.5 ${
                            selected
                              ? 'border-[#5B3765] bg-[#F6EFFB]'
                              : 'border-transparent hover:bg-[#FAF6FC]'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-[#2F6B54] shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#9D8FAD] shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#2B1F33] leading-snug">
                              {lesson.title}
                            </p>
                            <p className="text-xs font-mono tabular-nums text-[#7E6F8A] mt-1">
                              {lesson.durationMinutes}분
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* 선택된 강의 화면 */}
                {activeLesson && (
                  <div className="lg:col-span-8 rounded-2xl border border-[#E4DCEE] bg-white overflow-hidden">
                    <div className="bg-gradient-to-br from-[#3D2545] via-[#4F3159] to-[#6B466E] text-white p-8 sm:p-10 space-y-4">
                      <div className="flex items-center justify-between text-xs text-white/75">
                        <span>{activeCourse.title}</span>
                        <span className="font-mono tabular-nums">
                          수강 시간 {activeLesson.durationMinutes}분
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-snug">
                        {activeLesson.title}
                      </h3>
                      <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                        {activeLesson.summary}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleToggleLesson(activeLesson.id)}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            activeEnrollment.completedLessonIds.includes(
                              activeLesson.id
                            )
                              ? 'bg-[#2F6B54] text-white'
                              : 'bg-white text-[#2B1F33] hover:bg-[#FAF6FC]'
                          }`}
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>
                            {activeEnrollment.completedLessonIds.includes(
                              activeLesson.id
                            )
                              ? '학습 완료됨 (클릭 시 해제)'
                              : '이 차시 학습 완료 체크하기'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                      <div>
                        <p className="text-xs font-medium text-[#9F5A6A] mb-1">
                          학습 목표
                        </p>
                        <p className="text-base font-medium text-[#2B1F33]">
                          {activeLesson.learningGoal}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FAF6FC] border border-[#E4DCEE] p-5 space-y-2">
                        <p className="text-sm font-semibold text-[#5B3765] flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>핵심 강의 노트 & 현장 팁</span>
                        </p>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-[#2B1F33] leading-relaxed">
                          {activeLesson.lectureNotes}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeWorkspace === 'assignment' && (
              <div className="rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-8 max-w-3xl space-y-6">
                <div>
                  <p className="text-xs font-medium text-[#9F5A6A] mb-1">
                    실무 과제 제출
                  </p>
                  <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
                    회상미술 프로그램 계획안 작성
                  </h3>
                  <p className="text-sm text-[#5C4E68] mt-1">
                    현장에서 직접 진행할 1회기 회상미술 프로그램 계획안을 작성해 제출해 주세요.
                  </p>
                </div>

                {!isExamUnlocked ? (
                  <div className="rounded-xl bg-[#FAF6FC] border border-[#E4DCEE] p-6 text-sm text-[#5C4E68]">
                    진도율 80% 이상 달성 후 과제를 제출하실 수 있습니다. (현재{' '}
                    <span className="font-mono font-bold text-[#5B3765]">
                      {activeEnrollment.progressPercent}%
                    </span>
                    )
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                        프로그램 제목
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="예: 고향의 봄꽃을 담은 한지 꽃바구니"
                        value={programTitle}
                        onChange={(e) => setProgramTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                          대상 어르신
                        </label>
                        <input
                          type="text"
                          required
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                          준비물
                        </label>
                        <input
                          type="text"
                          required
                          value={materials}
                          onChange={(e) => setMaterials(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                        도입 · 전개 · 마무리 진행 계획
                      </label>
                      <textarea
                        rows={5}
                        required
                        placeholder="도입 회상 질문과 미술 활동 순서, 마무리 나눔 계획을 자유롭게 적어주세요."
                        value={planContent}
                        onChange={(e) => setPlanContent(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm leading-relaxed"
                      />
                    </div>
                    {assignmentMsg && (
                      <p className="text-sm font-medium text-[#2F6B54]">
                        {assignmentMsg}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={busyAction}
                      className="px-6 py-2.5 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium"
                    >
                      {activeEnrollment.assignment ? '계획안 수정 제출' : '계획안 제출하기'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeWorkspace === 'exam' && (
              <div className="space-y-8">
                <div className="rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-8 max-w-3xl space-y-6">
                  <div>
                    <p className="text-xs font-medium text-[#9F5A6A] mb-1">
                      온라인 자격 검정 평가
                    </p>
                    <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
                      {activeCourse.title} 평가 시험
                    </h3>
                    <p className="text-sm text-[#5C4E68] mt-1">
                      객관식 5문항과 주관식 1문항을 완료하시면 즉시 채점 후 자격증이 발급됩니다.
                    </p>
                  </div>

                  {!isExamUnlocked ? (
                    <div className="rounded-xl bg-[#FAF6FC] border border-[#E4DCEE] p-6 text-sm text-[#5C4E68]">
                      진도율 80% 이상 달성 시 시험 응시가 가능합니다. (현재{' '}
                      <span className="font-mono font-bold text-[#5B3765]">
                        {activeEnrollment.progressPercent}%
                      </span>
                      )
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitExam} className="space-y-6">
                      {EXAM_QUESTIONS.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] p-5 space-y-3"
                        >
                          <p className="text-sm sm:text-base font-semibold text-[#2B1F33]">
                            {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((opt, idx) => (
                              <label
                                key={idx}
                                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer text-sm ${
                                  answers[q.id] === idx
                                    ? 'border-[#5B3765] bg-white text-[#2B1F33]'
                                    : 'border-transparent bg-white/60 text-[#5C4E68]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  checked={answers[q.id] === idx}
                                  onChange={() =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                                  }
                                  required
                                  className="mt-1 accent-[#5B3765]"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] p-5 space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-[#2B1F33]">
                          6. [주관식] 어르신이 수업 중 옛 기억을 떠올리며 눈시울을 붉히실 때,
                          강사로서 어떤 따뜻한 말과 행동으로 보듬어 주시겠습니까?
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="15자 이상 따뜻하고 안전한 공감 방향을 작성해 주세요."
                          value={essayAnswer}
                          onChange={(e) => setEssayAnswer(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E4DCEE] bg-white text-sm"
                        />
                      </div>

                      {examMsg && (
                        <div className="rounded-xl border border-[#C6DFD2] bg-[#F2F9F5] p-4 text-sm font-medium text-[#24553F] flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 shrink-0" />
                          <span>{examMsg}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={busyAction}
                          className="px-6 py-3 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium"
                        >
                          {busyAction ? '채점 및 발급 중...' : '답안 제출하고 결과 확인하기'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {(newlyIssuedCert || courseCert) && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 max-w-3xl mx-auto">
                      <div className="flex items-center gap-2 text-[#5B3765] font-serif font-bold text-lg">
                        <Award className="w-5 h-5" />
                        <span>발급된 공식 자격증</span>
                      </div>
                      <div className="flex items-center gap-2 no-print">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-4 py-2 rounded-lg bg-[#5B3765] text-white text-sm font-medium"
                        >
                          PDF 저장 / 인쇄하기
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('verify')}
                          className="px-4 py-2 rounded-lg border border-[#E4DCEE] bg-white text-sm font-medium text-[#2B1F33]"
                        >
                          진위 조회에서 확인하기
                        </button>
                      </div>
                    </div>

                    <CertificateSheet
                      certNumber={(newlyIssuedCert || courseCert)!.certNumber}
                      holderName={(newlyIssuedCert || courseCert)!.holderName}
                      birthDate={(newlyIssuedCert || courseCert)!.birthDate}
                      courseTitle={(newlyIssuedCert || courseCert)!.courseTitle}
                      gradeLabel={(newlyIssuedCert || courseCert)!.gradeLabel}
                      issuedAt={(newlyIssuedCert || courseCert)!.issuedAt}
                      issuerName={(newlyIssuedCert || courseCert)!.issuerName}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
