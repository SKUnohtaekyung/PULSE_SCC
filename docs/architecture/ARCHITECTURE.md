# SCC — Architecture

**이 문서는 시스템 구조의 정본이다.**

| | |
|---|---|
| 상태 | **미확정 — 코드 없음** |
| 최종 수정 | 2026-08-21 |
| 소유 역할 | `role:platform` |

---

## 1. 현재 상태

저장소에 애플리케이션 코드가 **없다.** 다음이 전부 미확정이다.

| 항목 | 상태 |
|---|---|
| 프로젝트 유형 (Web / Mobile / API 포함 여부) | 확정 필요 |
| Frontend framework | 확정 필요 |
| Backend 존재 여부 (자체 서버 / BaaS / 없음) | 확정 필요 |
| 데이터 저장소 | 확정 필요 |
| 인증 방식 | 확정 필요 |
| 배포 환경 | 확정 필요 |
| monorepo 여부 | 확정 필요 |

**미확정 상태에서 `apps/`, `packages/` 같은 빈 디렉터리를 미리 만들지 않는다.**

## 2. 디렉터리 구조

현재 존재하는 것만 적는다.

```
SCC/
├─ AGENTS.md            공통 Agent 계약 (Claude + Codex)
├─ CLAUDE.md            Claude 전용 지침
├─ README.md
├─ .gitignore
│
├─ docs/
│  ├─ product/          제품 요구사항 정본
│  ├─ design/           UI/UX 원칙 정본
│  ├─ architecture/     시스템 구조 정본
│  ├─ decisions/        ADR
│  └─ handoffs/         작업 인수인계 (active / archive)
│
├─ .claude/             Claude Code 설정 (팀 공용)
│  ├─ settings.json
│  ├─ rules/
│  ├─ agents/
│  └─ skills/
│
└─ .github/             이슈 / PR 템플릿
   └─ ISSUE_TEMPLATE/
```

애플리케이션 코드가 생기면 여기에 실제 구조를 추가한다.

## 3. 구조 결정 시 지킬 것

1. **프레임워크 관례를 우선한다.** 임의의 구조를 프레임워크 관례보다 앞세우지 않는다.
2. **필요해진 시점에 만든다.** 공유할 코드가 없는데 `packages/` 를 미리 만들지 않는다.
3. **결정은 ADR로 남긴다.** `docs/decisions/`
4. 백엔드/API가 생기면 `docs/architecture/API.md` 를 신설한다. **지금 만들지 않는다.**
5. DB/스키마가 생기면 `docs/architecture/DATA_MODEL.md` 를 신설한다. **지금 만들지 않는다.**
   - 단, API 계약과 DB 구조의 정본은 문서가 아니라 실제 schema/types/migration 이다. 문서는 그 위치와 설계 의도를 설명한다.

## 4. 4인 협업을 위한 구조 요건

구조를 정할 때 다음을 만족하는지 확인한다. (`AGENTS.md` 5장 소유 영역과 연결)

- 역할별 소유 경계가 디렉터리로 구분되는가
- 두 사람이 같은 파일을 자주 고쳐야 하는 지점이 있는가 (있으면 분리한다)
- 공용 UI 컴포넌트·토큰이 한 곳에 모여 있는가
- 기능 추가가 기존 파일 수정이 아니라 새 파일 추가로 끝나는가

## 5. Open Questions

| # | 질문 | 막고 있는 것 |
|---|---|---|
| 1 | 프로젝트 유형 | 디렉터리 구조 전체 |
| 2 | 기술 스택 | 실행 명령, CI, verify 스킬 |
| 3 | 백엔드 형태 (자체 / BaaS / 없음) | `API.md`·`DATA_MODEL.md` 필요 여부 |
| 4 | 배포 환경 | CI 워크플로 |
