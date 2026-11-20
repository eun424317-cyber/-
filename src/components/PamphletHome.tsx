import { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Printer,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  CourseItem,
  InstructorItem,
  VerifiedCertificate,
} from '../types/platform.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface PamphletHomeProps {
  courses: CourseItem[];
  instructors: InstructorItem[];
  loading: boolean;
  onNavigateTab: (tab: 'classroom' | 'verify' | 'resources' | 'instructors') => void;
  onPrintPamphlet: () => void;
}

const ARTWORK_GALLERY = [
  {
    image: '/src/assets/images/template_spring_herbs_1795155477388.jpg',
    season: '봄 도안 채색 · 2급 대표',
    title: '봄나물 캐는 7, 8살 아이들',
    story:
      '들판에서 냉이·쑥을 캐던 일곱, 여덟 살 시절의 반짝이는 기억을 도안 채색과 함께 나눕니다.',
  },
  {
    image: '/src/assets/images/template_hide_and_seek_1795155478944.jpg',
    season: '추억 도안 채색 · 치매안심센터',
    title: '숨바꼭질 하는 아이들의 모습',
    story:
      '담장과 장독대 뒤에 숨어 웃던 어린 시절 도안을 색칠하며 골목길 친구 이야기를 꺼냅니다.',
  },
  {
    image: '/src/assets/images/template_making_jang_1795155477471.jpg',
    season: '세시풍속 도안 채색 · 인지회상',
    title: '정월 장 만들기',
    story:
      '금줄과 숯이 걸린 장독대 도안을 채색하며 정월마다 장을 담그던 삶의 지혜를 회상합니다.',
  },
];

const JOURNEY_STEPS = [
  { step: '01', title: '온라인 수강', desc: '6차시 큰 글씨 강의' },
  { step: '02', title: '도안 채색 실습', desc: '회상 대화 · 교안 연습' },
  { step: '03', title: '평가 · PDF 발급', desc: '진도 80% 후 즉시 발급' },
  { step: '04', title: '복지관 강사 활동', desc: '자료실 · 기관 출강 연계' },
];

