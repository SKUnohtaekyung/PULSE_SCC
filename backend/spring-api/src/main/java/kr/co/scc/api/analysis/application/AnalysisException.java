package kr.co.scc.api.analysis.application;

import org.springframework.http.HttpStatus;

public class AnalysisException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final boolean retryable;
    /** 유효 리뷰가 기준보다 적어 실패했을 때의 현재 유효 리뷰 수. 그 밖의 실패에서는 null. */
    private final Integer validReviewCount;

    public AnalysisException(HttpStatus status, String code, String message, boolean retryable) {
        this(status, code, message, retryable, null);
    }

    public AnalysisException(
            HttpStatus status, String code, String message, boolean retryable, Integer validReviewCount) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryable = retryable;
        this.validReviewCount = validReviewCount;
    }

    public Integer validReviewCount() {
        return validReviewCount;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public boolean retryable() {
        return retryable;
    }
}
