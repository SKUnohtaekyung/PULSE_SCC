package kr.co.scc.api.mypage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.analysis.infrastructure.PersonaImageStorage;
import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class MyPageServiceTests {

    private static final Instant NOW = Instant.parse("2026-09-28T00:00:00Z");

    @Mock MyPageRepository repository;
    @Mock AuthRepository authRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock PersonaImageStorage imageStorage;

    private MyPageService service;
    private final UUID sessionId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new MyPageService(
                repository, authRepository, passwordEncoder, imageStorage, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void notificationSettingIsUpdated() {
        UUID userId = UUID.randomUUID();
        var expected = new MyPageRepository.NotificationSetting(false, Instant.now());
        when(repository.updateSetting(userId, false)).thenReturn(expected);

        assertThat(service.updateNotificationSetting(userId, false)).isEqualTo(expected);
    }

    @Test
    void localAccountRequiresCurrentPassword() {
        UUID userId = UUID.randomUUID();
        sessionIsActive(userId);
        when(authRepository.findUserById(userId)).thenReturn(Optional.of(
                new UserAccount(userId, "owner@scc.test", "hash", "01012345678", "ACTIVE")));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.deleteAccount(userId, sessionId, "wrong"))
                .isInstanceOf(AuthException.class)
                .hasMessage("현재 비밀번호를 확인해 주세요.");
        verify(repository, never()).deleteAccountData(userId);
    }

    @Test
    void deletingAccountRemovesDatabaseRowsAndImagesAfterCommit() {
        UUID userId = UUID.randomUUID();
        sessionIsActive(userId);
        when(authRepository.findUserById(userId)).thenReturn(Optional.of(
                new UserAccount(userId, "owner@scc.test", "hash", "01012345678", "ACTIVE")));
        when(passwordEncoder.matches("password1234", "hash")).thenReturn(true);
        when(repository.findImageStorageKeys(userId)).thenReturn(List.of("analysis/image.png"));

        service.deleteAccount(userId, sessionId, "password1234");

        verify(repository).deleteAccountData(userId);
        verify(imageStorage).deleteAllAfterCommit(List.of("analysis/image.png"));
    }

    @Test
    void aRevokedSessionCannotDeleteAGoogleOnlyAccount() {
        UUID userId = UUID.randomUUID();
        when(authRepository.isSessionActive(sessionId, userId, NOW)).thenReturn(false);

        AuthException rejected = catchAuth(() -> service.deleteAccount(userId, sessionId, null));

        assertThat(rejected.code()).isEqualTo("SESSION_REVOKED");
        verify(repository, never()).deleteAccountData(any());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void aGoogleOnlyAccountWithAnActiveSessionIsDeletedWithoutAPassword() {
        UUID userId = UUID.randomUUID();
        sessionIsActive(userId);
        when(authRepository.findUserById(userId)).thenReturn(Optional.of(
                new UserAccount(userId, "owner@scc.test", null, null, "ACTIVE")));
        when(repository.findImageStorageKeys(userId)).thenReturn(List.of());

        service.deleteAccount(userId, sessionId, null);

        verify(repository).deleteAccountData(userId);
    }

    private void sessionIsActive(UUID userId) {
        when(authRepository.isSessionActive(sessionId, userId, NOW)).thenReturn(true);
    }

    private static AuthException catchAuth(Runnable call) {
        try {
            call.run();
        } catch (AuthException exception) {
            return exception;
        }
        throw new AssertionError("AuthException 이 나지 않았다");
    }
}
