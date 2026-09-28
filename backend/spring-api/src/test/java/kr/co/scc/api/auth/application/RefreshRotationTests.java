package kr.co.scc.api.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.auth.domain.RefreshSession;
import kr.co.scc.api.auth.domain.SessionTokens;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class RefreshRotationTests {

    private static final Instant NOW = Instant.parse("2026-09-19T00:00:00Z");

    private AuthRepository repository;
    private TokenService tokenService;
    private AuthService service;
    private UserAccount user;

    @BeforeEach
    void setUp() {
        repository = mock(AuthRepository.class);
        tokenService = mock(TokenService.class);
        user = new UserAccount(UUID.randomUUID(), "owner@example.com", "hash", "01012345678", "ACTIVE");
        when(tokenService.hashRefreshToken("token")).thenReturn("token-hash");
        when(tokenService.issue(any(), any())).thenReturn(new SessionTokens(
                "access-token",
                NOW.plusSeconds(900),
                "next-refresh-token",
                "next-refresh-hash",
                NOW.plusSeconds(2_592_000)));
        service = new AuthService(
                repository,
                mock(PasswordEncoder.class),
                tokenService,
                mock(GoogleIdTokenVerifier.class),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private RefreshSession session(Instant revokedAt, UUID replacedBy) {
        return new RefreshSession(UUID.randomUUID(), user, NOW.plusSeconds(3600), revokedAt, replacedBy);
    }

    private void tokenResolvesTo(RefreshSession value) {
        when(repository.findSessionByTokenHash("token-hash")).thenReturn(Optional.of(value));
    }

    @Test
    void rotatesAnActiveSession() {
        tokenResolvesTo(session(null, null));
        when(repository.rotateSession(any(), any(), any())).thenReturn(true);

        AuthService.AuthResult result = service.refresh("token");

        assertThat(result.refreshToken()).isEqualTo("next-refresh-token");
        verify(repository).insertSession(any(), eq(user.id()), eq("next-refresh-hash"), any());
        verify(repository, never()).revokeAllSessions(any(), any());
    }

    @Test
    void aRetryWithinTheGraceWindowDoesNotLogTheUserOutEverywhere() {
        // 회전 직후 같은 토큰이 다시 들어온 경우. 앱의 재시도로 보고 이 요청만 거부한다.
        tokenResolvesTo(session(NOW.minusSeconds(2), UUID.randomUUID()));

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository, never()).revokeAllSessions(any(), any());
    }

    @Test
    void reusingAnOldRotatedTokenRevokesEveryActiveSession() {
        Instant longAgo = NOW.minus(AuthService.ROTATION_GRACE).minusSeconds(1);
        tokenResolvesTo(session(longAgo, UUID.randomUUID()));

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository).revokeAllSessions(user.id(), NOW);
    }

    @Test
    void reusingATokenFromAnExplicitLogoutRevokesEveryActiveSession() {
        // 로그아웃으로 폐기된 세션에는 교체 세션이 없다. 유예 창을 적용하지 않는다.
        tokenResolvesTo(session(NOW.minusSeconds(1), null));

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository).revokeAllSessions(user.id(), NOW);
    }

    @Test
    void theGraceWindowBoundaryCountsAsReuse() {
        tokenResolvesTo(session(NOW.minus(AuthService.ROTATION_GRACE).minusMillis(1), UUID.randomUUID()));

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository).revokeAllSessions(user.id(), NOW);
    }

    @Test
    void losingTheRotationRaceCleansUpItsReplacementRow() {
        tokenResolvesTo(session(null, null));
        when(repository.rotateSession(any(), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository).deleteUnusedSession(any());
    }

    @Test
    void losingTheRotationRaceDoesNotLogTheUserOutEverywhere() {
        tokenResolvesTo(session(null, null));
        when(repository.rotateSession(any(), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository, never()).revokeAllSessions(any(), any());
    }

    @Test
    void anUnknownRefreshTokenIsRejectedWithoutTouchingAnySession() {
        when(repository.findSessionByTokenHash("token-hash")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository, never()).revokeAllSessions(any(), any());
        verify(repository, never()).insertSession(any(), any(), any(), any());
    }

    @Test
    void anExpiredSessionIsRevokedOnItsOwnOnly() {
        RefreshSession expired = new RefreshSession(
                UUID.randomUUID(), user, NOW.minusSeconds(1), null, null);
        tokenResolvesTo(expired);

        assertThatThrownBy(() -> service.refresh("token")).isInstanceOf(AuthException.class);

        verify(repository).revokeSession(expired.id(), user.id(), NOW);
        verify(repository, never()).revokeAllSessions(any(), any());
    }

    @Test
    void everyFailureReportsTheSameCode() {
        tokenResolvesTo(session(NOW.minusSeconds(2), UUID.randomUUID()));
        AuthException retry = catchAuth(() -> service.refresh("token"));

        tokenResolvesTo(session(NOW.minus(AuthService.ROTATION_GRACE).minusSeconds(5), UUID.randomUUID()));
        AuthException reuse = catchAuth(() -> service.refresh("token"));

        assertThat(retry.code()).isEqualTo(reuse.code()).isEqualTo("INVALID_REFRESH_TOKEN");
    }

    private static AuthException catchAuth(Runnable action) {
        try {
            action.run();
        } catch (AuthException exception) {
            return exception;
        }
        throw new AssertionError("AuthException 이 발생하지 않았다");
    }
}
