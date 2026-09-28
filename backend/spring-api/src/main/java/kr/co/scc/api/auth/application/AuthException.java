package kr.co.scc.api.auth.application;

import java.time.Duration;

import org.springframework.http.HttpStatus;

public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    /** 잠시 뒤 같은 요청을 다시 보낼 수 있으면 그때까지의 시간. 없으면 null. */
    private final Duration retryAfter;

    public AuthException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public AuthException(HttpStatus status, String code, String message, Duration retryAfter) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public Duration retryAfter() {
        return retryAfter;
    }
}
