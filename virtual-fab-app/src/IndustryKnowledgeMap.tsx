import { ContactShadows, Html, Line, OrbitControls, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Group } from 'three'
import type { Line2 } from 'three-stdlib'
import { DISPLAY_SUPPLIER_ROWS } from './data/displayProcessSuppliers'
import { PROCESS_BENCHMARK_ROWS } from './data/industryProcessBenchmark'
import { getRevenueScale, REVENUE_LEGEND } from './data/industryRevenueScale'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  INDUSTRY_COMPANIES,
  RELATION_COLORS,
  RELATION_KIND_LABELS,
  VERIFIED_RELATIONS,
  getCompanyDomain,
  type CompanyCategory,
  type IndustryCompany,
  type IndustryDomain,
} from './data/industryCompanies'

type PositionedCompany = IndustryCompany & { position: [number, number, number]; domain: IndustryDomain; core: boolean }
type RegionFilter = 'all' | 'korea' | 'china' | 'us' | 'europe' | 'japan-taiwan'
type MapViewMode = 'galaxy' | 'companies' | 'process'

const REGION_LABELS: Record<RegionFilter, string> = {
  all: '전 지역',
  korea: '대한민국',
  china: '중국',
  us: '미국',
  europe: '유럽',
  'japan-taiwan': '일본·대만',
}
const EUROPE_COUNTRIES = new Set(['Netherlands', 'Germany', 'France', 'United Kingdom', 'Switzerland'])

function matchesRegion(company: IndustryCompany, region: RegionFilter) {
  if (region === 'all') return true
  if (region === 'korea') return company.country === 'South Korea'
  if (region === 'china') return company.country === 'China'
  if (region === 'us') return company.country === 'United States'
  if (region === 'europe') return EUROPE_COUNTRIES.has(company.country)
  return company.country === 'Japan' || company.country === 'Taiwan'
}

function relationLineWidth(strength: number, highlighted: boolean) {
  return highlighted ? 1.15 + strength * .78 : .45 + strength * .42
}

function orbitSignature(company: IndustryCompany) {
  return [...company.id].reduce((sum, character) => sum + character.charCodeAt(0), 0)
}

function orbitAngle(company: PositionedCompany, elapsed: number) {
  const signature = orbitSignature(company)
  const direction = signature % 2 === 0 ? 1 : -1
  const speed = company.core ? .042 : .014 + (signature % 7) * .003
  return elapsed * speed * direction
}

function orbitPositionAt(company: PositionedCompany, elapsed: number): [number, number, number] {
  if (company.domain === 'shared') return company.position
  const center = GALAXY_CENTERS[company.domain]
  const angle = orbitAngle(company, elapsed)
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const relativeX = company.position[0] - center[0]
  const relativeZ = company.position[2] - center[2]
  return [
    center[0] + relativeX * cosine + relativeZ * sine,
    company.position[1],
    center[2] - relativeX * sine + relativeZ * cosine,
  ]
}

const GALAXY_CENTERS = {
  semiconductor: [-5.7, .2, 0] as [number, number, number],
  display: [5.7, .2, 0] as [number, number, number],
}
const SEMICONDUCTOR_CORE = new Set(['samsung', 'sk-hynix', 'micron'])
const DISPLAY_CORE = new Set(['samsung-display', 'lg-display', 'boe', 'tcl-csot'])

const CATEGORY_LAYER_RADIUS: Record<CompanyCategory, number> = {
  manufacturing: 2.55,
  equipment: 3.28,
  materials: 4.01,
  packaging: 4.74,
  design: 5.47,
  fabless: 6.2,
}

function orbitPosition(center: [number, number, number], index: number, count: number, inner: boolean, category: CompanyCategory): [number, number, number] {
  if (inner) {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
    return [center[0] + Math.cos(angle) * 1.95, 1.05, center[2] + Math.sin(angle) * 1.65]
  }
  const radius = CATEGORY_LAYER_RADIUS[category]
  const layerIndex = Object.keys(CATEGORY_LAYER_RADIUS).indexOf(category)
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2 + layerIndex * .57
  return [center[0] + Math.cos(angle) * radius * 1.15, .78 + layerIndex * .08, center[2] + Math.sin(angle) * radius]
}