export function PamphletHome({
  courses,
  instructors,
  loading,
  onNavigateTab,
  onPrintPamphlet,
}: PamphletHomeProps) {
  const { firebaseUser, enrollments, signInWithGoogle, getToken, refreshDashboard } =
    useAuth();
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [enrollModalCourse, setEnrollModalCourse] = useState<CourseItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [submittingEnroll, setSubmittingEnroll] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState<string | null>(null);

  // Inline quick certificate lookup right inside the 1-page pamphlet
  const [quickCertNum, setQuickCertNum] = useState('2027-01-0001');
  const [quickCertResult, setQuickCertResult] = useState<VerifiedCertificate | null>(
    null
  );
  const [quickCertError, setQuickCertError] = useState<string | null>(null);
  const [quickVerifying, setQuickVerifying] = useState(false);

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCertNum.trim()) return;
    setQuickVerifying(true);
    setQuickCertError(null);
    setQuickCertResult(null);
    try {
      const res = await fetch(
        `/api/certificates/verify?certNumber=${encodeURIComponent(quickCertNum.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setQuickCertError(data.error || '조회되는 자격증이 없습니다.');
      } else {
        setQuickCertResult(data.certificate);
      }
    } catch {
      setQuickCertError('조회 중 오류가 발생했습니다.');
    } finally {
      setQuickVerifying(false);
    }
  };

  const handleConfirmEnroll = async () => {
    if (!enrollModalCourse) return;
    setEnrollError(null);
    setSubmittingEnroll(true);
    try {
      if (!firebaseUser) {
        await signInWithGoogle();
      }
      const token = await getToken();
      if (!token) {
        throw new Error('수강 신청을 위해 Google 로그인이 필요합니다.');
      }
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: enrollModalCourse.id,
          paymentMethod,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || '수강 신청 처리 중 오류가 발생했습니다.');
      }
      await refreshDashboard();
      setEnrollSuccessMsg(
        `${enrollModalCourse.title} 신청이 완료되었습니다. 나의 강의실에서 바로 시작하세요.`
      );
      setEnrollModalCourse(null);
    } catch (err: any) {
      setEnrollError(err.message || '수강 신청에 실패했습니다.');
    } finally {
      setSubmittingEnroll(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {enrollSuccessMsg && (
        <div className="rounded-xl border border-[#C6DFD2] bg-[#F2F9F5] p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 text-[#24553F]">
            <Check className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">{enrollSuccessMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('classroom')}
            className="px-4 py-1.5 rounded-lg bg-[#24553F] text-white text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
          >
            나의 강의실 열기
          </button>
        </div>
      )}

      {/* 한 장으로 완성되는 연보라 감성 디지털 팜플렛 시트 */}
      <div className="print-pamphlet-sheet rounded-2xl border border-[#DFD2EC] bg-gradient-to-br from-[#FBF7FE] via-[#F4ECF9] to-[#FDF6F2] p-5 sm:p-7 space-y-5 shadow-xs">
        {/* 1단: 표지 헤더 + 아틀리에 사진 + 4단계 취득 여정 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pamphlet-grid-gap">
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-[#7A4E85]">
                  메모리테라피회상미술 연구원 · 회상미술 지도사 1급·2급 안내 팜플렛
                </p>
                <button
                  type="button"
                  onClick={onPrintPamphlet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4C4E3] bg-white/90 hover:bg-white text-[#5B3765] text-xs font-medium whitespace-nowrap shrink-0 no-print"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>한 장 인쇄 · PDF 저장</span>
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1F33] leading-snug text-balance">
                그림 한 장으로 어르신의 빛나던 기억을 잇는 시간
              </h1>
              <p className="mt-2 text-sm text-[#5C4E68] leading-relaxed break-keep">
                그림을 잘 그리지 못해도 괜찮습니다. 따뜻한 채색 도안과 다정한 질문으로
                어르신의 마음을 여는 회상미술 지도사 과정을 온라인 수강부터 PDF 자격증
                발급, 복지관 강사 활동까지 한 번에 준비하세요.
              </p>
            </div>

            {/* 4단계 한눈에 보기 스트립 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {JOURNEY_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-[#E4DCEE] bg-white/90 px-3 py-2.5"
                >
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-[#9F5A6A]">
                    STEP {item.step}
                  </span>
                  <p className="font-serif text-xs sm:text-sm font-bold text-[#2B1F33] mt-0.5">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#6C5D78] mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="relative flex-1 min-h-[190px] rounded-xl overflow-hidden border border-[#E4DCEE] bg-[#F3ECF8]">
              <ResilientImage
                src="/src/assets/images/hero_atelier_lavender_1795154033351.jpg"
                alt="연보라빛 햇살이 드는 화실에서 강사와 어르신이 함께 회상미술 채색을 하는 모습"
                className="w-full h-full object-cover pamphlet-hero-img"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2B1F33]/80 via-[#2B1F33]/35 to-transparent p-3.5 text-white">
                <p className="font-serif text-xs sm:text-sm font-medium">
                  “어르신, 이 색을 칠할 때 어떤 날이 떠오르시나요?”
                </p>
                <p className="text-[11px] text-white/80 mt-0.5">
                  평생학습관 · 노인복지관 · 치매안심센터 현장 중심 교육
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2단: 수업 속 채색 도안 3종 한눈에 보기 */}
        <section className="border-t border-[#E4DCEE] pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2B1F33]">
                수업 속 회상미술 채색 도안 — 이 그림들을 채색하며 기억을 만납니다
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('resources')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5B3765] hover:underline no-print whitespace-nowrap shrink-0"
            >
              <span>도안 자료실 · 교안 도우미</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pamphlet-grid-gap">
            {ARTWORK_GALLERY.map((art) => (
              <article
                key={art.title}
                className="rounded-xl border border-[#E4DCEE] bg-white overflow-hidden flex flex-col"
              >
                <ResilientImage
                  src={art.image}
                  alt={art.title}
                  className="w-full aspect-[4/3] object-cover pamphlet-art-img"
                />
                <div className="p-3.5 space-y-1">
                  <p className="text-[11px] text-[#7E6F8A]">{art.season}</p>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#2B1F33]">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C4E68] leading-relaxed break-keep">
                    {art.story}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 3단: 2급·1급 자격 과정 비교 + 공식 자격증 미리보기 */}
        <section className="border-t border-[#E4DCEE] pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pamphlet-grid-gap">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 pamphlet-grid-gap">
            {loading
              ? [1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-xl border border-[#E4DCEE] bg-white/70 animate-pulse"
                  />
                ))
              : courses.map((course) => {
                  const isEnrolled = enrollments.some((e) => e.courseId === course.id);
                  const isExpanded = expandedCourseId === course.id;
                  return (
                    <div
                      key={course.id}
                      className="rounded-xl border border-[#E4DCEE] bg-white p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#5B3765]">
                            {course.gradeLabel}
                          </span>
                          <span className="font-mono tabular-nums text-[#7E6F8A]">
                            {course.totalLessons}차시 · {course.durationHours}시간
                          </span>
                        </div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#2B1F33]">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#5C4E68] leading-relaxed break-keep">
                          {course.description}
                        </p>
                        <div className="text-[11px] text-[#6C5D78] space-y-0.5 pt-1 border-t border-[#F0E9F6]">
                          <p>
                            <strong className="text-[#2B1F33]">응시:</strong>{' '}
                            {course.eligibility}
                          </p>
                          <p>
                            <strong className="text-[#2B1F33]">검정:</strong>{' '}
                            {course.examCriteria}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCourseId(isExpanded ? null : course.id)
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#5B3765] hover:underline no-print"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            {isExpanded ? '차시 닫기' : `${course.lessons.length}차시 커리큘럼 보기`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <ol className="space-y-1 rounded-lg bg-[#FAF6FC] border border-[#E4DCEE] p-2.5 text-[11px] text-[#2B1F33]">
                            {course.lessons.map((l) => (
                              <li key={l.id} className="flex justify-between gap-2">
                                <span className="truncate">{l.title}</span>
                                <span className="font-mono tabular-nums text-[#7E6F8A] shrink-0">
                                  {l.durationMinutes}m
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E4DCEE]">
                        <span className="font-mono tabular-nums text-base font-bold text-[#2B1F33]">
                          {course.tuitionKrw.toLocaleString('ko-KR')}원
                        </span>
                        {isEnrolled ? (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('classroom')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2F6B54] text-white text-xs font-medium whitespace-nowrap shrink-0 no-print"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>강의실 열기</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEnrollError(null);
                              setEnrollModalCourse(course);
                            }}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-xs font-medium whitespace-nowrap shrink-0 no-print"
                          >
                            <span>수강 신청</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* 콤팩트 공식 자격증 미리보기 카드 */}
          <div className="lg:col-span-4 rounded-xl border-2 border-[#5B3765] bg-[#FFFFFF] p-4 flex flex-col justify-between">
            <div className="border border-[#D4C4E3] rounded-lg p-3.5 bg-gradient-to-b from-white to-[#FAF6FC] flex-1 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7E6F8A]">
                <span>제 2027-01-0001 호</span>
                <span>공식 자격증 예시</span>
              </div>

              <div className="text-center">
                <p className="text-[10px] tracking-[0.18em] text-[#9F5A6A] font-medium">
                  CERTIFICATE
                </p>
                <h3 className="font-serif text-xl font-bold text-[#2B1F33] tracking-widest mt-0.5">
                  자 격 증
                </h3>
                <p className="text-xs text-[#5C4E68]">회상미술 지도사 1급 · 2급</p>
              </div>

              <p className="font-serif text-xs text-center text-[#2B1F33] leading-relaxed break-keep">
                소정의 교육 과정을 이수하고 온라인 검정에 합격한 분께 고유번호와
                직인이 담긴 PDF 자격증을 즉시 발급합니다.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#E4DCEE]">
                <span className="font-serif text-xs font-bold text-[#2B1F33]">
                  메모리테라피회상미술 연구원장
                </span>
                <span className="w-8 h-8 rounded border border-[#9F5A6A] bg-[#FAF0F2] text-[#9F5A6A] flex flex-col items-center justify-center text-[9px] font-serif font-bold shrink-0">
                  <Award className="w-3 h-3" />
                  직인
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4단: 실시간 진위 조회 · 강사 풀 · 강의실 한눈에 연결 스트립 */}
        <section className="border-t border-[#E4DCEE] pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 pamphlet-grid-gap">
          <div className="lg:col-span-6 rounded-xl border border-[#E4DCEE] bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#2B1F33] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#5B3765]" />
                <span>복지관·기관용 1초 자격증 진위 조회</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('verify')}
                className="text-xs font-medium text-[#5B3765] hover:underline no-print"
              >
                상세 조회 · PDF 출력
              </button>
            </div>

            <form onSubmit={handleQuickVerify} className="flex items-center gap-2 no-print">
              <input
                type="text"
                value={quickCertNum}
                onChange={(e) => setQuickCertNum(e.target.value)}
                placeholder="발급번호 입력 (예: 2027-01-0001)"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-[#E4DCEE] bg-[#FAF6FC] text-xs font-mono text-[#2B1F33]"
              />
              <button
                type="submit"
                disabled={quickVerifying}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5B3765] text-white text-xs font-medium whitespace-nowrap shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{quickVerifying ? '조회중' : '확인'}</span>
              </button>
            </form>

            {quickCertResult && (
              <p className="text-xs text-[#24553F] bg-[#F2F9F5] border border-[#C6DFD2] rounded-lg px-3 py-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  정식 유효: {quickCertResult.holderName} ·{' '}
                  {quickCertResult.courseTitle} ({quickCertResult.issuedAt})
                </span>
              </p>
            )}
            {quickCertError && (
              <p className="text-xs text-[#B42318]">{quickCertError}</p>
            )}
            {!quickCertResult && !quickCertError && (
              <p className="text-xs text-[#6C5D78]">
                예시 번호 <span className="font-mono">2027-01-0001</span>(김은희) 또는{' '}
                <span className="font-mono">2027-02-0014</span>(박정숙)로 즉시 진위 여부를 확인하세요.
              </p>
            )}
          </div>

          <div className="lg:col-span-6 rounded-xl border border-[#E4DCEE] bg-white p-4 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#2B1F33]">
                활동 강사 풀 · 기관 출강 및 실무 자료실
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('instructors')}
                className="text-xs font-medium text-[#5B3765] hover:underline no-print"
              >
                출강 의뢰하기
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {instructors.slice(0, 4).map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-lg bg-[#FAF6FC] border border-[#E4DCEE] px-2.5 py-1.5 truncate"
                >
                  <span className="font-semibold text-[#2B1F33]">{inst.name}</span>
                  <span className="text-[#7E6F8A] ml-1.5">{inst.region}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C5D78] pt-1">
              <span>계절 채색 도안 · 어르신 관찰 일지 · PQI 기획문서 제공</span>
              <button
                type="button"
                onClick={() => onNavigateTab('classroom')}
                className="font-medium text-[#5B3765] hover:underline no-print"
              >
                나의 강의실 바로가기 →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 수강 신청 결제 모달 */}
      {enrollModalCourse && (
        <div
          className="fixed inset-0 z-50 bg-[#2B1F33]/50 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E4DCEE] p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#9F5A6A]">
                  {enrollModalCourse.gradeLabel}
                </p>
                <h3 className="font-serif text-xl font-bold text-[#2B1F33] mt-1">
                  {enrollModalCourse.title} 신청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnrollModalCourse(null)}
                className="p-1.5 rounded-lg text-[#7E6F8A] hover:bg-[#F3ECF8]"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-[#FAF6FC] border border-[#E4DCEE] p-4 flex items-center justify-between">
              <span className="text-sm text-[#5C4E68]">수강 및 자격 검정료</span>
              <span className="font-mono tabular-nums text-lg font-bold text-[#5B3765]">
                {enrollModalCourse.tuitionKrw.toLocaleString('ko-KR')}원
              </span>
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-[#2B1F33]">결제 수단 선택</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-[#5B3765] bg-[#F3ECF8] text-[#5B3765]'
                      : 'border-[#E4DCEE] bg-white text-[#5C4E68]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>신용·체크카드</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#5B3765] bg-[#F3ECF8] text-[#5B3765]'
                      : 'border-[#E4DCEE] bg-white text-[#5C4E68]'
                  }`}
                >
                  <span>계좌이체</span>
                </button>
              </div>
              {!firebaseUser && (
                <p className="text-xs text-[#7E6F8A] pt-1">
                  신청 확인 시 Google 계정 로그인 창이 함께 열립니다.
                </p>
              )}
            </div>

            {enrollError && (
              <p className="text-xs text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg p-3">
                {enrollError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEnrollModalCourse(null)}
                className="px-4 py-2.5 rounded-lg border border-[#E4DCEE] text-sm font-medium text-[#5C4E68] hover:bg-[#FAF6FC]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={submittingEnroll}
                onClick={handleConfirmEnroll}
                className="px-5 py-2.5 rounded-lg bg-[#5B3765] hover:bg-[#472950] disabled:opacity-60 text-white text-sm font-medium"
              >
                {submittingEnroll ? '처리 중...' : '수강 신청 완료하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
