import type { ApiClient } from '@/api/client';
import type { PersonaImage } from '@/api/types';

// 페르소나 이미지는 공개 URL이 아니다. 인증 사용자와 소유권을 확인한 뒤 서버가 내려준다(API.md §6.1).
//
export type PersonaImageSource =
  /** 실제로 받아올 이미지가 있다. */
  | { kind: 'remote'; client: ApiClient; path: string }
  /** 이미지를 가리키는 값이 없거나 인증 정보가 없다(IMAGE-LOAD-ERROR). */
  | { kind: 'unavailable' };

/**
 * 이미지를 어떻게 보여줄지 정한다. 실패·자리표시 표현은 화면에서 코드로 그린다(DESIGN_SYSTEM §3.6).
 * 실제 서버에서는 Authorization 헤더가 필요하며, 그 요청도 불변식 12에 따라 토큰 갱신 후 한 번 재전송한다.
 */
export function personaImageSource(client: ApiClient, image: PersonaImage): PersonaImageSource {
  const tokens = client.getTokens();
  if (!tokens || !image.url) return { kind: 'unavailable' };
  return { kind: 'remote', client, path: image.url };
}

const bytesToDataUri = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return `data:image/png;base64,${btoa(binary)}`;
};

export async function loadPersonaImage(source: PersonaImageSource): Promise<string> {
  if (source.kind !== 'remote') throw new Error('불러올 페르소나 이미지가 없습니다.');
  return bytesToDataUri(await source.client.requestImage(source.path));
}
