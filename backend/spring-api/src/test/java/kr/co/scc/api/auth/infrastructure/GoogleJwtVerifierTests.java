package kr.co.scc.api.auth.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.auth.application.GoogleIdentity;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

class GoogleJwtVerifierTests {

    private static final String CLIENT_ID = "scc-android.apps.googleusercontent.com";

    private static AuthProperties properties(String googleClientId) {
        return new AuthProperties(
                "test-only-access-token-secret-at-least-32-bytes",
                Duration.ofMinutes(15),
                Duration.ofDays(30),
                "scc-api",
                googleClientId);
    }

    private static Jwt token(String issuer, List<String> audience, Object emailVerified, String email) {
        // issuer 는 claim("iss") 로 직접 넣는다. .issuer(...) 는 URL 로 변환하므로
        // Google 이 실제로 쓰는 스킴 없는 "accounts.google.com" 을 표현할 수 없다.
        return Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("google-subject")
                .claim("iss", issuer)
                .audience(audience)
                .claim("email_verified", emailVerified)
                .claim("email", email)
                .issuedAt(Instant.parse("2026-09-16T00:00:00Z"))
                .expiresAt(Instant.parse("2026-09-16T01:00:00Z"))
                .build();
    }

    private static GoogleJwtVerifier verifierReturning(Jwt jwt) {
        JwtDecoder decoder = mock(JwtDecoder.class);
        when(decoder.decode(anyString())).thenReturn(jwt);
        return new GoogleJwtVerifier(properties(CLIENT_ID), decoder);
    }

    @Test
    void acceptsATokenIssuedByGoogleForThisClient() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("https://accounts.google.com", List.of(CLIENT_ID), true, "owner@example.com"));

        GoogleIdentity identity = verifier.verify("id-token");

        assertThat(identity.subject()).isEqualTo("google-subject");
        assertThat(identity.email()).isEqualTo("owner@example.com");
    }

    @Test
    void acceptsTheBareGoogleIssuerForm() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("accounts.google.com", List.of(CLIENT_ID), true, "owner@example.com"));

        assertThat(verifier.verify("id-token").email()).isEqualTo("owner@example.com");
    }

    @Test
    void acceptsATokenWhoseAudienceListAlsoHoldsOtherClients() {
        GoogleJwtVerifier verifier = verifierReturning(token(
                "https://accounts.google.com",
                List.of("other.apps.googleusercontent.com", CLIENT_ID),
                true,
                "owner@example.com"));

        assertThat(verifier.verify("id-token").subject()).isEqualTo("google-subject");
    }

    @Test
    void refusesToVerifyWhenTheClientIdIsNotConfigured() {
        JwtDecoder decoder = mock(JwtDecoder.class);

        for (String unset : new String[] {null, "", "   "}) {
            GoogleJwtVerifier verifier = new GoogleJwtVerifier(properties(unset), decoder);

            assertThatThrownBy(() -> verifier.verify("id-token"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("설정되지 않았습니다");
        }
    }

    @Test
    void rejectsATokenMintedForAnotherClient() {
        GoogleJwtVerifier verifier = verifierReturning(token(
                "https://accounts.google.com",
                List.of("attacker.apps.googleusercontent.com"),
                true,
                "owner@example.com"));

        assertThatThrownBy(() -> verifier.verify("id-token")).isInstanceOf(AuthException.class);
    }

    @Test
    void rejectsATokenFromAnIssuerThatIsNotGoogle() {
        GoogleJwtVerifier verifier = verifierReturning(token(
                "https://accounts.google.com.attacker.test",
                List.of(CLIENT_ID),
                true,
                "owner@example.com"));

        assertThatThrownBy(() -> verifier.verify("id-token")).isInstanceOf(AuthException.class);
    }

    @Test
    void rejectsAnUnverifiedEmail() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("https://accounts.google.com", List.of(CLIENT_ID), false, "owner@example.com"));

        assertThatThrownBy(() -> verifier.verify("id-token")).isInstanceOf(AuthException.class);
    }

    @Test
    void rejectsAMissingEmailVerifiedClaim() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("https://accounts.google.com", List.of(CLIENT_ID), null, "owner@example.com"));

        assertThatThrownBy(() -> verifier.verify("id-token")).isInstanceOf(AuthException.class);
    }

    @Test
    void rejectsABlankEmail() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("https://accounts.google.com", List.of(CLIENT_ID), true, "   "));

        assertThatThrownBy(() -> verifier.verify("id-token")).isInstanceOf(AuthException.class);
    }

    @Test
    void reportsAFailedSignatureCheckAsAnInvalidToken() {
        JwtDecoder decoder = mock(JwtDecoder.class);
        when(decoder.decode(anyString())).thenThrow(new JwtException("bad signature"));
        GoogleJwtVerifier verifier = new GoogleJwtVerifier(properties(CLIENT_ID), decoder);

        assertThatThrownBy(() -> verifier.verify("id-token"))
                .isInstanceOf(AuthException.class)
                .satisfies(error -> assertThat(error.getMessage()).doesNotContain("bad signature"));
    }

    @Test
    void doesNotLeakTokenClaimsIntoTheErrorMessage() {
        GoogleJwtVerifier verifier = verifierReturning(
                token("https://evil.test", List.of(CLIENT_ID), true, "victim@example.com"));

        assertThatThrownBy(() -> verifier.verify("id-token"))
                .isInstanceOf(AuthException.class)
                .satisfies(error -> {
                    assertThat(error.getMessage()).doesNotContain("victim@example.com");
                    assertThat(error.getMessage()).doesNotContain("https://evil.test");
                });
    }
}
