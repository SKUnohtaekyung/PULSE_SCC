package kr.co.scc.api.analysis.infrastructure;

import java.net.URI;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("scc.analysis-service")
public record AnalysisServiceProperties(URI baseUrl, String serviceToken) {
}
