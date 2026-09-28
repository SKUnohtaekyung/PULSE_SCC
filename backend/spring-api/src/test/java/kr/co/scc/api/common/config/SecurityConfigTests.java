package kr.co.scc.api.common.config;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Optional;

import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
})
@AutoConfigureMockMvc
class SecurityConfigTests {

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
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void allOtherRequestsRequireAuthenticationByDefault() throws Exception {
        mockMvc.perform(get("/api/v1/not-implemented"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registrationEndpointIsPublicButValidatesItsBody() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    /**
     * denyAll 의 핵심 성질. 유효한 토큰을 들고 와도 등록되지 않은 경로는 열리지 않아야 한다.
     * 인증 여부만 보는 테스트는 이 성질을 검증하지 못한다.
     */
    @Test
    void anAuthenticatedCallerStillCannotReachAnUnmappedPath() throws Exception {
        mockMvc.perform(get("/api/v1/not-implemented").with(jwt()))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sessionRestoreRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void actuatorEndpointsOtherThanHealthAreNotPublic() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validationFailuresCarryFieldErrorsAndATraceId() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.error.traceId").isNotEmpty())
                .andExpect(jsonPath("$.error.fieldErrors").isArray())
                .andExpect(jsonPath("$.error.fieldErrors[0].field").exists());
    }

    /** API.md 2.1 — fieldErrors 는 필드 오류가 있을 때만 포함한다. */
    @Test
    void anErrorWithoutFieldErrorsOmitsTheFieldErrorsKey() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner@example.com\",\"password\":\"correct-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.error.traceId").isNotEmpty())
                .andExpect(jsonPath("$.error.fieldErrors").doesNotExist());
    }

    @Test
    void everyResponseCarriesATraceIdHeader() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"));
    }
}
