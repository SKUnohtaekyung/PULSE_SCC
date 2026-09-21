# TASK-018 Android 실행 증거

## Environment

- AVD: `Medium_Phone`
- Android 17 / API 37, 1080×2400, 420dpi
- Runtime: Expo Go SDK 57
- App code: Expo SDK 57.0.24, React Native 0.86.3
- Data: 전부 디자인 검증용 가상 데이터
- 검증일: 2026-09-21

## Direct run

`Medium_Phone` 에뮬레이터가 열린 뒤 저장소 루트에서 다음 명령을 실행한다. 현재 `npm run start`는 development build용이므로, 이 프로토타입은 package와 scheme이 확정되기 전까지 Expo Go 모드를 명시한다.

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $androidSdk
$env:Path = "$androidSdk\platform-tools;$androidSdk\emulator;$env:Path"
cd frontend\mobile
npx expo start --go --android
```

에뮬레이터가 닫혀 있으면 먼저 다음 명령으로 실행하고 Android 홈 화면이 뜬 뒤 위 명령을 실행한다.

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
Start-Process -FilePath "$androidSdk\emulator\emulator.exe" -ArgumentList @('-avd', 'Medium_Phone')
```

## Final evidence

| 파일 | 확인 내용 |
|---|---|
| [android-final-live.png](android-final-live.png) | 수정 후 기본 1위 선택, 완료 히어로, 동적 TOP3, 고정 하단 바 |
| [android-current-after-fix.png](android-current-after-fix.png) | 수정 후 2위 선택과 아래 콘텐츠 교체 |
| [android-more-after-fix.png](android-more-after-fix.png) | `더보기`가 현재 선택 유형의 상세 영역으로 이동 |
| [android-font-200-after-fix.png](android-font-200-after-fix.png) | 글자 200%에서 헤더가 줄바꿈되고 히어로 장식이 숨겨진 상단 |
| [android-font-200-top3-after-fix.png](android-font-200-top3-after-fix.png) | 글자 200%에서 세 TOP3 탭과 선택 유형 문구가 잘리지 않는 상태 |
| [android-font-200-lower-after-fix.png](android-font-200-lower-after-fix.png) | 글자 200%에서 고객 여정 하단, 행동 카드, 접힌 AI·참고 지식 |
| [android-user-feedback-final.png](android-user-feedback-final.png) | 사용자 참고 이미지 반영 후 딥 네이비 완료 히어로와 화면상 순위 배지가 없는 1위 선택 상태 |
| [android-user-feedback-rank2.png](android-user-feedback-rank2.png) | 2위 선택 시 확대·테두리·태그·상세 문구·`2 / 3` 표시가 함께 교체되는 상태 |
| [android-user-feedback-rank3.png](android-user-feedback-rank3.png) | 3위 선택 시 같은 선택 규칙과 접근성 선택 상태가 유지되는 화면 |
| [android-user-feedback-font200.png](android-user-feedback-font200.png) | 사용자 피드백 반영 후 글자 200% 상단과 TOP3 진입부 |
| [android-user-feedback-font200-scrolled.png](android-user-feedback-font200-scrolled.png) | 글자 200%에서 선택 유형 상세와 4가지 관점까지 세로 스크롤 가능한 상태 |
| `android-font-200-third.xml` | 글자 200%에서 3위 선택 상태가 접근성 트리에 반영됨 |
| `android-font-200-ai-expanded.xml` | 글자 200%에서 `AI 해석 접기`와 펼친 본문이 접근성 트리에 반영됨 |

각 PNG와 같은 이름의 XML은 해당 화면의 UIAutomator 계층이다. `android-initial*`, `android-second-selected*`, `android-journey*`, `android-more-scroll*`, `android-font-200-top*`, `android-font-200-top3*`는 누락 스타일을 발견하기 전의 중간 캡처이며 최종 판정에는 `*-after-fix`와 `android-final-live`를 사용한다.

## Results

- 기본 렌더링: 완료 히어로, TOP3, 선택 유형 카드와 고정 하단 바가 겹침 없이 렌더링되어 PASS
- TOP3 전환: 1·2·3위 선택 시 선택 카드가 확대되고 아래 유형·관점·근거·여정·행동 데이터가 교체되어 PASS
- 사용자 피드백 반영: 완료 히어로의 달력·문서·체크·반짝임 장식과 선택 카드의 태그·페이지 표시를 추가하고 화면상 `N위 선택됨` 배지를 제거한 뒤 PASS
- 모션: 시스템 `Reduce motion` 값을 읽고 선택 카드 전환 및 `더보기` 스크롤 애니메이션을 끌 수 있게 구현
- `더보기`: 현재 선택한 유형의 상세 카드 시작점으로 이동하여 PASS
- 고객 여정: 유형별 4단계를 렌더링하고 `AI 해석 기반 시안`, `제품 미확정`, MVP 계약 밖이라는 설명을 함께 표시하여 탐색 기능 경계 PASS
- 200% 글자: 헤더 배지 줄바꿈, 히어로 장식 숨김, TOP3 간격·카드 높이·문구 줄바꿈을 보완한 뒤 상단·TOP3·하단·펼치기 PASS
- 접근성 트리: TOP3의 `tab` 레이블과 선택 상태, `더보기`, 하단 내비게이션, AI 펼침·접힘 이름을 UIAutomator에서 확인
- 실제 TalkBack 발화: 이번 재검증에서는 서비스가 비활성 상태여서 미확인

## Limitations

- USB 실기기 미연결
- development build 미생성 — `android.package`와 scheme 미확정
- Expo Go의 회색 설정 버튼과 scheme 경고는 앱 UI가 아니라 개발 도구 오버레이다.
- 고객 여정은 사용자가 비교할 수 있게 남긴 탐색 기능이며 현재 PRD와 `RESULT_IA`의 확정 결과 계약이 아니다.
- loading·empty·error·유형 부족·인증·저장·실제 API 데이터는 이 정상 상태 프로토타입 범위에 포함하지 않았다.
- 하단 바의 다른 화면과 전체 근거 보기는 프로토타입 안내만 제공한다.
