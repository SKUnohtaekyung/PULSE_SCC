import type { AnalysisResult, CreateJobRequest, Persona, PodiumSlot } from '@/api/types';

// 고정 fixture 데이터다. 실제 리뷰가 아니라 화면 구조 검증용 가상 데이터이며,
// 화면에는 fixture 모드임을 함께 표시한다(SCREEN_STATES §10).
// 문구는 Step 5 프로토타입(src/prototypes/result/ResultPrototype.tsx)의 가상 데이터를 계약 구조로 옮긴 것이다.

export const fixturePersonaImageIds = {
  revisit: '141f8562-0000-4000-8000-000000000001',
  spice: '141f8562-0000-4000-8000-000000000002',
  solo: '141f8562-0000-4000-8000-000000000003',
  missing: '141f8562-0000-4000-8000-00000000ffff',
} as const;

const imageUrl = (id: string) => '/api/v1/persona-images/' + id;

const evidence = (reviewId: string, excerpt: string, writtenAt: string) => ({
  reviewId,
  excerpt,
  writtenAt,
});

const perspective = (
  factId: string,
  fact: string,
  interpretation: string,
  previews: { reviewId: string; excerpt: string; writtenAt: string }[],
  evidenceCount: number,
) => ({
  reviewFacts: [{ id: 'fact-' + factId, text: fact }],
  aiInterpretations: [{ id: 'interpretation-' + factId, text: interpretation }],
  evidencePreview: previews,
  evidenceCount,
});

const revisitPersona: Persona = {
  id: '57cdd38d-0000-4000-8000-000000000001',
  label: '추억 재방문형',
  summary: '예전부터 방문해 온 손님이 익숙한 맛과 정겨운 분위기를 이유로 다시 찾는 패턴이에요.',
  caveat: null,
  image: {
    id: fixturePersonaImageIds.revisit,
    url: imageUrl(fixturePersonaImageIds.revisit),
    altText: '추억 재방문형을 나타내는 따뜻한 음식 그릇과 재방문 모티프',
    generatedByAi: true,
  },
  perspectives: {
    priority: perspective(
      'revisit-priority',
      '주말과 점심의 대기 언급이 반복돼요.',
      '혼잡 시간 안내가 재방문 경험을 좌우할 가능성이 있어요.',
      [evidence('review-r1', '주말 점심에는 대기가 조금 길어요.', '2026-07-03')],
      12,
    ),
    positive: perspective(
      'revisit-positive',
      '맛이 여전하고 반찬이 정갈하다는 표현이 반복돼요.',
      '변함없는 맛이 재방문의 핵심 이유로 보입니다.',
      [evidence('review-r2', '몇 년 만에 다시 왔는데 여전히 맛있네요.', '2026-08-12')],
      18,
    ),
    negative: perspective(
      'revisit-negative',
      '주말과 점심에 대기가 길어 불편했다는 의견이 있어요.',
      '혼잡 시간의 대기가 좋은 경험을 방해할 수 있어요.',
      [evidence('review-r3', '기다리는 시간이 길어 아쉬웠어요.', '2026-06-21')],
      11,
    ),
    perception: perspective(
      'revisit-perception',
      '오래 운영한 곳, 변함없는 맛으로 인식해요.',
      '신뢰감이 선택 이유로 작동할 가능성이 있어요.',
      [evidence('review-r4', '오래된 동네 맛집이라 믿고 갑니다.', '2026-05-30')],
      9,
    ),
  },
  advice: [
    {
      id: 'advice-0000-0001',
      reviewFact: '주말 등 혼잡 시간대에 대기가 길다는 언급이 반복돼요.',
      suggestedAction: '혼잡 시간과 예상 대기 안내를 먼저 정리해 보세요.',
      details: {
        aiInterpretation: '대기 정보를 미리 알면 재방문 결정이 쉬워질 가능성이 있습니다.',
        knowledgeReferences: [],
      },
      evidencePreview: [evidence('review-r3', '기다리는 시간이 길어 아쉬웠어요.', '2026-06-21')],
    },
  ],
};

