import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Vector3 } from 'three'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  HUB_FLOWS,
  INDUSTRY_COMPANIES,
  PROCESS_HUBS,
  type CompanyCategory,
  type IndustryCompany,
} from './data/industryCompanies'

type PositionedCompany = IndustryCompany & { position: [number, number, number] }

function positionCompanies(companies: IndustryCompany[]) {
  const byHub = new Map<string, IndustryCompany[]>()
  companies.forEach((company) => byHub.set(company.hub, [...(byHub.get(company.hub) ?? []), company]))
  return companies.map((company) => {
    const group = byHub.get(company.hub) ?? [company]
    const index = group.findIndex((item) => item.id === company.id)
    const hub = PROCESS_HUBS.find((item) => item.id === company.hub) ?? PROCESS_HUBS[0]
    const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2
    const radius = group.length > 4 ? 2.45 : 2.05
    return {
      ...company,
      position: [hub.position[0] + Math.cos(angle) * radius, 1.25 + (index % 3) * .72, hub.position[2] + Math.sin(angle) * radius] as [number, number, number],
    }
  })
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function NodeGeometry({ category }: { category: CompanyCategory }) {
  if (category === 'materials') return <octahedronGeometry args={[.38, 0]} />
  if (category === 'manufacturing') return <cylinderGeometry args={[.39, .39, .56, 20]} />
  if (category === 'packaging') return <dodecahedronGeometry args={[.4, 0]} />
  if (category === 'design') return <sphereGeometry args={[.38, 18, 14]} />
  if (category === 'fabless') return <icosahedronGeometry args={[.4, 0]} />
  return <boxGeometry args={[.68, .52, .68]} />
}

function CompanyNode({ company, selected, dimmed, onSelect }: { company: PositionedCompany; selected: boolean; dimmed: boolean; onSelect: (id: string) => void }) {
  const color = CATEGORY_COLORS[company.category]
  return <group position={company.position}>
    <mesh
      scale={selected ? 1.34 : 1}
      onClick={(event) => { event.stopPropagation(); onSelect(company.id) }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <NodeGeometry category={company.category}/>
      <meshStandardMaterial color={color} emissive={selected ? color : '#000000'} emissiveIntensity={selected ? .32 : 0} roughness={.46} metalness={.18} transparent opacity={dimmed ? .12 : 1}/>
    </mesh>
    {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.38, 0]}><ringGeometry args={[.54, .69, 36]}/><meshBasicMaterial color="#ffb21d"/></mesh>}
    {!dimmed && <Html position={[0, .72, 0]} center distanceFactor={15}>
      <button type="button" className={`industry-node-label ${selected ? 'selected' : ''}`} onClick={() => onSelect(company.id)} aria-label={`${company.name} 상세보고서 열기`}>
        <b>{company.name}</b><span>{company.status === 'deep' ? '심층본' : company.role}</span>
      </button>
    </Html>}
  </group>
}

function ProcessHub({ hub, active }: { hub: typeof PROCESS_HUBS[number]; active: boolean }) {
  return <group position={hub.position}>
    <mesh><cylinderGeometry args={[.78, .94, .28, 32]}/><meshStandardMaterial color={active ? '#ffb21d' : '#173f48'} metalness={.42} roughness={.32}/></mesh>
    <mesh position={[0, .18, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.62, .82, 32]}/><meshBasicMaterial color={active ? '#fff0b5' : '#69d9dc'}/></mesh>
    <Html position={[0, .7, 0]} center distanceFactor={17}><div className={`industry-hub-label ${active ? 'active' : ''}`}>{hub.label}</div></Html>
  </group>
}

