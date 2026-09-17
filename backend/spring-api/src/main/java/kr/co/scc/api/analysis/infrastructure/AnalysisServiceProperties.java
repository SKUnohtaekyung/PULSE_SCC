package kr.co.scc.api.analysis.infrastructure;

import java.net.URI;
import java.nio.file.Path;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scc.analysis-service")
public record AnalysisServiceProperties(
        URI baseUrl,
        String serviceToken,
        Duration connectTimeout,
        Duration readTimeout,
        Path imageStoragePath) {

    public AnalysisServiceProperties {
        baseUrl = baseUrl == null ? URI.create("http://127.0.0.1:8000") : baseUrl;
        serviceToken = serviceToken == null ? "" : serviceToken;
        connectTimeout = connectTimeout == null ? Duration.ofSeconds(5) : connectTimeout;
        readTimeout = readTimeout == null ? Duration.ofMinutes(5) : readTimeout;
        imageStoragePath = imageStoragePath == null ? Path.of("../storage/personas") : imageStoragePath;
    }
}
