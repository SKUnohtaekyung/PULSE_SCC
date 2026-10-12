import { TurboModuleRegistry } from 'react-native';

import { googleWebClientId } from '@/api/config';

// Google 계정 선택 창을 띄워 ID 토큰을 받는다. 토큰 검증과 세션 발급은 서버가 한다
// (POST /api/v1/auth/google). 상태 정본은 SCREEN_STATES §3.2 AUTH-GOOGLE-*다.
//
// 라이브러리는 누르는 순간에, 네이티브 모듈이 있는 것을 확인한 뒤에 불러온다. 모듈이 없는
// Expo Go에서는 불러오는 것만으로 치명 오류가 보고되고, Metro가 그 예외를 삼켜 try/catch로는
// 잡히지 않는다.

export type GoogleSignInOutcome =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  /** 빌드에 웹 클라이언트 ID가 없다. */
  | { type: 'notConfigured' }
  /** 이 앱 빌드에 Google 로그인 모듈이 없다(Expo Go). */
  | { type: 'unsupported' }
  | { type: 'playServicesUnavailable' }
  | { type: 'failed' };

export async function requestGoogleIdToken(): Promise<GoogleSignInOutcome> {
  if (!googleWebClientId) return { type: 'notConfigured' };

  if (TurboModuleRegistry.get('RNGoogleSignin') == null) return { type: 'unsupported' };

  const { GoogleSignin, isErrorWithCode, statusCodes } = await import(
    '@react-native-google-signin/google-signin'
  );

  try {
    // 서버가 ID 토큰의 대상(aud)을 이 웹 클라이언트 ID와 대조한다.
    GoogleSignin.configure({ webClientId: googleWebClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return { type: 'cancelled' };

    const idToken = response.data.idToken;
    // 앱의 세션은 서버가 발급한 토큰으로 유지한다. Google 쪽 로그인 상태를 남겨 두면
    // 다음에 계정 선택 창 없이 같은 계정으로 들어가므로 토큰만 받고 정리한다. 로그인을 늦추지
    // 않도록 끝나기를 기다리지 않는다.
    void GoogleSignin.signOut().catch(() => null);

    return idToken ? { type: 'success', idToken } : { type: 'failed' };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return { type: 'cancelled' };
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { type: 'playServicesUnavailable' };
      }
      // 콘솔 등록이 어긋나면(패키지 이름·서명 지문·클라이언트 ID) 여기로 온다. 대표적으로 코드 10.
      console.warn('Google 로그인 실패', error.code, error.message);
    }
    return { type: 'failed' };
  }
}
