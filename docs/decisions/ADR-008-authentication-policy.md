# ADR-008 — 인증 토큰과 계정 연결 정책

## Status

Accepted — 2026-09-16

## Context

SCC MVP는 Google 로그인과 서비스 자체 로그인을 모두 제공한다. 비밀번호 저장 방식, 전화번호 용도, 토큰 수명·회전·폐기, 동일 이메일 계정 연결 규칙이 미정이라 인증 API와 `auth_sessions` migration을 안전하게 구현할 수 없었다.

## Decision

1. 자체 계정 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 받고 Spring Security BCrypt 해시만 저장한다.
2. 이메일은 trim 후 소문자로 정규화하고 `users.login_email` unique 제약을 유지한다.
3. 전화번호는 자체 계정의 필수 정보로 정규화해 저장하지만 MVP에서는 SMS 인증·로그인·계정 복구에 사용하지 않으며 중복을 허용한다.
4. Access Token은 HS256 JWT로 발급하고 수명은 15분이다. 서명 비밀은 `AUTH_ACCESS_TOKEN_SECRET` 환경변수로만 주입한다.
5. Refresh Token은 256-bit 불투명 난수로 발급하고 수명은 30일이다. DB에는 SHA-256 해시만 저장한다.
6. Refresh Token은 사용할 때마다 새 세션으로 회전한다. 이미 폐기된 Refresh Token이 다시 사용되면 탈취 가능성으로 보고 해당 사용자의 활성 세션을 모두 폐기한다.
7. 로그아웃은 현재 세션을 폐기한다. 비밀번호 변경 기능이 추가되면 모든 활성 세션을 폐기한다.
8. Google ID Token의 서명·만료·issuer·audience·이메일 검증 상태를 Spring Boot가 확인한다.
9. 동일 이메일의 Google 계정과 자체 계정을 자동 연결하지 않는다. 기존 계정 인증을 거친 명시적 연결 기능이 생기기 전에는 `ACCOUNT_LINK_REQUIRED`로 거부한다.
10. Android 앱은 Access/Refresh Token을 플랫폼 안전 저장소에 보관하고 HTTPS 요청의 Authorization 헤더와 갱신 요청 본문으로만 전송한다.

## Consequences

- `auth_sessions`를 Flyway V2로 추가하고 Spring Boot가 단독 소유한다.
- 짧은 Access Token은 로그아웃 후 최대 15분까지 암호학적으로 유효할 수 있으므로, 세션 복원 endpoint는 DB의 폐기 상태도 확인한다.
- 전화번호는 검증된 식별자가 아니며 중복 계정 판정이나 복구 수단으로 사용할 수 없다.
- Google 계정 자동 연결을 하지 않아 계정 탈취 위험은 줄지만, 동일 이메일 사용자는 후속 연결 기능 전까지 기존 방식으로 로그인해야 한다.
- 이용약관·개인정보 처리 동의와 계정 복구·탈퇴 정책은 별도 결정이며 운영 출시 전에 확정해야 한다.
