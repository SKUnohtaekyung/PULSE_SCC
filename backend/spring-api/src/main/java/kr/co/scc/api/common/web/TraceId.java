package kr.co.scc.api.common.web;

import java.util.HexFormat;
import java.security.SecureRandom;

import org.slf4j.MDC;

/**
 * 오류 응답과 운영 로그를 연결하는 상관관계 식별자.
 *
 * <p>docs/architecture/API.md 2.1 은 traceId 가 개인정보를 포함하지 않을 것을 요구한다.
 * 따라서 사용자·요청 내용에서 유도하지 않고 난수로만 만든다.
 */
public final class TraceId {

    public static final String MDC_KEY = "traceId";

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int BYTES = 16;

    private TraceId() {
    }

    /** 현재 요청에 부여된 식별자를 반환한다. 없으면 새로 만든다. */
    public static String current() {
        String existing = MDC.get(MDC_KEY);
        return existing != null && !existing.isBlank() ? existing : generate();
    }

    public static String generate() {
        byte[] value = new byte[BYTES];
        RANDOM.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }
}
