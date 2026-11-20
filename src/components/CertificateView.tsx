import { useState } from 'react';
import { AlertCircle, CheckCircle2, Printer, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { VerifiedCertificate } from '../types/platform.ts';
import { CertificateSheet } from './CertificateSheet.tsx';

export function CertificateView() {
  const { certificates } = useAuth();
  const [certNumber, setCertNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [searching, setSearching] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<VerifiedCertificate | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const runLookup = async (targetCertNum: string, targetName = '') => {
    setSearching(true);
    setLookupError(null);
    setVerifiedCert(null);
    try {
      const params = new URLSearchParams({ certNumber: targetCertNum });
      if (targetName.trim()) {
        params.set('holderName', targetName.trim());
      }
      const res = await fetch(`/api/certificates/verify?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setLookupError(
          data.error || '일치하는 정식 자격증 발급 내역을 찾을 수 없습니다.'
        );
      } else {
        setVerifiedCert(data.certificate);
      }
    } catch {
      setLookupError('조회 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNumber.trim()) return;
    runLookup(certNumber, holderName);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 기관 담당자용 실시간 진위 조회 */}
      <section className="max-w-3xl mx-auto rounded-2xl border border-[#E4DCEE] bg-white p-6 sm:p-10 space-y-6 no-print">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9F5A6A]">
            <ShieldCheck className="w-4 h-4" />
            <span>공공·복지 기관 담당자용 실시간 진위 확인</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1F33]">
            자격증 진위 여부 조회
          </h2>
          <p className="text-sm sm:text-base text-[#5C4E68] break-keep">
            평생학습관, 노인복지관, 요양시설 담당자분께서는 강사가 제출한 자격증의
            발급번호를 입력해 정식 발급 여부를 즉시 확인하실 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                자격증 발급번호
              </label>
              <input
                type="text"
                required
                placeholder="예: 2027-01-0001"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm font-mono text-[#2B1F33]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2B1F33] mb-1.5">
                취득자 성명 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 김은희"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E4DCEE] bg-[#FAF6FC] text-sm text-[#2B1F33]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7E6F8A]">
              <span>시연용 번호 바로 조회:</span>
              <button
                type="button"
                onClick={() => {
                  setCertNumber('2027-01-0001');
                  setHolderName('김은희');
                  runLookup('2027-01-0001', '김은희');
                }}
                className="font-mono underline text-[#5B3765] hover:text-[#472950]"
              >
                2027-01-0001
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setCertNumber('2027-02-0014');
                  setHolderName('박정숙');
                  runLookup('2027-02-0014', '박정숙');
                }}
                className="font-mono underline text-[#5B3765] hover:text-[#472950]"
              >
                2027-02-0014
              </button>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5B3765] hover:bg-[#472950] text-white text-sm font-medium whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? '조회 중...' : '실시간 조회하기'}</span>
            </button>
          </div>
        </form>

        {verifiedCert && (
          <div className="rounded-xl border border-[#C6DFD2] bg-[#F2F9F5] p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#24553F] font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>정식 등록·발급된 유효 자격증입니다 ({verifiedCert.status})</span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-[#D3E8DD] pt-4">
              <div>
                <dt className="text-xs text-[#557A68]">발급번호</dt>
                <dd className="font-mono tabular-nums font-bold text-[#1C3B2B] mt-0.5">
                  {verifiedCert.certNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#557A68]">성명</dt>
                <dd className="font-semibold text-[#1C3B2B] mt-0.5">
                  {verifiedCert.holderName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#557A68]">생년월일</dt>
                <dd className="font-mono tabular-nums text-[#1C3B2B] mt-0.5">
                  {verifiedCert.birthDateMasked}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#557A68]">자격명 · 등급</dt>
                <dd className="font-medium text-[#1C3B2B] mt-0.5">
                  {verifiedCert.courseTitle} ({verifiedCert.gradeLabel})
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#557A68]">발급일자</dt>
                <dd className="font-mono tabular-nums text-[#1C3B2B] mt-0.5">
                  {verifiedCert.issuedAt}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#557A68]">발급기관</dt>
                <dd className="text-[#1C3B2B] mt-0.5">{verifiedCert.issuerName}</dd>
              </div>
            </dl>
          </div>
        )}

        {lookupError && (
          <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-5 flex items-center gap-2.5 text-sm text-[#B42318]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </section>

      {/* 내가 발급받은 자격증 PDF 출력 */}
      {certificates.length > 0 && (
        <section className="space-y-8">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4 no-print">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2B1F33]">
                내가 취득한 자격증 ({certificates.length})
              </h3>
              <p className="text-sm text-[#5C4E68]">
                인쇄 버튼을 누른 뒤 &ldquo;PDF로 저장&rdquo;을 선택하면 파일로 보관하실 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5B3765] text-white text-sm font-medium whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>PDF 저장 / 인쇄하기</span>
            </button>
          </div>

          <div className="space-y-10">
            {certificates.map((cert) => (
              <CertificateSheet
                key={cert.id}
                certNumber={cert.certNumber}
                holderName={cert.holderName}
                birthDate={cert.birthDate}
                courseTitle={cert.courseTitle}
                gradeLabel={cert.gradeLabel}
                issuedAt={cert.issuedAt}
                issuerName={cert.issuerName}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
