import { ContactShadows, Html, Line, OrbitControls, Sparkles } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  CATEGORY_LABELS,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  INDUSTRY_COMPANIES,
  VERIFIED_RELATIONS,
  getCompanyDomain,
  type CompanyCategory,
  type IndustryCompany,
  type IndustryDomain,
} from './data/industryCompanies'

type PositionedCompany = IndustryCompany & { position: [number, number, number]; domain: IndustryDomain; core: boolean }

const GALAXY_CENTERS = {
  semiconductor: [-5.7, .2, 0] as [number, number, number],
  display: [5.7, .2, 0] as [number, number, number],
}
const SEMICONDUCTOR_CORE = new Set(['samsung', 'sk-hynix', 'micron'])
const DISPLAY_CORE = new Set(['samsung-display', 'lg-display', 'boe', 'tcl-csot'])

function orbitPosition(center: [number, number, number], index: number, count: number, inner: boolean): [number, number, number] {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
  const radius = inner ? 1.65 : 3.35 + (index % 2) * 1.35
  return [center[0] + Math.cos(angle) * radius * 1.18, .9 + (index % 3) * .2, center[2] + Math.sin(angle) * radius]
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
      position = orbitPosition(GALAXY_CENTERS.semiconductor, group.findIndex((item) => item.id === company.id), group.length, core)
    } else {
      const group = core ? displayCore : displayOrbit
      position = orbitPosition(GALAXY_CENTERS.display, group.findIndex((item) => item.id === company.id), group.length, core)
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

function CompanyNode({ company, selected, dimmed, onSelect }: { company: PositionedCompany; selected: boolean; dimmed: boolean; onSelect: (id: string) => void }) {
  const color = DOMAIN_COLORS[company.domain]
  return <group position={company.position}>
    <mesh scale={(selected ? 1.35 : 1) * (company.core ? 1.28 : 1)} onClick={(event) => { event.stopPropagation(); onSelect(company.id) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <NodeGeometry category={company.category}/>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? .72 : company.core ? .24 : .08} roughness={.42} metalness={.24} transparent opacity={dimmed ? .09 : 1}/>
    </mesh>
    {(selected || company.domain === 'shared') && !dimmed && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.38, 0]}><ringGeometry args={[.54, .7, 40]}/><meshBasicMaterial color={selected ? '#ffffff' : color} transparent opacity={.9}/></mesh>}
    {!dimmed && <Html position={[0, .72, 0]} center distanceFactor={16}>
      <button type="button" className={`industry-node-label ${selected ? 'selected' : ''} ${company.core ? 'core' : ''} ${company.domain}`} onClick={() => onSelect(company.id)} aria-label={`${company.name} 상세보고서 열기`}>
        <b>{company.name}</b><span>{company.domain === 'shared' ? 'CROSS-INDUSTRY' : company.core ? 'GALAXY CORE' : company.role}</span>
      </button>
    </Html>}
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
    <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.7, 1.12, 64]}/><meshBasicMaterial color={color} transparent opacity={.34}/></mesh>
    <pointLight position={[center[0], 1.2, center[2]]} color={color} intensity={8} distance={7}/>
    <Sparkles count={70} scale={[9, .7, 9]} position={[center[0], .55, center[2]]} size={1.25} speed={0} color={color}/>
    <Html position={[center[0], .3, center[2] - .05]} center distanceFactor={16}><div className={`industry-galaxy-core ${domain}`}><b>{domain === 'semiconductor' ? 'SEMICONDUCTOR' : 'DISPLAY'}</b><span>{domain === 'semiconductor' ? 'MEMORY · LOGIC · AI' : 'OLED · LCD · MLED'}</span></div></Html>
  </group>
}

