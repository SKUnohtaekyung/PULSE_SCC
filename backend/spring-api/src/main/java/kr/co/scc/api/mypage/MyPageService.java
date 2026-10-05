package kr.co.scc.api.mypage;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import kr.co.scc.api.analysis.infrastructure.PersonaImageStorage;
import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MyPageService {

    private final MyPageRepository repository;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonaImageStorage imageStorage;
    private final Clock clock;

    public MyPageService(MyPageRepository repository, AuthRepository authRepository,
            PasswordEncoder passwordEncoder, PersonaImageStorage imageStorage, Clock clock) {
        this.repository = repository;
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.imageStorage = imageStorage;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<MyPageRepository.NotificationView> notifications(UUID userId) {
        return repository.findNotifications(userId);
    }

    @Transactional
    public MyPageRepository.NotificationSetting notificationSetting(UUID userId) {
        return repository.findOrCreateSetting(userId);
    }

    @Transactional
    public MyPageRepository.NotificationSetting updateNotificationSetting(UUID userId, boolean enabled) {
        return repository.updateSetting(userId, enabled);
    }

    @Transactional
    public void deleteAccount(UUID userId, UUID sessionId, String password) {
        // 되돌릴 수 없는 삭제라 JWT 서명·만료만으로 허용하지 않는다. 로그아웃했거나 토큰 재사용
        // 감지로 폐기된 세션의 Access Token 은 최대 15분 유효하므로 DB 세션을 확인한다(ADR-010).
        if (!authRepository.isSessionActive(sessionId, userId, clock.instant())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "SESSION_REVOKED", "로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
        UserAccount user = authRepository.findUserById(userId).orElseThrow(() -> new AuthException(
                HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "계정을 찾을 수 없습니다."));
        if (user.credentialHash() != null
                && (password == null || !passwordEncoder.matches(password, user.credentialHash()))) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "PASSWORD_CONFIRMATION_FAILED", "현재 비밀번호를 확인해 주세요.");
        }
        List<String> storageKeys = repository.findImageStorageKeys(userId);
        repository.deleteAccountData(userId);
        // 파일은 DB 삭제가 커밋된 뒤에 지운다. 먼저 지우면 커밋이 실패했을 때 이미지만 사라진다.
        imageStorage.deleteAllAfterCommit(storageKeys);
    }
}
