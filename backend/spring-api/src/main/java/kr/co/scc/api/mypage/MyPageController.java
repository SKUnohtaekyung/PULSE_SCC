package kr.co.scc.api.mypage;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class MyPageController {

    private final MyPageService service;

    public MyPageController(MyPageService service) {
        this.service = service;
    }

    @GetMapping("/notifications")
    public List<MyPageRepository.NotificationView> notifications(@AuthenticationPrincipal Jwt jwt) {
        return service.notifications(userId(jwt));
    }

    @GetMapping("/notification-settings")
    public MyPageRepository.NotificationSetting notificationSetting(@AuthenticationPrincipal Jwt jwt) {
        return service.notificationSetting(userId(jwt));
    }

    @PatchMapping("/notification-settings")
    public MyPageRepository.NotificationSetting updateNotificationSetting(
            @AuthenticationPrincipal Jwt jwt, @RequestBody NotificationSettingRequest request) {
        return service.updateNotificationSetting(userId(jwt), request.analysisResultEnabled());
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal Jwt jwt, @RequestBody(required = false) DeleteAccountRequest request) {
        service.deleteAccount(userId(jwt), request == null ? null : request.password());
        return ResponseEntity.noContent().build();
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public record NotificationSettingRequest(boolean analysisResultEnabled) {}
    public record DeleteAccountRequest(String password) {}
}
