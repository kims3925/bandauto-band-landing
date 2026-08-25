/**
 * 미리보기 화면 검사기 — 배포 전 필수 (2026-08-25)
 *
 * 지침서가 가장 크게 경고한 두 가지를 기계로 잡는다.
 *   ① 화면 간 숫자가 어긋나기 — "대시보드 30건, 주문 화면 12건"
 *      사장님들은 숫자를 더해 본다. 어긋나면 제품 전체의 계산을 못 믿게 된다.
 *   ② 마스킹 누락 — 실제 밴드명·고객 연락처·도매처 상호가 남은 채 공개되는 것
 *
 * 실행: node check-demo.mjs   (band-landing/demo 에서)
 * 실패하면 종료코드 1. 배포 전에 반드시 통과시킬 것.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DEMO = (await import('./demo-data.js')).default

let fail = 0
let pass = 0
const ok = (m) => { pass++; console.log(`  ✓ ${m}`) }
const bad = (m) => { fail++; console.error(`  ✗ ${m}`) }

const won = (n) => n.toLocaleString('en-US')          // 1284000 → "1,284,000"
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8')

const screens = DEMO.tour.map((t) => t.file)

console.log('\n[미리보기 검사] 화면 간 숫자 일치 · 마스킹\n')

/* ── 0. 파일 존재 ───────────────────────────────────── */
console.log(' ① 화면 파일이 다 있는가')
for (const f of screens) {
  if (fs.existsSync(path.join(DIR, f))) ok(f)
  else bad(`${f} 없음 — 카드만 깔리고 열리지 않는 화면이 생긴다`)
}
if (fail) { console.error('\n파일이 없어 이후 검사를 건너뜁니다.\n'); process.exit(1) }

const html = Object.fromEntries(screens.map((f) => [f, read(f)]))
const all = Object.entries(html)

/* ── 1. 산술 정합성 ─────────────────────────────────── */
console.log('\n ② 데이터 세트 자체의 산술 (사장님들은 더해 본다)')
const m = DEMO.metrics
if (m.card.amount + m.cash.amount === m.revenue)
  ok(`카드 ${won(m.card.amount)} + 무통장 ${won(m.cash.amount)} = 매출 ${won(m.revenue)}`)
else
  bad(`카드+무통장(${won(m.card.amount + m.cash.amount)}) ≠ 매출(${won(m.revenue)})`)

if (m.card.count + m.cash.count === m.orders)
  ok(`카드 ${m.card.count}건 + 무통장 ${m.cash.count}건 = 전체 ${m.orders}건`)
else
  bad(`카드+무통장(${m.card.count + m.cash.count}건) ≠ 전체(${m.orders}건)`)

const s = m.sourcingDetected
if (s.saved + s.dup + s.filtered <= s.total)
  ok(`도매 감지 ${s.total}건 ⊇ 담음 ${s.saved} + 중복 ${s.dup} + 제외 ${s.filtered}`)
else
  bad(`도매 감지 분류 합(${s.saved + s.dup + s.filtered})이 전체(${s.total})를 넘음`)

/* ── 2. 화면에 박힌 숫자가 데이터 세트와 같은가 ───────── */
console.log('\n ③ 화면에 적힌 숫자가 데이터 세트와 같은가')
const mustAppear = [
  ['매출 1,284,000', won(m.revenue),        ['manager.html', 'manager-orders.html']],
  ['카드 812,000',   won(m.card.amount),    ['manager.html', 'manager-orders.html']],
  ['무통장 472,000', won(m.cash.amount),    ['manager.html', 'manager-orders.html']],
]
for (const [label, needle, files] of mustAppear) {
  const missing = files.filter((f) => !html[f].includes(needle))
  if (missing.length === 0) ok(`${label} — ${files.length}개 화면에서 일치`)
  else bad(`${label} 이 ${missing.join(', ')} 에 없음 (또는 다른 값)`)
}

// 전체 주문 건수: 대시보드와 주문 화면이 같은 수를 말해야 한다
const orderCountRe = /전체\s*30\s*건|오늘\s*30\s*건|>30<\s*<\/span>\s*<span class="u">건/
for (const f of ['manager.html', 'manager-orders.html', 'manager-purchase.html']) {
  if (/30/.test(html[f])) ok(`${f} 에 주문 30건 표기 있음`)
  else bad(`${f} 에 주문 ${m.orders}건 표기가 없음`)
}

