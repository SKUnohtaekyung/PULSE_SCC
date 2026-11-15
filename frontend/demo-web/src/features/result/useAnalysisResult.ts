import { useEffect, useState } from 'react';

import { getAnalysisJobResult, getSavedAnalysis } from '@/api/endpoints';
import { resolveErrorMessage } from '@/api/errorMessage';
import { ApiError, SessionExpiredError } from '@/api/errors';
import type { AnalysisResult } from '@/api/types';
import { useSession } from '@/session/SessionProvider';

// 결과의 하위 화면(손님 유형·검토해 볼 행동·분석 기준)이 같은 결과를 다시 불러오는 훅.
// 저장된 결과(홈에서 들어옴)와 저장 전 새 결과(미리보기에서 들어옴, jobId) 두 출처가 있다.
// 화면 사이에 결과를 들고 다니지 않고 주소(jobId)만 넘긴다 — 새로고침·링크로 들어와도 같은 화면이 나온다.

export type ResultSource = { kind: 'saved' } | { kind: 'preview'; jobId: string };

export const sourceFromParams = (jobId?: string): ResultSource =>
  jobId ? { kind: 'preview', jobId } : { kind: 'saved' };

/** 돌아갈 화면이 없을 때(링크로 바로 들어옴) 뒤로가기가 갈 곳. 미리보기면 저장 선택 화면으로 돌아간다. */
export const sourceHome = (source: ResultSource) =>
  source.kind === 'preview' ? `/preview-result?jobId=${encodeURIComponent(source.jobId)}` : '/home';

/** 하위 화면 주소에 붙일 값. 저장된 결과면 붙일 것이 없다. */
export const sourceParams = (source: ResultSource): Record<string, string> =>
  source.kind === 'preview' ? { jobId: source.jobId } : {};

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; result: AnalysisResult }
  | { phase: 'empty' }
  | { phase: 'error'; message: string };

export function useAnalysisResult(source: ResultSource) {
  const { client } = useSession();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const jobId = source.kind === 'preview' ? source.jobId : null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = jobId ? await getAnalysisJobResult(client, jobId) : await getSavedAnalysis(client);
        if (!cancelled) setState({ phase: 'ready', result });
      } catch (error) {
        if (cancelled || error instanceof SessionExpiredError) return;
        if (error instanceof ApiError && error.code === 'SAVED_ANALYSIS_NOT_FOUND') {
          setState({ phase: 'empty' });
          return;
        }
        setState({
          phase: 'error',
          message: resolveErrorMessage(error, {
            fallback: '결과를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.',
            offline: '인터넷에 연결되지 않아 결과를 불러오지 못했어요.',
          }),
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [client, jobId, reloadToken]);

  return {
    state,
    reload: () => {
      setState({ phase: 'loading' });
      setReloadToken((token) => token + 1);
    },
  };
}
