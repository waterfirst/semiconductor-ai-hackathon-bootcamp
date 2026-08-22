export type CompanyCategory = 'design' | 'fabless' | 'manufacturing' | 'equipment' | 'materials' | 'packaging'

export type IndustrySource = { label: string; url: string }

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
    role: '증착·식각·CMP·이온주입·검사·패키징',
    summary: '재료를 만들고, 깎고, 바꾸고, 측정하는 폭넓은 장비를 바탕으로 transistor·interconnect·memory·advanced packaging 공정을 공동최적화한다.',
    products: ['CVD·PVD·ALD·Epitaxy', 'Etch·CMP', 'Ion implant·Thermal', 'Inspection·Advanced packaging'],
    processes: ['DEPOSITION', 'ETCH', 'CMP', 'IMPLANT', 'PACKAGING'],
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
      { label: 'Applied FY2026 Q3 실적', url: 'https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-third-quarter-2026-results' },
      { label: 'Applied 2025 Form 10-K', url: 'https://www.sec.gov/Archives/edgar/data/6951/000162828025056742/amat-20251026.htm' },
    ],
    reportUrl: githubReport('APPLIED_MATERIALS_2026-08-23.md'),
  },
  { id: 'lam', name: 'Lam Research', country: 'United States', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '식각·증착·세정', summary: '고종횡비 구조와 3D memory를 포함한 plasma etch·deposition·clean 공정 후보군.', products: ['Etch', 'Deposition', 'Clean'], processes: ['ETCH', 'DEPOSITION', 'CLEAN'], jobs: ['Plasma process', 'Equipment', 'Field service'], risks: ['Memory 투자 사이클', '수출통제'], sources: [{ label: 'Lam Research 공식', url: 'https://www.lamresearch.com/' }] },
  { id: 'tel', name: 'Tokyo Electron', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '코터·디벨로퍼부터 식각·증착까지', summary: 'Photo track과 thermal·etch·deposition·clean을 폭넓게 연결하는 일본 종합 장비기업.', products: ['Coater/Developer', 'Etch', 'Deposition', 'Thermal'], processes: ['PHOTO TRACK', 'ETCH', 'DEPOSITION'], jobs: ['Process', 'Equipment', 'Field service'], risks: ['설비투자 사이클', '수출규제'], sources: [{ label: 'Tokyo Electron 공식', url: 'https://www.tel.com/' }] },
  { id: 'kla', name: 'KLA', country: 'United States', category: 'equipment', hub: 'lithography', status: 'profile', role: '검사·계측·공정제어', summary: '결함을 찾고 치수·막·overlay를 측정해 수율학습 속도를 높이는 process control 후보군.', products: ['Inspection', 'Metrology', 'Data analytics'], processes: ['DEFECT', 'METROLOGY', 'YIELD'], jobs: ['Optics', 'Algorithm', 'Application'], risks: ['선단 고객집중', '수출통제'], sources: [{ label: 'KLA 공식', url: 'https://www.kla.com/' }] },
  { id: 'asm', name: 'ASM International', country: 'Netherlands', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: 'ALD·Epitaxy', summary: '원자층 증착과 epitaxy를 중심으로 선단 transistor의 박막·계면을 제어하는 장비기업.', products: ['ALD', 'Epitaxy'], processes: ['ALD', 'EPI'], jobs: ['Thin film', 'Materials', 'Application'], risks: ['선단 투자집중', '공정경쟁'], sources: [{ label: 'ASM 공식', url: 'https://www.asm.com/' }] },
  { id: 'screen', name: 'SCREEN SPE', country: 'Japan', category: 'equipment', hub: 'materialsEngineering', status: 'profile', role: '웨이퍼 세정', summary: '입자·금속·유기 오염을 제거하고 다음 공정의 계면 품질을 만드는 세정장비 후보군.', products: ['Single wafer clean', 'Batch clean'], processes: ['CLEAN', 'SURFACE PREP'], jobs: ['Chemical process', 'Equipment'], risks: ['Wet chemistry 경쟁', '고객인증'], sources: [{ label: 'SCREEN SPE 공식', url: 'https://www.screen.co.jp/spe/en/' }] },
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
  { id: 'nvidia', name: 'NVIDIA', country: 'United States', category: 'fabless', hub: 'compute', status: 'profile', role: 'AI 가속기·플랫폼 설계', summary: 'AI compute 수요를 chip·memory·network·advanced packaging 요구로 전달하는 fabless 생태계 노드.', products: ['GPU', 'AI accelerator', 'Networking'], processes: ['SYSTEM ARCHITECTURE', 'CHIP DESIGN'], jobs: ['Architecture', 'Circuit', 'Verification'], risks: ['공급망 집중', '수출통제'], sources: [{ label: 'NVIDIA 공식', url: 'https://www.nvidia.com/' }] },
  { id: 'tsmc', name: 'TSMC', country: 'Taiwan', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'Pure-play foundry', summary: 'Fabless 설계를 대규모 wafer 공정과 공정설계키트로 양산하는 foundry 핵심 노드.', products: ['Logic foundry', 'Specialty process', 'Packaging'], processes: ['WAFER FAB', 'YIELD', 'PACKAGING'], jobs: ['Integration', 'Process', 'Equipment', 'Yield'], risks: ['지정학', '대규모 CapEx'], sources: [{ label: 'TSMC 공식', url: 'https://www.tsmc.com/english' }] },
  { id: 'samsung', name: 'Samsung Electronics', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'Memory·Foundry·System LSI IDM', summary: 'Memory와 logic 설계·제조를 함께 운영하는 종합 반도체 제조 노드.', products: ['DRAM·NAND', 'Foundry', 'System LSI'], processes: ['MEMORY FAB', 'FOUNDRY', 'YIELD'], jobs: ['Process', 'Device', 'Design', 'Package'], risks: ['메모리 사이클', '선단 수율·투자'], sources: [{ label: 'Samsung Semiconductor 공식', url: 'https://semiconductor.samsung.com/' }] },
  { id: 'sk-hynix', name: 'SK hynix', country: 'South Korea', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'DRAM·NAND·HBM Memory', summary: 'Memory cell·periphery·wafer 공정과 HBM packaging을 연결하는 제조 노드.', products: ['DRAM', 'NAND', 'HBM'], processes: ['MEMORY FAB', 'HBM PACKAGING'], jobs: ['Process', 'Device', 'Design', 'Package'], risks: ['메모리 사이클', '고객·증설 집중'], sources: [{ label: 'SK hynix 공식', url: 'https://www.skhynix.com/' }] },
  { id: 'micron', name: 'Micron', country: 'United States', category: 'manufacturing', hub: 'fab', status: 'profile', role: 'Memory·Storage IDM', summary: 'DRAM·NAND와 memory system을 설계·제조하는 글로벌 memory 노드.', products: ['DRAM', 'NAND', 'Memory products'], processes: ['MEMORY FAB', 'PACKAGING'], jobs: ['Process', 'Device', 'Product'], risks: ['메모리 사이클', '수출통제'], sources: [{ label: 'Micron 공식', url: 'https://www.micron.com/' }] },
  { id: 'ase', name: 'ASE Technology', country: 'Taiwan', category: 'packaging', hub: 'packaging', status: 'profile', role: 'OSAT·System-in-Package', summary: 'wafer 제조 후 die를 연결·보호·검사해 출하 가능한 제품으로 만드는 후공정 노드.', products: ['Assembly', 'Advanced packaging', 'Test'], processes: ['PACKAGING', 'TEST'], jobs: ['Package', 'Process', 'Quality'], risks: ['고객집중', 'CapEx·사이클'], sources: [{ label: 'ASE 공식', url: 'https://www.aseglobal.com/' }] },
  { id: 'amkor', name: 'Amkor', country: 'United States', category: 'packaging', hub: 'packaging', status: 'profile', role: 'OSAT·첨단패키징', summary: '외주 assembly·test와 heterogeneous integration을 제공하는 글로벌 후공정 노드.', products: ['Advanced packaging', 'Assembly', 'Test'], processes: ['PACKAGING', 'TEST'], jobs: ['Package design', 'Process', 'Test'], risks: ['고객집중', '공장·지역 투자'], sources: [{ label: 'Amkor 공식', url: 'https://amkor.com/' }] },
  { id: 'advantest', name: 'Advantest', country: 'Japan', category: 'packaging', hub: 'test', status: 'profile', role: '반도체 자동검사장비', summary: '완성 die·package의 전기적 특성과 불량을 고속으로 판정하는 ATE 생태계.', products: ['SoC tester', 'Memory tester'], processes: ['ELECTRICAL TEST'], jobs: ['Test', 'Hardware', 'Application'], risks: ['AI·memory 투자집중', '고객인증'], sources: [{ label: 'Advantest 공식', url: 'https://www.advantest.com/' }] },
  { id: 'teradyne', name: 'Teradyne', country: 'United States', category: 'packaging', hub: 'test', status: 'profile', role: 'ATE·테스트 시스템', summary: 'SoC·memory·wireless 제품의 자동 전기검사와 생산 테스트 솔루션 후보군.', products: ['Semiconductor test', 'System test'], processes: ['ELECTRICAL TEST'], jobs: ['Test engineering', 'Application'], risks: ['테스트 사이클', '고객집중'], sources: [{ label: 'Teradyne 공식', url: 'https://www.teradyne.com/' }] },
]
