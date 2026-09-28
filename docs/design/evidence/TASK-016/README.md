# TASK-016 Android 실행 증거

## Environment

- AVD: `Medium_Phone`
- Android 17 / API 37, 1080×2400, 420dpi
- Runtime: Expo Go SDK 57.0.0
- App code: Expo SDK 57.0.24, React Native 0.86.3
- Data: 전부 시안용 가상 데이터

## Evidence

| 파일 | 확인 내용 |
|---|---|
| [android-live.png](android-live.png) | 기본 1위 선택, TOP3 이미지, 선택 유형 카드, 고정 하단 바 |
| [android-rank2.png](android-rank2.png) | 2위 탭 선택과 아래 콘텐츠·이미지 교체 |
| [android-bottom.png](android-bottom.png) | 대표 근거, 사실+행동, 접힌 AI·참고 지식, 하단 바 |
| [android-ai-expanded.png](android-ai-expanded.png) | AI 해석 펼치기 동작 |
| [android-knowledge-expanded.png](android-knowledge-expanded.png) | 참고 지식의 `접기` 상태와 시안용 출처 진입점 |
| [android-font-200-top.png](android-font-200-top.png) | 글자 200% 상단·TOP3 최종 상태 |
| [android-font-200-bottom.png](android-font-200-bottom.png) | 글자 200% 근거·행동·접힘·하단 바 최종 상태 |
| [android-talkback-rank1.png](android-talkback-rank1.png) | TalkBack 활성 상태의 Expo Go 화면. 회색 설정 버튼의 녹색 표시는 개발 도구가 받은 초기 초점이다 |

`android-top.png`은 기본 상단의 중간 캡처다. 최종 기본 상태는 `android-live.png`를 사용한다.

## Results

- 기본 렌더링: 가로 overflow·카드 겹침 없이 PASS
- TOP3 탭: 2위 선택 시 선택 상태와 아래 유형·4관점·근거·제안 데이터 교체 PASS
- 하단 바: 스크롤과 독립적으로 고정되며 가운데 분석하기가 강조됨 PASS
- 하단 라벨 대비: 원형 주황색은 유지하고 작은 `분석하기` 라벨을 브랜드 텍스트 토큰으로 수정, 흰 카드 기준 12.91:1 PASS
- 펼치기: AI·참고 지식 본문 노출, `expanded` 의미 상태, 펼친 뒤 `접기` 이름 확인 PASS
- 참고 지식 출처: `출처 확인 · … (시안)` 진입점과 실제 자료명·URL·검증일 연결 필요 안내 Alert 확인 PASS
- 200% 글자: 최초 TOP3 보조 문장의 2줄 제한 때문에 말줄임 FAIL을 발견해 제한을 제거했다. 수정 후 상단·하단 기능 및 내용 잘림 없이 PASS
- 접근성 트리: TOP3 1·2·3위 레이블, 이미지 대체 텍스트, 홈·분석하기·마이페이지 레이블을 UIAutomator에서 확인
- TalkBack: 서비스·touch exploration 활성화와 접근성 음성용 audio focus 요청을 확인. Expo Go 개발 도구가 초기 초점을 가로채므로 제품 화면의 실제 전체 탐색 순서와 사람이 들은 한국어 발화는 미확인

## Limitations

- USB 실기기 미연결
- development build 미생성 — `android.package`·scheme 미확정
- Expo Go의 회색 설정 버튼과 scheme 경고는 앱이 아니라 개발 도구 오버레이다.
- 참고 지식의 출처는 위치와 레이블만 검증하는 시안용 슬롯이며, 실제 자료명·URL·검증일은 미연결이다.
- loading·empty·error·유형 부족·인증·저장·실제 API 데이터 미구현
- 하단 바의 다른 화면과 전체 근거 보기는 프로토타입 안내만 제공
