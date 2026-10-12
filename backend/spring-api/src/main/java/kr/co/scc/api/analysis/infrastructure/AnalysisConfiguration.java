package kr.co.scc.api.analysis.infrastructure;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestClient;

@Configuration
@EnableAsync
@EnableScheduling
public class AnalysisConfiguration {

    private static final Duration PROGRESS_TIMEOUT = Duration.ofSeconds(2);

    @Bean
    RestClient analysisRestClient(AnalysisServiceProperties properties) {
        // JDK HttpClient 의 기본 버전은 HTTP/2 다. 그러면 평문 연결에서 Upgrade: h2c 로
        // 프로토콜 전환을 시도하는데, 분석 서비스의 uvicorn 은 HTTP/1.1 만 처리한다.
        // 업그레이드 요청이 거부되면서 chunked 본문이 유실돼 Python 이 필드 없는 요청으로
        // 보고 422 를 반환했다. 내부 호출을 HTTP/1.1 로 고정한다.
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.connectTimeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());
        return RestClient.builder()
                .baseUrl(properties.baseUrl().toString())
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * 진행 단계 조회용 클라이언트.
     *
     * <p>분석 요청용 클라이언트는 응답을 몇 분씩 기다린다. 진행 단계는 몇 초마다 묻는 가벼운
     * 조회라, 분석 서비스가 응답하지 않을 때 폴링 스레드가 오래 묶이지 않게 짧게 끊는다.
     */
    @Bean
    RestClient analysisProgressRestClient(AnalysisServiceProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(PROGRESS_TIMEOUT)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(PROGRESS_TIMEOUT);
        return RestClient.builder()
                .baseUrl(properties.baseUrl().toString())
                .requestFactory(requestFactory)
                .build();
    }

    @Bean(name = "analysisTaskExecutor")
    TaskExecutor analysisTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("analysis-");
        executor.initialize();
        return executor;
    }
}
