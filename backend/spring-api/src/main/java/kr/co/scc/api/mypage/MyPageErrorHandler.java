package kr.co.scc.api.mypage;

import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorBody;
import kr.co.scc.api.auth.api.AuthErrorHandler.ErrorEnvelope;
import kr.co.scc.api.auth.application.AuthException;
import kr.co.scc.api.common.web.TraceId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = MyPageController.class)
public class MyPageErrorHandler {

    @ExceptionHandler(AuthException.class)
    ResponseEntity<ErrorEnvelope> handle(AuthException exception) {
        return ResponseEntity.status(exception.status())
                // 인증 오류와 같은 공통 오류 계약(API.md 2.1)을 쓴다. 필드 오류가 없으면 생략한다.
                .body(new ErrorEnvelope(new ErrorBody(
                        exception.code(), exception.getMessage(), false, null, TraceId.current())));
    }
}
