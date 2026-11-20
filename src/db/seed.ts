import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  certificates,
  courses,
  dispatchInquiries,
  instructors,
  lessons,
  resources,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeedData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const existing = await db.select({ value: count() }).from(courses);
  if ((existing[0]?.value ?? 0) > 0) {
    return;
  }

  const insertedCourses = await db
    .insert(courses)
    .values([
      {
        code: 'GRADE_2',
        gradeLabel: '2급 기초·이론',
        title: '회상미술 지도사 2급 과정',
        subtitle: '기억을 여는 색채와 따뜻한 공감 대화의 기초',
        description:
          '노년기 심리 특성과 회상요법의 원리를 이해하고, 어르신과 함께 계절·고향 주제의 쉬운 수채·꼴라주 수업을 안전하게 진행할 수 있는 입문 자격 과정입니다.',
        tuitionKrw: 240000,
        totalLessons: 6,
        durationHours: 12,
        eligibility: '연령·학력 제한 없이 어르신 돌봄 및 미술 교육에 관심 있는 분 누구나',
        examCriteria: '온라인 진도율 80% 이상 · 회상미술 프로그램 계획안 제출 · 온라인 평가 70점 이상',
        pqiCode: 'PQI 등록 연계 2급 (직무: 노년기 정서·회상 미술 프로그램 운영)',
        imageUrl: '/src/assets/images/template_spring_herbs_1795155477388.jpg',
      },
      {
        code: 'GRADE_1',
        gradeLabel: '1급 심화·현장실습',
        title: '회상미술 지도사 1급 과정',
        subtitle: '인지재활 사례 설계와 기관 출강 전문 지도사',
        description:
          '경도인지장애·치매 예방 단계별 맞춤 미술 중재 기법, 집단 회상 프로그램 설계, 어르신 상담 일지 기록 및 복지관·요양원 출강 실무를 완성하는 심화 과정입니다.',
        tuitionKrw: 360000,
        totalLessons: 6,
        durationHours: 18,
        eligibility: '회상미술 지도사 2급 취득자 또는 사회복지·평생교육·미술치료 유관 경력자',
        examCriteria: '온라인 진도율 80% 이상 · 인지단계별 사례 교안 제출 · 심화 평가 75점 이상',
        pqiCode: 'PQI 등록 연계 1급 (직무: 인지재활 회상미술 총괄 설계 및 기관 강사)',
        imageUrl: '/src/assets/images/template_hide_and_seek_1795155478944.jpg',
      },
    ])
    .returning();

  const grade2 = insertedCourses.find((c) => c.code === 'GRADE_2')!;
  const grade1 = insertedCourses.find((c) => c.code === 'GRADE_1')!;

  await db.insert(lessons).values([
    {
      courseId: grade2.id,
      lessonOrder: 1,
      title: '1차시. 회상미술의 개념과 노년기 정서 이해',
      summary: '어르신의 생애 기억이 그림을 통해 어떻게 긍정적 자존감으로 회복되는지 배웁니다.',
      learningGoal: '회상요법(Reminiscence Therapy)과 미술 활동의 결합 원리를 설명할 수 있다.',
      durationMinutes: 35,
      lectureNotes:
        '• 핵심 원리: 완성도보다 "이야기 나눔"이 우선입니다.\n• 도입 대화 예시: "어르신, 어릴 적 봄에 들판에서 가장 먼저 보았던 꽃이 기억나시나요?"\n• 주의할 점: 그림 실력을 평가하지 않고 색감 선택과 기억의 조각을 따뜻하게 경청합니다.',
    },
    {
      courseId: grade2.id,
      lessonOrder: 2,
      title: '2차시. 오감 자극을 여는 따뜻한 재료 선택과 안전',
      summary: '손의 악력이 약한 어르신도 편안히 잡을 수 있는 붓, 파스텔, 한지 재료를 익힙니다.',
      learningGoal: '대상자 신체 기능에 맞는 미술 도구를 안전하게 선정하고 세팅할 수 있다.',
      durationMinutes: 40,
      lectureNotes:
        '• 추천 도구: 굵은 수채 색연필, 스펀지 붓, 손에 묻지 않는 젤 크레용.\n• 책상 배치: 시야가 편안한 자연광 쪽으로 좌석을 배치하고 물통은 묵직한 도자기 그릇을 사용합니다.',
    },
    {
      courseId: grade2.id,
      lessonOrder: 3,
      title: '3차시. [도안 실습] 봄나물 캐는 7, 8살 아이들과 계절 회상 대화',
      summary: '봄나물 캐기 도안을 함께 채색하며 유년 시절 들판 기억을 꺼내는 60분 수업을 실습합니다.',
      learningGoal: '계절 도안 채색을 활용해 3단계(도입-표현-나눔) 수업을 진행할 수 있다.',
      durationMinutes: 45,
      lectureNotes:
        '• 도입(10분): 냉이·달래·쑥 이름을 떠올리며 봄나들이 말문을 엽니다.\n• 표현(35분): 봄나물 캐는 7, 8살 아이들 도안에 연보라·연두 수채 색연필로 채색합니다.\n• 나눔(15분): 어린 시절 누구와 들판에 나갔는지 한 문장씩 나눕니다.',
    },
    {
      courseId: grade2.id,
      lessonOrder: 4,
      title: '4차시. [도안 실습] 숨바꼭질 하는 아이들의 모습과 유년 기억 잇기',
      summary: '골목과 장독대 숨바꼭질 도안을 채색하며 장기 기억을 자극하고 웃음을 나눕니다.',
      learningGoal: '놀이 회상 질문을 구조화하여 집단 상호작용을 촉진할 수 있다.',
      durationMinutes: 40,
      lectureNotes:
        '• 감각 단서: 장독대, 담벼락, 저녁 연기, 친구 이름 등 친숙한 시각 단서를 활용합니다.\n• 소극적인 어르신에게는 "주로 어디에 숨으셨나요?"처럼 가벼운 질문을 건넵니다.',
    },
    {
      courseId: grade2.id,
      lessonOrder: 5,
      title: '5차시. [도안 실습] 정월 장 만들기와 세시풍속 회상 채색',
      summary: '장독대·금줄·숯 도안을 채색하며 정성껏 살림을 꾸려온 자부심과 가족 이야기를 나눕니다.',
      learningGoal: '세시풍속 도안 채색을 어르신 수준에 맞게 변형하여 자존감을 높일 수 있다.',
      durationMinutes: 40,
      lectureNotes:
        '• 소근육 자극: 항아리 곡선을 따라 부드럽게 색연필 명암을 넣어봅니다.\n• 집단 긍정 피드백: 집안마다 다르던 장 담그는 노하우를 서로 존중하며 경청합니다.',
    },
    {
      courseId: grade2.id,
      lessonOrder: 6,
      title: '6차시. 회상미술 프로그램 계획안 작성과 관찰 기록',
      summary: '복지관·경로당 제출용 표준 교안 작성법과 어르신 반응 관찰 일지 기록법을 정리합니다.',
      learningGoal: '실제 기관에 제출 가능한 1회기 회상미술 프로그램 계획안을 완성할 수 있다.',
      durationMinutes: 35,
      lectureNotes:
        '• 계획안 필수 요소: 프로그램명, 대상 및 인원, 회상 목표, 준비물, 도입·전개·마무리 시간 배분.\n• 관찰 일지에는 "참여 태도, 발화 횟수, 표정 변화, 선호 색채"를 객관적으로 남깁니다.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 1,
      title: '1차시. 인지기능 단계별(정상·경도인지장애·초기치매) 미술 중재',
      summary: '어르신의 인지 스펙트럼에 따라 과제 난이도와 시각적 안내선을 조절하는 법을 배웁니다.',
      learningGoal: '인지 수준별 맞춤형 도안 단순화 및 안내 전략을 수립할 수 있다.',
      durationMinutes: 50,
      lectureNotes:
        '• 경도인지장애 단계: 기억 단서를 2~3개로 좁히고 단계별 시범을 천천히 보여줍니다.\n• 초기 치매 어르신: 선택지 과부하를 피하기 위해 한 번에 3~4가지 색만 테이블에 둡니다.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 2,
      title: '2차시. 감정의 안전한 수용과 상실·우울 회상 다루기',
      summary: '회상 과정에서 슬픔이나 그리움이 올라올 때 강사가 따뜻하고 안전하게 지지하는 기법입니다.',
      learningGoal: '부정적 정서 반응 발생 시 비언어적 공감과 안전한 종결 기법을 적용할 수 있다.',
      durationMinutes: 45,
      lectureNotes:
        '• 감정을 억누르지 않고 "그때 정말 애쓰셨겠어요"라며 현재의 성취로 시선을 부드럽게 옮깁니다.\n• 마무리 단계에는 따뜻한 차 마시기 또는 손 마사지 호흡으로 현재감을 회복합니다.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 3,
      title: '3차시. [현장사례] 8회기 연속 인지회상 미술 커리큘럼 설계',
      summary: '평생학습관과 치매안심센터에서 가장 선호하는 8주 연속 프로그램 구성을 분석합니다.',
      learningGoal: '생애주기 흐름(유년기-청년기-중년기-현재)에 따른 8회기 커리큘럼을 설계할 수 있다.',
      durationMinutes: 50,
      lectureNotes:
        '• 1~2회기: 라포 형성(나의 이름 꽃, 봄꽃)\n• 3~5회기: 청·장년 기억(첫 직장, 혼례, 자녀 이야기)\n• 6~8회기: 자서전 그림책 제본 및 소규모 전시회 개최.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 4,
      title: '4차시. 작품 전시와 가족 소통: 작은 화실 회고전 운영',
      summary: '어르신의 작품을 액자·엽서로 제작해 자존감을 극대화하고 보호자와 공유하는 방법입니다.',
      learningGoal: '참여자 작품 중심의 소규모 기관 전시회 및 수료식을 기획할 수 있다.',
      durationMinutes: 40,
      lectureNotes:
        '• 모든 작품 하단에 어르신의 이름과 짧은 한 줄 이야기를 함께 인쇄해 전시합니다.\n• 보호자에게 전달하는 회상 리포트는 강점 중심의 따뜻한 언어로 작성합니다.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 5,
      title: '5차시. 복지관·요양시설 강사 출강 실무와 제안서 작성',
      summary: '평생학습관, 주간보호센터, 요양원 섭외 시 필요한 강의계획서·이력서·강사료 기준을 익힙니다.',
      learningGoal: '공공·복지 기관 제출용 표준 출강 제안서를 작성할 수 있다.',
      durationMinutes: 45,
      lectureNotes:
        '• 기관 담당자가 가장 중요하게 보는 3가지: 자격증 진위 여부, 현장 안전 대책, 차시별 결과물.\n• 온라인 자격증 진위 조회 번호를 제안서 상단에 함께 기재하면 신뢰도가 크게 높아집니다.',
    },
    {
      courseId: grade1.id,
      lessonOrder: 6,
      title: '6차시. 심화 사례 분석 및 수퍼비전 가이드',
      summary: '실제 현장 사례 3편을 통해 돌발 상황 대처와 윤리적 경계 유지 원칙을 종합 점검합니다.',
      learningGoal: '현장 사례 데이터를 바탕으로 프로그램 개선점을 도출할 수 있다.',
      durationMinutes: 45,
      lectureNotes:
        '• 강사는 의료적 진단을 내리지 않으며, 정서적 지지와 예술적 촉진자의 역할을 지킵니다.\n• 매 회기 종료 후 5분간 자가 점검 체크리스트를 작성해 수업의 질을 유지합니다.',
    },
  ]);

  await db.insert(certificates).values([
    {
      certNumber: '2027-01-0001',
      courseId: grade1.id,
      holderName: '김은희',
      birthDate: '1968-04-12',
      gradeLabel: '1급 심화·현장실습',
      courseTitle: '회상미술 지도사 1급',
      issuedAt: '2027-01-15',
      issuerName: '메모리테라피회상미술 연구원',
      status: '유효',
    },
    {
      certNumber: '2027-02-0014',
      courseId: grade2.id,
      holderName: '박정숙',
      birthDate: '1964-09-23',
      gradeLabel: '2급 기초·이론',
      courseTitle: '회상미술 지도사 2급',
      issuedAt: '2027-01-22',
      issuerName: '메모리테라피회상미술 연구원',
      status: '유효',
    },
    {
      certNumber: '2027-01-0008',
      courseId: grade1.id,
      holderName: '이서연',
      birthDate: '1975-11-05',
      gradeLabel: '1급 심화·현장실습',
      courseTitle: '회상미술 지도사 1급',
      issuedAt: '2027-02-03',
      issuerName: '메모리테라피회상미술 연구원',
      status: '유효',
    },
  ]);

  await db.insert(resources).values([
    {
      category: '계절별 도안',
      title: '봄나물 캐는 7, 8살 아이들 채색 도안 및 회상 가이드',
      seasonOrTag: '봄 도안 채색 · 2급/1급 공용',
      summary: '어린 시절 들판에서 봄나물을 캐던 기억을 떠올리며 따뜻한 색으로 채색하는 60분 활동 도안입니다.',
      imageUrl: '/src/assets/images/template_spring_herbs_1795155477388.jpg',
      contentBody:
        '# 봄나물 캐는 7, 8살 아이들 회상미술 채색 도안\n\n- 대상: 복지관·주간보호센터 어르신 (6~12명)\n- 준비물: 채색 도안지, 굵은 수채 색연필, 물붓\n- 도입 질문: "어릴 적 일곱, 여덟 살 때 들판에 나가 어떤 봄나물을 주로 캐셨나요?"\n- 진행 순서:\n  1) 도안 속 아이들의 표정과 바구니를 손가락으로 따라 보며 이야기를 나눕니다.\n  2) 봄꽃은 연보라와 분홍으로, 나물은 싱그러운 연두색으로 편안히 채색합니다.\n  3) 완성 후 그 시절 가장 기억에 남는 친구나 가족 이야기를 나눕니다.',
    },
    {
      category: '계절별 도안',
      title: '숨바꼭질 하는 아이들의 모습 채색 도안',
      seasonOrTag: '추억 도안 채색 · 치매안심센터 추천',
      summary: '장독대와 담장 뒤에 숨어 웃던 골목길 숨바꼭질 기억을 되살리며 채색하는 대표 도안입니다.',
      imageUrl: '/src/assets/images/template_hide_and_seek_1795155478944.jpg',
      contentBody:
        '# 숨바꼭질 하는 아이들의 모습 회상미술 채색 도안\n\n- 대상: 경도인지장애 및 일반 어르신\n- 준비물: 채색 도안지, 파스텔, 수채 색연필\n- 도입 질문: "어릴 적 동네 친구들과 숨바꼭질할 때 어르신만의 비밀 숨는 장소가 있었나요?"\n- 진행 포인트:\n  1) 장독대와 기와지붕의 큰 면적부터 편안하게 칠합니다.\n  2) 술래가 눈을 감고 숫자를 세던 추억을 함께 웃으며 이야기합니다.',
    },
    {
      category: '계절별 도안',
      title: '정월 장 만들기 세시풍속 채색 도안',
      seasonOrTag: '세시풍속 도안 채색 · 정서·인지 회상',
      summary: '금줄과 숯, 빨간 고추가 달린 장독대 도안을 채색하며 정월 장 담그기 추억을 나누는 수업 자료입니다.',
      imageUrl: '/src/assets/images/template_making_jang_1795155477471.jpg',
      contentBody:
        '# 정월 장 만들기 회상미술 채색 도안\n\n- 대상: 요양원·경로당 그룹 수업\n- 준비물: 채색 도안지, 수채 색연필, 크레용\n- 도입 질문: "정월에 장을 담그실 때 항아리에 숯과 고추를 왜 띄워 두셨는지 기억나시나요?"\n- 진행 포인트:\n  1) 항아리의 윤기 나는 갈색과 금줄·고추의 선명한 색감을 채워 넣습니다.\n  2) 집안마다 간장·된장을 잘 담그던 비법과 가족 이야기를 경청합니다.',
    },
    {
      category: '상담 일지 양식',
      title: '어르신 회상미술 정서·인지 반응 관찰 일지 (표준 양식)',
      seasonOrTag: '기관 제출용 · 표준 서식',
      summary: '수업 후 어르신의 표정 변화, 발화량, 색채 선택, 소근육 협응을 간결하게 기록하는 실무 서식입니다.',
      imageUrl: '/src/assets/images/journey_pamphlet_visual_1795154033475.jpg',
      contentBody:
        '# 어르신 회상미술 관찰 일지\n\n- 일시 / 기관명: 2027년 __월 __일 / __________\n- 회기 주제: ______________________\n- 참여 어르신 성함: __________\n\n[관찰 항목]\n1. 초기 반응 및 라포 형성: (적극적 / 보통 / 소극적)\n2. 주요 회상 발화 키워드: \n3. 선호 색상 및 재료 사용 특징: \n4. 다음 회기 지원 메모: ',
    },
    {
      category: '기획 문서 아카이브',
      title: '01_자격증_개요.md — 자격명·발급기관·비전 정의서',
      seasonOrTag: '기획 아카이브 · PQI 준비',
      summary: '회상미술 지도사(1급·2급) 민간자격 신설 목적, 직무 내용, 발급기관 비전을 정리한 기본 문서입니다.',
      imageUrl: '',
      contentBody:
        '# 01. 회상미술 지도사 민간자격 개요\n\n- 자격명: 회상미술 지도사 (1급 / 2급)\n- 발급기관: 메모리테라피회상미술 연구원 (평생학습원)\n- 자격의 목적: 고령화 사회 속에서 미술 활동과 회상요법을 결합하여 어르신의 인지 건강과 정서적 안녕을 돕는 현장 전문 강사 양성.\n- 주요 직무: 평생학습관, 노인복지관, 치매안심센터, 요양시설 등에서 회상미술 프로그램을 기획·진행하고 참여자 반응 일지를 관리.',
    },
    {
      category: '기획 문서 아카이브',
      title: '02_커리큘럼_구성.md & 03_웹사이트_메뉴구조도.md',
      seasonOrTag: '기획 아카이브 · 교육·웹 설계',
      summary: '2급 기초 6차시·1급 심화 6차시 학습 목표와 5대 핵심 웹 메뉴 구성 초안을 한데 모았습니다.',
      imageUrl: '',
      contentBody:
        '# 02. 커리큘럼 및 03. 웹사이트 메뉴 구조도\n\n[2급 기초·이론 6차시]\n1) 회상미술 개념과 노년기 정서  2) 재료 선택과 안전  3) 봄꽃 수채 실습  4) 고향 풍경 기억 잇기  5) 명절 다과상 콜라주  6) 프로그램 계획안 작성\n\n[1급 심화·현장실습 6차시]\n1) 인지단계별 중재  2) 감정 수용 기법  3) 8회기 커리큘럼 설계  4) 작품 회고전 운영  5) 기관 출강 제안서 실무  6) 심화 사례 수퍼비전\n\n[웹사이트 5대 메뉴]\n1. 팜플렛 홈(자격안내)  2. 나의 강의실(LMS·진도·시험)  3. 자격증 조회  4. 도안 자료실  5. 강사 매칭·출강 의뢰',
    },
  ]);

  await db.insert(instructors).values([
    {
      name: '김은희',
      certNumber: '2027-01-0001',
      gradeLabel: '1급 심화·현장실습',
      region: '서울 마포·은평',
      specialty: '치매안심센터 · 고향 풍경 수채화',
      bio: '평생교육사 자격과 복지관 출강 경험을 바탕으로 어르신 눈높이에 맞춘 따뜻한 수채 회상 수업을 진행합니다.',
      experienceYears: 6,
      availableForDispatch: true,
    },
    {
      name: '박정숙',
      certNumber: '2027-02-0014',
      gradeLabel: '2급 기초·이론',
      region: '경기 성남·분당',
      specialty: '경로당 · 계절 꽃바구니 미술',
      bio: '중장년과 노년층이 첫 붓을 잡는 두려움 없이 즐겁게 기억을 나눌 수 있도록 세심하게 동행합니다.',
      experienceYears: 3,
      availableForDispatch: true,
    },
    {
      name: '이서연',
      certNumber: '2027-01-0008',
      gradeLabel: '1급 심화·현장실습',
      region: '부산 해운대·수영',
      specialty: '주간보호센터 · 한지 콜라주 인지재활',
      bio: '소근육 자극에 효과적인 한지·명절 소재 콜라주 프로그램과 보호자 소통 회고전 기획을 전문으로 합니다.',
      experienceYears: 5,
      availableForDispatch: true,
    },
    {
      name: '최민준',
      certNumber: '2027-01-0011',
      gradeLabel: '1급 심화·현장실습',
      region: '대전 유성·서구',
      specialty: '요양원 · 남성 어르신 생애 자서전 미술',
      bio: '옛 직업과 청춘의 추억을 주제로 어르신들의 자존감을 높이는 남성·혼합 그룹 회상미술 강의를 운영합니다.',
      experienceYears: 4,
      availableForDispatch: true,
    },
  ]);

  await db.insert(dispatchInquiries).values([
    {
      organizationName: '마포구 어르신 평생학습관',
      contactName: '한지영 주무관',
      contactPhone: '02-3153-0000',
      contactEmail: 'edu@mapo-senior.example.kr',
      region: '서울 마포·은평',
      inquiryType: '강사 출강 의뢰',
      targetInstructorName: '김은희',
      preferredDate: '2027-03-10',
      details: '봄학기 8회기 어르신 회상미술 반(정원 12명) 강사 파견을 희망합니다.',
      status: '상담 진행중',
    },
  ]);
}
