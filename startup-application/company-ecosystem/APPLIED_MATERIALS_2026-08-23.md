# Applied Materials 심층분석

기준일: 2026-08-23
용도: FAB-JUDGMENT Industry Twin 기업·공정 교육자료
투자자문 아님

## 1. 회사명 확인

사용자가 말한 ‘Advanced Materials’는 문맥상 **Applied Materials(어플라이드 머티어리얼즈, AMAT)**로 해석했다. 다른 회사를 뜻했다면 별도 분석한다.

## 2. 한 문장 정의

Applied Materials는 웨이퍼 위에 재료를 **만들고(Create), 깎고(Shape), 바꾸고(Modify), 측정하는(Analyze)** 장비를 폭넓게 공급하며, 개별 공정을 넘어 transistor·interconnect·memory·advanced packaging 구조를 공동최적화하는 종합 재료공학 장비기업이다.

## 3. 생태계 위치

Applied는 노광 패턴을 만드는 ASML과 역할이 다르다. ASML이 패턴의 ‘청사진을 빛으로 전사’한다면 Applied는 그 패턴을 실제 박막·금속·절연막·구조로 구현하고 수정·평탄화·검사한다.

공식 제품군:

- Create: ALD, dielectric deposition, epitaxy, metal deposition, plating, selective deposition
- Shape: CMP, etch, pattern shaping, photomask, selective etch
- Modify: ion implant, thermal processing and treatments
- Analyze: defect control, patterning control
- Extend: advanced packaging, factory software, service and spares

한 회사가 여러 연속 공정을 보유하면, 각 chamber를 따로 개선하는 것뿐 아니라 전후 공정의 interface와 recipe를 공동최적화할 수 있다. 이것이 Applied가 강조하는 materials engineering의 핵심이다.

## 4. 공정별 고객가치

### Deposition

원하는 조성·두께·conformality의 박막을 형성한다. GAA, 3D NAND, DRAM capacitor, barrier/liner와 interconnect에서 구조가 3차원화될수록 원자층 수준의 균일도와 계면 제어가 중요해진다.

KPI: thickness, within-wafer uniformity, conformality, composition, resistivity, defectivity, particles, throughput.

### Etch와 selective removal

마스크 패턴을 하부막으로 전사하거나 특정 물질만 선택적으로 제거한다. 높은 aspect ratio와 새로운 재료 조합에서는 profile, selectivity, sidewall damage가 핵심이다.

KPI: etch rate, selectivity, CD bias, profile, bowing, loading, residue, plasma damage.

### CMP

증착·식각으로 생긴 표면 높이차를 평탄화한다. advanced packaging과 hybrid bonding에서는 wafer 전체의 total thickness variation과 표면 결함이 접합수율을 좌우한다.

KPI: removal rate, non-uniformity, dishing, erosion, scratches, particles, TTV.

### Ion implant와 thermal treatment

불순물의 종류·농도·깊이를 제어하고, 열처리로 활성화·결함복구·재료 특성을 조정한다.

KPI: dose, energy, angle, junction depth, activation, sheet resistance, contamination.

### Process control

광학·전자빔 기반 검사와 계측으로 결함과 패턴 편차를 찾는다. 장비 포트폴리오 내부 데이터를 연결하면 원인후보를 공정단계별로 좁힐 수 있다.

## 5. 최근 기술방향

Applied는 2026년에 DRAM과 advanced packaging용 신규 시스템을 발표했다.

- Centura Prime Epi: source/drain 부위에 doped SiGe·SiP를 선택 성장해 strain과 doping을 제어
- Opta Quad CMP: polishing 중 wafer 상태를 감시하고 실시간 조정해 advanced packaging의 균일도·TTV를 제어
- Nokota VMax 2 ECD: TSV fill과 microbump 등 차세대 packaging용 정밀 구리 도금

이 사례는 AI 반도체 수요가 단순히 더 많은 transistor만 요구하는 것이 아니라 DRAM/HBM, 3D stacking, hybrid bonding, copper interconnect와 같은 재료·패키징 난제를 확대한다는 점을 보여준다.

