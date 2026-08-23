export type CompanyCategory = 'design' | 'fabless' | 'manufacturing' | 'equipment' | 'materials' | 'packaging'

export type IndustrySource = { label: string; url: string }
export type ValueLayerId = 'foundations' | 'equipment' | 'memory' | 'integration' | 'demand'
export type IndustryDomain = 'semiconductor' | 'shared' | 'display'
export type RelationStrength = 1 | 2 | 3 | 4 | 5
export type RelationKind = 'ownership' | 'supply' | 'manufacturing' | 'collaboration' | 'certification'

export type IndustryRelation = {
  from: string
  to: string
  label: string
  source: string
  strength: RelationStrength
  kind: RelationKind
  evidence: string
  disclosedScale?: string
  asOf: string
}

export type IndustryCompany = {
  id: string
  name: string
  country: string
  category: CompanyCategory
  hub: string
  role: string
  summary: string
  products: string[]
  processes: string[]
  jobs: string[]
  risks: string[]
  status: 'deep' | 'profile'
  metrics?: Array<{ label: string; value: string; note: string }>
  sections?: Array<{ title: string; body: string }>
  sources: IndustrySource[]
  reportUrl?: string
}

export const CATEGORY_LABELS: Record<CompanyCategory, string> = {
  design: 'EDA · IP',
  fabless: '칩 설계',
  manufacturing: 'Fab · Memory',
  equipment: '공정 장비',
  materials: '소재 · 핵심부품',
  packaging: '패키징 · 테스트',
}

export const CATEGORY_COLORS: Record<CompanyCategory, string> = {
  design: '#6d62c5',
  fabless: '#2f78b7',
  manufacturing: '#087b79',
  equipment: '#d47b13',
  materials: '#879523',
  packaging: '#b55270',
}

export const DOMAIN_LABELS: Record<IndustryDomain, string> = {
  semiconductor: '반도체 은하',
  shared: '공통 기술 브리지',
  display: '디스플레이 은하',
}

export const DOMAIN_COLORS: Record<IndustryDomain, string> = {
  semiconductor: '#29c5d6',
  shared: '#ffc857',
  display: '#d86cff',
}

export const RELATION_KIND_LABELS: Record<RelationKind, string> = {
  ownership: '지분·계열',
  supply: '공급·구매',
  manufacturing: '위탁생산·패키징',
  collaboration: '공동개발·전략협력',
  certification: '공정인증·설계생태계',
}

export const RELATION_COLORS: Record<RelationKind, string> = {
  ownership: '#ffc857',
  supply: '#ff4f8b',
  manufacturing: '#30d4e5',
  collaboration: '#ff9f43',
  certification: '#b98cff',
}

const DISPLAY_COMPANY_IDS = new Set([
  'samsung-display', 'lg-display', 'boe', 'tcl-csot', 'canon-tokki', 'corning', 'universal-display',
])
const SHARED_COMPANY_IDS = new Set(['applied-materials', 'screen', 'ulvac'])

export function getCompanyDomain(companyId: string): IndustryDomain {
  if (SHARED_COMPANY_IDS.has(companyId)) return 'shared'
  if (DISPLAY_COMPANY_IDS.has(companyId)) return 'display'
  return 'semiconductor'
}

export const PROCESS_HUBS = [
  { id: 'design', label: 'EDA · IP', position: [-8, 0.7, 3.8] as [number, number, number] },
  { id: 'compute', label: 'CHIP DESIGN', position: [-5.6, 0.7, 0] as [number, number, number] },
  { id: 'fab', label: 'WAFER FAB', position: [0, 0.7, 0] as [number, number, number] },
  { id: 'lithography', label: 'PATTERNING', position: [3.7, 0.7, 4.4] as [number, number, number] },
  { id: 'materialsEngineering', label: 'MATERIALS ENGINEERING', position: [5.8, 0.7, 0.6] as [number, number, number] },
  { id: 'materials', label: 'MATERIALS', position: [3.9, 0.7, -4.3] as [number, number, number] },
  { id: 'packaging', label: 'PACKAGING', position: [-0.4, 0.7, -5.2] as [number, number, number] },
  { id: 'test', label: 'TEST', position: [-4.8, 0.7, -4.2] as [number, number, number] },
] as const

export const HUB_FLOWS = [
  ['design', 'compute'], ['compute', 'fab'], ['fab', 'lithography'], ['fab', 'materialsEngineering'],
  ['materials', 'fab'], ['fab', 'packaging'], ['packaging', 'test'],
] as const

export const VALUE_LAYERS: Array<{ id: ValueLayerId; label: string; kicker: string; z: number }> = [
  { id: 'foundations', label: '설계·소재 기반', kicker: 'EDA · WAFER · CHEMICAL · GAS · OPTICS', z: -5.2 },
  { id: 'equipment', label: '웨이퍼 공정 장비', kicker: 'PATTERN · DEPOSITION · ETCH · CLEAN · METROLOGY', z: -2.6 },
  { id: 'memory', label: 'MEMORY / IDM CORE', kicker: 'SAMSUNG · SK HYNIX · MICRON', z: 0 },
  { id: 'integration', label: '로직 결합·패키징·테스트', kicker: 'FOUNDRY · 2.5D/3D · OSAT · ATE', z: 2.6 },
  { id: 'demand', label: 'AI 가속기·시스템 수요', kicker: 'GPU · XPU · NETWORK · DATA CENTER', z: 5.2 },
]

const COMPANY_LAYERS: Record<ValueLayerId, string[]> = {
  foundations: ['synopsys', 'cadence', 'arm', 'zeiss', 'shinetsu', 'sumco', 'jsr', 'tok', 'entegris', 'air-liquide'],
  equipment: ['asml', 'applied-materials', 'lam', 'tel', 'kla', 'asm', 'screen', 'kokusai', 'axcelis'],
  memory: ['samsung', 'sk-hynix', 'micron'],
  integration: ['tsmc', 'ase', 'amkor', 'advantest', 'teradyne'],
  demand: ['nvidia', 'amd', 'broadcom'],
}

export function getCompanyLayer(companyId: string): ValueLayerId {
  return (Object.entries(COMPANY_LAYERS).find(([, ids]) => ids.includes(companyId))?.[0] as ValueLayerId | undefined) ?? 'foundations'
}

