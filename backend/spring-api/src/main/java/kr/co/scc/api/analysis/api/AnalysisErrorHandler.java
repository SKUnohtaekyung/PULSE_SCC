package kr.co.scc.api.analysis.api;

import java.time.Instant;
import java.util.Map;

import kr.co.scc.api.analysis.application.AnalysisException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = {AnalysisController.class, PersonaImageController.class})
public class AnalysisErrorHandler {

    @ExceptionHandler(AnalysisException.class)
    public ResponseEntity<ErrorEnvelope> handle(AnalysisException exception) {
        return ResponseEntity.status(exception.status()).body(new ErrorEnvelope(new ErrorBody(
                exception.code(),
                exception.getMessage(),
                exception.retryable(),
                Map.of(),
                Instant.now())));
    }

    public record ErrorEnvelope(ErrorBody error) {
    }

    public record ErrorBody(
            String code,
            String message,
            boolean retryable,
            Map<String, String> fields,
            Instant timestamp) {
    }
}
