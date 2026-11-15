import type { Advice, PerspectiveKey } from '@/api/types';

// 시연 앱 전용 예시 데이터다. 실제 가게·실제 리뷰가 아니다.
// 리뷰 문장은 시연을 위해 지어낸 것이며, 결과 문구는 실제 분석 결과 형식(API.md §6)만 따른다.
//
// 화면의 숫자는 모두 아래 리뷰 목록에서 계산한다(손으로 적은 수치를 두지 않는다).
// - 손님 유형의 리뷰 수 = 그 유형에 묶인 리뷰 수
// - 관점의 근거 수 = 그 유형·관점에 묶인 리뷰 수
// - 분석한 리뷰 = 유형에 묶인 리뷰 + 어느 유형에도 묶이지 않은 리뷰(generalReviews)
// - 모은 리뷰 = 분석한 리뷰 + 분석에서 뺀 리뷰(너무 짧거나 사진만 있는 리뷰)
// 사실 문장("반복돼요", "모두")은 아래 리뷰가 실제로 그 말을 뒷받침하도록 맞춰 두었다.
// 손님 유형 이름은 직업·연령·성별을 단정하지 않고 이용 상황으로 짓는다(PRD FR-003).

export type DemoPersonaKey = 'lunch' | 'family' | 'solo';

export type DemoReview = {
  id: string;
  persona: DemoPersonaKey;
  perspective: PerspectiveKey;
  excerpt: string;
  rating: number;
  writtenAt: string;
};

type DemoAdvice = Omit<Advice, 'id' | 'evidencePreview'> & {
  /** 이 제안의 근거가 된 리뷰. 같은 유형의 '손님이 불편해한 점' 리뷰 목록에서의 순서다. */
  evidence: number[];
};

export type DemoPersona = {
  key: DemoPersonaKey;
  label: string;
  summary: string;
  caveat: string | null;
  altText: string;
  facts: Record<PerspectiveKey, string[]>;
  interpretations: Record<PerspectiveKey, string[]>;
  advice: DemoAdvice[];
};

export const demoStoreDefaults = {
  storeName: '온기 한식당',
  category: '한식',
  naverPlaceUrl: 'https://naver.me/demo-ongi',
};

