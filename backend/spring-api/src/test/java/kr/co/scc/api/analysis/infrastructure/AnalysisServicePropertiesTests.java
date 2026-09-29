package kr.co.scc.api.analysis.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.nio.file.Path;
import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class AnalysisServicePropertiesTests {

    @Test
    void keepsTheConfiguredInternalServiceBoundary() {
        var baseUrl = URI.create("http://127.0.0.1:8000");

        var properties = new AnalysisServiceProperties(
                baseUrl,
                "test-token",
                Duration.ofSeconds(3),
                Duration.ofMinutes(5),
                "backend/storage/persona-images");

        assertThat(properties.baseUrl()).isEqualTo(baseUrl);
        assertThat(properties.serviceToken()).isEqualTo("test-token");
    }

    @Test
    void fallsBackToTheDefaultStorageDirectory() {
        var properties = new AnalysisServiceProperties(null, null, null, null, null);

        assertThat(properties.imageStoragePath())
                .isEqualTo(AnalysisServiceProperties.DEFAULT_IMAGE_STORAGE_PATH);
        assertThat(properties.imageStorageDirectory()).isAbsolute();
    }

    @Test
    void resolvesTheStorageDirectoryToAnAbsoluteNormalizedPath() {
        var properties = new AnalysisServiceProperties(null, null, null, null, "../storage/personas");

        Path directory = properties.imageStorageDirectory();

        // 디렉터리가 아직 없어도 성립해야 하므로 실제 파일을 확인하는 단언은 쓰지 않는다.
        assertThat(directory).isAbsolute();
        assertThat(directory.toString()).doesNotContain("..");
        assertThat(directory.getFileName()).isEqualTo(Path.of("personas"));
        assertThat(directory.getParent().getFileName()).isEqualTo(Path.of("storage"));
    }

    /**
     * 기본 저장 경로가 실제 설정 바인딩을 통과해야 한다.
     *
     * <p>Path 로 받던 시절에는 Spring 의 String → Path 변환기가 ".." 로 시작하는 값을
     * 리소스 경로로 해석해 거부했고, 애플리케이션이 기동조차 되지 않았다.
     */
    @Test
    void bindsTheDefaultStoragePathFromConfiguration() {
        ConfigurationPropertySource source = new MapConfigurationPropertySource(java.util.Map.of(
                "scc.analysis-service.base-url", "http://127.0.0.1:8000",
                "scc.analysis-service.image-storage-path",
                AnalysisServiceProperties.DEFAULT_IMAGE_STORAGE_PATH));

        var bound = new Binder(source)
                .bind("scc.analysis-service", Bindable.of(AnalysisServiceProperties.class))
                .get();

        assertThat(bound.imageStoragePath())
                .isEqualTo(AnalysisServiceProperties.DEFAULT_IMAGE_STORAGE_PATH);
        assertThat(bound.imageStorageDirectory()).isAbsolute();
    }
}