## 6. 사업모델

### Semiconductor Systems

신규 장비와 공정 chamber를 판매한다. 고객의 신규 Fab 건설, 기술 node 전환, HBM·advanced packaging 투자에 민감하다.

### Applied Global Services

설치장비의 parts, service, upgrade, subscription, factory automation software를 제공한다. 설치기반과 wafer starts가 늘면 반복매출 기반이 커질 수 있다.

서비스는 단순 수리만이 아니다. ramp 기간 단축, 장비성능 유지, fab output과 운영비 최적화가 고객가치다.

## 7. 최신 실적

### FY2026 3분기 공식 실적

- 총매출: $9.115 billion, 전년동기 대비 25% 증가
- GAAP 매출총이익률: 50.3%
- GAAP 영업이익률: 33.7%
- Semiconductor Systems 매출: $7.040 billion
- Applied Global Services 매출: $1.781 billion
- Q4 FY2026 회사 매출전망: $10.250 billion ± $0.500 billion

총매출 대비 Semiconductor Systems는 약 77.2%, AGS는 약 19.5%다. 이는 공식 수치로 계산한 값이며 나머지는 기타 부문이다.

Semiconductor Systems의 Q3 고객시장 구성:

- Foundry, logic and other: 67%
- DRAM: 26%
- Flash: 7%

회사는 Q3 강세의 배경으로 DRAM, leading-edge foundry/logic, advanced packaging 수요를 제시했다. 회사 설명은 전망이며 외부 독립 검증과 구분해야 한다.

## 8. 경쟁과 차별화

Applied의 가장 큰 강점은 한 공정의 완전독점보다 **포트폴리오 폭과 공정간 공동최적화**다.

비교 검토군:

- Lam Research: etch·deposition·clean 중심
- Tokyo Electron: coat/develop·etch·deposition·clean·thermal
- ASM International: ALD·epitaxy
- KLA·Onto Innovation: inspection·metrology·process control
- Axcelis: ion implantation

위 회사들은 제품영역이 부분 중첩하지만 모든 시장에서 동일한 방식으로 경쟁하는 것은 아니다. 장비 선정은 device architecture, installed base, recipe maturity, local service, chamber matching, cost of ownership에 따라 달라진다.

Applied의 방어력은 다음에서 나온다.

- 여러 재료공정을 하나의 device roadmap으로 공동개발
- 고객 Fab에 설치된 chamber와 장기간 축적된 recipe·service 경험
- 장비·공정·계측 데이터를 연결하는 co-optimization
- 신규재료와 3D 구조 전환 때 늘어나는 공정복잡도
- EPIC Center 등 고객·대학과의 공동 R&D 기반

## 9. 핵심 위험

### 고객집중

2025 Form 10-K상 두 고객이 각각 총매출의 약 19%, 15%를 차지했다. 고객명은 해당 표에서 공개되지 않았으므로 임의로 특정하지 않는다.

### 중국·수출통제

2025년 중국 매출은 총매출의 30%였다. 미국 수출규정 변화는 판매가능 장비·서비스와 중국 현지 경쟁사의 성장속도에 동시에 영향을 줄 수 있다. FY2026 Q3에는 과거 수출통제 사안 합의와 관련된 $253 million 비용도 공식 자료에 나타난다.

### 반도체 설비투자 사이클

Fab 건설 지연, memory 공급과잉, 고객의 technology transition 지연은 신규장비 매출을 흔든다. 서비스 매출이 완충하더라도 장비 사이클을 제거하지는 못한다.

### 포트폴리오 복잡성

폭넓은 제품군은 장점이지만 모든 세부시장에서 최강이라는 뜻은 아니다. 특정 공정에서 전문기업이 더 나은 성능·원가·recipe를 제공할 수 있다.

### 공급망과 현장 실행