function KnowledgeGraph({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = companies.find((company) => company.id === selectedId)
  const allCompanies = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const visibleIds = new Set(companies.map((company) => company.id))
  const companyById = new Map(allCompanies.map((company) => [company.id, company]))
  const shared = allCompanies.filter((company) => company.domain === 'shared')
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
      const center = company.domain === 'display' ? GALAXY_CENTERS.display : company.domain === 'semiconductor' ? GALAXY_CENTERS.semiconductor : [0, .2, company.position[2]] as [number, number, number]
      return <group key={company.id}>
        {company.domain !== 'shared' && <Line points={[center, company.position]} color={DOMAIN_COLORS[company.domain]} lineWidth={company.core ? 1.25 : .55} transparent opacity={dimmed ? .04 : company.core ? .42 : .18}/>}
        <CompanyNode company={company} selected={selectedId === company.id} dimmed={dimmed} onSelect={onSelect}/>
      </group>
    })}
    {VERIFIED_RELATIONS.map((relation) => {
      const from = companyById.get(relation.from); const to = companyById.get(relation.to)
      if (!from || !to) return null
      const active = visibleIds.has(from.id) && visibleIds.has(to.id)
      return <Line key={`${relation.from}-${relation.to}`} points={[from.position, to.position]} color="#ff4f8b" lineWidth={active ? 2.1 : .5} transparent opacity={active ? .85 : .07}/>
    })}
    {selected && <pointLight position={selected.position} color={DOMAIN_COLORS[selected.domain]} intensity={6} distance={5}/>}
    <ContactShadows position={[0, .02, 0]} opacity={.22} scale={28} blur={3} far={12}/>
    <OrbitControls makeDefault target={[0, .25, 0]} minDistance={13} maxDistance={42} minPolarAngle={.18} maxPolarAngle={Math.PI / 2.08} enableDamping dampingFactor={.08}/>
  </>
}

