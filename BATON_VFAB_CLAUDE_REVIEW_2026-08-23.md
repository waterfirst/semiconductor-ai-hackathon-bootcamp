# BATON — Claude 독립 검수 · FAB-JUDGMENT Virtual Fab · 2026-08-23

## 0. 역할과 최종 질문

너는 구현자가 아니라 **독립 레드팀 검수자**다. 현재 Virtual Fab이 다음 두 목적에 충분한지 판정하라.

1. 반도체 취업준비생 5–10명에게 70분 파일럿을 진행해도 되는가.
2. 「모두의 창업 프로젝트 2차」 기술트랙에서 “작동하는 기술특화 MVP”라고 주장해도 되는가.

판정은 아래 셋 중 하나만 사용한다.

- `GO_PILOT` — 파일럿을 진행해도 되는 수준
- `CONDITIONAL_GO` — 명시한 P1 조치 후 파일럿 가능
- `NO_GO` — 데이터·채점·보안·완주 흐름에 P0 출시불가 결함 존재

**조용히 수정하지 마라.** 이번 작업은 감사다. 허용된 유일한 새 파일은 저장소 루트의 `REPORT_CLAUDE_VFAB_AUDIT_2026-08-23.md`다. 기존 파일 수정·삭제·포맷팅·커밋·푸시를 금지한다.

---

## 1. 정본과 기준시점

- 저장소: `https://github.com/waterfirst/semiconductor-ai-hackathon-bootcamp`
- 검수 기준 HEAD: `aa9eaf3` 또는 그 이후 사용자가 명시한 커밋
- 로컬 저장소: `/home/waterfirst/.cokacdir/workspace/syctizfu/semiconductor-ai-hackathon-bootcamp`
- 공개 가상팹: <https://waterfirst.pro/virtual-fab/>
- 공개 API health: <https://waterfirst.pro/virtual-fab/api/health>
- 독립 산업지도: <https://waterfirst.pro/industry-map/>

검수 시작 시 아래를 기록하라.

```bash
git rev-parse HEAD
git status --short
curl -fsS https://waterfirst.pro/virtual-fab/api/health
curl -sS -o /dev/null -w '%{http_code}\n' https://waterfirst.pro/virtual-fab/
curl -sS -o /dev/null -w '%{http_code}\n' https://waterfirst.pro/industry-map/
```

현재 작업트리에는 이번 검수와 무관한 변경·미추적 파일이 있다. **stage·수정·삭제하지 마라.**

- `artifacts/data_quality/cmp_audit_gallery.png`
- `PLAN.md`
- `design-directions/`
- `proposals/preview/`
- `submission/`
- `virtual-fab-mvp/`

---

## 2. 읽기 범위

### 2.1 반드시 읽을 파일

아래 순서대로 읽어라. 먼저 T0 블랙박스 검수를 마치기 전에는 소스 결론을 내리지 마라.

1. 이 바톤 문서
2. `vfab_assets/INTEGRATION_SPEC.md`
3. `virtual-fab-app/README.md`
4. `virtual-fab-app/tests/test_api.py`
5. `virtual-fab-app/tests/e2e.spec.ts`
6. `virtual-fab-app/backend/main.py` — 아래 심볼과 직접 호출부만 우선 확인
   - `dataset_rows`
   - PHOTO 데이터·answer key 로드/생성 함수
   - `apply_decision`
   - `/dataset.csv`
   - `/llm/check`, AI 대화 저장
   - `/outcomes`
   - `/report`
   - Holdout 계산
7. `virtual-fab-app/src/App.tsx` — 데이터 미리보기·그룹집계·AI 문답·결론·최종 리포트·standalone map route
8. `virtual-fab-app/src/components/InvestigationNotebook.tsx`
9. `virtual-fab-app/src/components/PersonalAIConnector.tsx`
10. `virtual-fab-app/src/types.ts`
11. `vfab_assets/generate_photo_cd.py`
12. `vfab_assets/answer_key_20260814.json`
13. `vfab_assets/photo_cd_20260814.csv`
14. `startup-application/MODOO_2_VIRTUAL_FAB_FINAL_2026-08-23.qmd` — 구현·검증·사업 주장 대조에 필요한 부분만

