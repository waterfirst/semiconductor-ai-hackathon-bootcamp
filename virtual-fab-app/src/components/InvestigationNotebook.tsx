import type { CSSProperties } from 'react'
import type { AIExchange } from '../types'

type GroupResult = { label: string; value: number; count: number }

type DatasetPreview = { headers: string[]; rows: string[][] }

export type DatasetAudit = {
  rows: number
  usable: number
  missing: number
  unitErrors: number
  duplicates: number
}

export function auditDataset(preview: DatasetPreview | null): DatasetAudit {
  if (!preview) return { rows: 0, usable: 0, missing: 0, unitErrors: 0, duplicates: 0 }
  const index = Object.fromEntries(preview.headers.map((header, position) => [header, position]))
  const hasPhotoSchema = ['wafer_id', 'point_id', 'measured_at', 'cd_nm'].every((header) => header in index)
  if (!hasPhotoSchema) {
    const missing = preview.rows.filter((row) => row.some((value) => value.trim() === '')).length
    return { rows: preview.rows.length, usable: preview.rows.length - missing, missing, unitErrors: 0, duplicates: 0 }
  }
  const identities = new Set<string>()
  let missing = 0
  let unitErrors = 0
  let duplicates = 0
  for (const row of preview.rows) {
    const cd = row[index.cd_nm]?.trim() ?? ''
    if (!cd) missing += 1
    else if (!Number.isFinite(Number(cd)) || Number(cd) < 1) unitErrors += 1
    const identity = `${row[index.wafer_id]}|${row[index.point_id]}|${row[index.measured_at]}`
    if (identities.has(identity)) duplicates += 1
    else identities.add(identity)
  }
  return { rows: preview.rows.length, usable: preview.rows.length - missing - unitErrors - duplicates, missing, unitErrors, duplicates }
}

export function DataEvidenceVisualizer({ results, aggregation, audit }: { results: GroupResult[]; aggregation: string; audit: DatasetAudit }) {
  const visible = results.slice(0, 12)
  const values = visible.map((item) => item.value)
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, Math.abs(max) * 0.04, 1)
  return <section className="data-evidence-visual" aria-labelledby="data-evidence-visual-title">
    <header>
      <div><b id="data-evidence-visual-title">분포를 눈으로 검증</b><span>선택한 그룹과 집계를 즉시 다시 계산한 교육용 시각화</span></div>
      <strong>{aggregation.toUpperCase()}</strong>
    </header>
    <div className="data-audit-strip" aria-label="데이터 품질 감사 요약">
      <span>전체 <b>{audit.rows}</b></span><span>분석 가능 <b>{audit.usable}</b></span><span>결측 <b>{audit.missing}</b></span><span>단위 오류 <b>{audit.unitErrors}</b></span><span>중복 <b>{audit.duplicates}</b></span>
    </div>
    {visible.length > 0 ? <figure className="evidence-bars">
      <figcaption>값의 절대 높이보다 그룹 간 차이와 표본 수를 함께 확인해.</figcaption>
      <div>{visible.map((item) => {
        const ratio = aggregation === 'count' ? item.value / Math.max(max, 1) : (item.value - min + range * .06) / (range * 1.06)
        return <div className="evidence-bar-row" key={item.label}>
          <span title={item.label}>{item.label}</span>
          <div><i style={{ '--bar-ratio': Math.max(.025, Math.min(1, ratio)) } as CSSProperties}/></div>
          <b>{item.value}</b><small>n={item.count}</small>
        </div>
      })}</div>
    </figure> : <p className="data-visual-empty">표시할 유효 수치가 없어. 결측과 단위를 먼저 확인해.</p>}
  </section>
}

