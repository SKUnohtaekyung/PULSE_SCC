# 안양시 외식업 리뷰분석 AI 서비스 — 디지털/AI 활용 실태 및 경쟁·대체 서비스 조사

## 0. 조사 요약

Part 1(디지털/AI 활용 실태)은 중소벤처기업부·소상공인시장진흥공단의 국가승인통계 「2024년 기준 소상공인실태조사」(2026.3.13 발표) 원문 페이지에서 디지털·스마트기술 활용률(27.2%)과 세부 유형별 수치를 직접 확인했다〔E-C1〕. 중소기업중앙회의 「소상공인 DX·AX 현황 및 정책 수요 설문조사」(500개사, 외식업 200곳 포함)는 여러 언론이 동일 수치를 인용해 대체로 신뢰할 만하나, KBIZ 원문 보도자료 자체에는 접근하지 못해 등급을 C로 제한했다〔E-C2~E-C4〕. Part 2(경쟁 서비스)에서는 **핵심 위험 신호**를 확인했다: aT의 「The외식 나침반」이 이미 포털 리뷰를 분석해 "강점·보완점"을 제시하는 리뷰분석 기능을 정부 예산으로 무료 제공 중이며〔E-C8〕, 네이버는 스마트플레이스 사업자에게 AI가 부정 리뷰를 감지·알림하고 답글 초안까지 써주는 '온서비스 AI'를 베타 운영 중이다(사업자 만족도 97%)〔E-C10〕. 한국신용데이터(캐시노트)도 배달앱·지도서비스 리뷰를 AI로 감정분석·답글제안하는 기능을 2026년 5월 출시했다〔E-C11〕. Part 3(데이터 수집 리스크)에서는 카카오맵 robots.txt가 사실상 전체 크롤링을 차단하고 있음을 직접 확인했고〔E-C14〕, 카카오는 리뷰 데이터를 오픈API로도 제휴로도 제공하지 않는다고 공식 답변했다〔E-C15〕. 네이버 이용약관 원문(policy.naver.com)과 개발자 문서(developers.naver.com)는 접근 차단으로 직접 확인하지 못했다 — 이는 확인 실패로 정직하게 기록한다.

## 1. 조사 결과

### Part 1 — 디지털/AI 활용 실태

**디지털·스마트 기술 활용률(국가승인통계).** 중기부·소진공이 2026년 3월 13일 발표한 「2024년 기준 소상공인실태조사」(일반통계 승인 제142021호, 조사대상 11개 업종 약 4만개 업체)에 따르면 디지털·스마트 기술을 활용하는 소상공인은 27.2%로 전년 대비 9.2%p 상승했다. 활용 유형(복수응답)은 온라인 판로 49.0%, 매장관리 34.4%, 경영관리 소프트웨어 19.6%, 스마트 주문·결제 15.2% 순이다〔E-C1〕. 이 보도자료에는 숙박·음식점업(외식업)만 따로 뗀 디지털 활용 세부수치는 없었다 — 업종별 기업체 수(79.6만개, 13.0%)만 확인된다. **주의**: 검색 과정에서 "온라인 판로 49.2%, 스마트 주문·결제 41.8%, 디지털 광고 15.4%"라는 다른 수치 조합이 다수 유통되고 있었으나〔E-C9〕, 어느 연도·조사인지 원문으로 특정하지 못해 이 보고서에서는 채택하지 않았다. 두 수치 세트가 혼재되어 인용되고 있다는 사실 자체가 통계 재인용 과정의 오류 가능성을 보여준다.

**AI 활용 실태(민간조사, 참고자료).** 중소기업중앙회가 소상공인 500개사(외식업 200·소매업 150·숙박업 50·개인서비스업 50·교육여가업 50)를 대상으로 실시한 「소상공인 DX·AX 현황 및 정책 수요 설문조사」(2026.6.9 발표)에 따르면, 디지털·AI 기술을 "현재 활용 중"이라는 응답이 80.0%였다. 다만 이 조사의 "디지털·AI"에는 문서작성 프로그램·키오스크·배달앱·SNS 등 일상적 도구까지 포함되어, 활용 수준을 나누면 기초 단계 30.5% + 입문 단계(키오스크·배달앱·SNS 등 보편적 도구) 52.8% = 83.3%가 초보 수준이고, 중급 15.3%·고급은 1.5%에 불과했다. 업종별로는 외식업 94.5%가 활용 중이라 응답했다(교육여가업 98.0%에 이어 2위)〔E-C2〕. 정부 지원사업 참여 경험은 전체 응답자의 3.2%뿐이었다〔E-C3〕. 필요 정책 수요는 운영비용 지원 59.0%, 초기비용 지원 35.8%, 맞춤형 교육 16.6%, 컨설팅 지원 14.0% 순으로, **비용 지원이 압도적 1순위**였고 올해 가장 기대하는 사업은 AI 활용 교육·서비스 도입 지원(46.4%)이었다〔E-C4〕. 다만 이 조사는 필자가 KBIZ 원문 보도자료(kbiz.or.kr)에 직접 접근하지 못했고 언론 재인용을 통해서만 확인했다 — 여러 매체(헤럴드경제·테크42·부산일보·서울경제·시사저널·충청매일)가 동일 수치를 일관되게 보도하고 있어 숫자 자체의 신빙성은 낮지 않으나, 출처 등급은 C로 제한한다.

**디지털 전환 준비도/장애요인(연구기관, 부분 확인).** 중소벤처기업연구원(KOSI)의 「실태조사를 기반으로 한 소상공인 디지털전환 정책제언」(2024.4 발간)은 자금·인력·지식(역량) 준비도가 낮다는 점을 지적하나, PDF 원문의 텍스트 추출이 두 차례 시도에서 모두 실패해(암호화/스트림 구조로 인해) 자금 2.21점·인력 2.38점·지식 2.53점 같은 구체적 수치를 원문으로 직접 검증하지 못했다〔E-C5〕. 이 수치는 검색결과 스니펫에서만 발견되어 최종 근거로 채택하지 않는다.

