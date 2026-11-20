import { useState } from 'react';
import { CheckCircle2, MapPin, Search, Send, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { DispatchInquiryItem, InstructorItem } from '../types/platform.ts';

interface InstructorMatchViewProps {
  instructors: InstructorItem[];
  inquiries: DispatchInquiryItem[];
  onRefreshPublicData: () => Promise<void>;
}

export function InstructorMatchView({
  instructors,
  inquiries,
  onRefreshPublicData,
}: InstructorMatchViewProps) {
  const { firebaseUser, certificates, profile, signInWithGoogle, getToken } = useAuth();
  const [regionFilter, setRegionFilter] = useState('');

  // Dispatch inquiry form
  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [region, setRegion] = useState('');
  const [inquiryType, setInquiryType] = useState<'강사 출강 의뢰' | '기관 단체 수강'>(
    '강사 출강 의뢰'
  );
  const [targetInstructorName, setTargetInstructorName] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [details, setDetails] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Instructor profile registration form
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [instName, setInstName] = useState(profile?.name || '');
  const [instCertNumber, setInstCertNumber] = useState(
    certificates[0]?.certNumber || ''
  );
  const [instGrade, setInstGrade] = useState(
    certificates[0]?.gradeLabel || '1급 심화·현장실습'
  );
  const [instRegion, setInstRegion] = useState('');
  const [instSpecialty, setInstSpecialty] = useState('');
  const [instBio, setInstBio] = useState('');
  const [instYears, setInstYears] = useState(1);
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);

  const filteredInstructors = instructors.filter((inst) => {
    const q = regionFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      inst.region.toLowerCase().includes(q) ||
      inst.specialty.toLowerCase().includes(q) ||
      inst.name.toLowerCase().includes(q)
    );
  });

  const handleSelectInstructorForInquiry = (inst: InstructorItem) => {
    setInquiryType('강사 출강 의뢰');
    setTargetInstructorName(inst.name);
    setRegion(inst.region);
    const el = document.getElementById('dispatch-inquiry-form');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInquiry(true);
    setInquiryError(null);
    setInquirySuccess(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          contactName,
          contactPhone,
          region,
          inquiryType,
          targetInstructorName,
          preferredDate,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInquirySuccess(
        `${data.organizationName}의 ${data.inquiryType}가 정상 접수되었습니다.`
      );
      setOrganizationName('');
      setContactName('');
      setContactPhone('');
      setDetails('');
      await onRefreshPublicData();
    } catch (err: any) {
      setInquiryError(err.message || '문의 접수 중 오류가 발생했습니다.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleRegisterInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMsg(null);
    try {
      if (!firebaseUser) {
        await signInWithGoogle();
      }
      const token = await getToken();
      if (!token) throw new Error('Google 로그인이 필요합니다.');

      const res = await fetch('/api/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: instName || profile?.name,
          certNumber: instCertNumber,
          gradeLabel: instGrade,
          region: instRegion,
          specialty: instSpecialty,
          bio: instBio,
          experienceYears: instYears,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegisterMsg('강사 풀에 프로필이 등록되었습니다.');
      setShowRegisterForm(false);
      await onRefreshPublicData();
    } catch (err: any) {
      setRegisterMsg(err.message || '강사 등록에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-14 pb-16">
      {/* 강사 풀 검색 & 목록 */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4DCEE] pb-5">
          <div>
            <p className="text-xs font-medium text-[#9F5A6A] mb-1.5">
              자격 취득 강사 풀 · 기관 파견 연계
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1F33]">
              지역별 회상미술 전문 강사님 만나기
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-[#5C4E68]">
              자격을 취득하고 현장에서 따뜻하게 활동 중인 강사님께 평생학습관·복지관·요양원 출강을 의뢰하실 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRegisterForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4C4E3] bg-white hover:bg-[#FAF6FC] text-sm font-medium text-[#5B3765] whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showRegisterForm ? '등록 양식 닫기' : '강사 프로필 등록하기'}</span>
          </button>
        </div>

        {showRegisterForm && (
          <form
            onSubmit={handleRegisterInstructor}
            className="rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-8 space-y-4"
          >
            <h3 className="font-serif text-lg font-bold text-[#2B1F33]">
              자격 취득 강사 프로필 등록
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="강사 성명"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
              />
              <input
                type="text"
                required
                placeholder="자격번호 (예: 2027-01-0015)"
                value={instCertNumber}
                onChange={(e) => setInstCertNumber(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm font-mono"
              />
              <select
                value={instGrade}
                onChange={(e) => setInstGrade(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
              >
                <option value="1급 심화·현장실습">1급 심화·현장실습</option>
                <option value="2급 기초·이론">2급 기초·이론</option>
              </select>
              <input
                type="text"
                required
                placeholder="활동 가능 지역 (예: 서울 강서·양천)"
                value={instRegion}
                onChange={(e) => setInstRegion(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
              />
              <input
                type="text"
                required
                placeholder="전문 분야 (예: 복지관 수채 회상)"
                value={instSpecialty}
                onChange={(e) => setInstSpecialty(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="활동 경력(년)"
                value={instYears}
                onChange={(e) => setInstYears(Number(e.target.value))}
                className="px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm font-mono"
              />
            </div>
            <textarea
              rows={2}
              required
              placeholder="수업 스타일과 따뜻한 소개 문구를 적어주세요."
              value={instBio}
              onChange={(e) => setInstBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            {registerMsg && (
              <p className="text-sm text-[#5B3765] font-medium">{registerMsg}</p>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#5B3765] text-white text-sm font-medium"
            >
              강사 풀에 등록 완료
            </button>
          </form>
        )}

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#7E6F8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="지역, 전문 분야 또는 강사 이름으로 검색 (예: 서울, 부산, 치매)"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-white text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInstructors.map((inst) => (
            <article
              key={inst.id}
              className="rounded-2xl border border-[#E4DCEE] bg-white p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#7E6F8A]">
                    <span className="font-semibold text-[#5B3765]">
                      {inst.gradeLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      자격번호 {inst.certNumber}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#7E6F8A]">
                    경력 {inst.experienceYears}년
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-[#2B1F33]">
                    {inst.name} 강사
                  </h3>
                  <p className="text-sm font-medium text-[#9F5A6A] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {inst.region} · {inst.specialty}
                    </span>
                  </p>
                </div>

                <p className="text-sm text-[#5C4E68] leading-relaxed break-keep">
                  {inst.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E4DCEE] flex items-center justify-between">
                <span className="text-xs text-[#2F6B54] font-medium">
                  출강 섭외 가능
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectInstructorForInquiry(inst)}
                  className="px-4 py-2 rounded-lg bg-[#F3ECF8] hover:bg-[#EAE0F2] text-[#5B3765] text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
                >
                  이 강사님께 출강 의뢰
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 기관 출강 및 B2B 단체 수강 의뢰 */}
      <section
        id="dispatch-inquiry-form"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <form
          onSubmit={handleSubmitInquiry}
          className="lg:col-span-7 rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-8 space-y-5"
        >
          <div>
            <p className="text-xs font-medium text-[#9F5A6A] mb-1">
              평생학습관 · 경로당 · 요양원 · 치매안심센터
            </p>
            <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
              기관 강사 파견 · 단체 수강 의뢰
            </h3>
          </div>

          <div className="flex gap-2">
            {(['강사 출강 의뢰', '기관 단체 수강'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInquiryType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  inquiryType === type
                    ? 'border-[#5B3765] bg-[#F3ECF8] text-[#5B3765]'
                    : 'border-[#E4DCEE] bg-white text-[#5C4E68]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="기관명 (예: 서대문 노인복지관)"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            <input
              type="text"
              required
              placeholder="담당자 성함"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            <input
              type="text"
              required
              placeholder="연락처 (예: 02-1234-5678)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            <input
              type="text"
              required
              placeholder="희망 지역 (예: 서울 서대문구)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            <input
              type="text"
              placeholder="희망 강사 성함 (선택)"
              value={targetInstructorName}
              onChange={(e) => setTargetInstructorName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
            <input
              type="text"
              placeholder="희망 시작 일정 (예: 2027년 3월)"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
            />
          </div>

          <textarea
            rows={4}
            required
            placeholder="대상 인원, 희망 회기 수, 어르신 특성 등 문의 내용을 적어주세요."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm"
          />

          {inquirySuccess && (
            <div className="rounded-xl bg-[#F2F9F5] border border-[#C6DFD2] p-4 text-sm text-[#24553F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{inquirySuccess}</span>
            </div>
          )}

          {inquiryError && (
            <p className="text-sm text-[#B42318]">{inquiryError}</p>
          )}

          <button
            type="submit"
            disabled={submittingInquiry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            <span>{submittingInquiry ? '접수 중...' : '기관 의뢰서 접수하기'}</span>
          </button>
        </form>

        <aside className="lg:col-span-5 rounded-2xl border border-[#E4DCEE] bg-[#FAF6FC] p-6 space-y-4">
          <h4 className="font-serif text-lg font-bold text-[#2B1F33]">
            최근 기관 연계 접수 현황
          </h4>
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="rounded-xl border border-[#E4DCEE] bg-white p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-[#7E6F8A]">
                  <span>
                    {inq.inquiryType} · {inq.region}
                  </span>
                  <span className="font-medium text-[#5B3765]">{inq.status}</span>
                </div>
                <p className="text-sm font-semibold text-[#2B1F33]">
                  {inq.organizationName}
                  {inq.targetInstructorName
                    ? ` (희망 강사: ${inq.targetInstructorName})`
                    : ''}
                </p>
                <p className="text-xs text-[#5C4E68] leading-relaxed">
                  {inq.details}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