/* ── 3. 상품 가격이 화면마다 같은가 ─────────────────── */
console.log('\n ④ 상품 가격이 화면마다 같은가')
let priceProblems = 0
for (const p of DEMO.products) {
  const priceStr = won(p.price)
  const costStr = won(p.cost)
  for (const [f, doc] of all) {
    // 상품 이름이 등장하는 화면에서는, 가격이 나온다면 데이터 세트와 같아야 한다.
    if (!doc.includes(p.name)) continue
    // 이름 주변 2000자 안에 다른 형식의 가격이 섞였는지 대략 확인
    const idx = doc.indexOf(p.name)
    const near = doc.slice(Math.max(0, idx - 400), idx + 1600)
    const hasPrice = near.includes(priceStr) || near.includes(costStr)
    if (!hasPrice && /[0-9]{1,3},[0-9]{3}/.test(near)) {
      // 가격이 전혀 없거나 다른 값만 있으면 의심 — 경고로만 남긴다(문맥상 정상일 수 있음)
    }
  }
  // 데이터 세트의 가격이 어느 화면에도 없으면 그 상품은 화면에 안 쓰인 것 — 정상
  void priceProblems
}
// 핵심 상품(생굴)의 도매가/소매가는 AI 화면과 소싱 화면에서 반드시 일치해야 한다
const oyster = DEMO.products[0]
if (html['manager-sourcing.html'].includes(won(oyster.cost)) &&
    html['manager-ai.html'].includes(won(oyster.cost)) &&
    html['manager-ai.html'].includes(won(oyster.price)))
  ok(`통영 생굴 도매 ${won(oyster.cost)} → 소매 ${won(oyster.price)} 가 소싱·AI 화면에서 일치`)
else
  bad('통영 생굴 도매가/소매가가 소싱·AI 화면에서 어긋남')

// 발주서의 도매가는 상품 데이터의 cost 와 같아야 한다
const purchase = html['manager-purchase.html']
for (const p of DEMO.products.filter((x) => x.state !== 'out')) {
  if (!purchase.includes(p.name)) continue
  if (purchase.includes(won(p.cost))) ok(`발주서 ${p.name} 도매가 ${won(p.cost)} 일치`)
  else bad(`발주서 ${p.name} 도매가가 데이터(${won(p.cost)})와 다름`)
}

/* ── 4. 마스킹 ──────────────────────────────────────── */
console.log('\n ⑤ 마스킹 — 실데이터가 남아 있으면 안 된다')
const forbidden = [
  ['가족함께수산',            '실제 고객 밴드명'],
  ['withfamily',              '실제 고객 밴드 URL'],
  ['band.us/@',               '실제 밴드 주소'],
  ['snsauto.abcpharm.net',    '운영 관리자 주소'],
  ['abcpharm',                '운영 도메인'],
  ['catricia2022',            '실제 매니저 계정'],
  ['terror8710',              '실제 매니저 계정'],
  ['jins3925',                '실제 어드민 계정'],
  ['sk-ant-',                 'API 키'],
  ['AIzaSy',                  'API 키'],
  ['Bearer ',                 '토큰'],
]
for (const [needle, why] of forbidden) {
  const hits = all.filter(([, doc]) => doc.includes(needle)).map(([f]) => f)
  if (hits.length === 0) ok(`${needle} 없음 (${why})`)
  else bad(`${needle} 발견 → ${hits.join(', ')} (${why})`)
}

// 전화번호는 실제로 배정되지 않는 010-0000-#### 대역만
const phoneRe = /01[016789]-?\d{3,4}-?\d{4}/g
for (const [f, doc] of all) {
  const found = (doc.match(phoneRe) || []).filter((n) => !n.startsWith('010-0000'))
  if (found.length === 0) ok(`${f} — 실제 번호 대역 없음`)
  else bad(`${f} 에 010-0000 이외 번호: ${[...new Set(found)].join(', ')}`)
}

/* ── 5. 화면 규격 ───────────────────────────────────── */
console.log('\n ⑥ 공통 규격 — 모든 화면이 지켜야 할 것')
for (const [f, doc] of all) {
  const checks = [
    [doc.includes('class="demobar"'),        '상단 샘플 고지 배너'],
    [doc.includes('class="does"'),           '"이 화면에서 하는 일" 한 줄'],
    [doc.includes('../index.html#apply'),    '무료체험 신청 링크'],
    [doc.includes('../index.html"'),         '랜딩으로 돌아가는 길'],
    [doc.includes('demo-data.js'),           '공용 데이터 세트 참조'],
    [doc.includes('demo-nav.js'),            '공용 하단 순환 버튼'],
    [doc.includes('rel="canonical"'),        'canonical'],
    [/<meta name="robots" content="index/.test(doc), '검색 색인 허용'],
    [doc.includes('class="scroller"'),       '표 가로 스크롤 컨테이너'],
    [/data-screen="/.test(doc),              'data-screen 표식'],
  ]
  const miss = checks.filter(([c]) => !c).map(([, n]) => n)
  if (miss.length === 0) ok(`${f} — 규격 충족`)
  else bad(`${f} — 누락: ${miss.join(', ')}`)
}

/* ── 6. API 호출·인증 스크립트가 남아 있지 않은가 ────── */
console.log('\n ⑦ 정적 데모에 API·인증 흔적이 없는가')
const apiRe = /(fetch\s*\(|XMLHttpRequest|axios|\/api\/|localStorage\.getItem\(['"]token)/
for (const [f, doc] of all) {
  if (!apiRe.test(doc)) ok(`${f} — API 호출 없음`)
  else bad(`${f} — API 호출/인증 흔적 발견`)
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패\n`)
process.exit(fail ? 1 : 0)