### 2.2 표본 검수 파일

- `virtual-fab-app/src/IndustryKnowledgeMap.tsx`
- `virtual-fab-app/src/data/industryCompanies.ts`
- `startup-application/INDUSTRY_RELATIONSHIP_STRENGTH_METHOD_2026-08-23.md`
- `startup-application/LETUIN_STUDENT_PILOT_PROTOCOL_2026-08-23.md`

산업지도는 전체 73개 기업을 전수 조사하지 말고 다음 표본만 검수한다.

- 핵심 제조: Samsung Electronics, SK hynix, Micron
- 장비·소재: ASML, Applied Materials, SEMES, Dongjin Semichem
- 디스플레이: Samsung Display, LG Display, BOE
- 관계선: 강도 5 두 건, 강도 4 두 건, 강도 3 두 건

각 표본에서 회사 역할·출처·기준일·공식 사실/교육용 분류가 섞이지 않는지 확인한다.

### 2.3 읽지 말 것

- `vfab_assets/UPGRADE_SPEC_v2.md` — 이번 감사 범위 아님
- 과거 바톤·과거 감사보고서 전체 — 현재 코드를 현재 기준으로 독립 판정할 것
- `node_modules/`, `dist/`, `.git/` 내부 객체
- `artifacts/`, `submission/`, `proposals/preview/`, `virtual-fab-mvp/`
- 다른 저장소, 개인 홈의 비밀 설정, 브라우저 프로필, API 키 파일
- 실제 회사 내부자료·재직회사 자료

큰 파일을 통째로 출력하지 말고 `rg`, 심볼 검색, 필요한 줄 범위만 사용한다.

---

## 3. 알려진 과거 P0와 재검수 기준

2026-08-16 감사에서는 다음 세 결함 때문에 출시 불가 판정을 받았다. 현재 문서의 “완료” 설명을 신뢰하지 말고 직접 재현하라.

### P0-A · 데이터에 진단할 답이 없었다

과거 42행 CSV는 화면 그래프를 반복했고 Tool이 Lot의 함수라 독립 진단정보가 없었다.

현재 완료 주장:

- PHOTO 데이터 2,969행
- 진짜 원인 Tool과 평균값 미끼 Tool 분리
- edge 영역, onset Lot, 결측·단위·중복 함정
- Tool / Lot / `radius_mm` bin / slot / 시간 그룹핑
- `scenario_version + seed` 결정성

통과 기준:

1. 같은 seed로 재생성한 CSV와 answer key가 결정적이다.
2. 서로 다른 세션 seed에서는 최소 원인·미끼·onset 중 일부가 달라진다.
3. 정답키 없이 CSV만 집계해도 진짜 원인을 좁힐 증거가 있다.
4. Tool 전체평균만 보면 미끼를 선택할 가능성이 실제로 존재한다.
5. 학생 UI만으로 결측·단위·중복과 edge 효과를 발견할 수 있다.
6. 정답키·원인 값이 프런트 번들·API 응답·다운로드 보고서에 노출되지 않는다.

### P0-B · 채점이 정답 판정이 아니라 선택지 매칭이었다

과거에는 CSV를 읽지 않고 무의미한 AI 문답과 학생 입력 Holdout 숫자로 100점을 만들 수 있었다.

현재 완료 주장:

- 7항목 서버 비공개 채점
- 미끼 Tool을 원인으로 지목하면 핵심 점수 0
- AI 문답 8–15회와 사람의 채택·수정·기각·근거 기록
- Holdout 값은 서버에서 계산
- `/outcomes`는 저장된 서버 행동기록에서만 역량 증거 산출

통과 기준:

