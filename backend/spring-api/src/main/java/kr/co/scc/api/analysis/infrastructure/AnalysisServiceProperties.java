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
        String imageStoragePath) {

    /**
     * 저장 경로는 {@code Path} 가 아니라 문자열로 받는다.
     *
     * <p>Spring 의 String → Path 변환기는 값을 리소스 경로로 해석하는데, {@code ..} 로
     * 시작하면 루트 밖으로 벗어난다고 보고 바인딩을 거부한다
     * ("resource path [/../storage/personas] has been normalized to [null]").
     * 기본값이 {@code ../storage/personas} 라 애플리케이션이 기동조차 되지 않았다.
     * 문자열로 받아 {@link #imageStorageDirectory()} 에서 직접 변환한다.
     */
    public static final String DEFAULT_IMAGE_STORAGE_PATH = "../storage/personas";

    public AnalysisServiceProperties {
        baseUrl = baseUrl == null ? URI.create("http://127.0.0.1:8000") : baseUrl;
        serviceToken = serviceToken == null ? "" : serviceToken;
        connectTimeout = connectTimeout == null ? Duration.ofSeconds(5) : connectTimeout;
        readTimeout = readTimeout == null ? Duration.ofMinutes(5) : readTimeout;
        imageStoragePath = imageStoragePath == null || imageStoragePath.isBlank()
                ? DEFAULT_IMAGE_STORAGE_PATH
                : imageStoragePath;
    }

    /** 설정값을 실제 저장에 쓰는 절대 경로로 바꾼다. */
    public Path imageStorageDirectory() {
        return Path.of(imageStoragePath).toAbsolutePath().normalize();
    }
}
