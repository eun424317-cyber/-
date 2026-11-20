import { Award } from 'lucide-react';

interface CertificateSheetProps {
  certNumber: string;
  holderName: string;
  birthDate: string;
  courseTitle: string;
  gradeLabel: string;
  issuedAt: string;
  issuerName: string;
  isPreviewSample?: boolean;
}

export function CertificateSheet({
  certNumber,
  holderName,
  birthDate,
  courseTitle,
  gradeLabel,
  issuedAt,
  issuerName,
  isPreviewSample = false,
}: CertificateSheetProps) {
  return (
    <div className="print-only-sheet relative bg-[#FDFBFE] border-2 border-[#5B3765] p-3 sm:p-5 rounded-xl shadow-sm max-w-3xl mx-auto">
      <div className="border border-[#C9B7D9] rounded-lg px-6 py-8 sm:px-12 sm:py-12 bg-gradient-to-b from-[#FFFFFF] via-[#FAF6FC] to-[#FDF8F5]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DCEE] pb-4 mb-8">
          <div className="text-xs font-mono tabular-nums text-[#5E5069]">
            발급번호 제 {certNumber} 호
          </div>
          <div className="text-xs text-[#7E6F8A]">
            {isPreviewSample ? '공식 자격증서 예시' : '한국직업능력연구원 민간자격 등록 연계'}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.22em] text-[#9F5A6A] font-medium mb-2">
            CERTIFICATE OF QUALIFICATION
          </p>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B1F33] tracking-wider">
            자 격 증
          </h3>
          <p className="mt-2 text-sm text-[#5C4E68]">{courseTitle}</p>
        </div>

        <dl className="max-w-md mx-auto grid grid-cols-3 gap-y-3 text-sm border-y border-[#E4DCEE] py-5 mb-8">
          <dt className="text-[#7E6F8A] font-medium">성 명</dt>
          <dd className="col-span-2 font-serif text-base font-semibold text-[#2B1F33]">
            {holderName}
          </dd>

          <dt className="text-[#7E6F8A] font-medium">생년월일</dt>
          <dd className="col-span-2 font-mono tabular-nums text-[#2B1F33]">
            {birthDate}
          </dd>

          <dt className="text-[#7E6F8A] font-medium">자격등급</dt>
          <dd className="col-span-2 text-[#5B3765] font-medium">{gradeLabel}</dd>
        </dl>

        <p className="font-serif text-center text-base sm:text-lg leading-relaxed text-[#2B1F33] max-w-xl mx-auto mb-10 break-keep">
          위 사람은 본 연구원이 정한 소정의 회상미술 교육 과정을 성실히 이수하고
          직무 검정 평가에 합격하였으므로 위 자격을 수여합니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-[#E4DCEE]">
          <div className="text-sm font-mono tabular-nums text-[#5C4E68]">
            발급일자 {issuedAt}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-serif text-lg font-bold text-[#2B1F33]">
                {issuerName}장
              </p>
              <p className="text-xs text-[#7E6F8A]">진위 확인 · 홈페이지 자격증 조회</p>
            </div>
            <div
              aria-hidden="true"
              className="w-14 h-14 rounded-lg border-2 border-[#9F5A6A] bg-[#FAF0F2] flex flex-col items-center justify-center text-[#9F5A6A] shrink-0"
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px] font-serif font-bold leading-tight mt-0.5">
                직인
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