export const VERIFIED_RELATIONS: IndustryRelation[] = [
  {
    from: 'asml', to: 'zeiss', kind: 'ownership', strength: 5,
    label: '노광 광학 단일 공급 생태계',
    evidence: 'ASML은 ZEISS SMT를 광학 칼럼 단일 공급처이자 ASML을 ZEISS의 단일 고객으로 공시했다.',
    disclosedScale: 'ZEISS SMT 지분 24.9%', asOf: '2024-12-31',
    source: 'https://ourbrand.asml.com/m/1d935e9653a216d7/original/2024-Annual-Report-based-on-IFRS.pdf',
  },
  {
    from: 'samsung', to: 'samsung-display', kind: 'ownership', strength: 5,
    label: '삼성전자 연결 자회사',
    evidence: '삼성전자 연결재무제표가 Samsung Display의 의결권 지분을 84.8%로 공시했다.',
    disclosedScale: '의결권 지분 84.8%', asOf: '2024-12-31',
    source: 'https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2025_SEC_Consolidated_Financial_statements.pdf',
  },
  {
    from: 'samsung', to: 'broadcom', kind: 'collaboration', strength: 5,
    label: '메모리·파운드리·패키징 전략협력',
    evidence: '양사는 차세대 AI 인프라용 메모리·2nm 이하 파운드리·첨단패키징 협력을 공식 발표했다.',
    disclosedScale: '2030년까지 5년간 $200B+', asOf: '2026-07-25',
    source: 'https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%C2%B7%EB%B8%8C%EB%A1%9C%EB%93%9C%EC%BB%B4-2000%EC%96%B5-%EB%8B%AC%EB%9F%AC-%EA%B7%9C%EB%AA%A8-%EC%A0%84%EB%9E%B5%EC%A0%81-%ED%98%91%EB%A0%A5',
  },
  {
    from: 'tsmc', to: 'broadcom', kind: 'manufacturing', strength: 5,
    label: '핵심 위탁생산 관계',
    evidence: 'Broadcom은 FY2025 위탁생산 웨이퍼의 약 95%가 TSMC에서 생산됐다고 공시했다.',
    disclosedScale: '위탁생산 웨이퍼 약 95%', asOf: '2025-11-02',
    source: 'https://www.sec.gov/Archives/edgar/data/1730168/000119312526085733/d46845dars.pdf',
  },
  {
    from: 'amkor', to: 'nvidia', kind: 'manufacturing', strength: 5,
    label: 'AI 첨단패키징·테스트 다년 계약',
    evidence: 'NVIDIA의 선급금으로 Amkor 미국 첨단패키징 생산능력을 확대하는 다년 개발·생산 계약이다.',
    disclosedScale: '$1.5B 다년 계약', asOf: '2026-07-23',
    source: 'https://ir.amkor.com/news-releases/news-release-details/amkor-technology-announces-strategic-partnership-nvidia-expand',
  },
  {
    from: 'sk-hynix', to: 'tsmc', kind: 'collaboration', strength: 4,
    label: 'HBM4 base die·CoWoS 공동최적화',
    evidence: 'HBM4 base die와 첨단패키징 호환성을 위한 전략적 공동개발을 양사가 공개했다.',
    asOf: '2024-04-19',
    source: 'https://news.skhynix.com/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/',
  },
  {
    from: 'tsmc', to: 'nvidia', kind: 'manufacturing', strength: 4,
    label: 'AI GPU wafer·CoWoS 생산',
    evidence: 'NVIDIA는 TSMC를 wafer foundry로 명시하고 CoWoS 패키징 기술을 사용한다고 공시했다.',
    asOf: '2026-01-25',
    source: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm',
  },
  {
    from: 'tsmc', to: 'amd', kind: 'manufacturing', strength: 4,
    label: 'HPC·FPGA wafer 생산',
    evidence: 'AMD는 HPC·FPGA·adaptive SoC 제품의 wafer 생산에 TSMC를 사용한다고 공시했다.',
    asOf: '2025-12-27',
    source: 'https://www.sec.gov/Archives/edgar/data/2488/000000248826000018/amd-20251227.htm',
  },
  {
    from: 'sk-hynix', to: 'nvidia', kind: 'supply', strength: 4,
    label: 'AI용 HBM 공급·시스템 적용',
    evidence: 'NVIDIA는 SK hynix를 메모리 구매처로 공시했고 SK hynix는 GB300 적용 제품을 공개했다.',
    asOf: '2026-01-25',
    source: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm',
  },
  {
    from: 'micron', to: 'nvidia', kind: 'supply', strength: 4,
    label: 'AI용 HBM 공급·H200 적용',
    evidence: 'NVIDIA는 Micron을 메모리 구매처로 공시했고 Micron은 HBM3E의 H200 적용을 공개했다.',
    asOf: '2026-01-25',
    source: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm',
  },
  {
    from: 'samsung-display', to: 'universal-display', kind: 'supply', strength: 4,
    label: 'PHOLED 재료·기술 장기계약',
    evidence: 'OLED 재료 공급과 기술 라이선스 계약이 2027년 말까지 유효하며 2년 연장 옵션이 있다.',
    disclosedScale: '2027년 말까지·2년 연장 옵션', asOf: '2022-12-05',
    source: 'https://ir.oled.com/newsroom/press-releases/press-release-details/2022/Samsung-Display-and-Universal-Display-Corporation-Enter-into-Long-Term-OLED-Agreements/',
  },
  {
    from: 'lg-display', to: 'universal-display', kind: 'supply', strength: 4,
    label: 'PHOLED 재료·기술 장기계약 연장',
    evidence: '20년 이상 이어진 OLED 재료 공급·기술 라이선스 계약을 2026년에 장기 연장했다.',
    disclosedScale: '20년+ 협력·계약기간 비공개', asOf: '2026-02-26',
    source: 'https://ir.oled.com/newsroom/press-releases/press-release-details/2026/LG-Display-and-Universal-Display-Corporation-Strengthen-Two-Decade-OLED-Partnership-with-Extended-Long-Term-Agreements/default.aspx',
  },
  {
    from: 'samsung', to: 'nvidia', kind: 'supply', strength: 3,
    label: 'wafer foundry·memory 공급처',
    evidence: 'NVIDIA는 Samsung을 wafer foundry와 메모리 구매처로 모두 명시했으나 품목별 비중은 공개하지 않았다.',
    asOf: '2026-01-25',
    source: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm',
  },
  {
    from: 'synopsys', to: 'tsmc', kind: 'certification', strength: 3,
    label: 'A16·N2P 인증 EDA/IP 협력',
    evidence: 'A16·N2P 디지털·아날로그 flow 인증과 A14·3Dblox·CoWoS 공동개발이 공개됐다.',
    asOf: '2025-04-23',
    source: 'https://investor.synopsys.com/news/news-details/2025/Synopsys-and-TSMC-Usher-In-Angstrom-Scale-Designs-with-Certified-EDA-Flows-on-Advanced-TSMC-A16-and-N2P-Processes/default.aspx',
  },
  {
    from: 'cadence', to: 'tsmc', kind: 'certification', strength: 3,
    label: 'A16·N2P·3DFabric 인증 설계협력',
    evidence: 'TSMC A16·N2P 인증 flow와 3DFabric 설계·IP 협력이 공식 발표됐다.',
    asOf: '2025-04-24',
    source: 'https://www.cadence.com/en_US/home/company/newsroom/press-releases/pr/2025/cadence-and-tsmc-advance-ai-and-3d-ic-chip-design-with-certified.html',
  },
]

