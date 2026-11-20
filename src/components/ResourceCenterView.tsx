import { useState } from 'react';
import { BookMarked, Download, FileText, Printer, Sparkles, X } from 'lucide-react';
import { GeneratedLessonPlan, ResourceItem } from '../types/platform.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ResourceCenterViewProps {
  resources: ResourceItem[];
}

const CATEGORIES = ['전체', '계절별 도안', '상담 일지 양식', '기획 문서 아카이브'];

export function ResourceCenterView({ resources }: ResourceCenterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [activeResource, setActiveResource] = useState<ResourceItem | null>(null);

  // AI Lesson Plan Helper state
  const [season, setSeason] = useState('봄 (봄나물 캐기)');
  const [targetGroup, setTargetGroup] = useState('복지관 일반 어르신 (8~12명)');
  const [material, setMaterial] = useState('도안 채색용 수채 색연필');
  const [memoryTheme, setMemoryTheme] = useState('봄나물 캐는 7, 8살 시절의 들판 기억');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const filtered =
    selectedCategory === '전체'
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  const handleDownloadMd = (item: ResourceItem) => {
    const blob = new Blob([item.contentBody], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/lesson-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, targetGroup, material, memoryTheme }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '교안 생성에 실패했습니다.');
      }
      setGeneratedPlan(data);
    } catch (err: any) {
      setGenError(err.message || '교안 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-14 pb-16">
      {/* 자료실 헤더 & 카테고리 필터 */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4DCEE] pb-5">
          <div>
            <p className="text-xs font-medium text-[#9F5A6A] mb-1.5">
              현장 실무 도안 · 상담일지 · 기획 아카이브
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1F33]">
              회상미술 활동 도안 · 서식 자료실
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-[#5C4E68]">
              계절별 수업 도안, 어르신 관찰 일지 양식, 그리고 PQI 민간자격 기획 문서를 바로 열람하고 내려받을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3ECF8] rounded-xl self-start">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-white text-[#2B1F33] shadow-xs'
                    : 'text-[#5C4E68] hover:text-[#2B1F33]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#E4DCEE] bg-white overflow-hidden flex flex-col justify-between"
            >
              <div>
                {item.imageUrl ? (
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="h-36 bg-gradient-to-br from-[#F3ECF8] to-[#FAF3F0] flex items-center justify-center border-b border-[#E4DCEE]">
                    <BookMarked className="w-8 h-8 text-[#5B3765]/70" />
                  </div>
                )}

                <div className="p-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#7E6F8A]">
                    <span className="font-medium text-[#5B3765]">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.seasonOrTag}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#2B1F33] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#5C4E68] leading-relaxed break-keep">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#FAF6FC] border-t border-[#E4DCEE] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveResource(item)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B3765] hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  <span>내용 펼쳐보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadMd(item)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4E68] hover:text-[#2B1F33]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>파일 저장</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 맞춤형 회상미술 교안 도우미 */}
      <section className="rounded-2xl border border-[#E4DCEE] bg-gradient-to-br from-[#FFFFFF] via-[#FAF6FC] to-[#FDF6F3] p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9F5A6A] mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>맞춤형 수업 준비 도우미</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
            어르신 맞춤형 회상미술 교안 만들기
          </h3>
          <p className="mt-1.5 text-sm sm:text-base text-[#5C4E68]">
            출강 기관의 계절과 어르신 인지 수준, 준비한 재료를 고르면 따뜻한 도입 질문과 60분 수업 순서를 정리해 드립니다.
          </p>
        </div>

        <form
          onSubmit={handleGeneratePlan}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-[#5C4E68] mb-1.5">
              계절 · 분위기
            </label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C4E68] mb-1.5">
              참여 어르신 대상
            </label>
            <input
              type="text"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C4E68] mb-1.5">
              주요 미술 재료
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5C4E68] mb-1.5">
              회상 주제
            </label>
            <input
              type="text"
              value={memoryTheme}
              onChange={(e) => setMemoryTheme(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DCEE] bg-white text-sm"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2.5 rounded-lg bg-[#5B3765] hover:bg-[#472950] disabled:opacity-60 text-white text-sm font-medium whitespace-nowrap shrink-0"
            >
              {generating ? '따뜻한 교안 작성 중...' : '맞춤형 교안 생성하기'}
            </button>
          </div>
        </form>

        {genError && (
          <p className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4">
            {genError}
          </p>
        )}

        {generatedPlan && (
          <div className="rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E4DCEE] pb-4">
              <div>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#2B1F33]">
                  {generatedPlan.title}
                </h4>
                <p className="text-sm text-[#5C4E68] mt-1">
                  {generatedPlan.emotionalGoal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E4DCEE] text-xs font-medium text-[#2B1F33] no-print"
              >
                <Printer className="w-4 h-4 text-[#5B3765]" />
                <span>교안 인쇄</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#9F5A6A]">준비물 목록</p>
                <ul className="list-disc list-inside text-sm text-[#2B1F33] space-y-1">
                  {generatedPlan.materialsList?.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#9F5A6A]">도입 회상 질문</p>
                <ul className="list-disc list-inside text-sm text-[#2B1F33] space-y-1">
                  {generatedPlan.openingQuestions?.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generatedPlan.steps?.map((st, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#FAF6FC] border border-[#E4DCEE] p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[#5B3765]">
                    <span>{st.phase}</span>
                    <span className="font-mono tabular-nums">{st.duration}</span>
                  </div>
                  <p className="text-sm text-[#2B1F33] leading-relaxed">{st.guide}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#F3ECF8] p-4 text-sm text-[#2B1F33]">
              <span className="font-semibold text-[#5B3765] mr-2">현장 팁:</span>
              {generatedPlan.supervisorTip}
            </div>
          </div>
        )}
      </section>

      {/* 자료 상세 보기 모달 */}
      {activeResource && (
        <div
          className="fixed inset-0 z-50 bg-[#2B1F33]/50 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-[#E4DCEE] p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E4DCEE] pb-4">
              <div>
                <p className="text-xs text-[#7E6F8A]">
                  {activeResource.category} · {activeResource.seasonOrTag}
                </p>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B1F33] mt-1">
                  {activeResource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResource(null)}
                className="p-1.5 rounded-lg text-[#7E6F8A] hover:bg-[#F3ECF8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeResource.imageUrl && (
              <ResilientImage
                src={activeResource.imageUrl}
                alt={activeResource.title}
                className="w-full max-h-64 object-cover rounded-xl border border-[#E4DCEE]"
              />
            )}

            <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-[#2B1F33] leading-relaxed bg-[#FAF6FC] border border-[#E4DCEE] rounded-xl p-5">
              {activeResource.contentBody}
            </pre>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleDownloadMd(activeResource)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#5B3765] text-white text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>문서(.md) 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
