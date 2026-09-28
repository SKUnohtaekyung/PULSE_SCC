package kr.co.scc.api.auth.api;

import static org.hamcrest.Matchers.oneOf;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 시도 제한이 API 오류 계약(429, Retry-After, retryable)으로 나가는지 확인한다(#32).
 *
 * <p>제한기는 컨텍스트 전체에서 하나라 같은 설정의 다른 테스트와 공유될 수 있다. 다른 테스트가
 * 쓰지 않는 문서용 주소(203.0.113.0/24)와 이메일만 써서 서로 막지 않게 한다.
 */
@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
})
@AutoConfigureMockMvc
class AuthRateLimitWebTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JdbcClient jdbcClient;

    @MockitoBean
    private AuthRepository authRepository;

    @BeforeEach
    void noAccountsExist() {
        when(authRepository.findUserByEmail(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void aLockedEmailGetsTooManyRequestsWithRetryAfter() throws Exception {
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(login("locked-web@example.com", "203.0.113.20"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                    .andExpect(jsonPath("$.error.retryable").value(false))
                    .andExpect(header().doesNotExist("Retry-After"));
        }

        mockMvc.perform(login("locked-web@example.com", "203.0.113.21"))
                .andExpect(status().isTooManyRequests())
                // 실제 시계를 쓰므로 요청 사이가 1초를 넘으면 899 가 될 수 있다.
                .andExpect(header().string("Retry-After", oneOf("899", "900")))
                .andExpect(jsonPath("$.error.code").value("TOO_MANY_ATTEMPTS"))
                .andExpect(jsonPath("$.error.retryable").value(true))
                .andExpect(jsonPath("$.error.traceId").exists());
    }

    @Test
    void anAddressOverSixtyRequestsIsBlockedForLoginAndRegistration() throws Exception {
        String address = "203.0.113.30";
        for (int i = 0; i < 60; i++) {
            mockMvc.perform(login("address-" + i + "@example.com", address))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(login("address-next@example.com", address))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", oneOf("599", "600")));
        mockMvc.perform(post("/api/v1/auth/register")
                        .with(request -> {
                            request.setRemoteAddr(address);
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@example.com","password":"password123","phoneNumber":"01012345678"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("TOO_MANY_ATTEMPTS"));
    }

    private static MockHttpServletRequestBuilder login(String email, String address) {
        return post("/api/v1/auth/login")
                .with(request -> {
                    request.setRemoteAddr(address);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"wrong-password\"}");
    }
}
