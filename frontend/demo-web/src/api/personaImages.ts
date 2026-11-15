import { Asset } from 'expo-asset';

import type { ApiClient } from '@/api/client';
import type { PersonaImage } from '@/api/types';
import type { DemoPersonaKey } from '@/demo/fixtures';

// 원본 앱은 인증이 필요한 PNG를 서버에서 받아온다(API.md §6.1).
// 시연 앱은 서버가 없으므로 앱에 함께 넣은 손님 유형 사진을 쓴다.
// 사진은 팀이 ChatGPT(OpenAI)로 만든 AI 가상 인물이다(2026-11-15). 실제 서비스도 OpenAI로 인물 이미지를 만든다(PRD FR-004).
// 배경이 투명해서, 화면이 순위마다 정한 연한 색 원 위에 얹힌다.
export type PersonaImageSource =
  /** 실제로 받아올 이미지가 있다. */
  | { kind: 'remote'; client: ApiClient; path: string }
  /** 이미지를 가리키는 값이 없거나 인증 정보가 없다(IMAGE-LOAD-ERROR). */
  | { kind: 'unavailable' };

const photos: Record<DemoPersonaKey, number> = {
  lunch: require('@/assets/images/personas/persona-lunch.webp'),
  family: require('@/assets/images/personas/persona-family.webp'),
  solo: require('@/assets/images/personas/persona-solo.webp'),
};

export function personaImageSource(client: ApiClient, image: PersonaImage): PersonaImageSource {
  const tokens = client.getTokens();
  if (!tokens || !image.url) return { kind: 'unavailable' };
  return { kind: 'remote', client, path: image.url };
}

export async function loadPersonaImage(source: PersonaImageSource): Promise<string> {
  if (source.kind !== 'remote') throw new Error('불러올 페르소나 이미지가 없습니다.');
  const key = source.path.split('/demo-').pop() as DemoPersonaKey | undefined;
  const photo = key ? photos[key] : undefined;
  if (photo === undefined) throw new Error('시연용 사진이 없는 손님 유형입니다.');
  return Asset.fromModule(photo).uri;
}
