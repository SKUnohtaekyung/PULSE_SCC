package kr.co.scc.api.common.web;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청 하나에 traceId 하나를 부여해 오류 응답과 로그가 같은 값을 쓰게 한다.
 *
 * <p>클라이언트가 보낸 값을 신뢰하지 않는다. 외부 입력을 그대로 로그·응답에 넣으면
 * 로그 위조와 주입에 쓰일 수 있어 서버가 항상 새로 만든다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    static final String RESPONSE_HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String traceId = TraceId.generate();
        MDC.put(TraceId.MDC_KEY, traceId);
        response.setHeader(RESPONSE_HEADER, traceId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(TraceId.MDC_KEY);
        }
    }
}