1. CSV를 열지 않고 최고점 획득이 불가능하다.
2. 빈 문자열·반복문장·무관한 질문 8회로 AI 검증점수를 얻지 못한다.
3. 클라이언트가 점수·baseline·holdout·정답을 임의 입력할 수 없다.
4. 미끼 Tool, 틀린 영역, 틀린 onset, 틀린 함정 수를 제출하면 배점대로 감점된다.
5. 올바른 결론과 근거를 제출하면 `INTEGRATION_SPEC.md` 배점과 일치한다.
6. `/outcomes`의 100점은 “학습효과”가 아니라 해당 세션 과정증거임을 UI·다운로드에 고지한다.

### P0-C · 자원 트레이드오프가 없었다

과거에는 최저가 도구만 선택해도 충분하고 예산·시간 압박이 없었다.

현재 완료 주장:

- 분석도구마다 비용·시간·정보영역이 다름
- 필수 정보영역과 자원 제약을 함께 만족해야 함
- Holdout 결과 후 제한된 적용범위를 사람이 선택

통과 기준:

1. 모든 도구 선택이 항상 최적이 아니며 실제로 예산 또는 시간이 부족해진다.
2. 최저가 조합이 모든 필수 정보영역을 덮지 못한다.
3. 최소 2개 합리적 전략 사이에 비용·정보·위험의 trade-off가 존재한다.
4. 실패한 선택 뒤 rewind해도 예산·시간·점수·이력이 일관되게 롤백된다.

---

## 4. T0 — 소스 읽기 전 블랙박스 공격

공개 서비스 또는 격리된 로컬 서버에서 새 세션을 만들어 아래를 시도한다. 실제 개인 Gemini·OpenAI·DeepSeek 키를 사용하지 말고 LLM은 테스트 mock 또는 외부 복사·붙여넣기 방식만 사용한다.

### T0-1 · 무의미 입력으로 100점 공격

- CSV 미리보기 없이 다음 단계 진입
- 반복문장 8개를 AI 문답으로 제출
- 사람 검증 메모를 같은 문장으로 반복
- 미끼 Tool과 임의 함정 수 제출
- 가장 싼 도구만 선택
- Holdout 값을 클라이언트 payload에 끼워 넣기

기대: 서버가 단계·데이터·근거·정답·자원 조건에 따라 거부 또는 감점한다.

### T0-2 · 정답·비밀정보 누설 공격

- 세션 생성·scenario catalog·dataset preview·outcomes·report 응답 확인
- HTML/JS bundle에서 `answer_key`, PHOTO 원인, API key 패턴 검색
- 다운로드 Markdown·HTML PT에서 정답키·개인키·서버 로컬경로 검색
- URL과 오류메시지가 내부 파일경로·스택트레이스를 노출하는지 확인

기대: 학생이 제출한 결론과 공개 설명 이외의 정답·비밀은 노출되지 않는다.

### T0-3 · 상태 무결성 공격

- 다음 단계 직접 호출
- 같은 요청 중복 전송
- rewind 후 오래된 payload 재전송
- 완료 후 다시 이전 단계 API 호출
- 존재하지 않는 session/scenario 사용

기대: 4xx와 일관된 상태, 중복점수·중복비용 차감 없음.

### T0-4 · 무키·모바일 완주

- Pixel 7 크기에서 개인 API 연결 없이 PHOTO 흐름 시작
- 서버 CSV 미리보기, 그룹축 변경, AI 외부응답 붙여넣기, 결론·최종 산출물까지 진행
- 버튼이 화면 밖·비활성·겹침 상태로 막히지 않는지 확인

기대: 키를 넣지 않아도 학습과정 완주 가능.

각 공격은 명령·HTTP 상태·핵심 응답을 보고서에 남기되 session ID와 토큰은 필요한 부분만 마스킹한다.

---

## 5. T1 — 재현성과 채점 검수

### T1-1 · 고정 fixture

```bash
cd /home/waterfirst/.cokacdir/workspace/syctizfu/semiconductor-ai-hackathon-bootcamp
md5sum vfab_assets/photo_cd_20260814.csv
python3 vfab_assets/generate_photo_cd.py --help
```

