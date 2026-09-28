package kr.co.scc.api.analysis.api;

import java.util.List;

import kr.co.scc.api.analysis.application.AnalysisException;
import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorBody;
import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorEnvelope;
import kr.co.scc.api.auth.api.AuthErrorHandler.FieldError;
import kr.co.scc.api.common.web.TraceId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 분석 API 오류를 공통 오류 계약(API.md 2.1)으로 돌려준다. 인증·마이페이지와 같은 형식이다.
 *
 * <p>요청 형식 오류도 여기서 {@code INVALID_REQUEST} 로 바꾼다. 그러지 않으면 Spring 기본 응답이
 * 나가 앱이 {@code error.code} 를 읽지 못한다.
 */
@RestControllerAdvice(assignableTypes = {AnalysisController.class, PersonaImageController.class})
public class AnalysisErrorHandler {

    private static final String INVALID_REQUEST = "INVALID_REQUEST";
    private static final String INVALID_REQUEST_MESSAGE = "요청 내용을 확인해 주세요.";

    @ExceptionHandler(AnalysisException.class)
    public ResponseEntity<ErrorEnvelope> handle(AnalysisException exception) {
        return ResponseEntity.status(exception.status())
                .body(envelope(exception.code(), exception.getMessage(), exception.retryable(), List.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope> handleInvalidBody(MethodArgumentNotValidException exception) {
        List<FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), "INVALID_VALUE", "값을 확인해 주세요."))
                .toList();
        return badRequest(fieldErrors);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorEnvelope> handleMissingHeader(MissingRequestHeaderException exception) {
        return badRequest(List.of(new FieldError(exception.getHeaderName(), "REQUIRED", "필수 헤더가 없습니다.")));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorEnvelope> handleMissingParameter(MissingServletRequestParameterException exception) {
        return badRequest(List.of(new FieldError(exception.getParameterName(), "REQUIRED", "필수 값이 없습니다.")));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorEnvelope> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return badRequest(List.of(new FieldError(exception.getName(), "INVALID_VALUE", "값의 형식을 확인해 주세요.")));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorEnvelope> handleUnreadableBody(HttpMessageNotReadableException exception) {
        return badRequest(List.of());
    }

    private static ResponseEntity<ErrorEnvelope> badRequest(List<FieldError> fieldErrors) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(envelope(INVALID_REQUEST, INVALID_REQUEST_MESSAGE, false, fieldErrors));
    }

    private static ErrorEnvelope envelope(String code, String message, boolean retryable, List<FieldError> fieldErrors) {
        return new ErrorEnvelope(new ErrorBody(
                code, message, retryable, fieldErrors.isEmpty() ? null : fieldErrors, TraceId.current()));
    }
}
