import type { AnalysisResult, EvidencePreview, PerspectiveKey, PodiumSlot } from '@/api/types';

// 결과 화면들이 함께 쓰는 순서·문구·날짜 표기.

export const perspectiveOrder: { key: PerspectiveKey; label: string }[] = [
  { key: 'priority', label: '먼저 볼 것' },
  { key: 'positive', label: '잘하고 있는 점' },
  { key: 'negative', label: '손님이 불편해한 점' },
  { key: 'perception', label: '손님이 기억하는 모습' },
];

/** 11월 15일 */
export const formatMonthDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

/** 11월 15일 15:12 */
export const formatMonthDayTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${formatMonthDay(value)} ${time}`;
};

/** 예시 리뷰 · 2026년 10월 */
export const formatReviewMonth = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `예시 리뷰 · ${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

/** 같은 리뷰의 같은 구절이 대표 리뷰에 두 번 오면 한 번만 보여 준다. */
export const dedupeEvidence = (reviews: EvidencePreview[]) =>
  reviews.filter(
    (review, index) =>
      reviews.findIndex(
        (candidate) => candidate.reviewId === review.reviewId && candidate.excerpt === review.excerpt,
      ) === index,
  );

/** 채워진 손님 유형을 순위 순으로. 응답이 rank 순이라는 보장이 계약에 없다(SCREEN_STATES §6.1). */
export const filledSlots = (result: AnalysisResult): PodiumSlot[] =>
  [...result.podium]
    .sort((left, right) => left.rank - right.rank)
    .filter((slot) => slot.status === 'FILLED' && slot.persona);

/** 분석한 리뷰 중 이 유형의 비율(앱 계산값). 유형끼리 겹칠 수 있어 합이 100%를 넘을 수 있다. */
export const shareOf = (slot: PodiumSlot, validReviewCount: number) =>
  slot.topicReviewCount !== undefined && validReviewCount > 0
    ? Math.round((slot.topicReviewCount / validReviewCount) * 100)
    : null;