function FallbackCompanyList({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="industry-map-fallback" role="region" aria-label="3D 지식맵 대체 목록"><strong>이 기기에서는 3D를 열 수 없어 회사 목록으로 보여줘.</strong><div>{companies.map((company) => <button type="button" key={company.id} className={company.id === selectedId ? 'selected' : ''} onClick={() => onSelect(company.id)}><b>{company.name}</b><span>{DOMAIN_LABELS[company.domain]} · {company.role}</span></button>)}</div></div>
}

function CompanyReport({ company }: { company: IndustryCompany }) {
  const domain = getCompanyDomain(company.id)
  const verifiedRelations = VERIFIED_RELATIONS.filter((relation) => relation.from === company.id || relation.to === company.id)
  return <article className="industry-report" aria-live="polite">
    <header><div><span style={{ '--company-color': DOMAIN_COLORS[domain] } as CSSProperties}>{DOMAIN_LABELS[domain]} · {CATEGORY_LABELS[company.category]} · {company.country}</span><h2>{company.name}</h2><p>{company.role}</p></div><b className={company.status}>{company.status === 'deep' ? '심층분석 완료' : '요약 프로필'}</b></header>
    <p className="industry-report-summary">{company.summary}</p>
    {domain === 'shared' && <section className="industry-cross-note"><b>두 은하의 공통 노드</b><p>반도체와 디스플레이가 함께 쓰는 진공·박막·세정·패터닝 역량을 뜻해. 특정 고객 계약을 의미하지는 않아.</p></section>}
    {verifiedRelations.length > 0 && <section className="industry-report-relations" aria-label="공식 공개 관계"><h3>공식 발표로 확인된 연결</h3>{verifiedRelations.map((relation) => { const counterpartId = relation.from === company.id ? relation.to : relation.from; const counterpart = INDUSTRY_COMPANIES.find((item) => item.id === counterpartId); return <a key={`${relation.from}-${relation.to}`} href={relation.source} target="_blank" rel="noreferrer"><b>{counterpart?.name ?? counterpartId}</b><span>{relation.label}</span><i>원문 ↗</i></a> })}</section>}
    {company.metrics && <section className="industry-report-metrics" aria-label="주요 공식 수치">{company.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><b>{metric.value}</b><small>{metric.note}</small></div>)}</section>}
    <section className="industry-report-facts"><div><h3>핵심 제품</h3><ul>{company.products.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>관련 공정</h3><ul>{company.processes.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>관련 직무</h3><ul>{company.jobs.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>검증할 위험</h3><ul>{company.risks.map((item) => <li key={item}>{item}</li>)}</ul></div></section>
    {company.sections ? <div className="industry-report-sections">{company.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div> : <section className="industry-report-queued"><h3>심층분석 예정</h3><p>현재는 공식 홈페이지로 역할만 확인한 후보 프로필이야. 공시·연차보고서·제품자료를 검증한 뒤 기술·고객가치·경쟁·실적·직무를 채운다.</p></section>}
    <section className="industry-report-sources"><h3>공식 원문</h3>{company.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true">↗</span></a>)}</section>
    {company.reportUrl && <a className="industry-full-report" href={company.reportUrl} target="_blank" rel="noreferrer">GitHub 전체 심층보고서 열기<span aria-hidden="true">↗</span></a>}
    <p className="industry-report-limit">은하의 일반 연결선은 교육용 공정 분류야. 실제 고객·공급 계약은 공식 발표가 있을 때만 분홍 실선으로 표시해.</p>
  </article>
}

export function IndustryKnowledgeMap({ onBack }: { onBack: () => void }) {
  const positioned = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const [selectedId, setSelectedId] = useState('sk-hynix')
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<'all' | IndustryDomain>('all')
  const webgl = useMemo(supportsWebGL, [])
  const filtered = useMemo(() => positioned.filter((company) => {
    const matchesDomain = domain === 'all' || company.domain === domain
    const search = query.trim().toLocaleLowerCase('ko-KR')
    const haystack = `${company.name} ${company.role} ${company.products.join(' ')} ${company.processes.join(' ')}`.toLocaleLowerCase('ko-KR')
    return matchesDomain && (!search || haystack.includes(search))
  }), [domain, positioned, query])
  const selected = INDUSTRY_COMPANIES.find((company) => company.id === selectedId) ?? INDUSTRY_COMPANIES[0]
  useEffect(() => { if (filtered.length > 0 && !filtered.some((company) => company.id === selectedId)) setSelectedId(filtered[0].id) }, [filtered, selectedId])

  return <main className="industry-map-shell">
    {/* THESIS: 두 산업을 별도 은하로 보되 공통 장비·소재 기업을 중앙의 단일 노드로 연결한다. */}
    <header className="industry-map-topbar"><div><button type="button" onClick={onBack}>VIRTUAL FAB</button><div><h1>반도체 × 디스플레이 산업 은하</h1><p>Memory·AI와 OLED·LCD 생태계가 공통 장비·소재에서 만나는 3D 지식맵.</p></div></div><div className="industry-map-controls"><label><span>기업·공정 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="OLED, HBM, 증착, ULVAC…"/></label><label><span>산업 은하</span><select value={domain} onChange={(event) => setDomain(event.target.value as 'all' | IndustryDomain)}><option value="all">두 은하 전체</option>{Object.entries(DOMAIN_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div></header>
    <section className="industry-map-workspace">
      <section className="industry-map-visual" aria-label="반도체와 디스플레이 산업 3D 지식맵">
        <div className="industry-map-status"><span>DUAL GALAXY · {filtered.length} / {positioned.length} COMPANIES</span><b>회전 · 확대 · 노드 클릭</b><small>금색은 공통 기술 · 분홍 실선만 공식 발표 관계</small></div>
        <div className="industry-galaxy-guide" aria-label="두 산업 은하 안내"><div className="semiconductor"><b>반도체 은하</b><span>Memory · Logic · AI</span></div><div className="shared"><b>공통 기술 브리지</b><span>Vacuum · Film · Clean</span></div><div className="display"><b>디스플레이 은하</b><span>OLED · LCD · MLED</span></div></div>
        <div className="industry-map-legend" aria-label="산업 은하 색상">{Object.entries(DOMAIN_LABELS).map(([key, label]) => <span key={key}><i style={{ '--legend-color': DOMAIN_COLORS[key as IndustryDomain] } as CSSProperties}/>{label}</span>)}<span className="verified"><i/>공식 공개 관계</span></div>
        <MapErrorBoundary fallback={<FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>}>
          {webgl ? <Canvas camera={{ position: [0, 29, 10], fov: 48 }} dpr={[1, 1.25]} frameloop="demand"><KnowledgeGraph companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/></Canvas> : <FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>}
        </MapErrorBoundary>
        {filtered.length === 0 && <div className="industry-map-empty"><b>일치하는 회사가 없어.</b><button type="button" onClick={() => { setQuery(''); setDomain('all') }}>필터 초기화</button></div>}
      </section>
      <aside className="industry-map-detail" aria-label="선택한 회사 상세보고서"><CompanyReport company={selected}/></aside>
    </section>
  </main>
}