장비는 고객 사양에 맞춰 조립·설치·인증되며 공급부품과 현장준비가 늦어지면 매출인식과 ramp가 지연될 수 있다.

## 10. 학생이 알아야 할 현업 용어

- PVD, CVD, ALD, Epitaxy, Selective deposition
- Dry etch, selective etch, plasma damage, selectivity
- CMP, removal rate, dishing, erosion, TTV
- Ion implant, dose, energy, activation anneal
- Barrier, liner, contact resistance, interconnect
- GAA, 3D NAND, DRAM capacitor, HBM
- TSV, microbump, hybrid bonding, ECD plating
- Chamber matching, recipe, uptime, cost of ownership

## 11. 관련 직무

- Process engineer: deposition·etch·CMP·implant·thermal recipe
- Equipment engineer: chamber hardware·vacuum·RF·gas delivery·robotics
- Application engineer: 고객 device 문제와 장비조건 연결
- Materials scientist: film·interface·plasma·chemical 반응
- Process control/data engineer: defect·metrology·FDC·SPC 분석
- Field service engineer: 설치·qualification·troubleshooting
- Supplier quality engineer: 핵심부품 품질·변경관리
- Advanced packaging engineer: plating·CMP·bonding·TTV

## 12. 가상팹 연결 시나리오

### 시나리오 A · CVD 두께 불균일

현상: 평균 두께는 규격 안이지만 wafer edge에서 film이 얇고 특정 chamber에서 악화된다.

경쟁 가설: gas distribution, temperature zone, chamber seasoning, precursor delivery, metrology bias.

필요 데이터: chamber·lot·wafer·radius bin, precursor lot, clean count, temperature, pressure, RF, pre/post maintenance.

### 시나리오 B · Etch CD bias

현상: photo CD는 정상인데 post-etch CD만 작아진다.

판단: ASML/photo 원인으로 성급히 돌리지 않고 etch rate·selectivity·plasma·loading·chamber history를 분리한다.

### 시나리오 C · CMP와 hybrid bonding

현상: wafer 평균 제거율은 정상이나 TTV와 edge dishing 때문에 bonding void가 증가한다.

판단: 평균값이 아니라 공간분포·pad age·slurry lot·pressure zone·incoming topography를 연결한다.

### 시나리오 D · 장비업체 선택

상황: 동일한 목표공정에 두 장비 후보가 있고 한쪽은 성능, 다른 쪽은 throughput·service·운영비가 유리하다.

학생은 최고 스펙을 고르는 대신 process window, qualification cost, installed base, spare parts, ramp risk를 점수화한다.

## 13. ASML과의 관계

두 회사는 전체적으로 대체재라기보다 상호보완적이다.

- ASML: 빛과 계산으로 패턴을 전사·제어
- Applied: 재료를 증착·제거·변형·평탄화·분석해 구조를 구현

가상팹에서는 pre-etch CD와 post-etch CD, 노광 overlay와 후공정 profile을 함께 보여줘야 어느 회사·공정영역의 문제인지 구분할 수 있다.

## 14. Industry Twin 등록안

- SCM role: `deposition_equipment`, `etch_equipment`, `cmp_equipment`, `implant_thermal`, `process_control`, `advanced_packaging`, `fab_services`
- Related processes: `CVD`, `ALD`, `ETCH`, `CMP`, `IMPLANT`, `DIFFUSION`, `METROLOGY`, `PACKAGING`
- Customer type: `foundry`, `logic_idm`, `memory_idm`, `osat`
- Key evidence: 공식 제품 페이지, FY2026 Q3 실적, 2025 Form 10-K

## 공식 출처

- [Applied Materials 반도체 제품 포트폴리오](https://www.appliedmaterials.com/us/en/semiconductor/products.html)
- [Applied Materials FY2026 Q3 실적](https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-third-quarter-2026-results)
- [Applied Materials 2026년 DRAM·패키징 신제품](https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-introduces-new-systems-accelerate-dram-and)
- [Applied Materials 2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/6951/000162828025056742/amat-20251026.htm)
