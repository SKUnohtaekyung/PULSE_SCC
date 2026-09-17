package kr.co.scc.api.auth.api;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import kr.co.scc.api.auth.application.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse register(@Valid @RequestBody RegisterRequest request) {
        return SessionResponse.from(authService.register(
                request.email(),
                request.password(),
                request.phoneNumber(),
                request.termsVersion(),
                request.privacyVersion()));
    }

    @PostMapping("/login")
    public SessionResponse login(@Valid @RequestBody LoginRequest request) {
        return SessionResponse.from(authService.login(request.email(), request.password()));
    }

    @PostMapping("/google")
    public SessionResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        return SessionResponse.from(authService.loginWithGoogle(request.idToken()));
    }

    @PostMapping("/refresh")
    public SessionResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return SessionResponse.from(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        authService.logout(userId(jwt), sessionId(jwt));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public UserResponse session(@AuthenticationPrincipal Jwt jwt) {
        return UserResponse.from(authService.restore(userId(jwt), sessionId(jwt), jwt.getClaimAsString("email")));
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private static UUID sessionId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("sid"));
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank String phoneNumber,
            @NotBlank String termsVersion,
            @NotBlank String privacyVersion) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record GoogleLoginRequest(@NotBlank String idToken) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record SessionResponse(
            String accessToken,
            Instant accessTokenExpiresAt,
            String refreshToken,
            Instant refreshTokenExpiresAt,
            UserResponse user) {

        static SessionResponse from(AuthService.AuthResult result) {
            return new SessionResponse(
                    result.accessToken(),
                    result.accessTokenExpiresAt(),
                    result.refreshToken(),
                    result.refreshTokenExpiresAt(),
                    UserResponse.from(result.user()));
        }
    }

    public record UserResponse(UUID id, String email, boolean hasSavedAnalysis) {

        static UserResponse from(AuthService.SessionView user) {
            return new UserResponse(user.id(), user.email(), user.hasSavedAnalysis());
        }
    }
}
