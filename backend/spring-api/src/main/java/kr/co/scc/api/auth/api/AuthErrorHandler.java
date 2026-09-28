package kr.co.scc.api.auth.api;

import java.time.Duration;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.common.web.TraceId;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
public class AuthErrorHandler {

    @ExceptionHandler(AuthException.class)
    ResponseEntity<ErrorEnvelope> handleAuth(AuthException exception) {
        Duration retryAfter = exception.retryAfter();
        if (retryAfter == null) {
            return ResponseEntity.status(exception.status())
                    .body(ErrorEnvelope.of(exception.code(), exception.getMessage(), List.of()));
        }
        // 초 단위로 올림해 알려 준다. 내림하면 알려 준 시각에 다시 보내도 막힌다.
        long seconds = Math.max(1, (retryAfter.toNanos() + 999_999_999L) / 1_000_000_000L);
        return ResponseEntity.status(exception.status())
                .header(HttpHeaders.RETRY_AFTER, Long.toString(seconds))
                .body(ErrorEnvelope.of(exception.code(), exception.getMessage(), true, List.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException exception) {
        List<FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), "INVALID_VALUE", validationMessage(error.getField())))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorEnvelope.of("INVALID_REQUEST", "입력값을 확인해 주세요.", fieldErrors));
    }

    private static String validationMessage(String field) {
        return switch (field) {
            case "email" -> "올바른 이메일 형식을 입력해 주세요.";
            case "password" -> "비밀번호는 8자 이상이며 UTF-8 기준 72바이트 이하여야 합니다.";
            case "phoneNumber" -> "전화번호를 입력해 주세요.";
            default -> "필수 값을 확인해 주세요.";
        };
    }

    public record ErrorEnvelope(ErrorBody error) {

        static ErrorEnvelope of(String code, String message, List<FieldError> fieldErrors) {
            return of(code, message, false, fieldErrors);
        }

        static ErrorEnvelope of(String code, String message, boolean retryable, List<FieldError> fieldErrors) {
            return new ErrorEnvelope(new ErrorBody(
                    code,
                    message,
                    retryable,
                    fieldErrors.isEmpty() ? null : fieldErrors,
                    TraceId.current()));
        }
    }

    /**
     * docs/architecture/API.md 2.1 공통 오류 구조를 따른다.
     * fieldErrors 는 필드 오류가 있을 때만 포함하므로 비어 있으면 응답에서 생략한다.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorBody(
            String code,
            String message,
            boolean retryable,
            List<FieldError> fieldErrors,
            String traceId) {
    }

    public record FieldError(String field, String code, String message) {
    }
}
