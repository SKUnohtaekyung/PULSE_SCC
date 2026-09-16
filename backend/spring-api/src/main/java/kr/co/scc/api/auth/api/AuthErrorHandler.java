package kr.co.scc.api.auth.api;

import java.util.List;

import kr.co.scc.api.auth.application.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
public class AuthErrorHandler {

    @ExceptionHandler(AuthException.class)
    ResponseEntity<ErrorEnvelope> handleAuth(AuthException exception) {
        return ResponseEntity.status(exception.status())
                .body(new ErrorEnvelope(new ErrorBody(
                        exception.code(),
                        exception.getMessage(),
                        false,
                        List.of())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException exception) {
        List<FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), "INVALID_VALUE", validationMessage(error.getField())))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorEnvelope(new ErrorBody(
                        "INVALID_REQUEST",
                        "입력값을 확인해 주세요.",
                        false,
                        fieldErrors)));
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
    }

    public record ErrorBody(
            String code,
            String message,
            boolean retryable,
            List<FieldError> fieldErrors) {
    }

    public record FieldError(String field, String code, String message) {
    }
}