기준 fixture의 알려진 사실:

- CSV MD5: `3d9b9acaff67c29fe0f53cf7cc1d8b13`
- 원인 Tool: `PHOTO_C`
- 미끼 Tool: `PHOTO_B`
- onset: `LOT-005`
- edge: `radius_mm >= 110`
- 결측 99, 단위오류 44, 중복 29

이 값이 fixture·생성기·서버채점에 일치하는지 확인한다. 실행 옵션이 문서와 다르면 그 자체를 문서 결함으로 보고한다. 생성 결과를 기존 fixture에 덮어쓰지 말고 임시 디렉터리에 출력한다.

### T1-2 · 배점 경계값

`INTEGRATION_SPEC.md`의 7개 문항별로 다음 세 가지 케이스를 자동 또는 수동으로 확인한다.

- 정답
- 부분정답·경계값
- 명백한 오답

특히 미끼를 원인으로 선택했을 때 “전체 0점”인지 “원인 문항만 0점”인지 문서·코드·UI 문구가 동일해야 한다. 모호하면 임의 해석하지 말고 P1 문서/평가 불일치로 보고한다.

### T1-3 · seed 변동

최소 seed 5개를 표본으로 다음을 확인한다.

- 재생성 hash 결정성
- 정답 변동
- 미끼가 실제 평균 함정으로 작동
- edge·onset 신호가 학생 분석 가능 수준
- 특정 seed에서 정답이 사라지거나 복수해석이 되지 않음

---

## 6. T2 — AI 대화와 증거 품질

다음은 “대화 횟수”가 아니라 “심층 토론”인지 검수한다.

1. 문제 상황·전문용어·현재 데이터 요약이 AI 요청에 포함되는가.
2. 전체 2,969행을 무제한 전송하지 않고 통계·표본·원문 범위를 통제하는가.
3. AI 응답을 화면에서 읽고 복사·수정할 수 있는가.
4. 다음 질문이 이전 응답·데이터·반론을 이어받는가.
5. 회차별 채택·수정·기각과 근거 메모가 서버 상태에 남는가.
6. “AI가 말했기 때문” 같은 근거가 높은 평가로 이어지지 않는가.
7. Gemini 실패가 성공처럼 보이지 않고 팝업 안에서 원인을 확인할 수 있는가.
8. API 키가 `localStorage`, Git, 다운로드, 서버 로그에 남지 않는가.
9. 모델별 토큰·비용 고지가 실제 요청과 모순되지 않는가.
10. 최종 PT에 데이터 분석·대안가설·AI 반론·사람 판단·한계가 구체적으로 반영되는가.

최소 한 세션의 시작 질문부터 최종 PT까지 evidence chain을 따라가라. “슬라이드가 생성됨”이 아니라 단편적 문장 복사가 아닌지 확인한다.

---

## 7. T3 — 교육·사용성 검수

### 데스크톱

- 100% 브라우저 배율에서 3D와 작업창이 모두 읽히는가.
- 분할바 드래그·키보드·더블클릭 초기화가 동작하는가.
- 캐릭터와 카드·버튼·데이터표가 겹치지 않는가.
- 완료한 상단 Step을 클릭해 이전 단계로 돌아갈 수 있는가.

### 모바일

- 첫 화면에서 다음 행동이 명확한가.
- 긴 표·그룹분석·AI 팝업에 가로 넘침이 없는가.
- 고정 요소가 입력·버튼을 가리지 않는가.
- 다운로드가 불가능한 환경에서도 결과를 읽고 복사할 수 있는가.

### 교육 설계

- 사건을 읽기 전 정답을 암시하지 않는가.
- 현업 키워드는 설명과 실제 분석행동에 연결되는가.
- 학생이 실패한 이유를 점수만이 아니라 근거로 이해할 수 있는가.
- 70분 파일럿에서 필수 흐름이 과도하지 않은가. 시간 추정치를 단계별로 제시하라.
- 사전·사후 rubric이 서버의 과정증거 점수와 다른 측정임을 명확히 구분하는가.

