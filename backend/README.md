# SCC Backend

SCC 백엔드는 외부 Android 앱 요청을 받는 Spring Boot API와 내부 Python 분석 서비스, PostgreSQL 하나로 구성한다.

## 구조

```text
backend/
├─ spring-api/        외부 `/api/v1/**`, 인증·권한·작업 완료·저장·알림 소유
├─ python-analysis/   내부 분석·리뷰 정제·AI 처리 경계
├─ compose.yaml       로컬 PostgreSQL 18.6
└─ .env.example       커밋 가능한 환경변수 예시
```

현재는 인증 API, 분석 작업 큐·리뷰 수집·분석 모델 호출·결과 저장, 마이페이지(저장 목록·알림·계정 탈퇴) API를 구현했다. 스키마는 Flyway V1~V5 다.

## 1. 환경 파일

PowerShell에서 `backend/.env.example`을 `backend/.env`로 복사하고 로컬 전용 비밀번호와 공유 서비스 토큰을 변경한다. `.env`는 Git에 커밋하지 않는다.
Spring과 Python을 각각 문서에 적힌 디렉터리에서 실행하면 두 서비스 모두 `backend/.env`를 읽는다. `ANALYSIS_SERVICE_TOKEN`과 `SCC_SERVICE_TOKEN`에는 같은 값을 넣는다. `AUTH_ACCESS_TOKEN_SECRET`에는 32바이트 이상의 예측 불가능한 값을, `GOOGLE_CLIENT_ID`에는 Android용 Google OAuth client ID를 넣는다.

## 2. PostgreSQL

Docker가 설치된 환경에서 저장소 루트를 기준으로 실행한다.
PostgreSQL 포트는 로컬 호스트(`127.0.0.1`)에만 공개되며 외부 네트워크에는 바인딩하지 않는다.

```powershell
docker compose --env-file backend/.env -f backend/compose.yaml up -d postgres
docker compose --env-file backend/.env -f backend/compose.yaml ps
```

2026-09-28 기준 작업 PC에서 Docker 로 이 명령과 Testcontainers 통합 테스트를 실행했다.

## 3. Spring Boot API

```powershell
Set-Location backend/spring-api
.\gradlew.bat test
.\gradlew.bat bootRun
```

애플리케이션 실행에는 PostgreSQL, `POSTGRES_PASSWORD`, `AUTH_ACCESS_TOKEN_SECRET` 환경변수가 필요하다. Google 로그인에는 `GOOGLE_CLIENT_ID`도 필요하다. 공개 헬스 체크와 가입·로그인·갱신 endpoint 외 요청은 기본 거부하거나 Bearer Access Token을 요구한다.

migration 은 `src/main/resources/db/migration/` 의 V1~V5 이며 테이블 설명은 [DATA_MODEL.md](../docs/architecture/DATA_MODEL.md) 가 정본이다. `gradlew test`는 Docker가 있으면 PostgreSQL 18.6 컨테이너에서 migration·제약 테스트(`InitialSchemaMigrationTests`)와 분석·마이페이지 API 통합 테스트(`AnalysisApiIntegrationTests`)를 실행하고, Docker가 없으면 이 두 클래스를 명시적으로 건너뛴다. 나머지 테스트는 Docker 없이 돈다.

## 4. Python 분석 서비스

```powershell
Set-Location backend/python-analysis
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m playwright install chromium
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m scc_analysis
```

`playwright install chromium` 은 리뷰 수집에 쓰는 브라우저를 받는다. 한 번만 실행하면 된다. 이 실행 명령은 `SCC_HOST`, `SCC_PORT`, `SCC_ENVIRONMENT` 설정을 적용한다. 내부 헬스 체크는 기본값 기준 `GET http://127.0.0.1:8000/internal/v1/health`다. 분석 endpoint `POST /internal/v1/analysis-jobs` 는 `X-SCC-Service-Token` 헤더로 `SCC_SERVICE_TOKEN` 과 같은 값을 요구하고, 분석에는 `SCC_OPENAI_API_KEY` 가 필요하다.
