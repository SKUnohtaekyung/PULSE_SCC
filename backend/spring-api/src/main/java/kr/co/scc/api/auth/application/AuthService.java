package kr.co.scc.api.auth.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import kr.co.scc.api.auth.domain.AuthPolicy;
import kr.co.scc.api.auth.domain.RefreshSession;
import kr.co.scc.api.auth.domain.SessionTokens;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final GoogleIdTokenVerifier googleVerifier;
    private final Clock clock;

    public AuthService(
            AuthRepository repository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            GoogleIdTokenVerifier googleVerifier,
            Clock clock) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.googleVerifier = googleVerifier;
        this.clock = clock;
    }

    @Transactional
    public AuthResult register(String email, String password, String phoneNumber) {
        String normalizedEmail = AuthPolicy.normalizeEmail(email);
        validatePassword(password);
        String normalizedPhone = normalizePhone(phoneNumber);
        ensureEmailAvailable(normalizedEmail);

        UUID userId = UUID.randomUUID();
        UserAccount user = new UserAccount(
                userId,
                normalizedEmail,
                passwordEncoder.encode(password),
                normalizedPhone,
                "ACTIVE");
        try {
            repository.insertUser(user);
            repository.insertIdentity(UUID.randomUUID(), userId, "LOCAL", normalizedEmail);
        } catch (DataIntegrityViolationException exception) {
            throw emailConflict();
        }
        return createSession(user);
    }

    @Transactional
    public AuthResult login(String email, String password) {
        String normalizedEmail = AuthPolicy.normalizeEmail(email);
        UserAccount user = repository.findUserByEmail(normalizedEmail)
                .filter(UserAccount::active)
                .filter(account -> account.credentialHash() != null)
                .filter(account -> passwordEncoder.matches(password, account.credentialHash()))
                .orElseThrow(AuthService::invalidCredentials);
        return createSession(user);
    }

    @Transactional
    public AuthResult loginWithGoogle(String idToken) {
        GoogleIdentity identity = googleVerifier.verify(idToken);
        String normalizedEmail = AuthPolicy.normalizeEmail(identity.email());
        UserAccount user = repository.findUserByIdentity("GOOGLE", identity.subject())
                .orElseGet(() -> createGoogleUser(identity.subject(), normalizedEmail));
        if (!user.active()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE", "사용할 수 없는 계정입니다.");
        }
        return createSession(user);
    }

    @Transactional(noRollbackFor = AuthException.class)
    public AuthResult refresh(String refreshToken) {
        Instant now = clock.instant();
        RefreshSession current = repository.findSessionByTokenHash(tokenService.hashRefreshToken(refreshToken))
                .orElseThrow(AuthService::invalidRefreshToken);

        if (current.revokedAt() != null) {
            repository.revokeAllSessions(current.user().id(), now);
            throw invalidRefreshToken();
        }
        if (!current.expiresAt().isAfter(now) || !current.user().active()) {
            repository.revokeSession(current.id(), current.user().id(), now);
            throw invalidRefreshToken();
        }

        UUID replacementId = UUID.randomUUID();
        SessionTokens tokens = tokenService.issue(current.user(), replacementId);
        repository.insertSession(
                replacementId,
                current.user().id(),
                tokens.refreshTokenHash(),
                tokens.refreshTokenExpiresAt());
        if (!repository.rotateSession(current.id(), replacementId, now)) {
            repository.revokeAllSessions(current.user().id(), now);
            throw invalidRefreshToken();
        }
        return result(current.user(), tokens);
    }

    @Transactional
    public void logout(UUID userId, UUID sessionId) {
        repository.revokeSession(sessionId, userId, clock.instant());
    }

    @Transactional(readOnly = true)
    public SessionView restore(UUID userId, UUID sessionId, String email) {
        if (!repository.isSessionActive(sessionId, userId, clock.instant())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "SESSION_REVOKED", "로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
        return new SessionView(userId, email, repository.hasSavedAnalysis(userId));
    }

    private UserAccount createGoogleUser(String subject, String normalizedEmail) {
        if (repository.findUserByEmail(normalizedEmail).isPresent()) {
            throw new AuthException(
                    HttpStatus.CONFLICT,
                    "ACCOUNT_LINK_REQUIRED",
                    "같은 이메일의 기존 계정이 있습니다. 기존 계정으로 로그인한 뒤 Google 계정을 연결해 주세요.");
        }
        UserAccount user = new UserAccount(UUID.randomUUID(), normalizedEmail, null, null, "ACTIVE");
        try {
            repository.insertUser(user);
            repository.insertIdentity(UUID.randomUUID(), user.id(), "GOOGLE", subject);
        } catch (DataIntegrityViolationException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_EXISTS", "이미 등록된 계정입니다.");
        }
        return user;
    }

    private AuthResult createSession(UserAccount user) {
        UUID sessionId = UUID.randomUUID();
        SessionTokens tokens = tokenService.issue(user, sessionId);
        repository.insertSession(sessionId, user.id(), tokens.refreshTokenHash(), tokens.refreshTokenExpiresAt());
        return result(user, tokens);
    }

    private AuthResult result(UserAccount user, SessionTokens tokens) {
        return new AuthResult(
                tokens.accessToken(),
                tokens.accessTokenExpiresAt(),
                tokens.refreshToken(),
                tokens.refreshTokenExpiresAt(),
                new SessionView(user.id(), user.email(), repository.hasSavedAnalysis(user.id())));
    }

    private void ensureEmailAvailable(String email) {
        if (repository.findUserByEmail(email).isPresent()) {
            throw emailConflict();
        }
    }

    private static String normalizePhone(String phoneNumber) {
        try {
            return AuthPolicy.normalizePhoneNumber(phoneNumber);
        } catch (IllegalArgumentException exception) {
            throw new AuthException(HttpStatus.UNPROCESSABLE_CONTENT, "INVALID_PHONE_NUMBER", exception.getMessage());
        }
    }

    private static void validatePassword(String password) {
        try {
            AuthPolicy.validatePassword(password);
        } catch (IllegalArgumentException exception) {
            throw new AuthException(HttpStatus.UNPROCESSABLE_CONTENT, "INVALID_PASSWORD", exception.getMessage());
        }
    }

    private static AuthException emailConflict() {
        return new AuthException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "이미 사용 중인 이메일입니다.");
    }

    private static AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해 주세요.");
    }

    private static AuthException invalidRefreshToken() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "로그인이 만료되었습니다. 다시 로그인해 주세요.");
    }

    public record AuthResult(
            String accessToken,
            Instant accessTokenExpiresAt,
            String refreshToken,
            Instant refreshTokenExpiresAt,
            SessionView user) {
    }

    public record SessionView(UUID id, String email, boolean hasSavedAnalysis) {
    }
}