**정부 지원사업 규모(공식 확인).** 중기부는 2026년 소상공인 지원사업‧융자를 통합 공고하며 소상공인 관련 전체 예산이 역대 최대 5.4조원(직접지원 1조3,410억원 — 전년대비 5,240억원/64% 증액, 정책자금 3조3,620억원)이라고 밝혔고, 신규 사업인 '혁신소상공인 AI 활용지원'에 144억원이 배정됐다〔E-C6〕. 이는 mss.go.kr 원문 보도자료에서 직접 확인했다.

**POS 보유율, AI 도입의향 세부 수치**: 공식 근거를 확인하지 못했다(3장 참조).

### Part 2 — 경쟁·대체 서비스 (핵심 조사)

이 프로젝트의 실현가능성을 좌우하는 가장 중요한 발견은, **정부기관과 대형 플랫폼이 이미 "리뷰 분석" 기능을 무료로 제공하고 있다**는 점이다.

1. **The외식 / 외식산업정보 포털(atfis.or.kr)** — aT(한국농수산식품유통공사) 운영. 뉴스·카드뉴스, 메뉴/식재료 가격, 산업통계·경기동향지수를 무료 제공한다〔E-C7〕.

2. **The외식 나침반** — aT가 농림축산식품부와 함께 2024년 12월 시범 개시, 2025년 4월 기능 확대. 매월 인근 동종업종 대비 ①매출분석(시장규모·점포수·평균매출) ②고객분석(성별·연령대별 선호메뉴 top5) **③리뷰분석**("포털사이트에 등록된 식당별 고객 리뷰 정보를 분석해 본인 매장의 강점과 동종업체 대비 보완이 필요한 점을 제시") ④메뉴분석 ⑤종합평가를 제공한다. 대상은 사업자 인증을 마친 외식사업자·예비창업자이며, atfis.or.kr/fip → atfis.nicebizmap.co.kr로 접속한다. AI 사용 여부·무료 여부는 보도자료에 명시되지 않았으나 정부 예산 시범사업 구조상 무상 제공으로 추정된다(단정 불가)〔E-C8〕. **→ 리뷰 분석 Y / 고객분석 Y / 마케팅 추천은 명시 안됨 / AI 여부 불명. 본 프로젝트의 핵심 기능(리뷰 기반 강점·약점 진단)과 직접 중복.**

3. **소상공인365(bigdata.sbiz.or.kr)** — 소진공 운영, 舊 상권정보시스템 개편. 실제 접속해 확인한 결과 상권별 평균매출 TOP5, 업소수 TOP5, 연령대별 유동인구, 배달건수 TOP5, **인기 검색키워드 TOP5**(리뷰 텍스트가 아닌 지도 검색어)를 무료로 제공한다. 64종 공공·민간데이터를 22종으로 융합했다〔E-C9〕. 리뷰 텍스트 분석 기능은 확인되지 않았다. **→ 상권/매출 데이터는 중복, 리뷰 분석은 미제공(프로젝트가 보완 가능한 영역).**

4. **네이버 스마트플레이스** — 무료. 기본 기능: 노출수·클릭수·전화문의·길찾기·검색키워드 통계, 리뷰 열람 및 답글. **신규 'AI 관리 도구'인 '온서비스 AI'**: 리뷰의 표현 수위·맥락을 분석해 부정적이거나 민감한 리뷰일 경우 사업주에게 스마트플레이스 알림을 발송하고, 리뷰 내용에 맞춘 답글 초안을 자동 생성해 제안한다. 네이버 공식 보도자료(navercorp.com)에서 베타 운영 중 사업자 만족도 97%로 확인했다〔E-C10〕. 정식 출시 시기·유료 여부는 추가 검색에서도 확인하지 못했다. **→ 이것이 이 프로젝트와 가장 직접적으로 겹치는 대체재다.** 다만 "리뷰 감성 감지+답글 초안"에 그치고, 원문이 요구하는 "고객유형 도출"이나 "마케팅/운영 개선 제안"까지는 확인되지 않았다.

5. **카카오맵 사장님(파트너) 센터** — 카카오 공식 개발자 문서(kakaobusiness.gitbook.io)로 직접 확인. 친구수·방문자수·메시지/쿠폰 통계·전용번호 통화리포트, 그리고 "카카오맵에 등록된 고객들의 매장 후기 정보 제공" 및 "후기 관리하기" 메뉴를 무료 제공하나, 평점 추이·키워드 분석 같은 심층 리뷰 분석 기능은 문서상 확인되지 않았다〔E-C13〕. **→ 리뷰 열람·답글만 가능, 분석은 미제공.**

6. **캐시노트 'AI 리뷰 관리'(한국신용데이터)** — 2026년 5월 14일 출시(전자신문 등 다수 매체). 배달 플랫폼과 지도 서비스에서 수집한 리뷰를 AI가 분석해 부정감정을 5단계로 분류하고, 4가지 어조의 맞춤 답변을 제안하며, 매일 정해진 시간에 부정 리뷰를 모아 알림 발송한다. 캐시노트는 220만 사업장에 도입되어 있다(다만 이 AI 리뷰 기능 자체의 가입자 수·무료 여부는 확인 못함)〔E-C11〕. **→ 리뷰 Y / 감성분석 Y / AI Y / 마케팅 추천은 불명확. 다중 플랫폼(배달앱+지도) 리뷰 통합이라는 점에서 프로젝트와 매우 유사.**

7. **캐치테이블 사장님** — AI 기반 리뷰 신뢰도 검증(가짜/조작 리뷰 탐지), BigQuery+Vertex AI로 매출·메뉴·고객 분석 대시보드 제공(구글클라우드 고객사례 페이지 및 언론)〔E-C12〕. 예약 확보 고객 데이터 중심으로 프로젝트가 다루려는 "리뷰 텍스트 기반 고객 인식"과는 결이 다르다.

8. **배달의민족 사장님광장/배민장부** — 리뷰 추천순 정렬, 평균 별점 등 리뷰 통계, 배민장부를 통한 매출·신규/재주문 비율 분석 제공. AI 기반 리뷰 감성분석은 이번 조사에서 확인되지 않았다〔E-C12〕.