const RESPONSE_SECTIONS = [
  { id: 'data', label: '데이터 근거', patterns: ['데이터 근거'] },
  { id: 'interpret', label: '해석', patterns: ['해석'] },
  { id: 'hypothesis', label: '가설·판단', patterns: ['가설', '판단'] },
  { id: 'falsify', label: '반증', patterns: ['반증'] },
  { id: 'uncertainty', label: '불확실성', patterns: ['불확실성', '한계'] },
  { id: 'next', label: '후속 질문', patterns: ['후속 질문', '다음 질문'] },
]

function responseCoverage(response: string) {
  return RESPONSE_SECTIONS.map((section) => ({ ...section, ready: section.patterns.some((pattern) => response.includes(pattern)) }))
}

export function DialogueEvidenceBoard({ conversation, onReview, onDownload }: {
  conversation: AIExchange[]
  onReview: (turn: number, review: Partial<NonNullable<AIExchange['review']>>) => void
  onDownload: () => void
}) {
  const reviewed = conversation.filter((exchange) => exchange.review?.verdict).length
  const structured = conversation.filter((exchange) => responseCoverage(exchange.response).filter((item) => item.ready).length >= 4).length
  return <section className="ai-dialogue evidence-notebook" aria-labelledby="dialogue-evidence-title">
    <header>
      <div><b id="dialogue-evidence-title">STEP 2 · AI 문답 증거 노트</b><span>질문 → 응답 → 사람 검증 → 다음 판단</span></div>
      <div className="notebook-actions"><span>{conversation.length}/15회 · 검토 {reviewed}회 · 구조 충족 {structured}회</span><button type="button" onClick={onDownload}>현재 분석노트 MD</button></div>
    </header>
    <ol className="dialogue-turn-map" aria-label="AI 문제풀이 회차 지도">
      {conversation.map((exchange) => {
        const coverage = responseCoverage(exchange.response)
        const review = exchange.review ?? { verdict: 'pending' as const, evidence_note: '' }
        return <li key={exchange.turn_no} className={`dialogue-turn ${review.verdict !== 'pending' ? 'reviewed' : ''}`}>
          <div className="turn-marker"><span>Q{exchange.turn_no}</span><small>{exchange.phase?.label ?? '문답'}</small></div>
          <article>
            <section className="turn-question"><header><b>질문</b><small>{exchange.keywords?.join(' · ') || '키워드 기록 없음'}</small></header><p>{exchange.question}</p></section>
            <section className="turn-answer"><header><b>{exchange.provider_label}</b><small>{exchange.model} · {tokenSummary(exchange.usage)}</small></header><p>{exchange.response}</p></section>
            <div className="answer-coverage" aria-label={`Q${exchange.turn_no} 응답 구성`}>
              {coverage.map((item) => <span key={item.id} className={item.ready ? 'ready' : ''}>{item.label}</span>)}
            </div>
            <section className="human-review" aria-label={`Q${exchange.turn_no} 사람 검증`}>
              <fieldset><legend>사람의 판정</legend>{([
                ['accept', '채택'], ['revise', '수정'], ['reject', '기각'],
              ] as const).map(([value, label]) => <button type="button" key={value} className={review.verdict === value ? 'selected' : ''} aria-pressed={review.verdict === value} onClick={() => onReview(exchange.turn_no, { verdict: value })}>{label}</button>)}</fieldset>
              <label>검증 근거<input value={review.evidence_note} onChange={(event) => onReview(exchange.turn_no, { evidence_note: event.target.value })} placeholder="CSV 수치·그래프·공정 원리와 대조한 내용을 짧게 기록" /></label>
            </section>
          </article>
        </li>
      })}
    </ol>
  </section>
}

function tokenSummary(usage: AIExchange['usage']) {
  const thought = usage.thought_tokens ?? 0
  return thought > 0
    ? `응답 ${usage.completion_tokens.toLocaleString()} · 사고 ${thought.toLocaleString()} · 전체 ${usage.total_tokens.toLocaleString()} tokens`
    : `응답 ${usage.completion_tokens.toLocaleString()} · 전체 ${usage.total_tokens.toLocaleString()} tokens`
}
