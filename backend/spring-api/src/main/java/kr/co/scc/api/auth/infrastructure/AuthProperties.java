package kr.co.scc.api.auth.infrastructure;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scc.auth")
public record AuthProperties(
        String accessTokenSecret,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        String issuer,
        String googleClientId) {
}
