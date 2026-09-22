import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiClient, type Tokens } from '@/api/client';
import { restoreSession } from '@/api/endpoints';
import { NetworkError, SessionExpiredError } from '@/api/errors';
import type { ApiUser, SessionResponse } from '@/api/types';
import { clearTokens, readTokens, writeTokens } from '@/session/storage';

// 앱 전역 진입 상태(SCREEN_STATES §3.1)를 그대로 옮긴 것이다.
// booting: APP-BOOTING, restoring: AUTH-RESTORING, signedOut: AUTH-INITIAL(만료면 AUTH-EXPIRED 안내),
// signedIn: APP-READY 또는 APP-FIRST-ANALYSIS-REQUIRED(hasSavedAnalysis로 갈린다), bootError: 복원 중 네트워크 실패.
export type SessionPhase = 'booting' | 'restoring' | 'signedOut' | 'signedIn' | 'bootError';

export type SessionState = {
  phase: SessionPhase;
  user: ApiUser | null;
  /** 직전 로그아웃이 세션 만료 때문이면 true. 로그인 화면에서 이유를 알린다. */
  expired: boolean;
};

type SessionValue = SessionState & {
  client: ApiClient;
  signIn: (session: SessionResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setHasSavedAnalysis: (value: boolean) => void;
  retryRestore: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ phase: 'booting', user: null, expired: false });
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const client = useMemo(
    () =>
      new ApiClient({
        onTokens: (tokens: Tokens) => {
          void writeTokens(tokens);
        },
        onSessionExpired: () => {
          void clearTokens();
          setState({ phase: 'signedOut', user: null, expired: true });
        },
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const tokens = await readTokens();
      if (cancelled) return;
      if (!tokens) {
        setState({ phase: 'signedOut', user: null, expired: false });
        return;
      }

      client.setTokens(tokens);
      setState((current) => ({ ...current, phase: 'restoring' }));

      try {
        const user = await restoreSession(client);
        if (cancelled) return;
        setState({ phase: 'signedIn', user, expired: false });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) {
          await clearTokens();
          client.setTokens(null);
          setState({ phase: 'signedOut', user: null, expired: true });
          return;
        }
        if (error instanceof NetworkError) {
          setState({ phase: 'bootError', user: null, expired: false });
          return;
        }
        // 그 밖의 오류도 로그인 상태를 단정하지 않는다. 다시 시도할 수 있게 둔다.
        setState({ phase: 'bootError', user: null, expired: false });
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [client, restoreAttempt]);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      client,
      signIn: async (session: SessionResponse) => {
        const tokens: Tokens = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        };
        client.setTokens(tokens);
        await writeTokens(tokens);
        setState({ phase: 'signedIn', user: session.user, expired: false });
      },
      signOut: async () => {
        client.setTokens(null);
        await clearTokens();
        setState({ phase: 'signedOut', user: null, expired: false });
      },
      setHasSavedAnalysis: (hasSavedAnalysis: boolean) => {
        setState((current) =>
          current.user
            ? { ...current, user: { ...current.user, hasSavedAnalysis } }
            : current,
        );
      },
      retryRestore: () => {
        setState({ phase: 'booting', user: null, expired: false });
        setRestoreAttempt((attempt) => attempt + 1);
      },
    }),
    [client, state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider 안에서만 useSession을 쓸 수 있어요.');
  return value;
}
