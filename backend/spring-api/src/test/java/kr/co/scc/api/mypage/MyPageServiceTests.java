package kr.co.scc.api.mypage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
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

    @Mock MyPageRepository repository;
    @Mock AuthRepository authRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock PersonaImageStorage imageStorage;

    private MyPageService service;

    @BeforeEach
    void setUp() {
        service = new MyPageService(repository, authRepository, passwordEncoder, imageStorage);
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
        when(authRepository.findUserById(userId)).thenReturn(Optional.of(
                new UserAccount(userId, "owner@scc.test", "hash", "01012345678", "ACTIVE")));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.deleteAccount(userId, "wrong"))
                .isInstanceOf(AuthException.class)
                .hasMessage("현재 비밀번호를 확인해 주세요.");
        verify(repository, never()).deleteAccountData(userId);
    }

    @Test
    void deletingAccountRemovesDatabaseRowsAndImages() {
        UUID userId = UUID.randomUUID();
        when(authRepository.findUserById(userId)).thenReturn(Optional.of(
                new UserAccount(userId, "owner@scc.test", "hash", "01012345678", "ACTIVE")));
        when(passwordEncoder.matches("password1234", "hash")).thenReturn(true);
        when(repository.findImageStorageKeys(userId)).thenReturn(List.of("analysis/image.png"));

        service.deleteAccount(userId, "password1234");

        verify(repository).deleteAccountData(userId);
        verify(imageStorage).deleteAll(List.of("analysis/image.png"));
    }
}