9. **국내 스타트업(브이리뷰, 르몽 등)** — 검색 스니펫 수준에서 AI 리뷰 답글 자동생성·다중 플랫폼(배달앱 등) 통합관리를 표방하나, 서비스 페이지(vreview.tv 등)에 직접 접속해 검증하지 못했다 — 이 부분은 정직하게 미검증으로 남긴다.

10. **해외 사례(참고, C등급)** — Yelp는 2024년 12월부터 레스토랑 카테고리에 LLM 기반 'Review Insights'를 출시, 고객경험·가격·시설·서비스 등 항목별 감성 점수를 리뷰 위에 표시하며 서비스 카테고리로 확장 중이다〔E-C16〕. Google Business Profile Insights는 무료로 노출·통화·예약·검색키워드 통계를 제공하나 리뷰 자체의 AI 분석은 확인되지 않았다〔E-C17〕. Podium·Birdeye는 AI 평판관리 스위트를 제공하지만 월 900~1,500달러대 기업용 가격으로 소상공인 단독 타깃과는 거리가 있다〔E-C18〕. **→ "리뷰를 LLM으로 분석해 매장에 인사이트를 주는" 사업모델 자체는 해외에서 이미 대형 플랫폼(Yelp) 표준기능으로 편입되는 추세다.**

### Part 3 — 데이터 수집 리스크

**robots.txt**: 카카오맵(map.kakao.com)의 robots.txt를 직접 fetch해 확인한 결과, `User-agent: *`에 `Disallow: /`(홈페이지만 `Allow: /$`)가 적용되어 사실상 전체 경로에 대한 크롤링을 차단하고 있으며, GPTBot·ClaudeBot·PerplexityBot 등 AI 학습·RAG 목적 봇을 명시적으로 차단한다〔E-C14〕. 네이버 지도(map.naver.com)의 robots.txt는 도메인 접근이 차단되어 직접 확인하지 못했다 — 확인 실패로 기록한다.

**오픈API의 리뷰 제공 여부**: 카카오 개발자 포럼(devtalk.kakao.com)에서 카카오 Map 담당자가 "내부 정책상 POI 내 평점·리뷰 데이터 등 장소 상세 정보는 오픈API로 제공하지 않으며, 제휴를 통한 제공도 검토하지 않는다"고 공식 답변한 것을 직접 확인했다〔E-C15〕. 네이버 지역검색 오픈API(openapi.naver.com)는 개발자 문서(developers.naver.com)에 대한 직접 접근이 차단되어, "리뷰 필드가 없다"는 점을 간접 정보(블로그·타 포럼)로만 확인했고 원문으로 검증하지 못했다 — 이 항목은 부분 확인에 그친다.

**이용약관**: 네이버 policy.naver.com 원문 접근이 차단되어 자동수집 금지 조항의 정확한 문구를 확인하지 못했다. 카카오계정 이용약관(kakao.com/policy/terms)은 확인했으나, "역설계·소스코드 추출·서비스 복제" 금지 조항(제12조)만 있고 크롤링을 명시적으로 금지하는 별도 조항은 발견하지 못했다〔E-C19〕.

**판례**: (1) 대법원 2022.5.12. 선고 2021도1533 판결(여기어때-야놀자 크롤링 사건) — 경쟁사 서버에 약 1,594만회 접속해 숙박정보를 수집한 행위에 대해 정보통신망 침입·업무방해·저작권법 위반 모두 무죄가 확정됐다. 핵심 근거는 로그인 등 별도 인증절차나 접근 차단 기술조치가 없었고, 이용약관의 금지조항만으로는 형사책임을 물을 수 없다는 것이다〔E-C20〕. 이는 "로그인 없이 공개된 리뷰"를 수집하는 행위의 형사적 위험이 상대적으로 낮을 수 있음을 시사한다. (2) 잡코리아-사람인 사건 — 사람인이 잡코리아 채용정보를 크롤링해 자사 영업에 활용한 데 대해 서울중앙지법·고등법원이 저작권법 제93조(데이터베이스제작자 권리 침해) 위반 및 부정경쟁행위로 인정하고 396건 폐기·1억9,800만원 배상을 명했다〔E-C21〕. 이는 **경쟁 서비스 목적의 상업적 활용**에서는 민사상 DB권 침해 책임이 실제로 인정된 사례로, 본 프로젝트가 네이버/카카오 리뷰를 상업 서비스의 원재료로 삼는다면 이 판례의 적용 위험을 검토해야 한다. (3) 대법원 2024.4.16. 선고 2023도17354 판결 — "상당한 부분"의 복제 여부는 양적 비교뿐 아니라 질적으로 데이터베이스 제작자의 투자 정도를 기준으로 판단하며, 개별적으로는 사소한 복제라도 반복적·체계적으로 이뤄져 누적되면 상당한 부분 복제와 같은 효과를 인정할 수 있다고 판시했다〔E-C22〕. 이는 리뷰를 소량씩이라도 지속적·반복적으로 수집하는 서비스 구조에 특히 유의미한 법리다. (2)·(3)은 법률사무소의 판례 해설(atlaw.kr 등)을 통해 사건번호·요지를 확인했으며, 대법원 원문 판결문(scourt.go.kr)·법원 PDF는 두 차례 fetch를 시도했으나 텍스트 추출에 실패해 원문 직접 검증에는 이르지 못했다 — 정직하게 이 한계를 기록한다.

**개인정보 쟁점**: 리뷰 작성자의 닉네임·프로필사진이 개인정보보호법상 개인정보에 해당할 가능성이 있다는 법률 실무 논의는 확인했으나〔E-C23〕, 이를 직접 판단한 확정 판례나 개인정보보호위원회의 공식 유권해석은 찾지 못했다.

---

## 2. Evidence Records