export const demoPersonas: DemoPersona[] = [
  {
    key: 'lunch',
    label: '평일 점심 손님',
    summary: '평일 점심 짧은 시간 안에 든든하게 먹고 돌아가야 하는 이용 상황',
    caveat: null,
    altText: '평일 점심 손님을 나타낸 AI 가상 인물 사진',
    facts: {
      positive: ['주문하고 음식이 빨리 나온다는 리뷰가 가장 많아요.', '점심 정식의 반찬 구성이 알차다는 이야기가 함께 나와요.'],
      negative: ['12시 전후 대기 줄이 길다는 리뷰가 반복돼요.', '식사 뒤 계산 줄이 다시 생긴다는 이야기도 있어요.'],
      perception: ['"회사 근처에서 믿고 가는 백반집"처럼 매일 와도 부담 없는 일상 식당으로 표현해요.'],
      priority: ['별점 4점 이하를 준 점심 손님 리뷰는 모두 대기나 계산 줄 이야기예요.'],
    },
    interpretations: {
      positive: ['짧은 점심시간 안에 식사를 마쳐야 하는 손님에게 가장 큰 선택 이유일 가능성이 있어요.'],
      negative: ['맛보다 시간 손실이 불만의 중심일 수 있어요.'],
      perception: ['특별한 날보다 자주 오는 일상 식당으로 자리 잡았을 가능성이 있어요.'],
      priority: ['기다리는 시간을 줄이면 재방문을 지키는 데 도움이 될 수 있어요.'],
    },
    advice: [
      {
        reviewFact: '12시 전후 대기 줄이 길다는 리뷰가 반복돼요.',
        suggestedAction: '11시 40분 전에 오는 손님에게 작은 혜택을 주는 방안을 검토해 보세요.',
        details: {
          aiInterpretation: '방문 시간을 조금만 나눠도 기다리는 체감이 줄어들 가능성이 있어요.',
          knowledgeReferences: [],
        },
        evidence: [0, 3],
      },
      {
        reviewFact: '식사 뒤 계산 줄이 다시 생긴다는 이야기가 있어요.',
        suggestedAction: '테이블 QR 결제나 선결제 안내를 시험해 보는 것을 검토해 보세요.',
        details: {
          aiInterpretation: '식사 후 바로 나가고 싶은 손님에게 계산 대기는 불편으로 남기 쉬워요.',
          knowledgeReferences: [],
        },
        evidence: [1, 5],
      },
    ],
  },
  {
    key: 'family',
    label: '주말 가족 손님',
    summary: '주말에 아이·부모님과 함께 넉넉하게 먹으러 오는 이용 상황',
    caveat: '주말 리뷰가 평일보다 적어요. 해석에 여유를 두세요.',
    altText: '주말 가족 손님을 나타낸 AI 가상 인물 사진',
    facts: {
      positive: ['양이 넉넉하고 맵지 않은 메뉴가 있어 아이와 먹기 좋다는 리뷰가 많아요.', '사장님이 친절하다는 이야기가 함께 나와요.'],
      negative: ['주차할 곳이 부족하다는 리뷰가 반복돼요.', '아기 의자가 모자랐다는 이야기도 있어요.'],
      perception: ['부모님을 모시거나 가족 외식을 하기 편한 곳으로 기억해요.'],
      priority: ['주말 리뷰에서 가장 자주 나온 불편은 주차예요.'],
    },
    interpretations: {
      positive: ['여러 세대가 함께 먹을 수 있는 메뉴 구성이 가족 손님을 부르는 이유일 가능성이 있어요.'],
      negative: ['도착 전 불편(주차)이 식사 경험 전체의 평가를 낮출 수 있어요.'],
      perception: ['편안하고 정갈한 가게라는 인상이 가족 모임 장소로 이어지고 있을 수 있어요.'],
      priority: ['주차 안내만 미리 해도 첫인상의 불만을 줄일 가능성이 있어요.'],
    },
    advice: [
      {
        reviewFact: '주차할 곳이 부족하다는 리뷰가 반복돼요.',
        suggestedAction: '근처 공영주차장 위치와 걸어오는 시간을 가게 소개에 적어 두는 것을 검토해 보세요.',
        details: {
          aiInterpretation: '미리 알고 오면 같은 불편도 덜 크게 느낄 수 있어요.',
          knowledgeReferences: [],
        },
        evidence: [0, 2],
      },
      {
        reviewFact: '아기 의자가 모자랐다는 이야기가 있어요.',
        suggestedAction: '주말 점심에 아기 의자를 한두 개 더 두는 것을 검토해 보세요.',
        details: {
          aiInterpretation: '작은 준비가 가족 손님의 재방문 결정에 영향을 줄 수 있어요.',
          knowledgeReferences: [],
        },
        evidence: [1],
      },
    ],
  },
  {
    key: 'solo',
    label: '조용한 혼밥 단골',
    summary: '혼자 와서 부담 없이 따뜻한 한 끼를 먹고 가는 이용 상황',
    caveat: '리뷰 수가 다른 유형보다 적어요. 참고용으로 보세요.',
    altText: '조용한 혼밥 단골을 나타낸 AI 가상 인물 사진',
    facts: {
      positive: ['혼자 와도 눈치 보이지 않는다는 리뷰가 반복돼요.', '반찬을 편하게 더 먹을 수 있다는 이야기가 있어요.'],
      negative: ['1인 좌석이 창가에만 있어 겨울에 춥다는 리뷰가 있어요.'],
      perception: ['집밥이 그리울 때 찾는 곳이라는 이야기가 반복돼요.'],
      priority: ['혼자 오는 단골이라고 밝힌 리뷰는 모두 별점 5점이에요.'],
    },
    interpretations: {
      positive: ['편안한 분위기가 혼자 오는 손님의 재방문 이유일 가능성이 있어요.'],
      negative: ['좌석 환경이 오래 머무는 손님의 만족도를 낮출 수 있어요.'],
      perception: ['집밥을 대신하는 일상 공간으로 받아들여지고 있을 수 있어요.'],
      priority: ['기존 단골의 만족을 지키는 것이 새 손님을 부르는 것보다 먼저일 수 있어요.'],
    },
    advice: [
      {
        reviewFact: '1인 좌석이 창가에만 있어 겨울에 춥다는 리뷰가 있어요.',
        suggestedAction: '겨울철 1인석에 무릎 담요를 두는 것을 검토해 보세요.',
        details: {
          aiInterpretation: '작은 배려가 단골의 애착을 더 단단하게 할 가능성이 있어요.',
          knowledgeReferences: [],
        },
        evidence: [0, 1],
      },
    ],
  },
];

