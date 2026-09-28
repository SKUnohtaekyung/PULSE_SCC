import { isFixtureMode } from '@/api/config';
import { getFixtureScenario, fixtureScenarios } from '@/api/fixtures/server';
import { Notice } from '@/components/ui/Notice';

// 가상 서버로 동작 중임을 화면에 알린다.
// SCREEN_STATES §10: fixture 데이터를 운영 데이터처럼 표시하지 않는다.
// 실제 서버에 연결하면(EXPO_PUBLIC_API_BASE_URL) 아무것도 그리지 않는다.

export function FixtureBanner() {
  if (!isFixtureMode) return null;
  const scenario = fixtureScenarios.find((item) => item.key === getFixtureScenario());
  return (
    <Notice
      title="예시 데이터로 보여드리는 화면이에요"
      message={`실제 서버에 연결하기 전이라 고정된 가상 데이터를 씁니다. 지금 상황: ${scenario?.label ?? '첫 분석 성공'}`}
    />
  );
}