const spicePersona: Persona = {
  id: '57cdd38d-0000-4000-8000-000000000002',
  label: '매운맛 조절형',
  summary: '맛있는 매운맛을 선호하지만 단계나 조절 가능 여부를 미리 알고 싶어 하는 패턴이에요.',
  caveat: null,
  image: {
    id: fixturePersonaImageIds.spice,
    url: imageUrl(fixturePersonaImageIds.spice),
    altText: '매운맛 조절형을 나타내는 찌개와 맵기 단계 모티프',
    generatedByAi: true,
  },
  perspectives: {
    priority: perspective(
      'spice-priority',
      '맵기 체감과 조절 가능 여부를 묻는 표현이 반복돼요.',
      '주문 전 맵기 기준이 선택을 돕는 정보일 수 있어요.',
      [evidence('review-s1', '맵기 선택 안내가 있으면 더 편할 것 같아요.', '2026-08-08')],
      10,
    ),
    positive: perspective(
      'spice-positive',
      '자극적이기보다 개운하고 계속 당긴다는 표현이 있어요.',
      '매운맛의 결이 강점으로 작동할 가능성이 있어요.',
      [evidence('review-s2', '칼칼한데 너무 자극적이지 않아서 좋았어요.', '2026-08-08')],
      15,
    ),
    negative: perspective(
      'spice-negative',
      '같은 메뉴도 방문 시점에 따라 더 맵게 느껴졌다는 의견이 있어요.',
      '맵기 편차가 기대와 어긋날 수 있어요.',
      [evidence('review-s3', '같이 간 사람은 조금 맵다고 했어요.', '2026-07-21')],
      8,
    ),
    perception: perspective(
      'spice-perception',
      '함께 온 사람의 취향에 맞춰 고르기 좋은 곳으로 인식해요.',
      '동행이 있는 방문에서 선택지가 강점일 수 있어요.',
      [evidence('review-s4', '각자 맵기를 고를 수 있어 좋았어요.', '2026-07-02')],
      7,
    ),
  },
  advice: [
    {
      id: 'advice-0000-0002',
      reviewFact: '맵기 체감과 조절 가능 여부를 묻는 리뷰가 반복돼요.',
      suggestedAction: '주문 전에 맵기 기준을 확인할 수 있게 해보세요.',
      details: {
        aiInterpretation: '선택 기준을 먼저 보여주면 주문 판단을 도울 수 있어요.',
        knowledgeReferences: [],
      },
      evidencePreview: [evidence('review-s1', '맵기 선택 안내가 있으면 더 편할 것 같아요.', '2026-08-08')],
    },
  ],
};