function positionCompanies(companies: IndustryCompany[]) {
  const semi = companies.filter((company) => getCompanyDomain(company.id) === 'semiconductor')
  const display = companies.filter((company) => getCompanyDomain(company.id) === 'display')
  const shared = companies.filter((company) => getCompanyDomain(company.id) === 'shared')
  const semiCore = semi.filter((company) => SEMICONDUCTOR_CORE.has(company.id))
  const semiOrbit = semi.filter((company) => !SEMICONDUCTOR_CORE.has(company.id))
  const displayCore = display.filter((company) => DISPLAY_CORE.has(company.id))
  const displayOrbit = display.filter((company) => !DISPLAY_CORE.has(company.id))
  return companies.map((company) => {
    const domain = getCompanyDomain(company.id)
    const core = SEMICONDUCTOR_CORE.has(company.id) || DISPLAY_CORE.has(company.id)
    let position: [number, number, number]
    if (domain === 'shared') {
      const index = shared.findIndex((item) => item.id === company.id)
      position = [0, 1.25 + (index % 2) * .28, (index - (shared.length - 1) / 2) * 2.7]
    } else if (domain === 'semiconductor') {
      const group = core ? semiCore : semiOrbit
      const layer = core ? group : group.filter((item) => item.category === company.category)
      position = orbitPosition(GALAXY_CENTERS.semiconductor, layer.findIndex((item) => item.id === company.id), layer.length, core, company.category)
    } else {
      const group = core ? displayCore : displayOrbit
      const layer = core ? group : group.filter((item) => item.category === company.category)
      position = orbitPosition(GALAXY_CENTERS.display, layer.findIndex((item) => item.id === company.id), layer.length, core, company.category)
    }
    return { ...company, position, domain, core }
  })
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch { return false }
}

class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function NodeGeometry({ category }: { category: CompanyCategory }) {
  if (category === 'materials') return <octahedronGeometry args={[.38, 0]}/>
  if (category === 'manufacturing') return <cylinderGeometry args={[.39, .39, .56, 20]}/>
  if (category === 'packaging') return <dodecahedronGeometry args={[.4, 0]}/>
  if (category === 'design') return <sphereGeometry args={[.38, 18, 14]}/>
  if (category === 'fabless') return <icosahedronGeometry args={[.4, 0]}/>
  return <boxGeometry args={[.68, .52, .68]}/>
}

function CompanyNode({ company, position = company.position, selected, dimmed, onSelect }: { company: PositionedCompany; position?: [number, number, number]; selected: boolean; dimmed: boolean; onSelect: (id: string) => void }) {
  const categoryColor = CATEGORY_COLORS[company.category]
  const domainColor = DOMAIN_COLORS[company.domain]
  const revenue = getRevenueScale(company.id)
  const planetScale = revenue.scale * (selected ? 1.22 : 1)
  const showLabel = selected || company.core || revenue.tier >= 4
  return <group position={position}>
    <mesh scale={planetScale} onClick={(event) => { event.stopPropagation(); onSelect(company.id) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <NodeGeometry category={company.category}/>
      <meshStandardMaterial color={categoryColor} emissive={domainColor} emissiveIntensity={selected ? .68 : company.core ? .22 : .1} roughness={.4} metalness={.26} transparent opacity={dimmed ? .09 : 1}/>
    </mesh>
    {!dimmed && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.38 * planetScale, 0]}><ringGeometry args={[.5 * planetScale, .59 * planetScale, 40]}/><meshBasicMaterial color={selected ? '#ffffff' : domainColor} transparent opacity={selected || company.domain === 'shared' ? .95 : .64}/></mesh>}
    {!dimmed && showLabel && <Html position={[0, .62 + planetScale * .34, 0]} center zIndexRange={[30, 1]}>
      <button type="button" className={`industry-node-label ${selected ? 'selected' : ''} ${company.core ? 'core' : ''} ${company.domain}`} onClick={() => onSelect(company.id)} aria-label={`${company.name} 상세보고서 열기`} aria-pressed={selected}>
        <b>{company.name}</b><span>{CATEGORY_LABELS[company.category]} · {revenue.tier === 0 ? '매출 미확인' : revenue.label.replace('연매출 ', '')}</span>
      </button>
    </Html>}
    {selected && !dimmed && <pointLight color={domainColor} intensity={6} distance={5}/>}
  </group>
}

