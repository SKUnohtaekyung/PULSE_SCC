package kr.co.scc.api.mypage;

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

    public MyPageService(MyPageRepository repository, AuthRepository authRepository,
            PasswordEncoder passwordEncoder, PersonaImageStorage imageStorage) {
        this.repository = repository;
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.imageStorage = imageStorage;
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
    public void deleteAccount(UUID userId, String password) {
        UserAccount user = authRepository.findUserById(userId).orElseThrow(() -> new AuthException(
                HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "계정을 찾을 수 없습니다."));
        if (user.credentialHash() != null
                && (password == null || !passwordEncoder.matches(password, user.credentialHash()))) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "PASSWORD_CONFIRMATION_FAILED", "현재 비밀번호를 확인해 주세요.");
        }
        List<String> storageKeys = repository.findImageStorageKeys(userId);
        repository.deleteAccountData(userId);
        imageStorage.deleteAll(storageKeys);
    }
}
