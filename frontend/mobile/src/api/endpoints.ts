import type { ApiClient } from '@/api/client';
import type {
  AnalysisResult,
  ApiUser,
  CreateJobRequest,
  EvidencePage,
  JobCreated,
  JobStatus,
  LegalDocuments,
  NotificationItem,
  NotificationSettings,
  RegisterRequest,
  SavedAnalysisReplaced,
  SessionResponse,
} from '@/api/types';

export const login = (client: ApiClient, email: string, password: string) =>
  client.requestPublic<SessionResponse>({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email, password },
  });

/** 저장된 인증 정보로 세션을 확인한다(AUTH-RESTORING). */
export const restoreSession = (client: ApiClient) =>
  client.request<ApiUser>({ method: 'GET', path: '/api/v1/auth/session' });

export const logout = (client: ApiClient) =>
  client.request<null>({ method: 'POST', path: '/api/v1/auth/logout' });

export const createAnalysisJob = (
  client: ApiClient,
  request: CreateJobRequest,
  idempotencyKey: string,
) =>
  client.request<JobCreated>({
    method: 'POST',
    path: '/api/v1/analysis-jobs',
    body: request,
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const getAnalysisJob = (client: ApiClient, jobId: string) =>
  client.request<JobStatus>({ method: 'GET', path: '/api/v1/analysis-jobs/' + jobId });

export const getAnalysisJobResult = (client: ApiClient, jobId: string) =>
  client.request<AnalysisResult>({
    method: 'GET',
    path: '/api/v1/analysis-jobs/' + jobId + '/result',
  });

export const getSavedAnalysis = (client: ApiClient) =>
  client.request<AnalysisResult>({ method: 'GET', path: '/api/v1/me/saved-analysis' });

export const replaceSavedAnalysis = (client: ApiClient, analysisId: string) =>
  client.request<SavedAnalysisReplaced>({
    method: 'PUT',
    path: '/api/v1/me/saved-analysis/' + analysisId,
  });

/**
 * 분석 작업 생성용 Idempotency-Key.
 * 암호학적 난수가 아니다. 이 값은 같은 사용자의 같은 제출을 서버가 구분하는 용도이고
 * 비밀이 아니므로 충돌만 피하면 된다(SCREEN_STATES 공통 불변식 13).
 */
export function createIdempotencyKey() {
  const hex = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const time = Date.now().toString(16).padStart(12, '0').slice(-12);
  return [hex(8), hex(4), '4' + hex(3), ((8 + Math.floor(Math.random() * 4)).toString(16) + hex(3)), time].join('-');
}

// ── 9단계에서 더한 호출 ────────────────────────────────────────────────────

export const getLegalDocuments = (client: ApiClient) =>
  client.requestPublic<LegalDocuments>({ method: 'GET', path: '/api/v1/legal-documents' });

export const register = (client: ApiClient, request: RegisterRequest) =>
  client.requestPublic<SessionResponse>({
    method: 'POST',
    path: '/api/v1/auth/register',
    body: request,
  });

export const getEvidence = (
  client: ApiClient,
  analysisId: string,
  query: { personaId: string; perspective: string; cursor?: string | null; limit?: number },
) => {
  const params = new URLSearchParams({
    personaId: query.personaId,
    perspective: query.perspective,
  });
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  return client.request<EvidencePage>({
    method: 'GET',
    path: `/api/v1/analyses/${analysisId}/evidence?${params.toString()}`,
  });
};

// 실제 백엔드(MyPageController)는 배열을 그대로 돌려준다. 감싸는 객체가 아니다.
export const getNotifications = (client: ApiClient) =>
  client.request<NotificationItem[]>({ method: 'GET', path: '/api/v1/me/notifications' });

export const getNotificationSettings = (client: ApiClient) =>
  client.request<NotificationSettings>({ method: 'GET', path: '/api/v1/me/notification-settings' });

export const updateNotificationSettings = (client: ApiClient, analysisResultEnabled: boolean) =>
  client.request<NotificationSettings>({
    method: 'PATCH',
    path: '/api/v1/me/notification-settings',
    body: { analysisResultEnabled },
  });