function spiralPoints(center: [number, number, number], arm: number) {
  return Array.from({ length: 40 }, (_, index) => {
    const t = index / 39
    const angle = t * Math.PI * 2.1 + arm * Math.PI
    const radius = .75 + t * 4.65
    return [center[0] + Math.cos(angle) * radius * 1.18, .12, center[2] + Math.sin(angle) * radius] as [number, number, number]
  })
}

function Galaxy({ domain }: { domain: 'semiconductor' | 'display' }) {
  const center = GALAXY_CENTERS[domain]
  const color = DOMAIN_COLORS[domain]
  return <group>
    {[0, 1].map((arm) => <Line key={arm} points={spiralPoints(center, arm)} color={color} lineWidth={1.25} transparent opacity={.28}/>)}
    {Object.entries(CATEGORY_LAYER_RADIUS).map(([category, radius]) => <mesh key={category} position={center} rotation={[-Math.PI / 2, 0, 0]} scale={[1.15, 1, 1]}><ringGeometry args={[radius - .025, radius + .025, 96]}/><meshBasicMaterial color={CATEGORY_COLORS[category as CompanyCategory]} transparent opacity={.2}/></mesh>)}
    <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.7, 1.12, 64]}/><meshBasicMaterial color={color} transparent opacity={.34}/></mesh>
    <pointLight position={[center[0], 1.2, center[2]]} color={color} intensity={8} distance={7}/>
    <Sparkles count={70} scale={[9, .7, 9]} position={[center[0], .55, center[2]]} size={1.25} speed={0} color={color}/>
    <Html position={[center[0], .3, center[2] - .05]} center distanceFactor={16}><div className={`industry-galaxy-core ${domain}`}><b>{domain === 'semiconductor' ? 'SEMICONDUCTOR' : 'DISPLAY'}</b><span>{domain === 'semiconductor' ? 'MEMORY · LOGIC · AI' : 'OLED · LCD · MLED'}</span></div></Html>
  </group>
}

