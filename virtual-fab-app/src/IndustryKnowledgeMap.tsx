import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Vector3 } from 'three'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  INDUSTRY_COMPANIES,
  VALUE_LAYERS,
  VERIFIED_RELATIONS,
  getCompanyLayer,
  type CompanyCategory,
  type IndustryCompany,
  type ValueLayerId,
} from './data/industryCompanies'

type PositionedCompany = IndustryCompany & { position: [number, number, number]; layer: ValueLayerId }

function positionCompanies(companies: IndustryCompany[]) {
  const byLayer = new Map<ValueLayerId, IndustryCompany[]>()
  companies.forEach((company) => {
    const layer = getCompanyLayer(company.id)
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), company])
  })
  return companies.map((company) => {
    const layer = getCompanyLayer(company.id)
    const group = byLayer.get(layer) ?? [company]
    const index = group.findIndex((item) => item.id === company.id)
    const layerSpec = VALUE_LAYERS.find((item) => item.id === layer) ?? VALUE_LAYERS[0]
    const spacing = layer === 'memory' ? 3.7 : Math.min(2.35, 18 / Math.max(group.length - 1, 1))
    const x = (index - (group.length - 1) / 2) * spacing
    return {
      ...company,
      layer,
      position: [x, layer === 'memory' ? 1.35 : 1 + (index % 2) * .32, layerSpec.z] as [number, number, number],
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
  const core = company.layer === 'memory'
  return <group position={company.position}>
    <mesh
      scale={(selected ? 1.34 : 1) * (core ? 1.35 : 1)}
      onClick={(event) => { event.stopPropagation(); onSelect(company.id) }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <NodeGeometry category={company.category}/>
      <meshStandardMaterial color={color} emissive={selected ? color : '#000000'} emissiveIntensity={selected ? .32 : 0} roughness={.46} metalness={.18} transparent opacity={dimmed ? .12 : 1}/>
    </mesh>
    {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.38, 0]}><ringGeometry args={[.54, .69, 36]}/><meshBasicMaterial color="#ffb21d"/></mesh>}
    {!dimmed && <Html position={[0, .72, 0]} center distanceFactor={15}>
      <button type="button" className={`industry-node-label ${selected ? 'selected' : ''} ${core ? 'core' : ''}`} onClick={() => onSelect(company.id)} aria-label={`${company.name} 상세보고서 열기`}>
        <b>{company.name}</b><span>{core ? 'MEMORY CORE · 심층본' : company.status === 'deep' ? '심층본' : company.role}</span>
      </button>
    </Html>}
  </group>
}

function LayerRail({ layer, active }: { layer: typeof VALUE_LAYERS[number]; active: boolean }) {
  const memory = layer.id === 'memory'
  return <group position={[0, .12, layer.z]}>
    <mesh><boxGeometry args={[21, memory ? .14 : .07, memory ? .52 : .3]}/><meshStandardMaterial color={memory ? '#ffb21d' : active ? '#4e8f95' : '#a8b9bb'} metalness={.25} roughness={.68} transparent opacity={active ? .88 : .3}/></mesh>
  </group>
}

function KnowledgeGraph({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = companies.find((company) => company.id === selectedId)
  const allCompanies = useMemo(() => positionCompanies(INDUSTRY_COMPANIES), [])
  const visibleIds = new Set(companies.map((company) => company.id))
  const companyById = new Map(allCompanies.map((company) => [company.id, company]))
  const activeLayers = new Set(companies.map((company) => company.layer))
  return <>
    <color attach="background" args={['#e7eff0']}/>
    <fog attach="fog" args={['#e7eff0', 23, 40]}/>
    <ambientLight intensity={1.85}/>
    <directionalLight position={[8, 12, 9]} intensity={2.5}/>
    <gridHelper args={[30, 30, '#aebfc2', '#d2dddf']} position={[0, -.03, 0]}/>
    <mesh position={[0, -.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[27, 23]}/><meshStandardMaterial color="#edf3f3" roughness={.94}/></mesh>
    {VALUE_LAYERS.slice(0, -1).map((layer, index) => <Line key={`${layer.id}-flow`} points={[[0, .18, layer.z], [0, .18, VALUE_LAYERS[index + 1].z]]} color="#78969a" lineWidth={1.1} dashed dashSize={.22} gapSize={.15}/>)}
    {VALUE_LAYERS.map((layer) => <LayerRail key={layer.id} layer={layer} active={activeLayers.has(layer.id)}/>) }
    {allCompanies.map((positioned) => {
      const company = positioned
      const dimmed = !visibleIds.has(company.id)
      return <group key={company.id}>
        <Line points={[[positioned.position[0], .18, positioned.position[2]], positioned.position]} color={dimmed ? '#c5d1d3' : CATEGORY_COLORS[company.category]} lineWidth={dimmed ? .35 : .8} transparent opacity={dimmed ? .16 : .52}/>
        <CompanyNode company={positioned} selected={selectedId === company.id} dimmed={dimmed} onSelect={onSelect}/>
      </group>
    })}
    {VERIFIED_RELATIONS.map((relation) => {
      const from = companyById.get(relation.from); const to = companyById.get(relation.to)
      if (!from || !to) return null
      const active = visibleIds.has(from.id) && visibleIds.has(to.id)
      return <Line key={`${relation.from}-${relation.to}`} points={[from.position, to.position]} color="#cc426d" lineWidth={active ? 2.1 : .55} transparent opacity={active ? .82 : .12}/>
    })}
    {selected && <pointLight position={selected.position} color={CATEGORY_COLORS[selected.category]} intensity={6} distance={5}/>} 
    <ContactShadows position={[0, .02, 0]} opacity={.16} scale={26} blur={3} far={12}/>
    <OrbitControls makeDefault target={[0, .35, 0]} minDistance={12} maxDistance={44} minPolarAngle={.18} maxPolarAngle={Math.PI / 2.08} enableDamping dampingFactor={.08}/>
  </>
}

function FallbackCompanyList({ companies, selectedId, onSelect }: { companies: PositionedCompany[]; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="industry-map-fallback" role="region" aria-label="3D 지식맵 대체 목록">
    <strong>이 기기에서는 3D를 열 수 없어 회사 목록으로 보여줘.</strong>
    <div>{companies.map((company) => <button type="button" key={company.id} className={company.id === selectedId ? 'selected' : ''} onClick={() => onSelect(company.id)}><b>{company.name}</b><span>{company.role}</span></button>)}</div>
  </div>
}

function CompanyReport({ company }: { company: IndustryCompany }) {
  const layer = VALUE_LAYERS.find((item) => item.id === getCompanyLayer(company.id)) ?? VALUE_LAYERS[0]
  const verifiedRelations = VERIFIED_RELATIONS.filter((relation) => relation.from === company.id || relation.to === company.id)
  return <article className="industry-report" aria-live="polite">
    <header>
      <div><span style={{ '--company-color': CATEGORY_COLORS[company.category] } as CSSProperties}>{layer.label} · {company.country}</span><h2>{company.name}</h2><p>{company.role}</p></div>
      <b className={company.status}>{company.status === 'deep' ? '심층분석 완료' : '요약 프로필'}</b>
    </header>
    <p className="industry-report-summary">{company.summary}</p>
    {verifiedRelations.length > 0 && <section className="industry-report-relations" aria-label="공식 공개 관계"><h3>공식 발표로 확인된 연결</h3>{verifiedRelations.map((relation) => { const counterpartId = relation.from === company.id ? relation.to : relation.from; const counterpart = INDUSTRY_COMPANIES.find((item) => item.id === counterpartId); return <a key={`${relation.from}-${relation.to}`} href={relation.source} target="_blank" rel="noreferrer"><b>{counterpart?.name ?? counterpartId}</b><span>{relation.label}</span><i>원문 ↗</i></a> })}</section>}
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
  const [selectedId, setSelectedId] = useState('sk-hynix')
  const [query, setQuery] = useState('')
  const [layer, setLayer] = useState<'all' | ValueLayerId>('all')
  const webgl = useMemo(supportsWebGL, [])
  const filtered = useMemo(() => positioned.filter((company) => {
    const matchesLayer = layer === 'all' || company.layer === layer
    const search = query.trim().toLocaleLowerCase('ko-KR')
    const haystack = `${company.name} ${company.role} ${company.products.join(' ')} ${company.processes.join(' ')}`.toLocaleLowerCase('ko-KR')
    return matchesLayer && (!search || haystack.includes(search))
  }), [layer, positioned, query])
  const selected = INDUSTRY_COMPANIES.find((company) => company.id === selectedId) ?? INDUSTRY_COMPANIES[0]

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((company) => company.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  return <main className="industry-map-shell">
    {/*
      THESIS: 삼성전자·SK하이닉스·Micron을 같은 Memory/IDM 중심층에 놓고 위쪽 공급기반과 아래쪽 시스템 수요를 구분한다.
      OWN-WORLD: 밝은 측정실 바닥, 남색 제어패널, 공정별 형상·색 노드와 얇은 검증 회선.
      STORY: 학생은 생태계를 회전해 탐색하고 회사를 선택해 공정·제품·직무·위험·공식 원문을 읽는다.
      FIRST VIEWPORT: 상단 검색대 아래 왼쪽 3D 맵 68%, 오른쪽 고정 보고서 32%; SK hynix 중심층 심층본이 첫 선택이다.
      FORM: established-world extension · process-control constellation · seed industry-map-extension.
      FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
    */}
    <header className="industry-map-topbar">
      <div><button type="button" onClick={onBack}>VIRTUAL FAB</button><div><h1>Memory 생태계 3D 지식맵</h1><p>공급 기반 → 삼성·SK·Micron → 패키징·AI 시스템을 다섯 레이어로 연결해.</p></div></div>
      <div className="industry-map-controls">
        <label><span>기업·공정 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ASML, CMP, HBM…"/></label>
        <label><span>가치사슬 레이어</span><select value={layer} onChange={(event) => setLayer(event.target.value as 'all' | ValueLayerId)}><option value="all">전체 5개 레이어</option>{VALUE_LAYERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
    </header>
    <section className="industry-map-workspace">
      <section className="industry-map-visual" aria-label="반도체 생태계 3D 지식맵">
        <div className="industry-map-status"><span>5 LAYERS · {filtered.length} / {positioned.length} COMPANIES</span><b>회전 · 확대 · 노드 클릭</b><small>분홍 실선만 공식 발표로 확인된 연결</small></div>
        <ol className="industry-layer-guide" aria-label="Memory 가치사슬 5개 레이어">{VALUE_LAYERS.map((item, index) => <li key={item.id} className={item.id === 'memory' ? 'core' : ''}><span>0{index + 1}</span><div><b>{item.label}</b><small>{item.kicker}</small></div></li>)}</ol>
        <div className="industry-map-legend" aria-label="회사 분류 색상">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <span key={key}><i style={{ '--legend-color': CATEGORY_COLORS[key as CompanyCategory] } as CSSProperties}/>{label}</span>)}<span className="verified"><i/>공식 공개 관계</span></div>
        <MapErrorBoundary fallback={<FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>}>
          {webgl ? <Canvas camera={{ position: [0, 25, 22], fov: 45 }} dpr={[1, 1.25]} frameloop="demand">
            <KnowledgeGraph companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>
          </Canvas> : <FallbackCompanyList companies={filtered} selectedId={selectedId} onSelect={setSelectedId}/>} 
        </MapErrorBoundary>
        {filtered.length === 0 && <div className="industry-map-empty"><b>일치하는 회사가 없어.</b><button type="button" onClick={() => { setQuery(''); setLayer('all') }}>필터 초기화</button></div>}
      </section>
      <aside className="industry-map-detail" aria-label="선택한 회사 상세보고서"><CompanyReport company={selected}/></aside>
    </section>
  </main>
}
