package kr.co.scc.api.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.auth.domain.SessionTokens;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthCredentialTests {

    private static final Instant NOW = Instant.parse("2026-09-16T00:00:00Z");

    private AuthRepository repository;
    private PasswordEncoder passwordEncoder;
    private TokenService tokenService;
    private AuthService service;

    @BeforeEach
    void setUp() {
        repository = mock(AuthRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        tokenService = mock(TokenService.class);
        when(tokenService.issue(any(), any())).thenReturn(new SessionTokens(
                "access-token",
                NOW.plusSeconds(900),
                "refresh-token",
                "refresh-hash",
                NOW.plusSeconds(2_592_000)));
        service = new AuthService(
                repository,
                passwordEncoder,
                tokenService,
                mock(GoogleIdTokenVerifier.class),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static UserAccount account(String email, String credentialHash) {
        return new UserAccount(UUID.randomUUID(), email, credentialHash, "01012345678", "ACTIVE");
    }

    // ---------- login ----------

    @Test
    void signsInWhenThePasswordMatches() {
        UserAccount user = account("owner@example.com", "stored-hash");
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct-password", "stored-hash")).thenReturn(true);

        AuthService.AuthResult result = service.login("owner@example.com", "correct-password");

        assertThat(result.user().email()).isEqualTo("owner@example.com");
        assertThat(result.accessToken()).isEqualTo("access-token");
    }

    @Test
    void signsInRegardlessOfHowTheEmailWasTyped() {
        UserAccount user = account("owner@example.com", "stored-hash");
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThat(service.login("  Owner@Example.COM  ", "correct-password").user().email())
                .isEqualTo("owner@example.com");
    }

    @Test
    void reportsTheSameFailureWhetherTheAccountExistsOrNot() {
        when(repository.findUserByEmail("missing@example.com")).thenReturn(Optional.empty());
        UserAccount user = account("owner@example.com", "stored-hash");
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "stored-hash")).thenReturn(false);

        AuthException unknownAccount = catchAuth(() -> service.login("missing@example.com", "any-password"));
        AuthException wrongPassword = catchAuth(() -> service.login("owner@example.com", "wrong-password"));

        assertThat(unknownAccount.code()).isEqualTo(wrongPassword.code()).isEqualTo("INVALID_CREDENTIALS");
        assertThat(unknownAccount.status()).isEqualTo(wrongPassword.status());
        assertThat(unknownAccount.getMessage()).isEqualTo(wrongPassword.getMessage());
    }

    @Test
    void refusesToSignInAGoogleOnlyAccountWithAPassword() {
        when(repository.findUserByEmail("owner@example.com"))
                .thenReturn(Optional.of(account("owner@example.com", null)));

        assertThat(catchAuth(() -> service.login("owner@example.com", "any-password")).code())
                .isEqualTo("INVALID_CREDENTIALS");
    }

    @Test
    void refusesToSignInAnAccountThatIsNotActive() {
        UserAccount suspended = new UserAccount(
                UUID.randomUUID(), "owner@example.com", "stored-hash", "01012345678", "SUSPENDED");
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.of(suspended));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThat(catchAuth(() -> service.login("owner@example.com", "correct-password")).code())
                .isEqualTo("INVALID_CREDENTIALS");
    }

    @Test
    void neverIssuesASessionWhenSignInFails() {
        when(repository.findUserByEmail("missing@example.com")).thenReturn(Optional.empty());

        catchAuth(() -> service.login("missing@example.com", "any-password"));

        verify(tokenService, never()).issue(any(), any());
    }

    // ---------- register ----------

    @Test
    void storesTheHashedPasswordNotThePlaintext() {
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plaintext-password")).thenReturn("bcrypt-hash");

        service.register("owner@example.com", "plaintext-password", "010-1234-5678");

        verify(repository).insertUser(argThatStores("bcrypt-hash"));
        verify(passwordEncoder).encode("plaintext-password");
    }

    @Test
    void rejectsAnEmailThatIsAlreadyTaken() {
        when(repository.findUserByEmail("owner@example.com"))
                .thenReturn(Optional.of(account("owner@example.com", "stored-hash")));

        AuthException error = catchAuth(
                () -> service.register("owner@example.com", "plaintext-password", "010-1234-5678"));

        assertThat(error.code()).isEqualTo("EMAIL_ALREADY_EXISTS");
        verify(repository, never()).insertUser(any());
    }

    @Test
    void treatsAUniqueViolationDuringInsertAsATakenEmail() {
        when(repository.findUserByEmail("owner@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("bcrypt-hash");
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("duplicate key"))
                .when(repository).insertUser(any());

        AuthException error = catchAuth(
                () -> service.register("owner@example.com", "plaintext-password", "010-1234-5678"));

        assertThat(error.code()).isEqualTo("EMAIL_ALREADY_EXISTS");
        assertThat(error.getMessage()).doesNotContain("duplicate key");
    }

    @Test
    void rejectsAPasswordShorterThanTheMinimum() {
        AuthException error = catchAuth(() -> service.register("owner@example.com", "short", "010-1234-5678"));

        assertThat(error.code()).isEqualTo("INVALID_PASSWORD");
        verify(repository, never()).insertUser(any());
    }

    @Test
    void rejectsAPasswordOverTheBcryptByteLimit() {
        String tooLong = "가".repeat(25); // UTF-8 기준 75바이트

        assertThat(catchAuth(() -> service.register("owner@example.com", tooLong, "010-1234-5678")).code())
                .isEqualTo("INVALID_PASSWORD");
    }

    @Test
    void rejectsAPhoneNumberThatCannotBeNormalized() {
        assertThat(catchAuth(() -> service.register("owner@example.com", "plaintext-password", "not-a-number")).code())
                .isEqualTo("INVALID_PHONE_NUMBER");
    }

    @Test
    void doesNotEchoTheSubmittedPasswordInAnyFailure() {
        String secret = "super-secret-password";

        AuthException error = catchAuth(() -> service.register("owner@example.com", secret, "not-a-number"));

        assertThat(error.getMessage()).doesNotContain(secret);
    }

    private static UserAccount argThatStores(String credentialHash) {
        return org.mockito.ArgumentMatchers.argThat(
                user -> user != null && credentialHash.equals(user.credentialHash()));
    }

    private static AuthException catchAuth(Runnable action) {
        try {
            action.run();
        } catch (AuthException exception) {
            return exception;
        }
        throw new AssertionError("AuthException 이 발생하지 않았다");
    }

    @Test
    void catchAuthFailsLoudlyWhenNothingIsThrown() {
        assertThatThrownBy(() -> catchAuth(() -> {}))
                .isInstanceOf(AssertionError.class);
    }
}
