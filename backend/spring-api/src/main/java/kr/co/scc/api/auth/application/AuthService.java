package kr.co.scc.api.auth.application;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
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

    /**
     * 회전 직후 같은 토큰이 다시 들어와도 재사용 공격으로 보지 않는 유예 시간.
     *
     * <p>앱의 네트워크 재시도와 화면 두 곳의 동시 갱신을 흡수한다. 이 창을 넘어서
     * 들어온 폐기 토큰은 재사용으로 간주해 사용자의 모든 세션을 폐기한다.
     */
    static final Duration ROTATION_GRACE = Duration.ofSeconds(30);

    private static final String DECOY_SECRET = "scc-login-timing-decoy";

    private final AuthRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final GoogleIdTokenVerifier googleVerifier;
    private final Clock clock;
    private volatile String decoyHash;

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
        Optional<UserAccount> candidate = repository.findUserByEmail(normalizedEmail)
                .filter(UserAccount::active)
                .filter(account -> account.credentialHash() != null);

        // 비밀번호 검사는 계정 유무와 무관하게 항상 한 번 수행한다. 계정이 없을 때
        // BCrypt 를 건너뛰면 응답 시간 차이만으로 가입 여부가 드러난다.
        String hashToCheck = candidate.map(UserAccount::credentialHash).orElseGet(this::decoyCredentialHash);
        boolean matches = hashToCheck != null && passwordEncoder.matches(password, hashToCheck);

        if (candidate.isEmpty() || !matches) {
            throw invalidCredentials();
        }
        return createSession(candidate.get());
    }

    /**
     * 존재하지 않는 계정에도 같은 비용의 해시 비교를 수행하기 위한 미끼 해시.
     *
     * <p>고정 문자열을 실제 인코더로 한 번 해싱해 캐시한다. 어떤 사용자의 비밀번호와도
     * 일치하지 않으며, 로그인 성공 판정에는 쓰이지 않는다.
     */
    private String decoyCredentialHash() {
        String cached = decoyHash;
        if (cached == null) {
            cached = passwordEncoder.encode(DECOY_SECRET);
            decoyHash = cached;
        }
        return cached;
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
            // 회전으로 방금 폐기된 토큰이 다시 들어온 경우는 같은 클라이언트의 재시도나
            // 화면 두 곳의 동시 갱신으로 보는 것이 타당하다. 이때 전체 세션을 폐기하면
            // 정상 사용자가 모든 기기에서 로그아웃된다. 유예 창 안에서는 이 요청만 거부한다.
            boolean concurrentRetry = current.rotated()
                    && !current.revokedAt().isBefore(now.minus(ROTATION_GRACE));
            if (!concurrentRetry) {
                repository.revokeAllSessions(current.user().id(), now);
            }
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
            // SELECT 와 UPDATE 사이에 다른 요청이 같은 세션을 회전시켰다. 오래된 토큰의
            // 재사용이 아니라 동시 요청 경합이므로 전체 폐기 대상이 아니다.
            // 교체 행은 FK 때문에 먼저 INSERT 했으므로 고아로 남지 않게 지운다.
            repository.deleteUnusedSession(replacementId);
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