// 유형·관점별 리뷰 문장. 별점은 관점에 맞춰 붙인다(아래 ratingFor).
const reviewTexts: Record<DemoPersonaKey, Record<PerspectiveKey, string[]>> = {
  lunch: {
    positive: [
      '점심에 갔는데 주문하고 5분 만에 나왔어요. 회사 복귀 여유 있게 했습니다.',
      '반찬이 매일 조금씩 바뀌어서 질리지 않아요. 제육 정식 추천해요.',
      '점심 정식 구성이 정말 알차요. 이 가격에 이 정도면 만족해요.',
      '음식 나오는 속도가 빨라서 점심시간이 짧은 날 꼭 여기로 와요.',
      '빨리 나와서 좋아요. 국도 따뜻하게 나와요.',
      '점심 정식 가성비 최고예요.',
      '반찬이 정갈하고 양도 넉넉해요.',
      '바쁜 점심에 딱이에요. 금방 먹고 나왔어요.',
      '김치찌개가 진하고 맛있어요. 나오는 것도 빨라요.',
      '직원분들이 손이 빨라서 기다릴 일이 거의 없어요.',
      '혼잡한데도 음식은 금방 나와요.',
      '불고기 정식이 맛있고 밑반찬도 계속 채워 주세요.',
      '시간 맞춰 먹고 나오기 좋은 백반집이에요.',
      '점심 메뉴 고민될 때 늘 여기예요. 빨리 나오는 게 최고.',
    ],
    negative: [
      '12시 10분에 갔더니 15분은 기다렸어요. 맛있지만 줄이 문제예요.',
      '먹는 건 빠른데 계산 줄이 또 있어서 시간이 아까웠어요.',
      '점심 피크에는 줄이 너무 길어서 그냥 돌아간 적도 있어요.',
      '12시 정각에는 가지 마세요. 대기가 너무 길어요.',
      '줄 서는 동안 점심시간 절반이 지나갔어요.',
      '계산대가 하나라 나갈 때 한참 기다렸어요.',
      '대기 명단이 없어서 줄을 계속 서 있어야 해요.',
      '맛은 좋은데 12시대 웨이팅은 각오해야 해요.',
    ],
    perception: [
      '회사 근처에서 믿고 가는 백반집이에요. 실패가 없어요.',
      '팀 점심 장소 고민될 때 무조건 여기예요.',
      '동네 사람들 점심 식당 같은 곳이에요.',
      '매일 와도 부담 없는 집밥 같은 점심이에요.',
      '근처에서 점심 하면 다들 여기 이야기해요.',
    ],
    priority: [
      '대기만 줄면 매일 오고 싶은 곳이에요.',
      '기다리는 시간 때문에 별 두 개 뺍니다.',
      '맛은 만점인데 계산 줄이 아쉬워요.',
      '줄이 길어서 다른 데로 갈까 고민했어요.',
      '웨이팅만 해결되면 단골 할게요.',
    ],
  },
  family: {
    positive: [
      '아이가 먹을 수 있는 안 매운 메뉴가 있어서 좋았어요. 양도 넉넉해요.',
      '사장님이 아이한테 계란말이를 서비스로 주셨어요. 너무 친절하세요.',
      '부모님이 간이 세지 않아서 좋다고 하셨어요.',
      '가족 넷이 배부르게 먹었어요. 양이 정말 많아요.',
      '아이 반찬을 따로 챙겨 주셔서 감동했어요.',
      '맵지 않은 국이 있어서 아이랑 오기 좋아요.',
      '사장님이 친절하셔서 가족 모임 하기 편했어요.',
      '부모님 생신 점심으로 왔는데 다들 만족했어요.',
      '반찬 리필을 아이 것까지 챙겨 주셨어요.',
    ],
    negative: [
      '주차할 곳이 없어서 근처를 몇 바퀴 돌았어요.',
      '아기 의자가 하나뿐이라 기다려야 했어요.',
      '주말에는 주차가 정말 어려워요. 미리 알았으면 좋았을 텐데요.',
      '주차장이 없어서 유모차 들고 한참 걸었어요.',
      '주말 점심엔 주차 자리 찾기가 힘들어요.',
      '가게 앞에 잠깐 세울 곳도 없어요.',
    ],
    perception: [
      '부모님 모시고 가기 편한 집이에요. 정갈해요.',
      '가족 외식 장소로 늘 여기를 골라요.',
      '조용하고 깔끔해서 어르신들이 좋아하세요.',
      '편하게 대화하며 먹을 수 있는 가게예요.',
    ],
    priority: [
      '주차만 해결되면 가족 모임은 여기로 정할게요.',
      '주말엔 주차 때문에 망설여져요.',
      '음식은 다 좋은데 주차가 제일 걸려요.',
    ],
  },
  solo: {
    positive: [
      '혼자 가도 전혀 눈치 안 보여요. 편하게 먹고 왔어요.',
      '반찬을 셀프로 더 가져올 수 있어서 편해요.',
      '혼밥 하기 좋은 분위기예요. 조용해요.',
      '혼자 와도 반겨 주셔서 좋아요.',
      '1인분도 푸짐하게 나와요.',
      '혼자 앉아도 어색하지 않은 자리가 있어요.',
    ],
    negative: [
      '1인석이 창가라 겨울엔 좀 추웠어요.',
      '창가 1인석에 바람이 들어와서 오래 앉아 있기 힘들어요.',
      '혼자 앉는 자리가 창가뿐이라 겨울엔 아쉬워요.',
    ],
    perception: [
      '집밥 생각날 때 가는 곳이에요. 된장찌개가 엄마 맛이에요.',
      '집밥 그리울 때 꼭 와요.',
      '혼자 사는 사람에게 집밥 같은 곳이에요.',
    ],
    priority: [
      '일주일에 두 번은 가는 단골이에요. 늘 한결같아요.',
      '3년째 단골이에요. 변하지 않아서 좋아요.',
    ],
  },
};

