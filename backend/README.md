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

현재는 프로젝트 골격, 헬스 체크, Flyway V1 초기 스키마를 구현했다. 비즈니스 API, 리뷰 수집, 분석 모델 호출은 다음 TASK 범위다.

## 1. 환경 파일

PowerShell에서 `backend/.env.example`을 `backend/.env`로 복사하고 로컬 전용 비밀번호와 공유 서비스 토큰을 변경한다. `.env`는 Git에 커밋하지 않는다.
Spring과 Python을 각각 문서에 적힌 디렉터리에서 실행하면 두 서비스 모두 `backend/.env`를 읽는다. `ANALYSIS_SERVICE_TOKEN`과 `SCC_SERVICE_TOKEN`에는 같은 값을 넣는다.

## 2. PostgreSQL

Docker가 설치된 환경에서 저장소 루트를 기준으로 실행한다.
PostgreSQL 포트는 로컬 호스트(`127.0.0.1`)에만 공개되며 외부 네트워크에는 바인딩하지 않는다.

```powershell
docker compose --env-file backend/.env -f backend/compose.yaml up -d postgres
docker compose --env-file backend/.env -f backend/compose.yaml ps
```

현재 작업 PC에는 Docker가 없어 이 명령은 아직 실행하지 못했다.

## 3. Spring Boot API

```powershell
Set-Location backend/spring-api
.\gradlew.bat test
.\gradlew.bat bootRun
```

애플리케이션 실행에는 PostgreSQL과 `POSTGRES_PASSWORD` 환경변수가 필요하다. 공개 헬스 체크는 `GET http://localhost:8080/actuator/health`다. 그 외 요청은 인증 구현 전까지 기본 거부한다.

`src/main/resources/db/migration/V1__create_initial_schema.sql`이 초기 테이블·관계·인덱스를 생성한다. `gradlew test`는 Docker가 있으면 PostgreSQL 18.6 컨테이너에서 migration과 핵심 소유권 제약을 검증하고, Docker가 없으면 통합 테스트 4개만 명시적으로 건너뛴다.

## 4. Python 분석 서비스

```powershell
Set-Location backend/python-analysis
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m scc_analysis
```

이 실행 명령은 `SCC_HOST`, `SCC_PORT`, `SCC_ENVIRONMENT` 설정을 적용한다. 내부 헬스 체크는 기본값 기준 `GET http://127.0.0.1:8000/internal/v1/health`다. 실제 분석 endpoint에는 서비스 토큰 인증을 구현하기 전까지 추가하지 않는다.
