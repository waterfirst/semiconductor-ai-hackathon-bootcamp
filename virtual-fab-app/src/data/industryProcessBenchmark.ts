export type ProcessBenchmarkRow = {
  stage: '전공정' | '후공정'
  process: string
  foreignCompanies: string[]
  koreanCompanies: string[]
  domesticTechnology: number
  partsLocalization: number
  mappedCompanyIds: string[]
}

// 사용자가 제공한 공정 장비 비교표를 구조화한 교육용 스냅샷이다.
// 원본 이미지에 기준연도가 없어 현재 시장점유율이나 최신 국산화율로 사용하지 않는다.
export const PROCESS_BENCHMARK_ROWS: ProcessBenchmarkRow[] = [
  { stage: '전공정', process: '노광', foreignCompanies: ['ASML', 'Nikon', 'Canon'], koreanCompanies: ['SEMES'], domesticTechnology: 10, partsLocalization: 0, mappedCompanyIds: ['asml', 'semes'] },
  { stage: '전공정', process: '식각', foreignCompanies: ['Lam Research', 'Tokyo Electron', 'Applied Materials'], koreanCompanies: ['DMS', 'APTC', 'SEMES'], domesticTechnology: 85, partsLocalization: 50, mappedCompanyIds: ['lam', 'tel', 'applied-materials', 'dms', 'semes'] },
  { stage: '전공정', process: '세정', foreignCompanies: ['Tokyo Electron', 'DNS'], koreanCompanies: ['SEMES', 'PSK', 'KC Tech', '제우스', '네오테크놀러지', 'DMS'], domesticTechnology: 85, partsLocalization: 65, mappedCompanyIds: ['tel', 'semes', 'dms'] },
  { stage: '전공정', process: 'CMP', foreignCompanies: ['Applied Materials'], koreanCompanies: ['KC Tech'], domesticTechnology: 75, partsLocalization: 60, mappedCompanyIds: ['applied-materials'] },
  { stage: '전공정', process: '이온주입', foreignCompanies: ['Applied Materials', 'Axcelis'], koreanCompanies: ['한국일신이온', '한국베리안'], domesticTechnology: 20, partsLocalization: 0, mappedCompanyIds: ['applied-materials', 'axcelis'] },
  { stage: '전공정', process: '증착', foreignCompanies: ['Applied Materials', 'Tokyo Electron'], koreanCompanies: ['주성엔지니어링', '원익IPS', '유진테크', 'TES', '국제엘렉트릭'], domesticTechnology: 90, partsLocalization: 65, mappedCompanyIds: ['applied-materials', 'tel', 'jusung-engineering'] },
  { stage: '전공정', process: '열처리', foreignCompanies: ['Applied Materials', 'Tokyo Electron'], koreanCompanies: ['원익IPS', 'AP시스템', '테라세미콘', '코닉시스템', '국제엘렉트릭'], domesticTechnology: 90, partsLocalization: 70, mappedCompanyIds: ['applied-materials', 'tel'] },
  { stage: '전공정', process: '측정·분석', foreignCompanies: ['KLA-Tencor', 'Applied Materials'], koreanCompanies: ['오로스테크놀로지', 'SFA'], domesticTechnology: 35, partsLocalization: 30, mappedCompanyIds: ['kla', 'applied-materials', 'sfa-engineering'] },
  { stage: '후공정', process: '패키징', foreignCompanies: ['TESCO', 'Hitachi High-Tech', 'ASM Pacific'], koreanCompanies: ['SEMES', '한미반도체', '이오테크닉스'], domesticTechnology: 90, partsLocalization: 60, mappedCompanyIds: ['semes'] },
  { stage: '후공정', process: '테스트', foreignCompanies: ['Advantest', 'Teradyne'], koreanCompanies: ['Exicon', 'UniTest'], domesticTechnology: 80, partsLocalization: 60, mappedCompanyIds: ['advantest', 'teradyne'] },
]