function KnowledgeGraph({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = companies.find((company) => company.id === selectedId)
  const allCompanies = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const visibleIds = new Set(companies.map((company) => company.id))
  const hubById = new Map<string, typeof PROCESS_HUBS[number]>(PROCESS_HUBS.map((hub) => [hub.id, hub]))
  const activeHubs = new Set(companies.map((company) => company.hub))
  return <>
    <color attach="background" args={['#e7eff0']}/>
    <fog attach="fog" args={['#e7eff0', 20, 34]}/>
    <ambientLight intensity={1.85}/>
    <directionalLight position={[8, 12, 9]} intensity={2.5}/>
    <gridHelper args={[30, 30, '#aebfc2', '#d2dddf']} position={[0, -.03, 0]}/>
    <mesh position={[0, -.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 25]}/><meshStandardMaterial color="#edf3f3" roughness={.94}/></mesh>
    {HUB_FLOWS.map(([from, to]) => {
      const source = hubById.get(from); const target = hubById.get(to)
      if (!source || !target) return null
      return <Line key={`${from}-${to}`} points={[source.position, target.position]} color="#6a878c" lineWidth={1.3} dashed dashSize={.22} gapSize={.14}/>
    })}
    {PROCESS_HUBS.map((hub) => <ProcessHub key={hub.id} hub={hub} active={activeHubs.has(hub.id)}/>) }
    {allCompanies.map((positioned) => {
      const company = positioned
      const hub = hubById.get(company.hub)
      if (!hub) return null
      const dimmed = !visibleIds.has(company.id)
      return <group key={company.id}>
        <Line points={[hub.position, positioned.position]} color={dimmed ? '#c5d1d3' : CATEGORY_COLORS[company.category]} lineWidth={dimmed ? .35 : .8} transparent opacity={dimmed ? .16 : .48}/>
        <CompanyNode company={positioned} selected={selectedId === company.id} dimmed={dimmed} onSelect={onSelect}/>
      </group>
    })}
    {selected && <pointLight position={selected.position} color={CATEGORY_COLORS[selected.category]} intensity={6} distance={5}/>} 
    <ContactShadows position={[0, .02, 0]} opacity={.18} scale={26} blur={3} far={12}/>
    <OrbitControls makeDefault target={[0, .8, 0]} minDistance={8} maxDistance={27} minPolarAngle={.35} maxPolarAngle={Math.PI / 2.12} enableDamping dampingFactor={.08}/>
  </>
}

function FallbackCompanyList({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="industry-map-fallback" role="region" aria-label="3D 지식맵 대체 목록">
    <strong>이 기기에서는 3D를 열 수 없어 회사 목록으로 보여줘.</strong>
    <div>{companies.map((company) => <button type="button" key={company.id} className={company.id === selectedId ? 'selected' : ''} onClick={() => onSelect(company.id)}><b>{company.name}</b><span>{company.role}</span></button>)}</div>
  </div>
}

function CompanyReport({ company }: { company: IndustryCompany }) {
  return <article className="industry-report" aria-live="polite">
    <header>
      <div><span style={{ '--company-color': CATEGORY_COLORS[company.category] } as CSSProperties}>{CATEGORY_LABELS[company.category]} · {company.country}</span><h2>{company.name}</h2><p>{company.role}</p></div>
      <b className={company.status}>{company.status === 'deep' ? '심층분석 완료' : '요약 프로필'}</b>
    </header>
    <p className="industry-report-summary">{company.summary}</p>
    {company.metrics && <section className="industry-report-metrics" aria-label="주요 공식 수치">{company.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><b>{metric.value}</b><small>{metric.note}</small></div>)}</section>}
    <section className="industry-report-facts">
      <div><h3>핵심 제품</h3><ul>{company.products.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><h3>관련 공정</h3><ul>{company.processes.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><h3>관련 직무</h3><ul>{company.jobs.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><h3>검증할 위험</h3><ul>{company.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section>
    {company.sections ? <div className="industry-report-sections">{company.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div> : <section className="industry-report-queued"><h3>심층분석 예정</h3><p>현재는 공식 홈페이지로 역할만 확인한 후보 프로필이야. 공시·연차보고서·제품자료를 다시 검증한 뒤 기술·고객가치·경쟁·실적·직무·가상팹 시나리오를 같은 형식으로 채운다.</p></section>}
    <section className="industry-report-sources"><h3>공식 원문</h3>{company.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true">↗</span></a>)}</section>
    {company.reportUrl && <a className="industry-full-report" href={company.reportUrl} target="_blank" rel="noreferrer">GitHub 전체 심층보고서 열기<span aria-hidden="true">↗</span></a>}
    <p className="industry-report-limit">회사 노드와 공정 허브의 선은 교육용 역할 분류이며 실제 고객·공급 계약을 뜻하지 않아. 특정 거래관계는 공식 공시가 있을 때만 별도로 표시해.</p>
  </article>
}

export function IndustryKnowledgeMap({ onBack }: { onBack: () => void }) {
  const positioned = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const [selectedId, setSelectedId] = useState('asml')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | CompanyCategory>('all')
  const webgl = useMemo(supportsWebGL, [])
  const filtered = useMemo(() => positioned.filter((company) => {
    const matchesCategory = category === 'all' || company.category === category
    const search = query.trim().toLocaleLowerCase('ko-KR')
    const haystack = `${company.name} ${company.role} ${company.products.join(' ')} ${company.processes.join(' ')}`.toLocaleLowerCase('ko-KR')
    return matchesCategory && (!search || haystack.includes(search))
  }), [category, positioned, query])
  const selected = INDUSTRY_COMPANIES.find((company) => company.id === selectedId) ?? INDUSTRY_COMPANIES[0]

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((company) => company.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  return <main className="industry-map-shell">
    {/*
      THESIS: 기업을 목록이 아니라 공정 의존망으로 이해하며, 실제 거래관계처럼 보이는 직선형 공급망 도식을 거부한다.
      OWN-WORLD: 밝은 측정실 바닥, 남색 제어패널, 공정별 형상·색 노드와 얇은 검증 회선.
      STORY: 학생은 생태계를 회전해 탐색하고 회사를 선택해 공정·제품·직무·위험·공식 원문을 읽는다.
      FIRST VIEWPORT: 상단 검색대 아래 왼쪽 3D 맵 68%, 오른쪽 고정 보고서 32%; ASML 심층본이 첫 선택이다.
      FORM: established-world extension · process-control constellation · seed industry-map-extension.
      FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
    */}
    <header className="industry-map-topbar">
      <div><button type="button" onClick={onBack}>VIRTUAL FAB</button><div><h1>반도체 생태계 3D 지식맵</h1><p>회사 → 제품 → 공정 → 직무를 하나의 맥락으로 연결해.</p></div></div>
      <div className="industry-map-controls">
        <label><span>기업·공정 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ASML, CMP, HBM…"/></label>
        <label><span>생태계 분류</span><select value={category} onChange={(event) => setCategory(event.target.value as 'all' | CompanyCategory)}><option value="all">전체 회사</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
    </header>
    <section className="industry-map-workspace">
      <section className="industry-map-visual" aria-label="반도체 생태계 3D 지식맵">
        <div className="industry-map-status"><span>{filtered.length} / {positioned.length} COMPANIES</span><b>회전 · 확대 · 노드 클릭</b><small>회선은 공정 역할 연결 · 실제 거래관계 아님</small></div>
        <div className="industry-map-legend" aria-label="회사 분류 색상">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <span key={key}><i style={{ '--legend-color': CATEGORY_COLORS[key as CompanyCategory] } as CSSProperties}/>{label}</span>)}</div>
        <MapErrorBoundary fallback={<FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>}>
          {webgl ? <Canvas camera={{ position: [15, 13, 17], fov: 43 }} dpr={[1, 1.25]} frameloop="demand">
            <KnowledgeGraph companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>
          </Canvas> : <FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>} 
        </MapErrorBoundary>
        {filtered.length === 0 && <div className="industry-map-empty"><b>일치하는 회사가 없어.</b><button type="button" onClick={() => { setQuery(''); setCategory('all') }}>필터 초기화</button></div>}
      </section>
      <aside className="industry-map-detail" aria-label="선택한 회사 상세보고서"><CompanyReport company={selected}/></aside>
    </section>
  </main>
}