function KnowledgeGraph({ companies, selectedId, motionEnabled, onSelect }: { companies: PositionedCompany[]; selectedId: string; motionEnabled: boolean; onSelect: (id: string) => void }) {
  const allCompanies = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const visibleIds = new Set(companies.map((company) => company.id))
  const companyById = new Map(allCompanies.map((company) => [company.id, company]))
  const shared = allCompanies.filter((company) => company.domain === 'shared')
  const orbitGroups = useRef(new Map<string, Group>())
  const relationLines = useRef(new Map<string, Line2>())
  const elapsedOrbitTime = useRef(0)

  useFrame((_, delta) => {
    if (!motionEnabled) return
    elapsedOrbitTime.current += Math.min(delta, .05)
    allCompanies.forEach((company) => {
      if (company.domain === 'shared') return
      const group = orbitGroups.current.get(company.id)
      if (group) group.rotation.y = orbitAngle(company, elapsedOrbitTime.current)
    })
    VERIFIED_RELATIONS.forEach((relation) => {
      const from = companyById.get(relation.from)
      const to = companyById.get(relation.to)
      const line = relationLines.current.get(`${relation.from}-${relation.to}`)
      if (!from || !to || !line) return
      const fromPosition = orbitPositionAt(from, elapsedOrbitTime.current)
      const toPosition = orbitPositionAt(to, elapsedOrbitTime.current)
      line.geometry.setPositions([...fromPosition, ...toPosition])
      line.computeLineDistances()
    })
  })

  return <>
    <color attach="background" args={['#06131c']}/><fog attach="fog" args={['#06131c', 24, 42]}/>
    <ambientLight intensity={1.18}/><directionalLight position={[3, 12, 7]} intensity={1.5}/>
    <mesh position={[0, -.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[29, 21]}/><meshStandardMaterial color="#071923" roughness={.97}/></mesh>
    <Galaxy domain="semiconductor"/><Galaxy domain="display"/>
    {shared.map((company) => <group key={`${company.id}-bridge`}>
      <Line points={[GALAXY_CENTERS.semiconductor, company.position, GALAXY_CENTERS.display]} color={DOMAIN_COLORS.shared} lineWidth={1.4} transparent opacity={visibleIds.has(company.id) ? .55 : .09}/>
    </group>)}
    <Line points={[[0, .15, -4.8], [0, .15, 4.8]]} color={DOMAIN_COLORS.shared} lineWidth={2.2} dashed dashSize={.25} gapSize={.16} transparent opacity={.42}/>
    {allCompanies.map((company) => {
      const dimmed = !visibleIds.has(company.id)
      if (company.domain === 'shared') return <CompanyNode key={company.id} company={company} selected={selectedId === company.id} dimmed={dimmed} onSelect={onSelect}/>
      const center = GALAXY_CENTERS[company.domain]
      const relativePosition: [number, number, number] = [company.position[0] - center[0], company.position[1] - center[1], company.position[2] - center[2]]
      return <group key={company.id} position={center} ref={(group) => { if (group) orbitGroups.current.set(company.id, group); else orbitGroups.current.delete(company.id) }}>
        <Line points={[[0, 0, 0], relativePosition]} color={DOMAIN_COLORS[company.domain]} lineWidth={company.core ? 1.25 : .55} transparent opacity={dimmed ? .04 : company.core ? .42 : .18}/>
        <CompanyNode company={company} position={relativePosition} selected={selectedId === company.id} dimmed={dimmed} onSelect={onSelect}/>
      </group>
    })}
    {VERIFIED_RELATIONS.map((relation) => {
      const from = companyById.get(relation.from); const to = companyById.get(relation.to)
      if (!from || !to) return null
      const active = visibleIds.has(from.id) && visibleIds.has(to.id)
      const highlighted = selectedId === from.id || selectedId === to.id
      const nonCommercial = relation.kind === 'collaboration' || relation.kind === 'certification'
      return <Line
        key={`${relation.from}-${relation.to}`}
        ref={(line) => {
          const key = `${relation.from}-${relation.to}`
          if (line) {
            line.frustumCulled = false
            relationLines.current.set(key, line as Line2)
          } else relationLines.current.delete(key)
        }}
        points={[orbitPositionAt(from, elapsedOrbitTime.current), orbitPositionAt(to, elapsedOrbitTime.current)]}
        color={RELATION_COLORS[relation.kind]}
        lineWidth={active ? relationLineWidth(relation.strength, highlighted) : .42}
        dashed={nonCommercial}
        dashSize={nonCommercial ? .22 : undefined}
        gapSize={nonCommercial ? .13 : undefined}
        transparent
        opacity={active ? highlighted ? .96 : .25 + relation.strength * .055 : .05}
      />
    })}
    <ContactShadows position={[0, .02, 0]} opacity={.22} scale={28} blur={3} far={12}/>
    <OrbitControls makeDefault target={[0, .25, 0]} minDistance={13} maxDistance={42} minPolarAngle={.18} maxPolarAngle={Math.PI / 2.08} enableDamping dampingFactor={.08}/>
  </>
}

function CompanyList({ companies, selectedId, onSelect, fallback = false }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void; fallback?: boolean }) {
  return <div className="industry-map-fallback" role="region" aria-label="산업 지식맵 회사 목록"><strong>{fallback ? '이 기기에서는 3D 대신 회사 목록을 보여줘.' : '회사를 선택하면 오른쪽에서 제품·공정·직무·공식 근거를 볼 수 있어.'}</strong><div>{companies.map((company) => <button type="button" key={company.id} className={company.id === selectedId ? 'selected' : ''} onClick={() => onSelect(company.id)}><b>{company.name}</b><span>{DOMAIN_LABELS[company.domain]} · {company.role}</span></button>)}</div></div>
}

