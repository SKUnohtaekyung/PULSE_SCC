import { ApiError, SessionExpiredError, sessionExpiredCodes, toApiError } from '@/api/errors';
import { sendRequest, type ApiRequest } from '@/api/transport';
import type { SessionResponse } from '@/api/types';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type ClientOptions = {
  /** 토큰이 회전되면 저장소에도 반영한다. */
  onTokens: (tokens: Tokens) => void;
  /** 세션이 끝났을 때(AUTH-EXPIRED) 알린다. */
  onSessionExpired: () => void;
};

const ok = (status: number) => status >= 200 && status < 300;

export class ApiClient {
  private tokens: Tokens | null = null;
  /** 갱신 요청은 한 번에 하나만 보낸다(SCREEN_STATES 공통 불변식 10). */
  private refreshing: Promise<Tokens> | null = null;

  constructor(private readonly options: ClientOptions) {}

  setTokens(tokens: Tokens | null) {
    this.tokens = tokens;
  }

  getTokens() {
    return this.tokens;
  }

  /** 인증이 필요 없는 요청. */
  async requestPublic<T>(request: ApiRequest): Promise<T> {
    const response = await sendRequest(request);
    if (!ok(response.status)) throw toApiError(response.status, response.body);
    return response.body as T;
  }

  /** 인증이 필요한 요청. 봉투 없는 401이면 토큰을 한 번 갱신하고 원래 요청을 다시 보낸다(불변식 12). */
  async request<T>(request: ApiRequest): Promise<T> {
    const first = await this.sendAuthorized(request);
    if (ok(first.status)) return first.body as T;

    const error = toApiError(first.status, first.body);
    if (!error.isEnvelopelessUnauthorized) throw error;

    await this.refreshTokens();

    const second = await this.sendAuthorized(request);
    if (ok(second.status)) return second.body as T;

    const retryError = toApiError(second.status, second.body);
    // error.code가 있는 401은 세션 만료가 아니다(공통 불변식 9).
    if (
      retryError.status === 401 &&
      (retryError.code === null || sessionExpiredCodes.includes(retryError.code))
    ) {
      this.expire();
      throw new SessionExpiredError();
    }
    throw retryError;
  }

  private async sendAuthorized(request: ApiRequest) {
    const headers = { ...request.headers };
    if (this.tokens) headers.Authorization = 'Bearer ' + this.tokens.accessToken;
    return sendRequest({ ...request, headers });
  }

  private async refreshTokens(): Promise<Tokens> {
    if (this.refreshing) return this.refreshing;

    const refreshToken = this.tokens?.refreshToken;
    if (!refreshToken) {
      this.expire();
      throw new SessionExpiredError();
    }

    this.refreshing = (async () => {
      try {
        const session = await this.requestPublic<SessionResponse>({
          method: 'POST',
          path: '/api/v1/auth/refresh',
          body: { refreshToken },
        });
        const next: Tokens = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        };
        this.tokens = next;
        this.options.onTokens(next);
        return next;
      } catch (error) {
        // 봉투 없는 오류(502·게이트웨이 HTML 등)는 401일 때만 세션 만료로 본다.
        // 그 밖의 봉투 없는 오류는 원인을 단정하지 않는다(공통 불변식 11).
        if (
          error instanceof ApiError &&
          ((error.code === null && error.status === 401) ||
            (error.code !== null && sessionExpiredCodes.includes(error.code)))
        ) {
          this.expire();
          throw new SessionExpiredError();
        }
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  private expire() {
    this.tokens = null;
    this.options.onSessionExpired();
  }
}
