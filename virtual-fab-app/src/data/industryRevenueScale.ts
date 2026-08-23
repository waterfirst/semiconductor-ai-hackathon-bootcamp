export type RevenueTier = 0 | 1 | 2 | 3 | 4 | 5

export type RevenueScale = {
  tier: RevenueTier
  label: string
  scale: number
  basis: string
}

const TIER_META: Record<RevenueTier, Omit<RevenueScale, 'tier'>> = {
  0: { label: '매출 비교자료 미확인', scale: .92, basis: '비상장·사업부 분리 등으로 비교 가능한 최근 연매출을 확인하지 못함' },
  1: { label: '연매출 $0.5B 미만', scale: .82, basis: '최근 공개 연차보고서·공시의 연결 또는 독립기업 매출 구간' },
  2: { label: '연매출 $0.5B–2B', scale: .98, basis: '최근 공개 연차보고서·공시의 연결 또는 독립기업 매출 구간' },
  3: { label: '연매출 $2B–10B', scale: 1.16, basis: '최근 공개 연차보고서·공시의 연결 또는 독립기업 매출 구간' },
  4: { label: '연매출 $10B–50B', scale: 1.38, basis: '최근 공개 연차보고서·공시의 연결 또는 독립기업 매출 구간' },
  5: { label: '연매출 $50B 이상', scale: 1.64, basis: '최근 공개 연차보고서·공시의 연결 또는 독립기업 매출 구간' },
}

// 2024~2026년에 공개된 최신 연차보고서·공시의 넓은 USD 환산 구간이다.
// 환율과 회계연도 차이의 영향을 줄이기 위해 정확한 순위를 만들지 않고 5개 구간만 사용한다.
const REVENUE_TIERS: Record<string, RevenueTier> = {
  asml: 4, 'applied-materials': 4, lam: 4, tel: 4, kla: 4, asm: 3, screen: 3, kokusai: 2, axcelis: 2,
  zeiss: 3, shinetsu: 4, sumco: 3, jsr: 3, tok: 2, entegris: 3, 'air-liquide': 4,
  synopsys: 3, cadence: 3, arm: 3, nvidia: 5, amd: 4, broadcom: 5,
  tsmc: 5, samsung: 5, 'sk-hynix': 4, micron: 4,
  ase: 4, amkor: 3, advantest: 3, teradyne: 3,
  'samsung-display': 4, 'lg-display': 4, boe: 4, 'tcl-csot': 3,
  'canon-tokki': 0, ulvac: 3, corning: 4, 'universal-display': 2,
  semes: 0, 'db-hitek': 2, 'sk-siltron': 2, 'lx-semicon': 2, 'duksan-neolux': 1,
  smic: 3, ymtc: 0, cxmt: 0, naura: 3, amec: 2,
  'intel-foundry': 4, globalfoundries: 3, qualcomm: 4, marvell: 3, 'onto-innovation': 2,
  stmicroelectronics: 4, infineon: 4, soitec: 2, 'merck-electronics': 3, aixtron: 2,
}

export function getRevenueScale(companyId: string): RevenueScale {
  const tier = REVENUE_TIERS[companyId] ?? 0
  return { tier, ...TIER_META[tier] }
}

export const REVENUE_LEGEND = ([1, 3, 5] as RevenueTier[]).map((tier) => ({ tier, ...TIER_META[tier] }))