function ProcessBenchmark({ onSelectCompany }: { onSelectCompany: (id: string) => void }) {
  const [benchmarkDomain, setBenchmarkDomain] = useState<'semiconductor' | 'display'>('semiconductor')
  return <section className="industry-process-benchmark" aria-labelledby="process-benchmark-title">
    <header><div><h2 id="process-benchmark-title">공정별 장비·소재 생태계</h2><p>반도체 장비와 Flexible OLED 공급망을 공정 순서로 비교해.</p></div><strong>과거 참고자료</strong></header>
    <nav className="industry-benchmark-switch" aria-label="공정 장비표 산업 선택">
      <button type="button" aria-pressed={benchmarkDomain === 'semiconductor'} onClick={() => setBenchmarkDomain('semiconductor')}>반도체 장비</button>
      <button type="button" aria-pressed={benchmarkDomain === 'display'} onClick={() => setBenchmarkDomain('display')}>Flexible OLED</button>
    </nav>
    {benchmarkDomain === 'semiconductor' ? <>
      <div className="industry-process-warning" role="note"><b>해석 주의</b><span>첨부 원문은 기준연도가 표시되지 않았어. 기술수준·부품 국산화율은 현재값이 아니라 당시 자료의 스냅샷이며 투자·구매 판단에는 사용할 수 없어.</span></div>
      <div className="industry-process-table" role="table" aria-label="국내외 반도체 장비 기업과 국산화 참고자료">
        <div className="industry-process-row industry-process-head" role="row"><span role="columnheader">공정</span><span role="columnheader">해외 기업</span><span role="columnheader">국내 기업</span><span role="columnheader">기술수준</span><span role="columnheader">부품 국산화</span></div>
        {PROCESS_BENCHMARK_ROWS.map((row) => <div className="industry-process-row" role="row" key={`${row.stage}-${row.process}`}>
          <span role="cell"><small>{row.stage}</small><b>{row.process}</b></span>
          <span role="cell">{row.foreignCompanies.join(' · ')}</span>
          <span role="cell">{row.koreanCompanies.join(' · ')}{row.mappedCompanyIds.length > 0 && <i>{row.mappedCompanyIds.map((id) => {
            const company = INDUSTRY_COMPANIES.find((item) => item.id === id)
            return company ? <button type="button" key={id} onClick={() => onSelectCompany(id)}>{company.name} 지도에서 보기</button> : null
          })}</i>}</span>
          <span role="cell"><meter min="0" max="100" value={row.domesticTechnology}>{row.domesticTechnology}%</meter><b>{row.domesticTechnology}%</b></span>
          <span role="cell"><meter min="0" max="100" value={row.partsLocalization}>{row.partsLocalization}%</meter><b>{row.partsLocalization}%</b></span>
        </div>)}
      </div>
      <footer>출처 표기: 첨부 자료의 “한국산업기술평가원”. 회사명은 원문 표기를 정리했으며 최신성·기관명·기준연도는 추가 검증이 필요해.</footer>
    </> : <>
      <div className="industry-process-warning" role="note"><b>공급망 해석 주의</b><span>첨부 원문에 기준연도가 없어 현재 납품계약·고객사 인증·점유율로 단정할 수 없어. 공정과 대표 공급사를 이해하는 교육용 스냅샷으로만 봐줘.</span></div>
      <div className="industry-process-table industry-display-table" role="table" aria-label="Flexible OLED 공정별 장비와 소재 공급사 참고자료">
        <div className="industry-process-row industry-process-head" role="row"><span role="columnheader">공정</span><span role="columnheader">장비·소재</span><span role="columnheader">삼성 공급사</span><span role="columnheader">LG 공급사</span><span role="columnheader">중국·기타</span></div>
        {DISPLAY_SUPPLIER_ROWS.map((row) => <div className="industry-process-row" role="row" key={`${row.majorProcess}-${row.detail}`}>
          <span role="cell"><small>{row.majorProcess}</small><b>{row.detail}</b></span>
          <span role="cell">{row.equipmentMaterial}{row.mappedCompanyIds.length > 0 && <i>{row.mappedCompanyIds.map((id) => {
            const company = INDUSTRY_COMPANIES.find((item) => item.id === id)
            return company ? <button type="button" key={id} onClick={() => onSelectCompany(id)}>{company.name} 지도에서 보기</button> : null
          })}</i>}</span>
          <span role="cell">{row.samsung.join(' · ')}</span>
          <span role="cell">{row.lg.join(' · ')}</span>
          <span role="cell">{row.chinaOthers.join(' · ')}</span>
        </div>)}
      </div>
      <footer>출처 표기: 첨부 자료의 “신한금융투자”. 회사명은 판독 가능한 대표 업체 중심으로 정리했으며 최신 공급관계는 기업 공시·공식 제품자료로 재검증해야 해.</footer>
    </>}
  </section>
}