## E-C1
- Claim: 2024년 기준 소상공인 디지털·스마트기술 활용률 27.2%, 유형별(온라인판로49.0%/매장관리34.4%/경영관리SW19.6%/스마트주문결제15.2%)
- Verdict: Confirmed
- Exact statistic: 27.2%(전체), 49.0%/34.4%/19.6%/15.2%(복수응답, 유형별)
- Unit: %
- Population: 소상공인 비중이 높은 11개 산업
- Sample: 약 4만개 업체
- Geography: 전국
- Survey/reference year: 2024년
- Publication year: 2026
- Organization: 중소벤처기업부, 소상공인시장진흥공단
- Document title: 2024년 기준 소상공인실태조사 결과 발표
- Table/page: 보도자료 본문(첨부 PDF/HWPX 별도)
- Primary source URL: https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=86&bcIdx=1066231&parentSeq=1066231
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct (원문 보도자료 페이지에서 WebFetch로 직접 확인)
- Source grade: S (국가승인통계, 승인번호 제142021호 계열)
- Limitations: 외식업(숙박음식점업)만 분리한 디지털활용 세부수치는 본문에 없음(업종별 기업체수만 확인). 첨부 PDF/HWPX 원문표는 다운로드했으나 텍스트 추출 실패.
- Notes: 검색 중 발견된 "온라인판로49.2%/스마트주문41.8%/디지털광고15.4%"라는 다른 수치조합은 이 공식수치와 불일치하여 채택하지 않음(E-C9 참조).

## E-C2
- Claim: 소상공인 디지털·AI 기술 활용률 80.0%, 활용수준 기초30.5%+입문52.8%=83.3%, 중급15.3%, 고급1.5%; 외식업 활용률 94.5%
- Verdict: Partially Confirmed
- Exact statistic: 80.0% / 83.3%(기초+입문) / 94.5%(외식업)
- Unit: %
- Population: 소상공인
- Sample: 500개사(외식업200/소매업150/숙박업50/개인서비스업50/교육여가업50)
- Geography: 전국(추정, 명시 안됨)
- Survey/reference year: 명시 안됨(발표 2026.6.9 기준 최근)
- Publication year: 2026
- Organization: 중소기업중앙회
- Document title: 소상공인 DX·AX 현황 및 정책 수요 설문조사
- Table/page: 불명(원문 미확인)
- Primary source URL: 원문 확인 불가(kbiz.or.kr 보도자료 URL 미발견) — 헤럴드경제 https://biz.heraldcorp.com/article/10767025 , 테크42 https://www.tech42.co.kr/... 등 재인용
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect (언론 재인용만 확인, 원문 미접근)
- Source grade: C (경제단체 자체 설문조사, 원문 미확인으로 신뢰도 제한)
- Limitations: KBIZ 공식 보도자료를 발견하지 못해 다수 언론 재인용에 의존. "디지털·AI"에 문서작성프로그램·키오스크 등 일반 도구가 포함되어 진정한 AI 활용률과는 다름.
- Notes: 6개 이상 매체(헤럴드경제·테크42·부산일보·서울경제·시사저널·충청매일)가 동일 숫자를 보도해 상호 일관성은 높음.

