import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { CertificateView } from './components/CertificateView.tsx';
import { ClassroomView } from './components/ClassroomView.tsx';
import { InstructorMatchView } from './components/InstructorMatchView.tsx';
import { PamphletHome } from './components/PamphletHome.tsx';
import { ResourceCenterView } from './components/ResourceCenterView.tsx';
import {
  CourseItem,
  DispatchInquiryItem,
  InstructorItem,
  ResourceItem,
} from './types/platform.ts';

type ActiveTab = 'pamphlet' | 'classroom' | 'verify' | 'resources' | 'instructors';

function PlatformShell() {
  const { firebaseUser, profile, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pamphlet');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [inquiries, setInquiries] = useState<DispatchInquiryItem[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);

  const loadPublicData = useCallback(async () => {
    try {
      setLoadingPublic(true);
      const [cRes, rRes, iRes, qRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/resources'),
        fetch('/api/instructors'),
        fetch('/api/inquiries'),
      ]);
      if (!cRes.ok || !rRes.ok || !iRes.ok || !qRes.ok) {
        throw new Error('데이터를 불러오지 못했습니다.');
      }
      const [cData, rData, iData, qData] = await Promise.all([
        cRes.json(),
        rRes.json(),
        iRes.json(),
        qRes.json(),
      ]);
      setCourses(cData);
      setResources(rData);
      setInstructors(iData);
      setInquiries(qData);
      setPublicError(null);
    } catch (err: any) {
      setPublicError(err.message || '서비스 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    document.body.dataset.printMode =
      activeTab === 'pamphlet' ? 'pamphlet' : 'certificate';
  }, [activeTab]);

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'pamphlet', label: '한장 팜플렛' },
    { id: 'classroom', label: '나의 강의실' },
    { id: 'verify', label: '자격증 조회' },
    { id: 'resources', label: '도안 자료실' },
    { id: 'instructors', label: '강사 매칭' },
  ];

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrintPamphlet = () => {
    document.body.dataset.printMode = 'pamphlet';
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#E4DCEE] bg-[#FAF6FC]/90 backdrop-blur-md no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => handleNavigate('pamphlet')}
            className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#2B1F33] whitespace-nowrap shrink-0 text-left"
          >
            메모리테라피회상미술 연구원
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors border-b-2 ${
                  activeTab === item.id
                    ? 'text-[#5B3765] border-[#5B3765]'
                    : 'text-[#5C4E68] border-transparent hover:text-[#2B1F33]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            {firebaseUser ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-lg border border-[#D4C4E3] bg-white hover:bg-[#F3ECF8] text-[#2B1F33] text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
              >
                {profile?.name || '내 계정'} · 로그아웃
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Google 로그인
              </button>
            )}
          </div>
        </div>

        <div className="md:hidden border-t border-[#E4DCEE] px-4 py-2 flex items-center gap-4 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 ${
                activeTab === item.id
                  ? 'text-[#5B3765] font-semibold underline underline-offset-4'
                  : 'text-[#5C4E68]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {publicError && (
          <div className="mb-6 rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318] flex items-center justify-between gap-4 no-print">
            <span>{publicError}</span>
            <button
              type="button"
              onClick={loadPublicData}
              className="px-3 py-1 rounded-md bg-white border border-[#FECDCA] text-xs font-medium"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {activeTab === 'pamphlet' && (
          <PamphletHome
            courses={courses}
            instructors={instructors}
            loading={loadingPublic}
            onNavigateTab={handleNavigate}
            onPrintPamphlet={handlePrintPamphlet}
          />
        )}
        {activeTab === 'classroom' && (
          <ClassroomView courses={courses} onNavigateTab={handleNavigate} />
        )}
        {activeTab === 'verify' && <CertificateView />}
        {activeTab === 'resources' && <ResourceCenterView resources={resources} />}
        {activeTab === 'instructors' && (
          <InstructorMatchView
            instructors={instructors}
            inquiries={inquiries}
            onRefreshPublicData={loadPublicData}
          />
        )}
      </main>

      <footer className="border-t border-[#E4DCEE] bg-[#F5EFF9]/70 py-6 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6C5D78]">
          <p className="font-serif text-sm font-medium text-[#2B1F33]">
            메모리테라피회상미술 연구원 · 평생학습 민간자격 운영본부
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('pamphlet')}
              className="hover:text-[#2B1F33]"
            >
              한장 팜플렛
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('verify')}
              className="hover:text-[#2B1F33]"
            >
              자격증 진위 조회
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('instructors')}
              className="hover:text-[#2B1F33]"
            >
              기관 출강 의뢰
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlatformShell />
    </AuthProvider>
  );
}