function CompanyReport({ company }: { company: IndustryCompany }) {
  const domain = getCompanyDomain(company.id)
  const revenue = getRevenueScale(company.id)
  const verifiedRelations = VERIFIED_RELATIONS.filter((relation) => relation.from === company.id || relation.to === company.id)
  return <article className="industry-report" aria-live="polite">
    <header><div><span style={{ '--company-color': DOMAIN_COLORS[domain] } as CSSProperties}>{DOMAIN_LABELS[domain]} · {CATEGORY_LABELS[company.category]} · {company.country}</span><h2>{company.name}</h2><p>{company.role}</p></div><b className={company.status}>{company.status === 'deep' ? '심층분석 완료' : '요약 프로필'}</b></header>
    <p className="industry-report-summary">{company.summary}</p>
    <section className="industry-company-scale" aria-label="행성 크기 기준"><b>행성 크기 · 매출 구간</b><strong>{revenue.label}</strong><span>{revenue.basis}. 회계연도·환율 차이 때문에 정확한 기업 순위가 아니라 넓은 구간만 표현해.</span></section>
    {domain === 'shared' && <section className="industry-cross-note"><b>두 은하의 공통 노드</b><p>반도체와 디스플레이가 함께 쓰는 진공·박막·세정·패터닝 역량을 뜻해. 특정 고객 계약을 의미하지는 않아.</p></section>}
    {verifiedRelations.length > 0 && <section className="industry-report-relations" aria-label="공식 공개 관계">
      <h3>공식 자료로 확인된 관계</h3>
      <p>선 굵기는 공개 근거의 관계 강도 1–5등급이야. 실제 거래금액 비중은 공개된 경우에만 표시해.</p>
      {verifiedRelations.map((relation) => {
        const counterpartId = relation.from === company.id ? relation.to : relation.from
        const counterpart = INDUSTRY_COMPANIES.find((item) => item.id === counterpartId)
        return <a key={`${relation.from}-${relation.to}`} href={relation.source} target="_blank" rel="noreferrer">
          <b>{counterpart?.name ?? counterpartId}</b>
          <span>{relation.label}<small>{RELATION_KIND_LABELS[relation.kind]} · 공개 관계 강도 {relation.strength}/5 · {relation.asOf}{relation.disclosedScale ? ` · ${relation.disclosedScale}` : ''}</small></span>
          <i>근거 ↗</i>
        </a>
      })}
    </section>}
    {company.metrics && <section className="industry-report-metrics" aria-label="주요 공식 수치">{company.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><b>{metric.value}</b><small>{metric.note}</small></div>)}</section>}
    <section className="industry-report-facts"><div><h3>핵심 제품</h3><ul>{company.products.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>관련 공정</h3><ul>{company.processes.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>관련 직무</h3><ul>{company.jobs.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>검증할 위험</h3><ul>{company.risks.map((item) => <li key={item}>{item}</li>)}</ul></div></section>
    {company.sections ? <div className="industry-report-sections">{company.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div> : <section className="industry-report-queued"><h3>심층분석 예정</h3><p>현재는 공식 홈페이지로 역할만 확인한 후보 프로필이야. 공시·연차보고서·제품자료를 검증한 뒤 기술·고객가치·경쟁·실적·직무를 채운다.</p></section>}
    <section className="industry-report-sources"><h3>공식 원문</h3>{company.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true">↗</span></a>)}</section>
    {company.reportUrl && <a className="industry-full-report" href={company.reportUrl} target="_blank" rel="noreferrer">GitHub 전체 심층보고서 열기<span aria-hidden="true">↗</span></a>}
    <p className="industry-report-limit">은하 중심으로 향하는 가는 방사선은 교육용 공정 분류야. 기업 사이 색상선만 공식 자료로 확인한 관계이며, 굵기는 거래액 자체가 아니라 공개 근거 기반의 관계 강도 등급이야.</p>
  </article>
}

export function IndustryKnowledgeMap({ onBack }: { onBack: () => void }) {
  const positioned = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const [selectedId, setSelectedId] = useState('sk-hynix')
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<'all' | IndustryDomain>('all')
  const [region, setRegion] = useState<RegionFilter>('all')
  const [viewMode, setViewMode] = useState<MapViewMode>(() => window.matchMedia('(max-width: 760px)').matches ? 'companies' : 'galaxy')
  const [galaxyMounted, setGalaxyMounted] = useState(() => !window.matchMedia('(max-width: 760px)').matches)
  const [orbiting, setOrbiting] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible')
  const webgl = useMemo(supportsWebGL, [])
  const filtered = useMemo(() => positioned.filter((company) => {
    const matchesDomain = domain === 'all' || company.domain === domain
    const matchesCountry = matchesRegion(company, region)
    const search = query.trim().toLocaleLowerCase('ko-KR')
    const haystack = `${company.name} ${company.country} ${company.role} ${company.products.join(' ')} ${company.processes.join(' ')}`.toLocaleLowerCase('ko-KR')
    return matchesDomain && matchesCountry && (!search || haystack.includes(search))
  }), [domain, positioned, query, region])
  const selected = INDUSTRY_COMPANIES.find((company) => company.id === selectedId) ?? INDUSTRY_COMPANIES[0]
  useEffect(() => { if (filtered.length > 0 && !filtered.some((company) => company.id === selectedId)) setSelectedId(filtered[0].id) }, [filtered, selectedId])
  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
  useEffect(() => { if (viewMode === 'galaxy') setGalaxyMounted(true) }, [viewMode])
  const motionEnabled = orbiting && pageVisible
  const selectFromReference = (id: string) => { setSelectedId(id); setViewMode('galaxy') }

  return <main className="industry-map-shell">
    {/* THESIS: 두 산업을 별도 은하로 보되 공통 장비·소재 기업을 중앙의 단일 노드로 연결한다. */}
    <header className="industry-map-topbar"><div><button type="button" onClick={onBack}>VIRTUAL FAB</button><div><h1>반도체 × 디스플레이 산업 은하</h1><p>Memory·AI와 OLED·LCD 생태계가 공통 장비·소재에서 만나는 3D 지식맵.</p></div></div><div className="industry-map-toolbar"><nav className="industry-map-view-switch" aria-label="산업 지식맵 보기 방식"><button type="button" aria-pressed={viewMode === 'galaxy'} onClick={() => setViewMode('galaxy')}>3D 은하</button><button type="button" aria-pressed={viewMode === 'companies'} onClick={() => setViewMode('companies')}>회사 목록</button><button type="button" aria-pressed={viewMode === 'process'} onClick={() => setViewMode('process')}>공정 장비표</button></nav><div className="industry-map-controls"><label><span>기업·공정 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="OLED, HBM, 증착, ULVAC…"/></label><label><span>산업 은하</span><select aria-label="산업 은하" value={domain} onChange={(event) => setDomain(event.target.value as 'all' | IndustryDomain)}><option value="all">두 은하 전체</option>{Object.entries(DOMAIN_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>본사 지역</span><select aria-label="본사 지역" value={region} onChange={(event) => setRegion(event.target.value as RegionFilter)}>{Object.entries(REGION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div></div></header>
    <section className="industry-map-workspace">
      <section className="industry-map-visual" aria-label="반도체와 디스플레이 산업 3D 지식맵">
        {viewMode === 'galaxy' && <><div className="industry-map-status"><span>DUAL GALAXY · {filtered.length} / {positioned.length} COMPANIES</span><b>대형·핵심 회사명만 표시</b><small>작은 행성 클릭 → 회사명·보고서 · 공전 {motionEnabled ? 'ON' : 'PAUSED'}</small><button type="button" aria-pressed={orbiting} onClick={() => setOrbiting((current) => !current)}>{orbiting ? '공전 일시정지' : '공전 시작'}</button></div>
        <div className="industry-galaxy-guide" aria-label="두 산업 은하 안내"><div className="semiconductor"><b>반도체 은하</b><span>Memory · Logic · AI</span></div><div className="shared"><b>공통 기술 브리지</b><span>Vacuum · Film · Clean</span></div><div className="display"><b>디스플레이 은하</b><span>OLED · LCD · MLED</span></div></div>
        <div className="industry-map-legend" aria-label="산업·업종·매출 범례">
          <div className="industry-legend-domains">{Object.entries(DOMAIN_LABELS).map(([key, label]) => <span key={key}><i className="domain-ring" style={{ '--legend-color': DOMAIN_COLORS[key as IndustryDomain] } as CSSProperties}/>{label}</span>)}</div>
          <div className="industry-legend-categories">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <span key={key}><i style={{ '--legend-color': CATEGORY_COLORS[key as CompanyCategory] } as CSSProperties}/>{label}</span>)}</div>
          <div className="industry-legend-scale"><b>행성 크기 = 최근 공개 연매출</b>{REVENUE_LEGEND.map((item) => <span key={item.tier}><i style={{ '--scale': item.scale } as CSSProperties}/>{item.label.replace('연매출 ', '')}</span>)}</div>
          <span className="verified"><i/>공개 관계 · 굵기 1–5</span>
        </div></>}
        <MapErrorBoundary fallback={<CompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId} fallback/>}>
          <>{galaxyMounted && <div className={`industry-map-canvas ${viewMode === 'galaxy' ? '' : 'is-hidden'}`} aria-hidden={viewMode !== 'galaxy'}>{webgl ? <Canvas camera={{ position: [0, 39, 18], fov: 48 }} dpr={[1, 1.25]} frameloop={motionEnabled && viewMode === 'galaxy' ? 'always' : 'demand'}><KnowledgeGraph companies={filtered} selectedId={selectedId} motionEnabled={motionEnabled && viewMode === 'galaxy'} onSelect={setSelectedId}/></Canvas> : <CompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId} fallback/>}</div>}{viewMode === 'process' ? <ProcessBenchmark onSelectCompany={selectFromReference}/> : viewMode === 'companies' ? <CompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/> : null}</>
        </MapErrorBoundary>
        {filtered.length === 0 && <div className="industry-map-empty"><b>일치하는 회사가 없어.</b><button type="button" onClick={() => { setQuery(''); setDomain('all'); setRegion('all') }}>필터 초기화</button></div>}
      </section>
      <aside className="industry-map-detail" aria-label="선택한 회사 상세보고서"><CompanyReport company={selected}/></aside>
    </section>
  </main>
}