---

## 8. T4 — 산업지도와 사업기획 주장 검수

### 산업지도

- 73개 회사 수, 4단 공급망, 반도체·디스플레이·공통기술 분류가 코드·화면과 일치하는가.
- 행성 크기의 매출기준과 관계선 굵기의 근거가 다른 개념으로 구분되는가.
- 회사 클릭 전 작은 회사명을 숨기고 클릭 후 읽을 수 있는가.
- Z축·공전이 시각적 장식만 늘리고 검색·선택을 방해하지 않는가.
- 공식 거래관계와 공정상 인접성을 동일한 선으로 오해하게 하지 않는가.
- 표본 10개 기업과 6개 관계의 원문이 실제 주장 범위를 직접 지지하는가.

### 모두의 창업 기획서

`startup-application/MODOO_2_VIRTUAL_FAB_FINAL_2026-08-23.qmd`의 다음 주장을 실제 코드·공개 화면과 대조한다.

- 6개 공정 흐름
- PHOTO 2,969행
- 7항목 서버 비공개 채점
- AI 8–15회와 사람 검증
- 서버 Holdout
- 5개 역량 증거
- 73개 기업·4단 공급망·공개관계 26개
- API 시험 27개
- 공개 MVP 정상

고객수요·학습효과·지불의향은 아직 가설로 표현돼야 한다. 렛유인 접점이나 특강 피드백을 도입계약·제품효과로 오해시키는 문장이 있으면 P1로 표시한다.

가격·3개년 매출은 “확정 전망”이 아니라 산식이 공개된 검증가설이어야 한다. 계산 오류를 독립 재계산하라.

---

## 9. T5 — 자동시험과 알려진 테스트 부채

의존성을 새로 설치하거나 업데이트하지 말고 현재 lockfile 환경에서 실행한다.

```bash
cd /home/waterfirst/.cokacdir/workspace/syctizfu/semiconductor-ai-hackathon-bootcamp/virtual-fab-app

# API
python3 -m pytest -q

# 프런트
npm test
npm run build

# 전체 브라우저 회귀
npm run test:e2e
```

`python3 -m pytest`가 환경 차이로 실패하면 사용 가능한 프로젝트 venv를 찾되 새 패키지를 설치하지 마라.

2026-08-23 직전 관찰값:

- API: `27 passed`
- build: 통과
- bundle: main 약 1.20MB minified / 약 334KB gzip
- 전체 E2E: `13 passed, 3 skipped, 2 failed`
- 실패 2건은 local base URL `http://127.0.0.1:8510/industry-map/`에서 standalone map heading을 찾지 못한 경로 동기화 문제
- 실제 공개 `https://waterfirst.pro/industry-map/`는 HTTP 200

이를 곧바로 “테스트만의 문제”라고 인정하지 마라. 다음 중 무엇인지 판정하라.

1. 테스트 서버가 오래된 dist를 제공한 환경 문제
2. local standalone route를 재현하지 못하는 배포계약 결함
3. 테스트가 공개 Nginx 전용 경로를 잘못 가정한 테스트 설계 결함
4. 실제 기능 결함

정확한 원인과 최소 수정 위치만 보고하고 이번 감사에서 수정하지 않는다.

`npm test`가 “No test files found, code 0”이면 통과 숫자로 부풀리지 말고 **프런트 단위시험 부재**로 P1 또는 P2 판정하라.

---

## 10. 심각도 기준

### P0 · 즉시 NO_GO

- 무의미 입력·위조 payload로 고득점 또는 완료
- 정답키·API 키·개인정보·로컬경로 노출
- seed 중 일부에 진단 가능한 정답이 없음
- 서버 Holdout을 학생이 조작 가능
- 핵심 PHOTO 흐름을 데스크톱 또는 모바일에서 완주 불가
- rewind·중복요청으로 점수·비용·이력 무결성 파괴

### P1 · 파일럿 전 수정

