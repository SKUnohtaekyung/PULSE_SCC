package kr.co.scc.api.analysis.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.nio.file.Path;
import java.time.Duration;

import org.junit.jupiter.api.Test;

class AnalysisServicePropertiesTests {

    @Test
    void keepsTheConfiguredInternalServiceBoundary() {
        var baseUrl = URI.create("http://127.0.0.1:8000");

        var properties = new AnalysisServiceProperties(
                baseUrl,
                "test-token",
                Duration.ofSeconds(3),
                Duration.ofMinutes(5),
                Path.of("backend/storage/persona-images"));

        assertThat(properties.baseUrl()).isEqualTo(baseUrl);
        assertThat(properties.serviceToken()).isEqualTo("test-token");
    }
}
