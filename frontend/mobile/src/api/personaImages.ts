import type { ImageSourcePropType } from 'react-native';

import type { ApiClient } from '@/api/client';
import { apiBaseUrl, isFixtureMode } from '@/api/config';
import { fixturePersonaImageIds } from '@/api/fixtures/data';
import type { PersonaImage } from '@/api/types';

// 페르소나 이미지는 공개 URL이 아니다. 인증 사용자와 소유권을 확인한 뒤 서버가 내려준다(API.md §6.1).
//
// fixture 모드에서는 이미지를 내려줄 서버가 없다. 프로토타입용 그림(assets/images/personas/prototype)은
// DESIGN_SYSTEM §3.6이 제품 화면 사용을 금지하므로 쓰지 않고, 코드로 그린 자리표시를 보여준다.

export type PersonaImageSource =
  /** 실제로 받아올 이미지가 있다. */
  | { kind: 'remote'; source: ImageSourcePropType }
  /** 가상 서버라 내려받을 이미지가 없다. 자리표시를 보여준다. */
  | { kind: 'fixture' }
  /** 이미지를 가리키는 값이 없거나 인증 정보가 없다(IMAGE-LOAD-ERROR). */
  | { kind: 'unavailable' };

const knownFixtureImageIds: string[] = [
  fixturePersonaImageIds.revisit,
  fixturePersonaImageIds.spice,
  fixturePersonaImageIds.solo,
];

/**
 * 이미지를 어떻게 보여줄지 정한다. 실패·자리표시 표현은 화면에서 코드로 그린다(DESIGN_SYSTEM §3.6).
 * 실제 서버에서는 Authorization 헤더가 필요하며, 그 요청도 불변식 12의 재전송 대상이다(§6.4, 아직 미구현).
 */
export function personaImageSource(client: ApiClient, image: PersonaImage): PersonaImageSource {
  if (isFixtureMode) {
    return knownFixtureImageIds.includes(image.id) ? { kind: 'fixture' } : { kind: 'unavailable' };
  }
  const tokens = client.getTokens();
  if (!tokens || !image.url) return { kind: 'unavailable' };
  return {
    kind: 'remote',
    source: {
      uri: (apiBaseUrl ?? '') + image.url,
      headers: { Authorization: 'Bearer ' + tokens.accessToken },
    },
  };
}
