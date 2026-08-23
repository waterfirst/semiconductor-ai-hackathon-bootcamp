# 반도체 × 디스플레이 기업 관계 강도 방법론

기준일: 2026-08-23
적용 화면: <https://waterfirst.pro/virtual-fab/#industry-map>

## 목적

3D 지식맵의 기업 간 연결선을 단순한 장식이 아니라 검증 가능한 산업관계로 표현한다. 선 굵기는 실제 거래금액을 임의 추정한 값이 아니라, 공개된 지분·공급집중도·계약규모·계약기간·공동개발의 중요도를 1–5로 정규화한 서열척도다.

## 등급

- **5 — 구조적 의존:** 지배지분, 단일공급·단일고객, 90% 이상 생산집중, 또는 10억 달러 이상 공개 다년계약.
- **4 — 핵심 장기 관계:** 핵심 제품의 주력 위탁생산, 장기 재료·기술계약, 차세대 핵심제품 공동개발.
- **3 — 확인된 상업·기술 관계:** 공급·foundry 관계는 확인되지만 품목별 비중이 비공개이거나, 최신 공정의 인증 EDA/IP 협력.
- **2 — 제한적 제품 관계:** 단일 세대·한정 제품 적용만 확인된 경우.
- **1 — 교육용 인접성:** 가치사슬상 관련되지만 양사 간 거래를 확인하지 못한 경우. 기업 간 공식 관계선으로 그리지 않고 은하 중심 방사선으로만 표시한다.

금액이 공개돼도 전체 매출·구매액과 직접 비교할 수 없으면 굵기를 선형 금액 비례로 계산하지 않는다. MOU의 계획 금액은 실현 매출과 구분한다.

## 반영한 공식 관계

1. ASML–ZEISS SMT: 광학 칼럼 단일 공급·단일 고객, ASML 지분 24.9% — 강도 5.
2. Samsung Electronics–Samsung Display: 의결권 지분 84.8% — 강도 5.
3. Samsung Electronics–Broadcom: 2030년까지 5년간 2,000억 달러 이상 협력 계획 — 강도 5.
4. TSMC–Broadcom: FY2025 위탁생산 웨이퍼 약 95% — 강도 5.
5. NVIDIA–Amkor: 15억 달러 다년 첨단패키징·테스트 계약 — 강도 5.
6. SK hynix–TSMC: HBM4 base die·CoWoS 공동최적화 — 강도 4.
7. NVIDIA–TSMC: wafer foundry 및 CoWoS 사용 — 강도 4.
8. AMD–TSMC: HPC·FPGA·adaptive SoC wafer 생산 — 강도 4.
9. NVIDIA–SK hynix: 메모리 구매처 공시와 AI 제품 적용 — 강도 4.
10. NVIDIA–Micron: 메모리 구매처 공시와 H200 HBM3E 적용 — 강도 4.
11. Samsung Display–Universal Display: 2027년 말까지 OLED 재료·라이선스 장기계약 — 강도 4.
12. LG Display–Universal Display: 20년 이상 관계의 장기계약 연장 — 강도 4.
13. NVIDIA–Samsung Electronics: foundry와 memory 공급처로 공시, 품목별 비중 비공개 — 강도 3.
14. TSMC–Synopsys: A16·N2P 인증 EDA/IP 및 3DIC 협력 — 강도 3.
15. TSMC–Cadence: A16·N2P·3DFabric 인증 설계협력 — 강도 3.

## 시각 규칙

- 선 굵기: 관계 강도 1–5.
- 실선: 지분·공급·위탁생산.
- 점선: 공동개발·공정인증.
- 색상: 금색 지분, 분홍 공급, 청록 위탁생산, 주황 공동개발, 보라 공정인증.
- 선택한 기업과 직접 연결된 선만 최대 밝기로 강조한다.

## 한계와 갱신

- 공급계약 금액, 고객별 매출, 장비 대수는 대부분 영업비밀이므로 추정하지 않는다.
- 기업 공시가 “계획”이라고 표현한 금액은 확정 매출이 아니다.
- 동일 등급 안의 관계가 동일 금액이라는 뜻은 아니다.
- 신규 10-K·사업보고서·IR 발표가 나오면 `asOf`, 근거, 등급을 재검토한다.
- 언론 보도만 있고 당사자 공식 확인이 없는 관계는 공식 관계선에 추가하지 않는다.

## 주요 1차 자료

- NVIDIA FY2026 Form 10-K: <https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm>
- AMD FY2025 Form 10-K: <https://www.sec.gov/Archives/edgar/data/2488/000000248826000018/amd-20251227.htm>
- Broadcom FY2025 Form 10-K: <https://www.sec.gov/Archives/edgar/data/1730168/000119312526085733/d46845dars.pdf>
- ASML 2024 Annual Report: <https://ourbrand.asml.com/m/1d935e9653a216d7/original/2024-Annual-Report-based-on-IFRS.pdf>
- Samsung Electronics 연결재무제표: <https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2025_SEC_Consolidated_Financial_statements.pdf>
- Samsung–Broadcom 공식 발표: <https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%C2%B7%EB%B8%8C%EB%A1%9C%EB%93%9C%EC%BB%B4-2000%EC%96%B5-%EB%8B%AC%EB%9F%AC-%EA%B7%9C%EB%AA%A8-%EC%A0%84%EB%9E%B5%EC%A0%81-%ED%98%91%EB%A0%A5>
- NVIDIA–Amkor 공식 발표: <https://ir.amkor.com/news-releases/news-release-details/amkor-technology-announces-strategic-partnership-nvidia-expand>
- Samsung Display–UDC 계약: <https://ir.oled.com/newsroom/press-releases/press-release-details/2022/Samsung-Display-and-Universal-Display-Corporation-Enter-into-Long-Term-OLED-Agreements/>
- LG Display–UDC 계약: <https://ir.oled.com/newsroom/press-releases/press-release-details/2026/LG-Display-and-Universal-Display-Corporation-Strengthen-Two-Decade-OLED-Partnership-with-Extended-Long-Term-Agreements/default.aspx>
