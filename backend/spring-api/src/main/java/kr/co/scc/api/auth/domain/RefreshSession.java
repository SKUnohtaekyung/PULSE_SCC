package kr.co.scc.api.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * 갱신 토큰 세션.
 *
 * <p>{@code replacedBySessionId} 는 이 세션이 <em>회전</em>으로 폐기됐는지를 구분한다.
 * 로그아웃으로 폐기된 세션에는 값이 없다. 폐기된 토큰이 다시 들어왔을 때
 * 정상 재시도와 토큰 재사용을 가르는 근거가 된다.
 */
public record RefreshSession(
        UUID id,
        UserAccount user,
        Instant expiresAt,
        Instant revokedAt,
        UUID replacedBySessionId) {

    public boolean rotated() {
        return replacedBySessionId != null;
    }
}