- 핵심 주장은 작동하지만 UI·문서·채점 의미가 불일치
- AI 문답이 횟수만 채워도 높은 증거점수를 얻음
- 무키 흐름 또는 결과 읽기·복사가 막힘
- 로컬/공개 배포계약과 E2E가 불일치
- 70분 파일럿에서 중대한 이탈을 유발할 정보량·동선
- 기획서의 구현·검증 수치가 코드와 다름

### P2 · 파일럿 후 개선 가능

- 초기 번들·3D 성능
- 미세한 시각 위계·카피
- 공정 6개의 콘텐츠 깊이 차이
- 산업지도 추가 기업·관계
- 운영자 대시보드·저작도구 미구현

---

## 11. 중단 조건

다음이면 임의 우회하지 말고 즉시 보고서에 `BLOCKED`로 기록한다.

1. 검수 HEAD가 요청 기준과 다르고 변경 이유를 확인할 수 없음
2. 공개 서비스와 로컬 소스가 명백히 다른 버전인데 배포 커밋을 식별할 수 없음
3. 테스트가 개인 API 키·비공개 회사자료·유료 호출을 요구함
4. 기존 작업트리를 수정하지 않고는 재현할 수 없음
5. 정답 규칙이 `INTEGRATION_SPEC.md`, fixture, 서버 코드 사이에서 충돌해 어느 것이 정본인지 판단 불가

중단해도 확인 가능한 범위의 판정과 다음 증거요청을 작성한다.

---

## 12. 보고서 형식

`REPORT_CLAUDE_VFAB_AUDIT_2026-08-23.md`에 아래 순서로 작성한다.

### A. 한 줄 판정

`GO_PILOT | CONDITIONAL_GO | NO_GO`와 이유 3개 이내.

### B. 검수 환경

- HEAD
- 공개 서비스 응답
- 실행한 명령
- 테스트 결과
- 로컬/공개 버전 일치 여부

### C. P0-A/B/C 재판정

각 항목을 `PASS / FAIL / BLOCKED`로 표시하고 추측이 아닌 재현 증거를 붙인다.

### D. 공격 시나리오 결과

공격 입력, 기대, 실제, HTTP 상태, 영향. 재현 가능한 최소 단계만 쓴다.

### E. AI 대화·최종 PT evidence chain

한 세션을 따라 데이터 → 질문 → AI 답 → 사람 검토 → 실험 → Holdout → 최종 PT가 연결되는지 요약한다.

### F. UX·교육 판정

데스크톱, 모바일, 70분 파일럿, 무키 완주를 분리한다.

### G. 산업지도·사업주장 판정

표본 원문 검수와 기획서 주장 대조 결과.

### H. 결함 목록

각 결함에 아래 필드를 사용한다.

- ID: `P0-01`, `P1-01`, `P2-01`
- 위치: 파일·함수·라인 또는 URL·화면
- 재현
- 실제 결과
- 기대 결과
- 영향
- 최소 수정 제안
- 회귀시험 제안

### I. 건드리지 말 것

이미 통과한 항목을 명시해 다음 구현자가 잘된 기능을 재작성하지 않도록 한다.

### J. 파일럿 전 체크리스트

최대 10개. 담당·완료증거·중단기준을 포함한다.

---

## 13. 검수 원칙

1. 화면이 예쁜지보다 **데이터에 답이 있고 채점이 그 답을 검증하는지** 먼저 본다.
2. 테스트 코드가 통과한다고 구현이 옳다고 가정하지 않는다.
3. 기획서 문장을 보고 코드를 맞춰 해석하지 말고 코드·실행결과로 문장을 검증한다.
4. 상관·분류·공식관계·추론을 구분한다.
5. 학생의 행동로그 점수를 학습효과로 바꾸어 말하지 않는다.
6. 발견한 문제를 이번 감사에서 고치지 않는다.
7. 확신할 수 없는 부분은 `BLOCKED`와 필요한 증거를 적는다.
8. 장황한 총평보다 재현 가능한 실패와 최소 변경을 우선한다.