const githubReport = (filename: string) => `https://github.com/waterfirst/semiconductor-ai-hackathon-bootcamp/blob/main/startup-application/company-ecosystem/${filename}`

export const INDUSTRY_COMPANIES: IndustryCompany[] = [
  {
    id: 'asml', name: 'ASML', country: 'Netherlands', category: 'equipment', hub: 'lithography', status: 'deep',
    role: 'EUV·DUV 노광과 패터닝 제어',
    summary: '설계된 회로 패턴을 웨이퍼에 전사하고, 계측·전자빔·계산 리소그래피로 패터닝 오차를 닫힌 고리로 제어한다.',
    products: ['EUV NXE·High-NA EXE', 'DUV immersion·dry', 'YieldStar·HMI e-beam', 'Computational lithography'],
    processes: ['PHOTO', 'OVERLAY', 'CD METROLOGY', 'PATTERN CONTROL'],
    jobs: ['광학·메카트로닉스', '광원·진공', '계산 리소그래피', '필드서비스·Application'],
    risks: ['소수 선단 고객 집중', '수출통제와 중국 매출', 'ZEISS 등 정밀 공급망', 'High-NA 공정생태계 검증'],
    metrics: [
      { label: '2026 Q2 매출', value: '€9.326B', note: 'ASML 공식 실적' },
      { label: '설치기반 매출', value: '29.6%', note: '€2.762B ÷ €9.326B 계산' },
      { label: 'Q2 총이익률', value: '54.0%', note: 'ASML 공식 실적' },
    ],
    sections: [
      { title: '왜 중요한가', body: 'EUV는 가장 복잡한 선단 Logic·Memory 레이어를, DUV는 선단 비핵심 레이어와 성숙공정을 담당한다. 고객은 최소 선폭 하나가 아니라 overlay, focus·dose, throughput, availability, defectivity와 정상 wafer당 비용을 함께 산다.' },
      { title: '기술의 본체', body: '13.5 nm EUV는 공기에도 흡수되므로 고진공과 다층 반사거울을 사용한다. High-NA EXE는 NA 0.55로 해상도를 높이며, scanner·광학계·광원·스테이지·계측·계산모델을 하나의 시스템으로 통합한다.' },
      { title: '공급망과 해자', body: 'ZEISS 광학계와 Cymer 광원 기술, 장기간의 고객 공정인증, 누적 설치기반의 서비스·업그레이드 데이터가 결합된다. 해자는 단일 부품보다 전문 공급망을 원자 단위 정밀도로 통합하는 능력에 가깝다.' },
      { title: '가상팹 연결', body: 'pre-etch와 post-etch CD, field 좌표, focus·dose map, scanner·reticle·track ID를 함께 보여주면 scanner 편차와 resist·develop·etch bias를 경쟁 가설로 분리할 수 있다.' },
    ],
    sources: [
      { label: 'ASML 제품 포트폴리오', url: 'https://www.asml.com/en/products' },
      { label: 'ASML 2026 Q2 실적', url: 'https://www.asml.com/en/news/press-releases/2026/q2-2026-financial-results' },
      { label: 'ASML 2025 Form 20-F', url: 'https://www.sec.gov/Archives/edgar/data/937966/000162828026011378/asml-20251231.htm' },
    ],
    reportUrl: githubReport('ASML_2026-08-23.md'),
  },
  {
    id: 'applied-materials', name: 'Applied Materials', country: 'United States', category: 'equipment', hub: 'materialsEngineering', status: 'deep',
    role: '반도체·디스플레이 증착·패터닝 장비',
    summary: '반도체에서는 transistor·interconnect·memory·advanced packaging 공정을, 디스플레이에서는 TFT array와 OLED 증착·봉지를 지원하는 두 산업의 공통 장비기업.',
    products: ['반도체 CVD·PVD·Etch·CMP', 'OLED Deposition·Encapsulation', 'Display CVD·PVD·eBeam review', 'Advanced packaging'],
    processes: ['SEMICONDUCTOR DEPOSITION', 'OLED DEPOSITION', 'ETCH', 'CMP', 'DISPLAY ARRAY'],
    jobs: ['공정·장비', '재료·Plasma', 'Application', '필드서비스·Supplier quality'],
    risks: ['설비투자 사이클', '고객·지역 집중', '미국 수출통제', '세부공정 전문기업 경쟁'],
    metrics: [
      { label: 'FY26 Q3 매출', value: '$9.115B', note: 'Applied 공식 실적' },
      { label: '반도체 장비', value: '77.2%', note: '$7.040B ÷ $9.115B 계산' },
      { label: '서비스', value: '19.5%', note: '$1.781B ÷ $9.115B 계산' },
    ],
    sections: [
      { title: '왜 중요한가', body: 'ASML이 패턴을 빛으로 전사한다면 Applied는 그 패턴을 박막·금속·절연막·3차원 구조로 구현한다. GAA, HBM, 3D NAND와 hybrid bonding은 재료계면과 형상 제어의 난도를 높인다.' },
      { title: '기술의 본체', body: 'Create·Shape·Modify·Analyze 포트폴리오를 전후 공정 데이터로 연결한다. 개별 chamber 성능뿐 아니라 film–etch–CMP–inspection 사이의 interface와 공정창을 공동최적화하는 것이 핵심이다.' },
      { title: '사업구조', body: 'Semiconductor Systems는 신규 Fab와 기술전환에 민감하고, Applied Global Services는 parts·upgrade·subscription·factory software로 설치기반의 가동률과 생산성을 관리한다.' },
      { title: '가상팹 연결', body: 'CVD edge 박막 저하, post-etch CD bias, CMP TTV와 bonding void를 각각 chamber·lot·radius bin·maintenance·재료 lot 데이터로 분해해 평균값 함정을 피하는 시나리오로 연결한다.' },
    ],
    sources: [
      { label: 'Applied 반도체 제품', url: 'https://www.appliedmaterials.com/us/en/semiconductor/products.html' },
      { label: 'Applied 디스플레이 제품', url: 'https://www.appliedmaterials.com/us/en/display.html' },
      { label: 'Applied FY2026 Q3 실적', url: 'https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-third-quarter-2026-results' },
      { label: 'Applied 2025 Form 10-K', url: 'https://www.sec.gov/Archives/edgar/data/6951/000162828025056742/amat-20251026.htm' },
    ],
    reportUrl: githubReport('APPLIED_MATERIALS_2026-08-23.md'),
  },
  { id: 'lam', name: 'Lam Research', country: 'United States', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '식각·증착·세정', summary: '고종횡비 구조와 3D memory를 포함한 plasma etch·deposition·clean 공정 후보군.', products: ['Etch', 'Deposition', 'Clean'], processes: ['ETCH', 'DEPOSITION', 'CLEAN'], jobs: ['Plasma process', 'Equipment', 'Field service'], risks: ['Memory 투자 사이클', '수출통제'], sources: [{ label: 'Lam Research 공식', url: 'https://www.lamresearch.com/' }] },
  { id: 'tel', name: 'Tokyo Electron', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '코터·디벨로퍼부터 식각·증착까지', summary: 'Photo track과 thermal·etch·deposition·clean을 폭넓게 연결하는 일본 종합 장비기업.', products: ['Coater/Developer', 'Etch', 'Deposition', 'Thermal'], processes: ['PHOTO TRACK', 'ETCH', 'DEPOSITION'], jobs: ['Process', 'Equipment', 'Field service'], risks: ['설비투자 사이클', '수출규제'], sources: [{ label: 'Tokyo Electron 공식', url: 'https://www.tel.com/' }] },
  { id: 'kla', name: 'KLA', country: 'United States', category: 'equipment', hub: 'lithography', status: 'profile', role: '검사·계측·공정제어', summary: '결함을 찾고 치수·막·overlay를 측정해 수율학습 속도를 높이는 process control 후보군.', products: ['Inspection', 'Metrology', 'Data analytics'], processes: ['DEFECT', 'METROLOGY', 'YIELD'], jobs: ['Optics', 'Algorithm', 'Application'], risks: ['선단 고객집중', '수출통제'], sources: [{ label: 'KLA 공식', url: 'https://www.kla.com/' }] },
  { id: 'asm', name: 'ASM International', country: 'Netherlands', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: 'ALD·Epitaxy', summary: '원자층 증착과 epitaxy를 중심으로 선단 transistor의 박막·계면을 제어하는 장비기업.', products: ['ALD', 'Epitaxy'], processes: ['ALD', 'EPI'], jobs: ['Thin film', 'Materials', 'Application'], risks: ['선단 투자집중', '공정경쟁'], sources: [{ label: 'ASM 공식', url: 'https://www.asm.com/' }] },
  { id: 'screen', name: 'SCREEN Holdings', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '반도체 세정·디스플레이 도포현상', summary: '반도체 wafer 세정과 OLED·LCD용 TFT array coat/develop 장비를 함께 공급하는 공통 공정장비 그룹.', products: ['Wafer clean', 'Coater/Developer', 'OLED·LCD TFT array equipment'], processes: ['SEMICONDUCTOR CLEAN', 'DISPLAY COAT/DEVELOP', 'SURFACE PREP'], jobs: ['Chemical process', 'Equipment', 'Application'], risks: ['설비투자 사이클', '고객인증'], sources: [{ label: 'SCREEN 반도체 제품', url: 'https://www.screen.co.jp/spe/en/' }, { label: 'SCREEN 디스플레이 제품', url: 'https://www.screen.co.jp/ft/en/products/oled' }] },
  { id: 'kokusai', name: 'Kokusai Electric', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '배치 열처리·증착', summary: '다수 wafer를 동시에 처리하는 batch furnace와 deposition 공정 후보군.', products: ['Batch furnace', 'Deposition'], processes: ['DIFFUSION', 'DEPOSITION'], jobs: ['Thermal process', 'Equipment'], risks: ['Memory 사이클', 'Batch 균일도'], sources: [{ label: 'Kokusai Electric 공식', url: 'https://www.kokusai-electric.com/en/' }] },
  { id: 'axcelis', name: 'Axcelis', country: 'United States', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '이온주입', summary: '불순물의 dose·energy·angle을 제어해 소자의 전기적 특성을 형성하는 implant 장비기업.', products: ['Ion implanter'], processes: ['IMPLANT'], jobs: ['Beam physics', 'Process', 'Field service'], risks: ['전력반도체·메모리 투자변동', '고객집중'], sources: [{ label: 'Axcelis 공식', url: 'https://www.axcelis.com/' }] },
  { id: 'zeiss', name: 'ZEISS SMT', country: 'Germany', category: 'materials', hub: 'lithography', status: 'profile', role: 'EUV·DUV 초정밀 광학계', summary: '노광기의 렌즈·다층반사거울과 계측광학을 공급하는 핵심 부품 생태계.', products: ['Projection optics', 'EUV mirrors'], processes: ['LITHOGRAPHY OPTICS'], jobs: ['Optical engineering', 'Surface metrology'], risks: ['초정밀 생산능력', '단일 생태계 의존'], sources: [{ label: 'ZEISS SMT 공식', url: 'https://www.zeiss.com/semiconductor-manufacturing-technology/home.html' }] },
  { id: 'shinetsu', name: 'Shin-Etsu Chemical', country: 'Japan', category: 'materials', hub: 'materials', status: 'profile', role: '실리콘 웨이퍼·전자재료', summary: 'wafer와 photo 관련 재료 등 공정 입력물의 품질을 좌우하는 소재 후보군.', products: ['Silicon wafer', 'Electronic materials'], processes: ['SUBSTRATE', 'PHOTO MATERIAL'], jobs: ['Crystal growth', 'Materials quality'], risks: ['원재료·에너지', '고객인증'], sources: [{ label: 'Shin-Etsu 공식', url: 'https://www.shinetsu.co.jp/en/' }] },
  { id: 'sumco', name: 'SUMCO', country: 'Japan', category: 'materials', hub: 'materials', status: 'profile', role: '실리콘 웨이퍼', summary: '결정결함·평탄도·저항률이 공정수율의 시작점이 되는 silicon wafer 기업.', products: ['300 mm wafer', 'Specialty wafer'], processes: ['SUBSTRATE'], jobs: ['Crystal', 'Wafer process', 'Quality'], risks: ['Wafer 사이클', '대규모 증설'], sources: [{ label: 'SUMCO 공식', url: 'https://www.sumcosi.com/english/' }] },
  { id: 'jsr', name: 'JSR', country: 'Japan', category: 'materials', hub: 'materials', status: 'profile', role: '포토레지스트·전자재료', summary: '노광광에 반응해 패턴을 형성하는 resist와 전자재료 생태계 후보군.', products: ['Photoresist', 'Electronic materials'], processes: ['PHOTO MATERIAL'], jobs: ['Polymer chemistry', 'Application'], risks: ['기술세대 전환', '수출규제'], sources: [{ label: 'JSR 공식', url: 'https://www.jsr.co.jp/jsr_e/' }] },
  { id: 'tok', name: 'Tokyo Ohka Kogyo', country: 'Japan', category: 'materials', hub: 'materials', status: 'profile', role: '포토레지스트·고순도 화학재료', summary: 'Photo와 packaging 공정에 쓰이는 감광재·고순도 화학재료 후보군.', products: ['Photoresist', 'Packaging materials'], processes: ['PHOTO MATERIAL', 'PACKAGING'], jobs: ['Chemistry', 'Quality', 'Application'], risks: ['공정세대 전환', '원재료'], sources: [{ label: 'TOK 공식', url: 'https://www.tok.co.jp/eng/' }] },
  { id: 'entegris', name: 'Entegris', country: 'United States', category: 'materials', hub: 'materials', status: 'profile', role: '오염제어·고순도 재료 전달', summary: '필터·용기·가스·액체 전달과 specialty materials로 공정 오염을 관리하는 생태계.', products: ['Filtration', 'Fluid handling', 'Specialty materials'], processes: ['CONTAMINATION CONTROL'], jobs: ['Chemical', 'Quality', 'Supplier engineering'], risks: ['고객인증', '원재료·공급망'], sources: [{ label: 'Entegris 공식', url: 'https://www.entegris.com/' }] },
  { id: 'air-liquide', name: 'Air Liquide', country: 'France', category: 'materials', hub: 'materials', status: 'profile', role: '산업·특수가스', summary: 'Fab의 deposition·etch·purge·clean에 필요한 고순도 가스와 현장 공급 인프라 후보군.', products: ['Carrier gas', 'Specialty gas'], processes: ['GAS SUPPLY', 'DEPOSITION', 'ETCH'], jobs: ['Gas systems', 'Safety', 'Operations'], risks: ['공급연속성', '안전·에너지'], sources: [{ label: 'Air Liquide 공식', url: 'https://www.airliquide.com/' }] },
  { id: 'synopsys', name: 'Synopsys', country: 'United States', category: 'design', hub: 'design', status: 'profile', role: 'EDA·Silicon IP', summary: '칩 설계·검증·물리구현과 IP를 제공해 제조가능한 설계를 만드는 도구기업.', products: ['EDA', 'Verification', 'IP'], processes: ['DESIGN', 'SIGN-OFF'], jobs: ['EDA', 'Verification', 'CAE'], risks: ['설계주기', 'IP·규제'], sources: [{ label: 'Synopsys 공식', url: 'https://www.synopsys.com/' }] },
  { id: 'cadence', name: 'Cadence', country: 'United States', category: 'design', hub: 'design', status: 'profile', role: 'EDA·시스템 설계', summary: '회로·물리설계·검증과 multiphysics 분석을 연결하는 설계도구 기업.', products: ['EDA', 'Verification', 'Multiphysics'], processes: ['DESIGN', 'SIGN-OFF'], jobs: ['Circuit', 'Layout', 'Verification'], risks: ['고객집중', '수출통제'], sources: [{ label: 'Cadence 공식', url: 'https://www.cadence.com/' }] },
  { id: 'arm', name: 'Arm', country: 'United Kingdom', category: 'design', hub: 'design', status: 'profile', role: 'CPU 아키텍처·IP', summary: '프로세서 아키텍처와 설계 IP를 라이선스해 다양한 SoC 생태계의 출발점을 제공한다.', products: ['CPU architecture', 'IP'], processes: ['ARCHITECTURE', 'DESIGN'], jobs: ['Architecture', 'IP verification'], risks: ['라이선스 생태계', '고객 내재화'], sources: [{ label: 'Arm 공식', url: 'https://www.arm.com/' }] },
  { id: 'nvidia', name: 'NVIDIA', country: 'United States', category: 'fabless', hub: 'compute', status: 'profile', role: 'AI 가속기·플랫폼 설계', summary: 'GPU·NVLink·networking을 결합하며 HBM의 대역폭·용량·전력 요구를 메모리와 패키징 생태계에 전달하는 수요 노드.', products: ['GPU', 'HGX platform', 'NVLink·Networking'], processes: ['SYSTEM ARCHITECTURE', 'CHIP DESIGN', 'HBM INTEGRATION'], jobs: ['Architecture', 'Circuit', 'Verification'], risks: ['공급망 집중', '수출통제'], sources: [{ label: 'NVIDIA HGX 공식', url: 'https://www.nvidia.com/en-us/data-center/hgx/' }] },
  { id: 'amd', name: 'AMD', country: 'United States', category: 'fabless', hub: 'compute', status: 'profile', role: 'CPU·GPU·AI 가속기 설계', summary: '데이터센터 가속기와 CPU 플랫폼을 통해 HBM·첨단패키징·고속 인터커넥트 수요를 만드는 시스템 설계 노드.', products: ['Instinct accelerator', 'EPYC CPU', 'Adaptive computing'], processes: ['SYSTEM ARCHITECTURE', 'CHIPLET', 'HBM INTEGRATION'], jobs: ['Architecture', 'Package', 'Verification'], risks: ['가속기 경쟁', '첨단패키징 공급'], sources: [{ label: 'AMD 데이터센터 공식', url: 'https://www.amd.com/en/solutions/data-center.html' }] },
  { id: 'broadcom', name: 'Broadcom', country: 'United States', category: 'fabless', hub: 'compute', status: 'profile', role: 'AI·네트워크용 맞춤형 반도체', summary: '데이터센터 네트워킹과 custom accelerator 생태계에서 고대역폭 메모리·첨단패키징 요구를 만드는 수요 노드.', products: ['Custom silicon', 'Ethernet switching', 'Connectivity'], processes: ['ASIC DESIGN', 'NETWORK SYSTEM', 'ADVANCED PACKAGE'], jobs: ['ASIC', 'Network silicon', 'Package'], risks: ['고객집중', 'AI 투자 사이클'], sources: [{ label: 'Broadcom 반도체 공식', url: 'https://www.broadcom.com/products/semiconductors' }] },
  { id: 'tsmc', name: 'TSMC', country: 'Taiwan', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'Pure-play foundry', summary: 'Fabless 설계를 대규모 wafer 공정과 공정설계키트로 양산하는 foundry 핵심 노드.', products: ['Logic foundry', 'Specialty process', 'Packaging'], processes: ['WAFER FAB', 'YIELD', 'PACKAGING'], jobs: ['Integration', 'Process', 'Equipment', 'Yield'], risks: ['지정학', '대규모 CapEx'], sources: [{ label: 'TSMC 공식', url: 'https://www.tsmc.com/english' }] },
  { id: 'samsung', name: 'Samsung Electronics', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'deep', role: 'Memory·Foundry·System LSI IDM', summary: 'DRAM·NAND에서 HBM, CXL memory, SSD까지 공급하고 foundry·첨단패키징 역량도 함께 가진 통합형 메모리 제조사.', products: ['DRAM·HBM', 'NAND·SSD', 'CXL memory', 'Foundry·Advanced packaging'], processes: ['MEMORY FAB', 'TSV STACK', 'BASE DIE', 'YIELD'], jobs: ['Process', 'Device', 'Design', 'Package'], risks: ['메모리 사이클', 'HBM 고객인증', '선단 수율·대규모 투자'], metrics: [{ label: 'HBM4 대역폭', value: '최대 3.3TB/s', note: 'Samsung 공식 제품 설명' }, { label: 'I/O', value: '2,048 pins', note: 'Samsung HBM4 공식' }, { label: '기반 기술', value: '1c + 4nm', note: 'DRAM + logic base die' }], sections: [{ title: '중앙 레이어의 역할', body: '범용 DRAM·NAND와 AI용 HBM을 동시에 제조하며, memory cell·주변회로·TSV 적층·base die·열·수율을 하나의 제품으로 통합한다.' }, { title: '위쪽 생태계 의존', body: '웨이퍼·포토재료·특수가스와 노광·증착·식각·검사 장비의 공정창이 bit density, 전력, 수율과 직결된다.' }, { title: '아래쪽으로 전달되는 가치', body: 'HBM은 GPU·xPU와 첨단패키징으로 결합돼 AI 학습·추론 시스템의 memory bandwidth 병목을 줄인다.' }], sources: [{ label: 'Samsung Memory 사업', url: 'https://semiconductor.samsung.com/about-us/business-area/memory/' }, { label: 'Samsung HBM4', url: 'https://semiconductor.samsung.com/dram/hbm/hbm4/' }] },
  { id: 'sk-hynix', name: 'SK hynix', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'deep', role: 'DRAM·NAND·HBM Memory', summary: 'DRAM·NAND와 HBM 적층·패키징을 결합하고 TSMC·NVIDIA와 공개 협력을 통해 AI memory를 시스템에 연결하는 제조사.', products: ['HBM3E·HBM4', 'DRAM·MRDIMM', 'NAND·eSSD'], processes: ['MEMORY FAB', 'TSV', 'MR-MUF', 'HBM PACKAGING'], jobs: ['Process', 'Device', 'Design', 'Package'], risks: ['메모리 사이클', 'AI 고객 집중', '수율·증설 실행'], metrics: [{ label: 'HBM4 구성', value: '16H · 48GB', note: '2026 TSMC Symposium 공개' }, { label: 'Base die', value: 'TSMC logic', note: '공식 기술협력' }, { label: '시스템 적용', value: 'GB300', note: 'HBM3E 공개 전시' }], sections: [{ title: '중앙 레이어의 역할', body: '미세 DRAM 공정과 수직 적층, 열·warpage 제어를 결합해 GPU가 요구하는 대역폭과 용량을 제공한다.' }, { title: '공식 확인된 연결', body: 'HBM4 base die와 CoWoS 최적화를 위해 TSMC와 협력하며, NVIDIA GB300 등 AI 시스템에 적용된 제품군을 공개했다.' }, { title: '교육 포인트', body: 'HBM 수율은 단일 wafer 수율이 아니라 known-good die, TSV, 적층, 열, package test가 곱해지는 시스템 문제로 다뤄야 한다.' }], sources: [{ label: 'SK hynix–TSMC HBM4 협력', url: 'https://news.skhynix.com/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/' }, { label: 'SK hynix GTC 2026', url: 'https://news.skhynix.com/en/gtc-2026-exhibition-booth/' }, { label: 'TSMC Symposium 2026', url: 'https://news.skhynix.com/tsmc-technology-symposium-2026/' }] },
  { id: 'micron', name: 'Micron', country: 'United States', category: 'manufacturing', hub: 'fab', status: 'deep', role: 'Memory·Storage IDM', summary: 'DRAM·NAND·SSD와 HBM을 함께 설계·제조하며 AI accelerator부터 server memory와 storage까지 데이터 경로 전반을 공급하는 제조사.', products: ['HBM3E·HBM4', 'DDR5·LPDDR', 'NAND·NVMe SSD'], processes: ['MEMORY FAB', 'TSV STACK', 'PACKAGING', 'PRODUCT TEST'], jobs: ['Process', 'Device', 'Product', 'Package'], risks: ['메모리 사이클', 'AI 고객 집중', '미국·중국 규제'], metrics: [{ label: 'HBM3E 대역폭', value: '>1.2TB/s', note: 'Micron 공식' }, { label: 'HBM3E 용량', value: '24·36GB', note: '8H·12H 제품' }, { label: '확인된 적용', value: 'NVIDIA H200', note: 'Micron 공식 발표' }], sections: [{ title: '중앙 레이어의 역할', body: 'HBM뿐 아니라 DDR·LPDDR·SSD를 함께 공급해 accelerator 인접 메모리부터 서버와 데이터 저장장치까지 AI 데이터 이동 경로를 포괄한다.' }, { title: '공식 확인된 연결', body: 'Micron은 HBM3E 24GB 8-high가 NVIDIA H200 Tensor Core GPU에 탑재된다고 공식 설명한다.' }, { title: '교육 포인트', body: '대역폭·용량·전력·열을 따로 보지 않고 workload 처리량과 data center 운영비까지 연결해 제품 가치를 판단해야 한다.' }], sources: [{ label: 'Micron HBM3E와 NVIDIA H200', url: 'https://www.micron.com/about/blog/applications/ai/microns-hbm3e-powering-the-future-of-ai-with-high-bandwidth-memory' }, { label: 'Micron HBM 제품군', url: 'https://www.micron.com/products/memory/hbm' }, { label: 'Micron AI memory·storage', url: 'https://www.micron.com/markets-industries/ai' }] },
  { id: 'ase', name: 'ASE Technology', country: 'Taiwan', category: 'packaging', hub: 'packaging', status: 'profile', role: 'OSAT·System-in-Package', summary: 'wafer 제조 후 die를 연결·보호·검사해 출하 가능한 제품으로 만드는 후공정 노드.', products: ['Assembly', 'Advanced packaging', 'Test'], processes: ['PACKAGING', 'TEST'], jobs: ['Package', 'Process', 'Quality'], risks: ['고객집중', 'CapEx·사이클'], sources: [{ label: 'ASE 공식', url: 'https://www.aseglobal.com/' }] },
  { id: 'amkor', name: 'Amkor', country: 'United States', category: 'packaging', hub: 'packaging', status: 'profile', role: 'OSAT·첨단패키징', summary: '외주 assembly·test와 heterogeneous integration을 제공하는 글로벌 후공정 노드.', products: ['Advanced packaging', 'Assembly', 'Test'], processes: ['PACKAGING', 'TEST'], jobs: ['Package design', 'Process', 'Test'], risks: ['고객집중', '공장·지역 투자'], sources: [{ label: 'Amkor 공식', url: 'https://amkor.com/' }] },
  { id: 'advantest', name: 'Advantest', country: 'Japan', category: 'packaging', hub: 'test', status: 'profile', role: '반도체 자동검사장비', summary: '완성 die·package의 전기적 특성과 불량을 고속으로 판정하는 ATE 생태계.', products: ['SoC tester', 'Memory tester'], processes: ['ELECTRICAL TEST'], jobs: ['Test', 'Hardware', 'Application'], risks: ['AI·memory 투자집중', '고객인증'], sources: [{ label: 'Advantest 공식', url: 'https://www.advantest.com/' }] },
  { id: 'teradyne', name: 'Teradyne', country: 'United States', category: 'packaging', hub: 'test', status: 'profile', role: 'ATE·테스트 시스템', summary: 'SoC·memory·wireless 제품의 자동 전기검사와 생산 테스트 솔루션 후보군.', products: ['Semiconductor test', 'System test'], processes: ['ELECTRICAL TEST'], jobs: ['Test engineering', 'Application'], risks: ['테스트 사이클', '고객집중'], sources: [{ label: 'Teradyne 공식', url: 'https://www.teradyne.com/' }] },
  { id: 'samsung-display', name: 'Samsung Display', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'deep', role: 'OLED·QD-OLED 패널 제조', summary: '모바일·IT·TV용 OLED를 설계·양산하며 8.6세대 IT OLED 투자로 반도체식 미세공정·수율관리와 디스플레이 대면적 공정을 잇는 핵심 패널사.', products: ['Mobile OLED', 'IT OLED', 'QD-OLED'], processes: ['TFT BACKPLANE', 'OLED EVAPORATION', 'ENCAPSULATION', 'MODULE'], jobs: ['TFT Process', 'OLED Device', 'Yield', 'Module'], risks: ['모바일 고객집중', '8.6세대 수율', '중국 패널 경쟁'], metrics: [{ label: 'IT OLED 투자', value: '₩4.1T', note: '2026년까지 공식 계획' }, { label: '생산 세대', value: '8.6G', note: 'IT OLED 신규 라인' }], sections: [{ title: '디스플레이 은하의 핵', body: 'TFT backplane 위에 유기 발광층을 형성하고 봉지·모듈 공정을 통합해 빛을 내는 제품을 만든다. wafer 대신 대면적 glass를 다루지만 박막·진공·패터닝·검사라는 공정 언어는 반도체와 겹친다.' }, { title: '반도체와 만나는 지점', body: 'LTPS·oxide TFT, OLED 증착, DDI와 timing controller, 검사·보정에서 소재·장비·반도체 업체가 함께 연결된다.' }], sources: [{ label: 'Samsung Display 지속가능경영보고서', url: 'https://www.samsungdisplay.com/kor/file/download/Samsung%20Display%20SR%202023_Eng.pdf' }, { label: 'Samsung Display 공식', url: 'https://www.samsungdisplay.com/' }] },
  { id: 'lg-display', name: 'LG Display', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'deep', role: 'OLED·LCD 패널 제조', summary: '대형 OLED부터 IT·모바일·차량용 Tandem OLED까지 제품군을 전개하는 디스플레이 패널사.', products: ['Large OLED', 'IT·Mobile OLED', 'Automotive Tandem OLED', 'LCD'], processes: ['TFT BACKPLANE', 'OLED STACK', 'ENCAPSULATION', 'MODULE'], jobs: ['Process', 'OLED Device', 'Optics', 'Quality'], risks: ['대형 OLED 수요', '투자·재무 부담', 'LCD·OLED 경쟁'], sections: [{ title: '차량용 기술', body: '두 개의 유기 발광층을 쌓는 Tandem OLED로 밝기·수명·내구성을 높이고, plastic substrate와 결합해 곡면 차량 공간에 적용한다.' }, { title: '교육 포인트', body: '발광재료 수명만이 아니라 TFT 구동, 수분·산소 봉지, 색·휘도 보정, 열과 기계 신뢰성을 함께 판단해야 한다.' }], sources: [{ label: 'LG Display Automotive OLED', url: 'https://www.lgdisplay.com/eng/product/automotive-display/oled' }, { label: 'LG Display 공식', url: 'https://www.lgdisplay.com/eng' }] },
  { id: 'boe', name: 'BOE', country: 'China', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'LCD·OLED·MLED 패널 제조', summary: 'ADS Pro LCD, flexible OLED, Mini/Micro LED와 차량용 디스플레이를 폭넓게 양산하는 중국 패널 기업.', products: ['ADS Pro LCD', 'Flexible OLED', 'MLED', 'Automotive display'], processes: ['TFT ARRAY', 'OLED', 'CELL', 'MODULE'], jobs: ['Process', 'Device', 'Product', 'Yield'], risks: ['공급과잉', '가격 경쟁', '기술·무역 규제'], sources: [{ label: 'BOE OLED 공식', url: 'https://www.boe.com/global/en/Products_OLED.html' }, { label: 'BOE LCD 공식', url: 'https://www.boe.com/global/en/Products_LCD.html' }] },
  { id: 'tcl-csot', name: 'TCL CSOT', country: 'China', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'LCD·AMOLED·인쇄 OLED 패널', summary: '대형 LCD, LTPO AMOLED와 인쇄 OLED를 개발·양산하며 여러 form factor의 디스플레이를 공급하는 패널사.', products: ['Large LCD', 'LTPO AMOLED', 'Printed OLED'], processes: ['TFT ARRAY', 'AMOLED', 'PRINTING', 'MODULE'], jobs: ['Process', 'Inkjet/OLED', 'Device', 'Quality'], risks: ['패널 가격', '인쇄 OLED 양산성', '증설 경쟁'], sources: [{ label: 'TCL CSOT AMOLED 공식', url: 'https://en.tclcsot.com/products/351.html' }, { label: 'TCL CSOT 공식', url: 'https://en.tclcsot.com/' }] },
  { id: 'canon-tokki', name: 'Canon Tokki', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: 'OLED 진공 증착·봉지 장비', summary: '유기재료와 cathode를 정밀 증착하고 mask alignment·기판 이송·봉지를 통합하는 OLED 양산장비 기업.', products: ['ELVESS OLED system', 'Evaporation', 'Encapsulation'], processes: ['OLED EVAPORATION', 'MASK ALIGNMENT', 'ENCAPSULATION'], jobs: ['Vacuum', 'Mechanical', 'Process', 'Field service'], risks: ['OLED 투자 사이클', 'FMM 정렬·대면적화'], sources: [{ label: 'Canon Tokki OLED 장비', url: 'https://tokki.canon/eng/product/el/mass.html' }] },
  { id: 'ulvac', name: 'ULVAC', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '반도체·디스플레이 진공 장비', summary: '반도체와 OLED·LCD 생산에 필요한 진공·증착·열처리 장비를 공급해 두 산업의 박막 형성을 잇는다.', products: ['Semiconductor vacuum equipment', 'OLED deposition', 'LCD production equipment'], processes: ['VACUUM', 'PVD', 'OLED DEPOSITION', 'THERMAL'], jobs: ['Vacuum', 'Thin film', 'Equipment', 'Field service'], risks: ['설비투자 사이클', '장비 경쟁', '고객인증'], sources: [{ label: 'ULVAC 디스플레이 장비', url: 'https://www.ulvac.co.jp/en/business/display_energy_production_equipment/' }, { label: 'ULVAC 반도체 장비', url: 'https://www.ulvac.co.jp/en/business/semiconductor_electronic_device_production_equipment/' }] },
  { id: 'corning', name: 'Corning', country: 'United States', category: 'materials', hub: 'materials', status: 'profile', role: '디스플레이 유리 기판', summary: 'LCD·OLED의 TFT backplane과 color filter를 지지하는 고평탄·고안정 glass substrate를 공급한다.', products: ['EAGLE XG', 'Lotus NXT', 'Display glass substrates'], processes: ['GLASS FORMING', 'TFT SUBSTRATE', 'DISPLAY BACKPLANE'], jobs: ['Glass materials', 'Quality', 'Process', 'Application'], risks: ['패널 투자 사이클', '유리 세대 전환', '고객집중'], sources: [{ label: 'Corning Display Glass', url: 'https://www.corning.com/worldwide/en/products/display-glass/products.html' }] },
  { id: 'universal-display', name: 'Universal Display', country: 'United States', category: 'materials', hub: 'materials', status: 'profile', role: 'OLED 발광재료·기술', summary: '인광 OLED 재료와 관련 기술을 제공해 OLED 효율·색·수명 성능에 영향을 주는 소재 노드.', products: ['PHOLED materials', 'OLED emitter technology'], processes: ['ORGANIC MATERIAL', 'EMISSIVE LAYER', 'MATERIAL QUALIFICATION'], jobs: ['Organic chemistry', 'Device', 'Application'], risks: ['고객집중', '재료 수명·색 성능', '특허 경쟁'], sources: [{ label: 'Universal Display 공식', url: 'https://oled.com/' }] },
]
