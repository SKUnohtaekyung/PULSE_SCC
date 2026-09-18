package kr.co.scc.api.mypage;

import java.util.List;

import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorBody;
import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorEnvelope;
import kr.co.scc.api.auth.application.AuthException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = MyPageController.class)
public class MyPageErrorHandler {

    @ExceptionHandler(AuthException.class)
    ResponseEntity<ErrorEnvelope> handle(AuthException exception) {
        return ResponseEntity.status(exception.status())
                .body(new ErrorEnvelope(new ErrorBody(
                        exception.code(), exception.getMessage(), false, List.of())));
    }
}
