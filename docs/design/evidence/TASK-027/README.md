# TASK-027 Visual QA

## 확인 환경

- AVD: `Medium_Phone`
- Android: 17 / API 37
- 화면: 1080 × 2400, 420 dpi
- 글자 배율: 1.0
- 실행: Expo Go, `exp://172.19.224.1:8081`

## 확인 절차

1. 저장 결과가 없는 테스트 계정으로 로그인했다.
2. `ResumeTestStore`·`한식`·네이버 가게 URL을 입력해 실제 분석 작업을 만들었다.
3. `COLLECTING_REVIEWS` 36% 상태를 `progress.png`·`progress.xml`로 기록했다.
4. `adb shell am force-stop host.exp.exponent`로 Expo Go 프로세스를 종료했다.
5. 같은 개발 서버 URL로 앱을 다시 열고 세션 복원 뒤 분석 화면을 확인했다.
6. 같은 입력과 36% 서버 단계, 복구 안내가 표시된 상태를 `resumed-final.png`·`resumed-final.xml`로 기록했다.

## 판정

판정: PASS

- 앱 재실행 뒤 진행 작업이 새로 생성되지 않고 같은 작업을 이어서 조회했다.
- 복구 안내, 입력 요약, 진행률, 실제 수신 단계가 compact 폰 화면에서 overflow 없이 표시됐다.
- UIAutomator에서 진행률 접근성 레이블과 입력 보기 버튼을 확인했다.
- 태블릿·가로 화면, 글자 배율 2.0, 실제 TalkBack 발화는 이번 기능 변경 범위에서 미확인이다.
- Visual regression 도구는 프로젝트에 없어 미실행했다.
