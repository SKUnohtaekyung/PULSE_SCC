package kr.co.scc.api.auth.infrastructure;

import java.util.List;
import java.util.Set;

import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.auth.application.GoogleIdentity;
import kr.co.scc.api.auth.application.GoogleIdTokenVerifier;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
public class GoogleJwtVerifier implements GoogleIdTokenVerifier {

    private static final Set<String> GOOGLE_ISSUERS = Set.of(
            "accounts.google.com",
            "https://accounts.google.com");

    private final AuthProperties properties;
    private final NimbusJwtDecoder decoder;

    public GoogleJwtVerifier(AuthProperties properties) {
        this.properties = properties;
        this.decoder = NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
        this.decoder.setJwtValidator(new JwtTimestampValidator());
    }

    @Override
    public GoogleIdentity verify(String idToken) {
        if (properties.googleClientId() == null || properties.googleClientId().isBlank()) {
            throw new AuthException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "GOOGLE_AUTH_NOT_CONFIGURED",
                    "Google 로그인이 아직 설정되지 않았습니다.");
        }

        try {
            Jwt jwt = decoder.decode(idToken);
            List<String> audience = jwt.getAudience();
            Boolean emailVerified = jwt.getClaim("email_verified");
            String email = jwt.getClaimAsString("email");

            if (!GOOGLE_ISSUERS.contains(jwt.getIssuer().toString())
                    || !audience.contains(properties.googleClientId())
                    || !Boolean.TRUE.equals(emailVerified)
                    || email == null
                    || email.isBlank()) {
                throw invalidGoogleToken();
            }
            return new GoogleIdentity(jwt.getSubject(), email);
        } catch (JwtException | NullPointerException exception) {
            throw invalidGoogleToken();
        }
    }

    private static AuthException invalidGoogleToken() {
        return new AuthException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_GOOGLE_ID_TOKEN",
                "Google 인증 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
    }
}
