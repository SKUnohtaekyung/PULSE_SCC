package kr.co.scc.api.auth.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import kr.co.scc.api.auth.domain.SessionTokens;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private static final int REFRESH_TOKEN_BYTES = 32;

    private final JwtEncoder jwtEncoder;
    private final AuthProperties properties;
    private final Clock clock;
    private final SecureRandom secureRandom;

    @Autowired
    public TokenService(JwtEncoder jwtEncoder, AuthProperties properties, Clock clock) {
        this(jwtEncoder, properties, clock, new SecureRandom());
    }

    TokenService(
            JwtEncoder jwtEncoder,
            AuthProperties properties,
            Clock clock,
            SecureRandom secureRandom) {
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
        this.clock = clock;
        this.secureRandom = secureRandom;
    }

    public SessionTokens issue(UserAccount user, UUID sessionId) {
        Instant now = clock.instant();
        Instant accessExpiry = now.plus(properties.accessTokenTtl());
        Instant refreshExpiry = now.plus(properties.refreshTokenTtl());
        String refreshToken = generateRefreshToken();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .issuedAt(now)
                .expiresAt(accessExpiry)
                .subject(user.id().toString())
                .claim("sid", sessionId.toString())
                .claim("email", user.email())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new SessionTokens(
                accessToken,
                accessExpiry,
                refreshToken,
                hashRefreshToken(refreshToken),
                refreshExpiry);
    }

    public String hashRefreshToken(String refreshToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(refreshToken.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