## E-C3
- Claim: 정부 디지털·AI 지원사업 참여 경험 3.2%
- Verdict: Partially Confirmed
- Exact statistic: 3.2%
- Unit: %
- Population/Sample/Geography/Survey year: E-C2와 동일
- Publication year: 2026
- Organization: 중소기업중앙회
- Document title: 소상공인 DX·AX 현황 및 정책 수요 설문조사
- Table/page: 불명
- Primary source URL: 원문 미확인 (재인용: https://www.thepublic.kr/news/articleView.html?idxno=307250)
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect
- Source grade: C
- Limitations: E-C2와 동일한 원문 미확인 한계.
- Notes: —

## E-C4
- Claim: 소상공인 정책수요 1위 운영비용지원 59.0%, 2위 초기비용지원 35.8%, 맞춤형교육 16.6%, 컨설팅지원 14.0%
- Verdict: Partially Confirmed
- Exact statistic: 59.0% / 35.8% / 16.6% / 14.0%
- Unit: %
- Population/Sample: E-C2와 동일
- Geography: 명시 안됨
- Survey/reference year: 2026(발표시점 기준)
- Publication year: 2026
- Organization: 중소기업중앙회
- Document title: 소상공인 DX·AX 현황 및 정책 수요 설문조사
- Table/page: 불명
- Primary source URL: 원문 미확인 (재인용 다수 매체)
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect
- Source grade: C
- Limitations: 원문 미확인.
- Notes: 마케팅 지원 수요(Q-C1 관련)에 대한 가장 근접한 공식수치이나 등급 C.

## E-C5
- Claim: 소상공인 디지털전환 준비도 점수(자금2.21/인력2.38/지식2.53)
- Verdict: Not Verifiable
- Exact statistic: 미검증(스니펫상 2.21/2.38/2.53)
- Unit: 점(척도 불명)
- Population/Sample: 불명
- Geography: 불명
- Survey/reference year: 불명
- Publication year: 2024(추정, 발간 표시)
- Organization: 중소벤처기업연구원(KOSI)
- Document title: 실태조사를 기반으로 한 소상공인 디지털전환 정책제언
- Table/page: 확인 불가
- Primary source URL: https://db.kosi.re.kr/kosbiDB/attachfiles/file/download?fileName=15+... (PDF)
- Access date: 2026-08-21
- Direct / Indirect evidence: 시도했으나 실패 — PDF 다운로드는 성공했으나 텍스트 추출 2회 모두 실패(스트림 구조/렌더러 미설치)
- Source grade: B(연구기관, 등급상) — 그러나 원문 미검증으로 최종 근거 미채택
- Limitations: 원문 텍스트 접근 실패. 검색엔진 스니펫에서만 발견된 수치로 최종 결론에 사용하지 않음.
- Notes: 정직하게 "원문 PDF 다운로드 성공, 텍스트 추출 실패"로 기록.

## E-C6
- Claim: 2026년 소상공인 예산 역대최대 5.4조원, 통합공고 지원사업 1조3,410억원, 정책자금 3조3,620억원, 혁신소상공인 AI활용지원 144억원 신규
- Verdict: Confirmed
- Exact statistic: 5.4조원 / 1조3,410억원(전년대비 +5,240억원) / 3조3,620억원 / 144억원
- Unit: 원
- Population: 전국 소상공인·예비창업자
- Sample: 해당없음(예산 통계)
- Geography: 전국
- Survey/reference year: 2026년도 예산
- Publication year: 2025(발표일 2025.12.29)
- Organization: 중소벤처기업부
- Document title: 2026년 소상공인 지원사업‧융자 통합 공고 AI‧디지털 전환 중심, 성장단계별 맞춤 지원 확대
- Table/page: 보도자료 본문
- Primary source URL: https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=86&bcIdx=1064370&parentSeq=1064370
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct
- Source grade: S (정부부처 공식 보도자료)
- Limitations: 외식업에 특화된 세부 배정액은 확인되지 않음.
- Notes: —

## E-C7 / E-C8
- Claim: aT 「The외식 나침반」이 매출/고객/리뷰/메뉴 분석 및 종합평가를 제공하며 리뷰분석 기능이 실존함
- Verdict: Confirmed
- Exact statistic: 해당없음(기능 존재 여부에 대한 사실확인)
- Unit: 해당없음
- Population: 외식사업자(사업자 인증 필요) 및 예비 외식경영자
- Sample: 해당없음
- Geography: 전국
- Survey/reference year: 시범 2024.11~12월 개시, 2025.4월 기능확대
- Publication year: 2024~2025
- Organization: 한국농수산식품유통공사(aT), 농림축산식품부
- Document title: (농식품부 보도자료) 식당 사장님을 위한 꿀팁! 모르면 손해보는 내 식당 무료 상담 서비스; (aT 포털) The외식/외식산업정보포털
- Table/page: 보도자료 본문
- Primary source URL: https://www.mafra.go.kr/home/5109/subview.do(제목상 "무료" 명시) ; https://www.atfis.or.kr/fip/front/index.do ; https://www.newsis.com/view/NISX20241202_0002980366
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct (농식품부 원문 보도자료 및 aT 포털 실제 접속 확인)
- Source grade: A (중앙부처 산하 공공기관 공식 발표 + 실제 서비스 페이지 확인)
- Limitations: AI 사용 여부는 보도자료에 명시되지 않음. 서비스 자체(atfis.nicebizmap.co.kr) 로그인 후 화면까지는 접속하지 못해 리뷰분석 결과물의 실제 산출 형태는 미확인.
- Notes: **본 프로젝트의 핵심 아이디어(리뷰 기반 강점/약점 진단)와 가장 직접적으로 중복되는 정부 서비스.** 제목에 "무료"라는 문구가 명시적으로 포함되어 있어 무료 서비스로 판단됨.

## E-C9
- Claim: 소상공인 상권정보시스템(소상공인365)이 상권분석·경영진단 등을 무료 제공
- Verdict: Confirmed
- Exact statistic: 64개 공공·민간데이터→22종 융합(플랫폼 설명), 서울 중구 소공동 예시: 카페 월평균매출 5,418만원 등(실시간 화면값, 통계적 대표성 없음)
- Unit: 다양
- Population: 전국 소상공인·예비창업자
- Sample: 해당없음
- Geography: 전국(상권 단위 조회)
- Survey/reference year: 실시간 갱신(조회 시점 2026년 5월/8월 기준월 표시)
- Publication year: 2025(정식서비스 2025.1.2)
- Organization: 중소벤처기업부, 소상공인시장진흥공단
- Document title: 소상공인365 (bigdata.sbiz.or.kr)
- Table/page: 해당없음(웹서비스)
- Primary source URL: https://bigdata.sbiz.or.kr/
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct (브라우저로 실제 접속, 화면 텍스트 직접 확인)
- Source grade: A (정부기관 운영 공공서비스, 실사이트 확인)
- Limitations: 리뷰 텍스트 분석 기능은 확인되지 않음("인기 키워드"는 지도 검색어이지 리뷰가 아님). 무료 여부는 별도 로그인·요금 안내를 확인하지 못해 "정부 공공서비스 관행상 무료로 추정"에 그침.
- Notes: —

## E-C10
- Claim: 네이버 스마트플레이스 '온서비스 AI'가 부정 리뷰를 감지해 사업주에게 알림을 보내고 답글 초안을 자동 생성함(베타, 사업자 만족도 97%)
- Verdict: Confirmed
- Exact statistic: 사업자 만족도 97%(베타 운영 기준)
- Unit: %
- Population: 네이버 플레이스 사업자(오프라인 매장 운영자)
- Sample: 명시 안됨
- Geography: 전국
- Survey/reference year: 명시 안됨(베타 운영 중)
- Publication year: 2026(보도자료 발표시점 추정)
- Organization: 네이버(NAVER Corp.)
- Document title: 리뷰 관리부터 FAQ 응대까지…네이버, '온서비스 AI' 통한 SME 비즈니스 성장 지원 사례 공유
- Table/page: 보도자료 본문
- Primary source URL: https://www.navercorp.com/media/pressReleasesDetail?seq=34203
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct
- Source grade: A (기업 공식 보도자료, 국내 최대 지도서비스 운영사 1차 발표)
- Limitations: 정식 출시일, 무료/유료 여부, "고객유형 분류"까지 하는지는 확인되지 않음(현재까지는 부정리뷰 감지+답글 초안 생성 수준으로 보임).
- Notes: **Q-C2에 대한 가장 결정적 증거.** 네이버가 이미 리뷰 감성분석 기반 알림·답글생성을 무료(추정) 제공 중이라는 사실은 프로젝트의 차별화 지점을 "리뷰 감성 인지"를 넘어 "고객유형 도출·마케팅전략 제안" 등 상위 인사이트로 옮겨야 함을 시사.

## E-C11
- Claim: 캐시노트(한국신용데이터) 'AI 리뷰 관리'가 배달플랫폼·지도서비스 리뷰를 감정 5단계로 분석하고 4가지 어조의 답변을 제안, 매일 부정리뷰 알림 발송
- Verdict: Confirmed
- Exact statistic: 감정 5단계, 답변 어조 4가지, 캐시노트 전체 220만 사업장 도입(AI리뷰기능 자체 가입자수는 별도 불명)
- Unit: 해당없음/개(사업장 수)
- Population: 캐시노트 이용 소상공인
- Sample: 해당없음
- Geography: 전국
- Survey/reference year: 출시 2026.5.14
- Publication year: 2026
- Organization: 한국신용데이터(캐시노트)
- Document title: 캐시노트, AI로 리뷰 관리 돕는다…"부정 리뷰 선별" 등 다수 보도
- Table/page: 기사 본문
- Primary source URL: https://www.etnews.com/20260514000324 (기업 공식 보도자료 원문 링크는 미발견, 언론 다수 보도로 교차확인)
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(기업 발표를 다룬 다수 언론 보도, 회사 공식 프레스룸 원문은 미확인)
- Source grade: C (기업 공식 발표 기반이나 원문 미접근으로 언론보도에 의존)
- Limitations: 무료/유료 여부, 데이터 수집 방식(제휴 API vs 자체 수집)이 확인되지 않음.
- Notes: 배달앱+지도서비스를 아우르는 멀티플랫폼 리뷰 통합이라는 점에서 프로젝트와 기능적으로 가장 근접.

## E-C12
- Claim: 캐치테이블 사장님(AI 리뷰 신뢰도 검증), 배달의민족 사장님광장(리뷰 통계·매출분석)
- Verdict: Partially Confirmed
- Exact statistic: 해당없음
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 불명
- Publication year: 다양
- Organization: 캐치테이블, 우아한형제들(배달의민족)
- Document title: 캐치테이블 우수사례(Google Cloud); 배민외식업광장/배민장부 가이드
- Table/page: 해당없음
- Primary source URL: https://cloud.google.com/customers/intl/ko-kr/catchtable ; https://ceo.baemin.com/guide/8740
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(구글 클라우드 고객사례·기업 가이드 페이지 요약, 서비스 자체 로그인 화면은 미확인)
- Source grade: C
- Limitations: 두 서비스 모두 리뷰 텍스트에 대한 감성분석·인사이트 도출 기능이 명확히 확인되지 않음(캐치테이블은 가짜리뷰 탐지 중심, 배민은 통계 정렬 중심).
- Notes: —

## E-C13
- Claim: 카카오맵 사장님(파트너) 센터는 통화/메시지/쿠폰 통계와 후기 열람·관리를 무료 제공하나, 리뷰 키워드·평점추이 분석은 문서상 확인되지 않음
- Verdict: Confirmed(제공 범위 한정)
- Exact statistic: 해당없음(기능 목록)
- Unit: 해당없음
- Population: 카카오맵 매장 등록 사업자
- Sample: 해당없음
- Geography: 전국
- Survey/reference year: 해당없음(상시 서비스)
- Publication year: 상시 갱신 문서
- Organization: 카카오
- Document title: kakao business 비즈니스 가이드 — 매장관리/파트너 홈
- Table/page: 해당 페이지 본문
- Primary source URL: https://kakaobusiness.gitbook.io/main/channel/run/mystore ; https://kakaobusiness.gitbook.io/main/channel/run/dashboard
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct(카카오 공식 개발자/파트너 문서 직접 확인)
- Source grade: A(1차 기업 공식 문서)
- Limitations: 문서에 없는 기능이 실제 대시보드에는 존재할 가능성을 완전히 배제할 수 없음.
- Notes: —

## E-C14
- Claim: 카카오맵(map.kakao.com) robots.txt는 모든 User-agent에 대해 `Disallow: /`(홈만 허용)를 적용해 사실상 전면 크롤링 차단
- Verdict: Confirmed
- Exact statistic: `User-agent: *` / `Disallow: /` / `Allow: /$`
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 조회 시점 2026-08-21
- Publication year: 해당없음(상시 파일)
- Organization: 카카오
- Document title: map.kakao.com/robots.txt
- Table/page: 해당없음
- Primary source URL: https://map.kakao.com/robots.txt
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct(원문 파일 직접 fetch)
- Source grade: 1차 원문 파일(등급체계상 최상위, S에 준함)
- Limitations: 네이버 지도(map.naver.com)의 robots.txt는 접근이 차단되어 대조 확인하지 못함.
- Notes: **Q-C4에 핵심적인 기술적 증거.**

## E-C15
- Claim: 카카오는 POI 평점·리뷰 데이터를 오픈API로 제공하지 않으며, 제휴를 통한 제공도 검토하지 않는다고 공식 답변
- Verdict: Confirmed
- Exact statistic: 해당없음(정책 답변)
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 해당없음
- Publication year: 불명(포럼 게시일 미확인)
- Organization: 카카오(Map API 담당자)
- Document title: Kakao Maps API 사용 시 리뷰 제공 가능 여부 및 관련 API 존재 여부 문의 — 카카오 데브톡
- Table/page: 해당없음
- Primary source URL: https://devtalk.kakao.com/t/kakao-maps-api-api/147942
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct(카카오 담당자의 공식 답변 원문)
- Source grade: C(비공식 채널이나 회사 담당자의 1차 공식 답변)
- Limitations: 포럼 게시물 자체이므로 공식 정책문서 대비 구속력·최신성은 낮을 수 있음.
- Notes: **Q-C2/Q-C4에 핵심적인 증거 — 네이버·카카오 모두 리뷰 원문 데이터를 공식 채널로는 얻을 수 없음을 시사, 즉 이 프로젝트가 크롤링 외에는 데이터 확보 수단이 없다는 뜻.**

## E-C16
- Claim: Yelp가 2024년 12월부터 레스토랑 카테고리에 LLM 기반 'Review Insights'(고객경험·가격·시설·서비스 등 항목별 감성점수)를 출시, 서비스 카테고리로 확장 중
- Verdict: Confirmed
- Exact statistic: 해당없음(기능 설명)
- Unit: 해당없음
- Population: Yelp 등록 미국 비즈니스(레스토랑→서비스업 확장)
- Sample: 해당없음
- Geography: 미국(해외 참고자료, 국내 미적용)
- Survey/reference year: 2024.12 출시, 2025 확장
- Publication year: 2025
- Organization: Yelp Inc.
- Document title: Yelp Expands AI Features to Make Local Discovery More Conversational, Visual and Seamless; Yelp end-of-year product release 2024
- Table/page: 해당없음
- Primary source URL: https://blog.yelp.com/news/end-of-year-product-release-2024/ ; https://www.yelp-ir.com/news/press-releases/...
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(기업 공식 블로그/IR 보도자료 검색결과 요약, 원문 전체 fetch는 미실시)
- Source grade: C(기업 공식 발표, 해외 시장 참고용으로만 사용)
- Limitations: 한국 시장에는 적용되지 않으며, 국내 자영업자에게 직접적 시사점은 제한적.
- Notes: 안양시/전국 통계에 일반화하지 않음 — 순수 참고용 해외 사례로만 인용.

## E-C17
- Claim: Google Business Profile Insights는 무료로 검색키워드·전화·예약·리뷰수 등 통계 제공(리뷰 자체의 AI 감성분석은 불명확)
- Verdict: Partially Confirmed
- Exact statistic: 해당없음
- Unit: 해당없음
- Population: Google Business Profile 등록 업체
- Sample: 해당없음
- Geography: 글로벌(해외 참고)
- Survey/reference year: 해당없음
- Publication year: 2026(다수 블로그 기준)
- Organization: Google
- Document title: 다수 3rd-party 가이드(AgencyAnalytics 등), Google 공식 페이지 marketingplatform.google.com
- Table/page: 해당없음
- Primary source URL: https://marketingplatform.google.com/about/small-business/
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(3rd-party 가이드 다수 종합, Google 공식원문 전체 fetch는 미실시)
- Source grade: C~D 혼재(구글 공식 페이지 링크는 확보했으나 본문 fetch 미실시로 등급 하향)
- Limitations: 해외 참고자료로만 사용, 한국 시장 일반화 금지.
- Notes: —

## E-C18
- Claim: Podium/Birdeye는 AI 평판관리 스위트를 제공하며 가격은 월 900~1,500달러대(기업용)
- Verdict: Partially Confirmed
- Exact statistic: $900~$1,500/월(3rd-party 비교사이트 추정치)
- Unit: USD/월
- Population: 미국 중소~중견 다지점 사업자
- Sample: 해당없음
- Geography: 미국
- Survey/reference year: 2026
- Publication year: 2026
- Organization: Podium, Birdeye(3rd-party 비교사이트 경유)
- Document title: Birdeye vs Podium 비교글 다수
- Table/page: 해당없음
- Primary source URL: https://birdeye.com/tools/podium-reviews/ 등
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(가격비교 3rd-party 사이트, 공식 요금표 원문 미확인)
- Source grade: D(비교사이트, 경유지 성격 — 최종 근거로는 참고용에 한정)
- Limitations: 정확한 공식 요금은 확인 못함. 해외 사례로만 참고.
- Notes: —

## E-C19
- Claim: 카카오계정 이용약관 제12조는 서비스 역설계·복제 금지를 규정하나 크롤링을 명시적으로 금지하는 별도 조항은 확인되지 않음
- Verdict: Confirmed(부재를 확인)
- Exact statistic: 해당없음
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 해당없음
- Publication year: 해당없음(상시 약관)
- Organization: 카카오
- Document title: 카카오계정 이용약관
- Table/page: 제12조(회원의 의무) 제1항 제8호
- Primary source URL: https://www.kakao.com/policy/terms (WebFetch로 접근한 페이지, 실제로는 카카오계정 약관이 반환됨 — 서비스별 별도 약관 존재 가능성 있음)
- Access date: 2026-08-21
- Direct / Indirect evidence: Direct(다만 카카오맵 자체의 별도 서비스약관이 아닌 '카카오계정' 약관일 가능성 있어 완전 확정은 아님)
- Source grade: B(1차 약관 문서이나 정확한 서비스범위 특정에 한계)
- Limitations: 카카오맵 전용 별도 이용약관이 존재하는지, 거기에 크롤링 금지조항이 있는지는 별도 확인하지 못함.
- Notes: 네이버 policy.naver.com은 접근 자체가 차단되어 대조 불가.

## E-C20
- Claim: 대법원 2022.5.12. 선고 2021도1533 판결 — 경쟁사 숙박정보 크롤링(여기어때-야놀자 사건)에 대해 정보통신망 침입·업무방해·저작권법 위반 모두 무죄 확정, 근거는 로그인 등 기술적 접근제한 부재
- Verdict: Confirmed(사건 존재·요지) / Not Verifiable(판결문 원문 문구)
- Exact statistic: 약 1,594만회 접속(기소사실), 1심 징역1년6월·집행유예2년 → 2심·대법원 무죄
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 행위시점 2016.6~10월, 확정 2022.5.12
- Publication year: 2022
- Organization: 대법원(사법부)
- Document title: 대법원 2022. 5. 12. 선고 2021도1533 판결
- Table/page: 해당없음
- Primary source URL: 원문 미확보(scourt.go.kr PDF 텍스트추출 실패) — 법률사무소 해설 https://atlaw.kr/kr-blog/... , 언론 https://zdnet.co.kr/view/?no=20220512180515 , https://www.khan.co.kr/article/202205121137001
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(법원 원문 판결문 fetch 2회 시도 모두 실패, 법무법인 해설·언론보도로 사건번호·요지 교차확인)
- Source grade: B(사법부 판결이지만 원문 미접근, 전문가 해설과 복수 언론의 교차확인으로 등급 유지)
- Limitations: 대법원 원문 판시문 정확한 문구는 확인 못함.
- Notes: **Q-C4의 핵심 참고 판례.**

## E-C21
- Claim: 잡코리아-사람인 크롤링 민사소송 — 사람인의 채용정보 무단수집·자사영업 활용에 대해 저작권법 제93조(데이터베이스제작자권리 침해) 위반 및 부정경쟁행위 인정, 396건 폐기·1억9,800만원 배상 판결
- Verdict: Confirmed(사건 존재·요지)
- Exact statistic: 396건, 1억9,800만원(50만원×396건)
- Unit: 원, 건
- Population/Sample/Geography: 해당없음
- Survey/reference year: 소송기간 약 9년(2016년 문제제기~)
- Publication year: 2017(1심), 이후 항소심
- Organization: 서울중앙지법, 서울고등법원
- Document title: 잡코리아 vs 사람인 크롤링 소송
- Table/page: 해당없음
- Primary source URL: 판결문 원문 미확보 — https://zdnet.co.kr/view/?no=20170927180839 ; https://www.minwho.kr/kr/business/business_case_view.php?bgu=view&idx=32903
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(법무법인 업무사례 및 언론 보도, 판결문 원문 미접근)
- Source grade: C(원문 미확인, 법무법인 자체 사례 소개 성격의 정보 포함)
- Limitations: 정확한 심급별 사건번호를 특정하지 못함(대법원 최종 확정 여부도 불명확).
- Notes: **상업적 경쟁서비스 목적의 크롤링에 대해 민사 손해배상 책임이 실제 인정된 사례** — Q-C4에서 가장 직접적으로 프로젝트에 불리하게 작용할 수 있는 판례.

## E-C22
- Claim: 대법원 2024.4.16. 선고 2023도17354 판결 — 데이터베이스의 "상당한 부분" 복제 여부는 양적·질적 기준으로 판단하며, 반복적·체계적 소량복제도 누적되면 상당한 부분 복제와 같은 효과를 인정할 수 있음
- Verdict: Confirmed(요지)
- Exact statistic: 해당없음(법리 판시)
- Unit: 해당없음
- Population/Sample/Geography: 해당없음
- Survey/reference year: 해당없음
- Publication year: 2024
- Organization: 대법원
- Document title: 대법원 2024. 4. 16. 선고 2023도17354 판결(저작권법위반)
- Table/page: 해당없음
- Primary source URL: 원문 미확보 — 요지 확인: https://atlaw.kr/kr-blog/... , https://casenote.kr/대법원/2023도17354
- Access date: 2026-08-21
- Direct / Indirect evidence: Indirect(법률블로그 요약, 원문 미접근)
- Source grade: B
- Limitations: 원문 판결문 미확인.
- Notes: 지속적·반복적 리뷰 수집 구조를 가진 서비스에 특히 유의미한 법리.

---

## 3. 확인 불가 항목

- **POS 시스템 보유율(소상공인 대상 구체 수치)**: 시도한 검색어 — "소상공인 POS 시스템 보유율 실태조사", "소상공인 POS 활용률". 시장조사기관 매출/점유율 자료만 발견, 소상공인 보유율 통계는 발견하지 못함.
- **AI 도입 의향(미사용자의 향후 도입 의사 비율)**: "소상공인 AI 도입 의향 없음 이유 조사" 검색 결과 서울 소상공인 AI 활용 9.7%·초기비용부담44.2% 수치를 발견했으나 원 출처(news1.kr) 기사가 403 오류로 직접 확인 불가했고, 재인용 기사(news1.kr)에서도 조사기관·표본이 명시되지 않아 Not Verifiable로 남김.
- **디지털 전환 장애요인의 정확한 응답비율(%)(시간/인력/비용별)**: "소상공인 디지털 전환 장애요인 비용 부담 인력 부족 시간 부족 조사" 등 검색. 정성적 서술("인력 부족", "역량 부족")은 다수 확인되나, 공식 실태조사에서 항목별 정확한 % 응답률은 원문 접근 실패(KOSI PDF 텍스트 추출 불가)로 확보하지 못함.
- **네이버 지도(map.naver.com) robots.txt 전문**: 도메인 자체 접근이 차단되어 확인 불가.
- **네이버 이용약관(policy.naver.com) 원문 조항**: 도메인 접근 차단으로 확인 불가.
- **네이버 오픈API(지역검색 API) 공식 문서상 응답 필드 목록**: developers.naver.com 접근 차단으로 확인 불가. 리뷰 필드 부재는 간접정보로만 추정.
- **소상공인365, The외식 나침반의 명시적 "무료" 확인**: 정부 공공서비스 관행상 무료로 추정되나 요금정책을 명시한 공식 문구는 확보하지 못함(The외식 나침반은 언론기사 제목에 "무료"라는 표현이 있어 상대적으로 근거가 더 있음).
- **캐시노트 AI 리뷰 관리, 브이리뷰·르몽 등 국내 스타트업의 정확한 요금제**: 자체 홈페이지 접속·요금표 확인을 시도했으나 시간 제약상 완결하지 못함.
- **개인정보보호법상 리뷰 작성자 닉네임의 개인정보 해당 여부에 대한 확정적 유권해석/판례**: 발견하지 못함.

## 4. 제외한 자료

- "온라인 판로 49.2%, 스마트 주문·결제 41.8%, 디지털 광고 15.4%" 수치 — 어느 조사·연도인지 원문으로 특정하지 못했고, 공식 확인된 「2024년 기준 소상공인실태조사」 수치(49.0%/15.2%)와 불일치. 재인용 경로가 불투명해 최종 근거에서 제외.
- 파이낸셜뉴스 "서울 소상공인 10곳 중 1곳만 AI 활용" 기사(및 news1.kr 재인용) — 원문 기사 403 오류, 원 조사기관·표본 미상으로 제외(참고 언급에 그침).
- vreview.tv(브이리뷰), 르몽 등 국내 리뷰관리 스타트업 서비스 페이지 — 검색 스니펫만 확인, 실제 사이트 미접속으로 기능·요금 확정 불가하여 핵심 근거에서 제외.
- KOSI(중소벤처기업연구원) 「실태조사를 기반으로 한 소상공인 디지털전환 정책제언」 PDF 내 구체 점수(자금2.21/인력2.38/지식2.53) — 원문 텍스트 추출 실패로 제외.
- 대법원 판결 원문 PDF(file.scourt.go.kr, scourt.go.kr) — 다운로드는 성공했으나 텍스트 추출 실패로 2차 법률해설 자료로 대체, 원문 자체는 최종 근거에서 제외.
- Google/Podium/Birdeye의 정확한 요금·기능 — 3rd-party 비교사이트 중심이며 공식 요금표 원문 미확인으로 참고자료 수준에 그침(해외 사례이므로 국내 결론에 일반화하지 않음).