const soloPersona: Persona = {
  id: '57cdd38d-0000-4000-8000-000000000003',
  label: '혼밥 안심형',
  summary: '혼자 방문해도 부담 없는 상차림과 빠른 식사를 중요하게 보는 패턴이에요.',
  caveat: null,
  image: {
    id: fixturePersonaImageIds.solo,
    url: imageUrl(fixturePersonaImageIds.solo),
    altText: '혼밥 안심형을 나타내는 한 사람용 밥과 반찬 상차림',
    generatedByAi: true,
  },
  perspectives: {
    priority: perspective(
      'solo-priority',
      '혼자 주문할 수 있는 구성과 시간대 문의가 반복돼요.',
      '1인 이용 조건이 방문 결정에 영향을 줄 수 있어요.',
      [evidence('review-o1', '점심에 혼자 든든하게 먹기 좋아요.', '2026-07-18')],
      8,
    ),
    positive: perspective(
      'solo-positive',
      '반찬과 한 끼 구성이 알차고 부담 없다는 표현이 있어요.',
      '1인 상차림의 완성도가 강점일 수 있어요.',
      [evidence('review-o2', '혼자 왔는데도 편하게 먹었어요.', '2026-08-02')],
      13,
    ),
    negative: perspective(
      'solo-negative',
      '혼잡할 때 혼자 자리를 차지하기 조심스럽다는 의견이 있어요.',
      '좌석 안내가 없으면 방문을 망설일 수 있어요.',
      [evidence('review-o3', '붐빌 때 가능한 자리 안내가 있으면 좋겠어요.', '2026-07-18')],
      6,
    ),
    perception: perspective(
      'solo-perception',
      '빠르고 정갈한 한 끼가 가능한 곳으로 인식해요.',
      '혼밥 목적의 선택지로 기억될 가능성이 있어요.',
      [evidence('review-o4', '혼자서도 든든한 한 끼였어요.', '2026-06-11')],
      6,
    ),
  },
  advice: [
    {
      id: 'advice-0000-0003',
      reviewFact: '1인 주문 가능 여부와 혼잡 시간 좌석을 묻는 표현이 반복돼요.',
      suggestedAction: '1인 주문 가능 시간과 구성을 먼저 안내해 보세요.',
      details: {
        aiInterpretation: '주문 가능 조건이 불명확하면 방문을 망설일 수 있어요.',
        knowledgeReferences: [],
      },
      evidencePreview: [evidence('review-o3', '붐빌 때 가능한 자리 안내가 있으면 좋겠어요.', '2026-07-18')],
    },
  ],
};

const emptySlot = (rank: number): PodiumSlot => ({
  rank,
  status: 'EMPTY',
  reason: {
    code: 'INSUFFICIENT_TOPIC_EVIDENCE',
    message: '분석에 활용할 리뷰 근거가 부족해 손님 유형을 채우지 않았습니다.',
  },
});

const basePersonas: { persona: Persona; topicReviewCount: number }[] = [
  { persona: revisitPersona, topicReviewCount: 24 },
  { persona: spicePersona, topicReviewCount: 19 },
  { persona: soloPersona, topicReviewCount: 16 },
];

export type FixtureResultOptions = {
  personaCount: 0 | 1 | 2 | 3;
  containsOldReviews?: boolean;
  /** 이미지 조회 실패(IMAGE-LOAD-ERROR)를 재현할 때 1위 이미지 id를 없는 값으로 바꾼다. */
  breakFirstImage?: boolean;
};

export function buildFixtureResult(
  analysisId: string,
  jobId: string,
  request: CreateJobRequest,
  options: FixtureResultOptions,
): AnalysisResult {
  const podium: PodiumSlot[] = [1, 2, 3].map((rank) => {
    const entry = basePersonas[rank - 1];
    if (rank > options.personaCount || !entry) return emptySlot(rank);
    const persona: Persona = { ...entry.persona, image: { ...entry.persona.image } };
    if (rank === 1 && options.breakFirstImage) {
      persona.image = {
        ...persona.image,
        id: fixturePersonaImageIds.missing,
        url: imageUrl(fixturePersonaImageIds.missing),
      };
    }
    return {
      rank,
      status: 'FILLED' as const,
      topicReviewCount: entry.topicReviewCount,
      persona,
    };
  });

  return {
    analysisId,
    jobId,
    store: {
      name: request.storeName,
      category: request.category,
      naverPlaceUrl: request.naverPlaceUrl,
    },
    metadata: {
      platform: 'NAVER',
      collectedReviewCount: 84,
      validReviewCount: 67,
      collectedAt: '2026-09-22T03:30:30Z',
      analyzedAt: '2026-09-22T03:32:00Z',
      containsReviewsOlderThanTwoYears: options.containsOldReviews ?? true,
    },
    limitations: [
      {
        code: 'ANALYSIS_LIMITATION',
        message: '분석에 사용한 리뷰 중 일부는 2년보다 오래된 리뷰입니다.',
      },
    ],
    podium,
  };
}