// 어느 손님 유형에도 묶이지 않았지만 분석에는 들어간 리뷰(가게 전반 이야기).
const generalReviewTexts = [
  '깔끔하고 맛있어요.',
  '전체적으로 무난하게 맛있는 집이에요.',
  '김치가 맛있어서 따로 사고 싶었어요.',
  '가게가 깨끗해서 좋아요.',
  '메뉴판이 보기 쉬워요.',
  '재방문 의사 있어요. 다음엔 다른 메뉴 먹어 볼게요.',
  '된장찌개 맛집이에요.',
  '가격이 착해요.',
  '밑반찬이 맛있어요.',
  '친구 추천으로 왔는데 만족해요.',
];

/** 분석에서 뺀 리뷰 수(너무 짧거나 글 없이 사진만 있는 리뷰). */
const excludedReviewCount = 12;

function ratingFor(perspective: PerspectiveKey, index: number) {
  if (perspective === 'negative') return index % 2 === 0 ? 3 : 4;
  // 우선순위 리뷰: 점심·가족은 불편 이야기라 3~4점, 혼밥 단골은 만족 이야기라 5점이다(fixtures 위 사실 문장과 맞춘다).
  if (perspective === 'priority') return index % 2 === 0 ? 4 : 3;
  return 5;
}

/** 2026-11-08부터 하루 반 간격으로 거슬러 올라간 날짜. 2년보다 오래된 리뷰는 없다. */
function dateFor(order: number) {
  const date = new Date(Date.UTC(2026, 10, 8));
  date.setUTCDate(date.getUTCDate() - Math.round(order * 1.5));
  return date.toISOString().slice(0, 10);
}

const keys: DemoPersonaKey[] = ['lunch', 'family', 'solo'];
const perspectiveOrder: PerspectiveKey[] = ['priority', 'positive', 'negative', 'perception'];

let order = 0;
export const demoReviews: DemoReview[] = keys.flatMap((persona) =>
  perspectiveOrder.flatMap((perspective) =>
    reviewTexts[persona][perspective].map((excerpt, index) => {
      order += 1;
      const rating =
        persona === 'solo' && perspective === 'priority' ? 5 : ratingFor(perspective, index);
      return {
        id: `demo-review-${String(order).padStart(3, '0')}`,
        persona,
        perspective,
        excerpt,
        rating,
        writtenAt: dateFor(order),
      };
    }),
  ),
);

/** 유형·관점에 묶인 리뷰. */
export const reviewsFor = (persona: DemoPersonaKey, perspective: PerspectiveKey) =>
  demoReviews.filter((review) => review.persona === persona && review.perspective === perspective);

/** 손님 유형의 리뷰 수(그 유형에 묶인 리뷰 수). */
export const topicReviewCountFor = (persona: DemoPersonaKey) =>
  demoReviews.filter((review) => review.persona === persona).length;

const validReviewCount = demoReviews.length + generalReviewTexts.length;

export const demoMetadata = {
  platform: 'NAVER',
  collectedReviewCount: validReviewCount + excludedReviewCount,
  validReviewCount,
  containsReviewsOlderThanTwoYears: false,
};
